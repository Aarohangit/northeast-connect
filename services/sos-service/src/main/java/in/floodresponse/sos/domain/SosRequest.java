package in.floodresponse.sos.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "sos_requests", indexes = {
        @Index(name = "ux_sos_client_id", columnList = "clientRequestId", unique = true),
        @Index(name = "ux_sos_reference", columnList = "reference", unique = true),
        @Index(name = "ix_sos_status", columnList = "status"),
        @Index(name = "ix_sos_district", columnList = "district")
})
public class SosRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Generated on the phone. Retries reuse it, which is what makes submits idempotent. */
    @Column(nullable = false, length = 64)
    private String clientRequestId;

    /** Short code shown to the citizen and read out over the phone, e.g. AS-7K3Q9. */
    @Column(nullable = false, length = 16)
    private String reference;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR) // plain text, so new values need no schema change
    @Column(nullable = false, length = 24)
    private EmergencyCategory category;

    @Column(length = 1000)
    private String description;

    private Integer peopleCount;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    private Double accuracyMeters;

    @Column(length = 60)
    private String district;

    @Column(length = 8)
    private String language;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR) // plain text, so new values need no schema change
    @Column(nullable = false, length = 16)
    private DeliveryChannel channel;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR) // plain text, so new values need no schema change
    @Column(nullable = false, length = 16)
    private RescueStatus status = RescueStatus.RECEIVED;

    /** When the citizen pressed SOS, per the device clock. */
    private Instant reportedAt;

    @Column(nullable = false)
    private Instant receivedAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        receivedAt = Instant.now();
        updatedAt = receivedAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getClientRequestId() { return clientRequestId; }
    public void setClientRequestId(String clientRequestId) { this.clientRequestId = clientRequestId; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public EmergencyCategory getCategory() { return category; }
    public void setCategory(EmergencyCategory category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getPeopleCount() { return peopleCount; }
    public void setPeopleCount(Integer peopleCount) { this.peopleCount = peopleCount; }
    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }
    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }
    public Double getAccuracyMeters() { return accuracyMeters; }
    public void setAccuracyMeters(Double accuracyMeters) { this.accuracyMeters = accuracyMeters; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public DeliveryChannel getChannel() { return channel; }
    public void setChannel(DeliveryChannel channel) { this.channel = channel; }
    public RescueStatus getStatus() { return status; }
    public void setStatus(RescueStatus status) { this.status = status; }
    public Instant getReportedAt() { return reportedAt; }
    public void setReportedAt(Instant reportedAt) { this.reportedAt = reportedAt; }
    public Instant getReceivedAt() { return receivedAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
