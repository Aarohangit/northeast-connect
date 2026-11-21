package in.floodresponse.sos.service;

import in.floodresponse.sos.client.AiClient;
import in.floodresponse.sos.domain.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Limit;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Runs AI triage after an SOS is saved. The citizen's request never waits on
 * this, and if the AI service is down the sweeper picks the request up later.
 */
@Component
class TriageWorker {

    private static final Logger log = LoggerFactory.getLogger(TriageWorker.class);
    private static final Duration DUPLICATE_WINDOW = Duration.ofHours(3);
    private static final double BOX_DEG = 0.01; // about 1 km

    private final SosRepository requests;
    private final TriageRepository triages;
    private final AiClient ai;
    private final TransactionTemplate tx;

    TriageWorker(SosRepository requests, TriageRepository triages, AiClient ai, TransactionTemplate tx) {
        this.requests = requests;
        this.triages = triages;
        this.ai = ai;
        this.tx = tx;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSubmitted(SosSubmitted event) {
        run(event.sosId());
    }

    /** Catches anything missed while ai-service was unreachable. */
    @Scheduled(fixedDelayString = "${triage.sweep-ms:60000}", initialDelayString = "${triage.sweep-ms:60000}")
    void sweep() {
        Instant now = Instant.now();
        List<Long> missed = triages.findUntriaged(now.minus(Duration.ofHours(24)), now.minusSeconds(30), Limit.of(20));
        if (!missed.isEmpty()) {
            log.info("Retrying triage for {} request(s)", missed.size());
            missed.forEach(this::run);
        }
    }

    void run(Long sosId) {
        if (triages.existsBySosId(sosId)) return;
        SosRequest s = requests.findById(sosId).orElse(null);
        if (s == null) return;

        AiClient.TriageResult result;
        try {
            result = ai.triage(new AiClient.TriageRequest(textFor(s), s.getCategory().name(),
                    s.getPeopleCount(), s.getLanguage()));
        } catch (RestClientException e) {
            log.warn("Triage for {} failed ({}); will retry", s.getReference(), e.getMessage());
            return;
        }

        AiClient.DuplicateMatch dup = findDuplicate(s);

        try {
            tx.executeWithoutResult(status -> triages.save(toEntity(s, result, dup)));
            log.info("Triaged {} as {} via {}", s.getReference(), result.severity(), result.engine());
        } catch (DataIntegrityViolationException alreadyDone) {
            // The sweeper and the event listener raced; one row is all we need.
        }
    }

    private AiClient.DuplicateMatch findDuplicate(SosRequest s) {
        try {
            var nearby = requests.nearbySince(s.getId(), s.getReceivedAt().minus(DUPLICATE_WINDOW),
                    s.getLatitude() - BOX_DEG, s.getLatitude() + BOX_DEG,
                    s.getLongitude() - BOX_DEG, s.getLongitude() + BOX_DEG);
            if (nearby.isEmpty()) return null;
            var result = ai.duplicates(report(s), nearby.stream().map(TriageWorker::report).toList());
            return result.likely_duplicate() && !result.matches().isEmpty() ? result.matches().getFirst() : null;
        } catch (RestClientException e) {
            log.warn("Duplicate check for {} failed: {}", s.getReference(), e.getMessage());
            return null;
        }
    }

    private static AiClient.Report report(SosRequest s) {
        return new AiClient.Report(s.getReference(), s.getLatitude(), s.getLongitude(), s.getReceivedAt(),
                s.getPhone(), s.getCategory().name(), s.getDescription());
    }

    private static String textFor(SosRequest s) {
        String d = s.getDescription();
        return (d == null || d.isBlank()) ? "(No description. Category chosen in app: " + s.getCategory() + ")" : d;
    }

    private static Triage toEntity(SosRequest s, AiClient.TriageResult r, AiClient.DuplicateMatch dup) {
        Triage t = new Triage(s);
        t.setSeverity(r.severity());
        t.setSuggestedCategory(r.category());
        t.setSeverityReason(cut(r.severity_reason(), 300));
        t.setSummary(cut(r.summary(), 300));
        t.setTranslation(cut(r.translation(), 2000));
        t.setDetectedLanguage(cut(r.detected_language(), 30));
        t.setPeopleCount(r.people_count() == null || r.people_count() == 0 ? null : r.people_count());
        t.setVulnerable(join(r.vulnerable(), 200));
        t.setNeeds(join(r.needs(), 300));
        t.setMedicalConditions(join(r.medical_conditions(), 300));
        t.setLocationHints(join(r.location_hints(), 500));
        t.setWaterLevel(r.water_level());
        t.setWaterRising(r.water_rising());
        t.setConfidence(r.confidence());
        t.setNeedsHumanReview(r.needs_human_review() || dup != null);
        t.setEngine(r.engine());
        if (dup != null) {
            t.setPossibleDuplicateOf(dup.reference());
            t.setDuplicateScore(dup.score());
        }
        return t;
    }

    private static String join(List<String> items, int max) {
        return items == null || items.isEmpty() ? null : cut(String.join(",", items), max);
    }

    private static String cut(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }
}
