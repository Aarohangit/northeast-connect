package in.floodresponse.sos.service;

import in.floodresponse.sos.api.ChangeStatusRequest;
import in.floodresponse.sos.api.SubmitSosRequest;
import in.floodresponse.sos.api.UpdateLocationRequest;
import in.floodresponse.sos.domain.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static in.floodresponse.sos.domain.RescueStatus.*;

@Service
public class SosService {

    private static final Map<RescueStatus, Set<RescueStatus>> ALLOWED = Map.of(
            RECEIVED, EnumSet.of(VERIFIED, REJECTED, DUPLICATE),
            VERIFIED, EnumSet.of(TEAM_ASSIGNED, REJECTED, DUPLICATE),
            TEAM_ASSIGNED, EnumSet.of(IN_PROGRESS, VERIFIED, RESCUED),
            IN_PROGRESS, EnumSet.of(RESCUED, TEAM_ASSIGNED, VERIFIED)
    );

    private final SosRepository requests;
    private final StatusChangeRepository history;
    private final ReferenceGenerator references;
    private final ApplicationEventPublisher events;

    public SosService(SosRepository requests, StatusChangeRepository history, ReferenceGenerator references,
                      ApplicationEventPublisher events) {
        this.requests = requests;
        this.history = history;
        this.references = references;
        this.events = events;
    }

    public record SubmitResult(SosRequest request, boolean created) {
    }

    /**
     * Phones on a flaky network will resend the same request several times.
     * The client id makes that safe: the first one wins, the rest get the
     * original back.
     */
    @Transactional
    public SubmitResult submit(SubmitSosRequest in) {
        var existing = requests.findByClientRequestId(in.clientRequestId());
        if (existing.isPresent()) {
            return new SubmitResult(existing.get(), false);
        }

        SosRequest s = new SosRequest();
        s.setClientRequestId(in.clientRequestId());
        s.setReference(newReference());
        s.setName(in.name().trim());
        s.setPhone(in.phone());
        s.setCategory(in.category());
        s.setDescription(in.description());
        s.setPeopleCount(in.peopleCount());
        s.setLatitude(in.latitude());
        s.setLongitude(in.longitude());
        s.setAccuracyMeters(in.accuracyMeters());
        s.setDistrict(in.district());
        s.setLanguage(in.language());
        s.setChannel(in.channel() == null ? DeliveryChannel.DIRECT : in.channel());
        s.setReportedAt(in.reportedAt());

        try {
            requests.saveAndFlush(s);
        } catch (DataIntegrityViolationException race) {
            // Two retries landed at the same moment; the other one got there first.
            return new SubmitResult(requests.findByClientRequestId(in.clientRequestId()).orElseThrow(), false);
        }
        history.save(new StatusChange(s, null, RECEIVED, "Request received", "system"));
        events.publishEvent(new SosSubmitted(s.getId()));
        return new SubmitResult(s, true);
    }

    @Transactional(readOnly = true)
    public SosRequest get(String reference) {
        return requests.findByReference(reference).orElseThrow(() -> new SosNotFoundException(reference));
    }

    @Transactional(readOnly = true)
    public List<StatusChange> historyOf(SosRequest s) {
        return history.findBySosOrderByChangedAtAsc(s);
    }

    @Transactional(readOnly = true)
    public List<SosRequest> search(RescueStatus status, String district) {
        return requests.search(status, district);
    }

    @Transactional
    public SosRequest updateLocation(String reference, UpdateLocationRequest in) {
        SosRequest s = get(reference);
        s.setLatitude(in.latitude());
        s.setLongitude(in.longitude());
        s.setAccuracyMeters(in.accuracyMeters());
        if (in.description() != null && !in.description().isBlank()) {
            s.setDescription(in.description());
        }
        return s;
    }

    @Transactional
    public SosRequest changeStatus(String reference, ChangeStatusRequest in) {
        SosRequest s = get(reference);
        RescueStatus from = s.getStatus();
        if (from == in.status()) {
            return s;
        }
        if (!ALLOWED.getOrDefault(from, Set.of()).contains(in.status())) {
            throw new InvalidTransitionException(from, in.status());
        }
        s.setStatus(in.status());
        history.save(new StatusChange(s, from, in.status(), in.note(), in.changedBy()));
        return s;
    }

    private String newReference() {
        String ref;
        do {
            ref = references.next();
        } while (requests.existsByReference(ref));
        return ref;
    }
}
