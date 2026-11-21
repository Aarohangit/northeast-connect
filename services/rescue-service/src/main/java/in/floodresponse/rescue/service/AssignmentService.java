package in.floodresponse.rescue.service;

import in.floodresponse.rescue.client.SosClient;
import in.floodresponse.rescue.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * Dispatch workflow. Every step changes our tables and then tells sos-service.
 * The remote call happens inside the transaction, so if sos-service refuses
 * or is down, our change rolls back and the two never disagree.
 */
@Service
public class AssignmentService {

    private static final Set<AssignmentStatus> OPEN = EnumSet.of(AssignmentStatus.ASSIGNED, AssignmentStatus.EN_ROUTE);

    private final AssignmentRepository assignments;
    private final TeamRepository teams;
    private final TeamService teamService;
    private final SosClient sos;

    public AssignmentService(AssignmentRepository assignments, TeamRepository teams,
                             TeamService teamService, SosClient sos) {
        this.assignments = assignments;
        this.teams = teams;
        this.teamService = teamService;
        this.sos = sos;
    }

    @Transactional
    public Assignment dispatch(String sosReference, Long teamId, String by, String note) {
        RescueTeam team = teamService.get(teamId);
        if (team.getStatus() != TeamStatus.AVAILABLE) {
            throw new RuleViolationException(team.getCode() + " is " + team.getStatus().name().toLowerCase().replace('_', ' '));
        }
        if (assignments.existsBySosReferenceAndStatusIn(sosReference, OPEN)) {
            throw new RuleViolationException(sosReference + " already has a team on the way");
        }

        team.setStatus(TeamStatus.DEPLOYED);
        teams.saveAndFlush(team);
        Assignment a = assignments.save(new Assignment(sosReference, team, by, note));

        sos.changeStatus(sosReference, "TEAM_ASSIGNED",
                team.getCode() + " (" + team.getName() + ") dispatched", by);
        return a;
    }

    @Transactional
    public Assignment depart(Long id, String by) {
        Assignment a = get(id);
        if (a.getStatus() != AssignmentStatus.ASSIGNED) {
            throw new RuleViolationException("Only a newly assigned operation can be marked en route");
        }
        a.depart();
        sos.changeStatus(a.getSosReference(), "IN_PROGRESS", a.getTeam().getCode() + " is on the way", by);
        return a;
    }

    @Transactional
    public Assignment complete(Long id, Integer peopleRescued, String note, String by) {
        Assignment a = requireOpen(id);
        a.complete(peopleRescued, note);
        a.getTeam().setStatus(TeamStatus.AVAILABLE);
        String msg = peopleRescued == null
                ? "Rescue completed by " + a.getTeam().getCode()
                : peopleRescued + " people rescued by " + a.getTeam().getCode();
        sos.changeStatus(a.getSosReference(), "RESCUED", msg, by);
        return a;
    }

    /** Team recalled or couldn't reach the site. The SOS goes back to the verified queue. */
    @Transactional
    public Assignment cancel(Long id, String reason, String by) {
        Assignment a = requireOpen(id);
        a.cancel(reason);
        a.getTeam().setStatus(TeamStatus.AVAILABLE);
        sos.changeStatus(a.getSosReference(), "VERIFIED",
                "Team recalled" + (reason == null || reason.isBlank() ? "" : ": " + reason), by);
        return a;
    }

    @Transactional(readOnly = true)
    public Assignment get(Long id) {
        return assignments.findById(id).orElseThrow(() -> new NotFoundException("No assignment with id " + id));
    }

    @Transactional(readOnly = true)
    public List<Assignment> list(String sosReference, Long teamId, boolean openOnly) {
        if (sosReference != null) return assignments.findBySosReferenceOrderByAssignedAtDesc(sosReference);
        if (teamId != null) return assignments.findByTeamIdOrderByAssignedAtDesc(teamId);
        if (openOnly) return assignments.findByStatusInOrderByAssignedAtDesc(OPEN);
        return assignments.findAllByOrderByAssignedAtDesc();
    }

    private Assignment requireOpen(Long id) {
        Assignment a = get(id);
        if (!a.getStatus().isOpen()) {
            throw new RuleViolationException("Operation #" + id + " is already " + a.getStatus().name().toLowerCase());
        }
        return a;
    }
}
