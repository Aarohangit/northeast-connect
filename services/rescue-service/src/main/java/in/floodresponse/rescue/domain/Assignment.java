package in.floodresponse.rescue.domain;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * One team sent to one SOS. The SOS itself lives in sos-service; we only
 * keep its reference here, never a copy of the citizen's details.
 */
@Entity
@Table(name = "rescue_assignments", indexes = {
        @Index(name = "ix_assignment_sos", columnList = "sosReference"),
        @Index(name = "ix_assignment_status", columnList = "status")
})
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 16)
    private String sosReference;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id")
    private RescueTeam team;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private AssignmentStatus status = AssignmentStatus.ASSIGNED;

    @Column(length = 80)
    private String assignedBy;

    @Column(length = 500)
    private String notes;

    private Integer peopleRescued;

    @Column(nullable = false)
    private Instant assignedAt;

    private Instant departedAt;

    private Instant closedAt;

    protected Assignment() {
    }

    public Assignment(String sosReference, RescueTeam team, String assignedBy, String notes) {
        this.sosReference = sosReference;
        this.team = team;
        this.assignedBy = assignedBy;
        this.notes = notes;
        this.assignedAt = Instant.now();
    }

    public void depart() {
        status = AssignmentStatus.EN_ROUTE;
        departedAt = Instant.now();
    }

    public void complete(Integer rescued, String note) {
        status = AssignmentStatus.COMPLETED;
        peopleRescued = rescued;
        appendNote(note);
        closedAt = Instant.now();
    }

    public void cancel(String reason) {
        status = AssignmentStatus.CANCELLED;
        appendNote(reason);
        closedAt = Instant.now();
    }

    private void appendNote(String note) {
        if (note == null || note.isBlank()) return;
        notes = (notes == null || notes.isBlank()) ? note : notes + " | " + note;
    }

    public Long getId() { return id; }
    public String getSosReference() { return sosReference; }
    public RescueTeam getTeam() { return team; }
    public AssignmentStatus getStatus() { return status; }
    public String getAssignedBy() { return assignedBy; }
    public String getNotes() { return notes; }
    public Integer getPeopleRescued() { return peopleRescued; }
    public Instant getAssignedAt() { return assignedAt; }
    public Instant getDepartedAt() { return departedAt; }
    public Instant getClosedAt() { return closedAt; }
}
