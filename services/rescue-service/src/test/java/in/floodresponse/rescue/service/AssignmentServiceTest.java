package in.floodresponse.rescue.service;

import in.floodresponse.rescue.client.SosClient;
import in.floodresponse.rescue.client.SosServiceUnavailableException;
import in.floodresponse.rescue.domain.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Dispatch rules. sos-service is mocked; it must be told about every step. */
class AssignmentServiceTest {

    private AssignmentRepository assignments;
    private TeamRepository teams;
    private SosClient sos;
    private AssignmentService service;
    private RescueTeam team;

    @BeforeEach
    void setUp() {
        assignments = mock(AssignmentRepository.class);
        teams = mock(TeamRepository.class);
        sos = mock(SosClient.class);
        service = new AssignmentService(assignments, teams, new TeamService(teams), sos);
        team = new RescueTeam();
        team.setCode("SDRF-AZL-01");
        team.setName("Mizoram SDRF Aizawl");
        when(teams.findById(1L)).thenReturn(Optional.of(team));
        when(assignments.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void dispatchDeploysTheTeamAndUpdatesTheCitizensRequest() {
        Assignment a = service.dispatch("AS-ABCDE", 1L, "officer", null);

        assertThat(team.getStatus()).isEqualTo(TeamStatus.DEPLOYED);
        assertThat(a.getStatus()).isEqualTo(AssignmentStatus.ASSIGNED);
        verify(sos).changeStatus(eq("AS-ABCDE"), eq("TEAM_ASSIGNED"), contains("SDRF-AZL-01"), eq("officer"));
    }

    @Test
    void aTeamAlreadyOutCannotBeSentAgain() {
        team.setStatus(TeamStatus.DEPLOYED);
        assertThatThrownBy(() -> service.dispatch("AS-ABCDE", 1L, "officer", null)).isInstanceOf(RuleViolationException.class);
        verifyNoInteractions(sos);
    }

    @Test
    void aRequestCannotGetTwoTeamsAtOnce() {
        when(assignments.existsBySosReferenceAndStatusIn(eq("AS-ABCDE"), anyCollection())).thenReturn(true);
        assertThatThrownBy(() -> service.dispatch("AS-ABCDE", 1L, "officer", null)).isInstanceOf(RuleViolationException.class);
    }

    @Test
    void ifSosServiceIsDownTheDispatchFailsSoTheTransactionRollsBack() {
        doThrow(new SosServiceUnavailableException()).when(sos).changeStatus(any(), any(), any(), any());
        assertThatThrownBy(() -> service.dispatch("AS-ABCDE", 1L, "officer", null))
                .isInstanceOf(SosServiceUnavailableException.class);
    }

    @Test
    void completingARescueFreesTheTeamAndClosesTheRequest() {
        Assignment a = new Assignment("AS-ABCDE", team, "officer", null);
        team.setStatus(TeamStatus.DEPLOYED);
        when(assignments.findById(7L)).thenReturn(Optional.of(a));

        service.complete(7L, 4, "All safe at camp", "SDRF-AZL-01");

        assertThat(a.getStatus()).isEqualTo(AssignmentStatus.COMPLETED);
        assertThat(a.getPeopleRescued()).isEqualTo(4);
        assertThat(team.getStatus()).isEqualTo(TeamStatus.AVAILABLE);
        verify(sos).changeStatus(eq("AS-ABCDE"), eq("RESCUED"), contains("4 people"), any());
    }
}
