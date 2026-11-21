package in.floodresponse.sos.domain;

import jakarta.persistence.*;

import java.time.Instant;

/** Append-only history. Nothing here is ever updated or deleted. */
@Entity
@Table(name = "sos_status_history", indexes = @Index(name = "ix_history_sos", columnList = "sos_id"))
public class StatusChange {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sos_id")
    private SosRequest sos;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private RescueStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private RescueStatus toStatus;

    @Column(length = 500)
    private String note;

    @Column(length = 80)
    private String changedBy;

    @Column(nullable = false)
    private Instant changedAt;

    protected StatusChange() {
    }

    public StatusChange(SosRequest sos, RescueStatus from, RescueStatus to, String note, String changedBy) {
        this.sos = sos;
        this.fromStatus = from;
        this.toStatus = to;
        this.note = note;
        this.changedBy = changedBy;
        this.changedAt = Instant.now();
    }

    public RescueStatus getFromStatus() { return fromStatus; }
    public RescueStatus getToStatus() { return toStatus; }
    public String getNote() { return note; }
    public String getChangedBy() { return changedBy; }
    public Instant getChangedAt() { return changedAt; }
}
