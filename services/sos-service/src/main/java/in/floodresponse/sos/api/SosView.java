package in.floodresponse.sos.api;

import in.floodresponse.sos.domain.*;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

/** Full record, for the control room. Contains personal data. */
public record SosView(
        String reference,
        String name,
        String phone,
        EmergencyCategory category,
        String description,
        Integer peopleCount,
        double latitude,
        double longitude,
        Double accuracyMeters,
        String district,
        String language,
        DeliveryChannel channel,
        RescueStatus status,
        Instant reportedAt,
        Instant receivedAt,
        Instant updatedAt,
        TriageView triage
) {
    /** Null while triage is still pending. */
    public record TriageView(String severity, String suggestedCategory, String severityReason, String summary,
                             String translation, String detectedLanguage, Integer peopleCount,
                             List<String> vulnerable, List<String> needs, List<String> medicalConditions,
                             List<String> locationHints, String waterLevel, boolean waterRising,
                             String confidence, boolean needsHumanReview, String engine,
                             String possibleDuplicateOf, Double duplicateScore, Instant triagedAt) {
        static TriageView of(Triage t) {
            if (t == null) return null;
            return new TriageView(t.getSeverity(), t.getSuggestedCategory(), t.getSeverityReason(), t.getSummary(),
                    t.getTranslation(), t.getDetectedLanguage(), t.getPeopleCount(), split(t.getVulnerable()),
                    split(t.getNeeds()), split(t.getMedicalConditions()), split(t.getLocationHints()),
                    t.getWaterLevel(), t.isWaterRising(), t.getConfidence(), t.isNeedsHumanReview(), t.getEngine(),
                    t.getPossibleDuplicateOf(), t.getDuplicateScore(), t.getTriagedAt());
        }

        private static List<String> split(String csv) {
            return csv == null || csv.isBlank() ? List.of() : Arrays.asList(csv.split(","));
        }
    }

    static SosView of(SosRequest s, Triage t) {
        return new SosView(s.getReference(), s.getName(), s.getPhone(), s.getCategory(), s.getDescription(),
                s.getPeopleCount(), s.getLatitude(), s.getLongitude(), s.getAccuracyMeters(), s.getDistrict(),
                s.getLanguage(), s.getChannel(), s.getStatus(), s.getReportedAt(), s.getReceivedAt(), s.getUpdatedAt(),
                TriageView.of(t));
    }
}
