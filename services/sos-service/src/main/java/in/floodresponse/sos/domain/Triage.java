package in.floodresponse.sos.domain;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * The AI's suggestion for a request. Advisory only: it never changes the
 * request's status, and the officer can ignore it.
 */
@Entity
@Table(name = "sos_triage")
public class Triage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sos_id", unique = true)
    private SosRequest sos;

    @Column(nullable = false, length = 10)
    private String severity;

    @Column(length = 24)
    private String suggestedCategory;

    @Column(length = 300)
    private String severityReason;

    @Column(length = 300)
    private String summary;

    @Column(length = 2000)
    private String translation;

    @Column(length = 30)
    private String detectedLanguage;

    private Integer peopleCount;

    /** Comma-separated enum names; small fixed sets, no need for join tables. */
    @Column(length = 200)
    private String vulnerable;

    @Column(length = 300)
    private String needs;

    @Column(length = 300)
    private String medicalConditions;

    @Column(length = 500)
    private String locationHints;

    @Column(length = 16)
    private String waterLevel;

    private boolean waterRising;

    @Column(length = 8)
    private String confidence;

    private boolean needsHumanReview;

    @Column(length = 10)
    private String engine;

    @Column(length = 16)
    private String possibleDuplicateOf;

    private Double duplicateScore;

    @Column(nullable = false)
    private Instant triagedAt;

    protected Triage() {
    }

    public Triage(SosRequest sos) {
        this.sos = sos;
    }

    @PrePersist
    void onCreate() {
        triagedAt = Instant.now();
    }

    public Long getId() { return id; }
    public SosRequest getSos() { return sos; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getSuggestedCategory() { return suggestedCategory; }
    public void setSuggestedCategory(String suggestedCategory) { this.suggestedCategory = suggestedCategory; }
    public String getSeverityReason() { return severityReason; }
    public void setSeverityReason(String severityReason) { this.severityReason = severityReason; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getTranslation() { return translation; }
    public void setTranslation(String translation) { this.translation = translation; }
    public String getDetectedLanguage() { return detectedLanguage; }
    public void setDetectedLanguage(String detectedLanguage) { this.detectedLanguage = detectedLanguage; }
    public Integer getPeopleCount() { return peopleCount; }
    public void setPeopleCount(Integer peopleCount) { this.peopleCount = peopleCount; }
    public String getVulnerable() { return vulnerable; }
    public void setVulnerable(String vulnerable) { this.vulnerable = vulnerable; }
    public String getNeeds() { return needs; }
    public void setNeeds(String needs) { this.needs = needs; }
    public String getMedicalConditions() { return medicalConditions; }
    public void setMedicalConditions(String medicalConditions) { this.medicalConditions = medicalConditions; }
    public String getLocationHints() { return locationHints; }
    public void setLocationHints(String locationHints) { this.locationHints = locationHints; }
    public String getWaterLevel() { return waterLevel; }
    public void setWaterLevel(String waterLevel) { this.waterLevel = waterLevel; }
    public boolean isWaterRising() { return waterRising; }
    public void setWaterRising(boolean waterRising) { this.waterRising = waterRising; }
    public String getConfidence() { return confidence; }
    public void setConfidence(String confidence) { this.confidence = confidence; }
    public boolean isNeedsHumanReview() { return needsHumanReview; }
    public void setNeedsHumanReview(boolean needsHumanReview) { this.needsHumanReview = needsHumanReview; }
    public String getEngine() { return engine; }
    public void setEngine(String engine) { this.engine = engine; }
    public String getPossibleDuplicateOf() { return possibleDuplicateOf; }
    public void setPossibleDuplicateOf(String possibleDuplicateOf) { this.possibleDuplicateOf = possibleDuplicateOf; }
    public Double getDuplicateScore() { return duplicateScore; }
    public void setDuplicateScore(Double duplicateScore) { this.duplicateScore = duplicateScore; }
    public Instant getTriagedAt() { return triagedAt; }
}
