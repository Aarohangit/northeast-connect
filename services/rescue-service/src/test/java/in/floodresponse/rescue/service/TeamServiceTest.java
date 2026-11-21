package in.floodresponse.rescue.service;

import in.floodresponse.rescue.domain.RescueTeam;
import in.floodresponse.rescue.domain.TeamRepository;
import in.floodresponse.rescue.domain.TeamStatus;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TeamServiceTest {

    @Test
    void distanceMatchesKnownStraightLineBetweenGuwahatiAndShillong() {
        double km = TeamService.haversineKm(26.1445, 91.7362, 25.5788, 91.8933);
        assertThat(km).isCloseTo(64.5, within(2.0));
    }

    @Test
    void nearestAvailableTeamsComeFirst() {
        TeamRepository repo = mock(TeamRepository.class);
        RescueTeam aizawl = team("SDRF-AZL-01", 23.7271, 92.7176);
        RescueTeam shillong = team("SDRF-SHL-01", 25.5788, 91.8933);
        RescueTeam imphal = team("SDRF-IMP-01", 24.8170, 93.9368);
        when(repo.findByStatus(TeamStatus.AVAILABLE)).thenReturn(List.of(shillong, imphal, aizawl));

        var nearest = new TeamService(repo).nearestAvailable(23.74, 92.72, 2);

        assertThat(nearest).extracting(d -> d.team().getCode()).containsExactly("SDRF-AZL-01", "SDRF-IMP-01");
        assertThat(nearest.getFirst().km()).isLessThan(3);
    }

    private static RescueTeam team(String code, double lat, double lng) {
        RescueTeam t = new RescueTeam();
        t.setCode(code);
        t.setBaseLatitude(lat);
        t.setBaseLongitude(lng);
        return t;
    }
}
