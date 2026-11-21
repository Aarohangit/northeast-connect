package in.floodresponse.rescue;

import in.floodresponse.rescue.api.RegisterTeamRequest;
import in.floodresponse.rescue.domain.TeamRepository;
import in.floodresponse.rescue.domain.TeamType;
import in.floodresponse.rescue.service.TeamService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;

import static in.floodresponse.rescue.domain.TeamType.*;

/** Loads a starting roster for flood-prone Assam districts. Only runs against an empty table. */
@Component
@ConditionalOnProperty(name = "rescue.seed-demo-teams", havingValue = "true")
class DemoTeams implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoTeams.class);

    private final TeamRepository repo;
    private final TeamService teams;

    DemoTeams(TeamRepository repo, TeamService teams) {
        this.repo = repo;
        this.teams = teams;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (repo.count() > 0) return;

        List<RegisterTeamRequest> roster = List.of(
                team("NDRF-1BN-A", "NDRF 1st Bn, Alpha", NDRF, "Kamrup Metro", "Insp. R. Baruah", "9435000101", 18, 4, 26.1700, 91.6700),
                team("SDRF-KMR-02", "SDRF Kamrup Unit 2", SDRF, "Kamrup Metro", "SI P. Kalita", "9435000102", 12, 2, 26.1445, 91.7898),
                team("SDRF-BPT-01", "SDRF Barpeta Unit 1", SDRF, "Barpeta", "SI M. Hussain", "9435000103", 10, 3, 26.3216, 91.0060),
                team("FES-BPT-01", "Fire & Emergency Barpeta", FIRE_AND_EMERGENCY, "Barpeta", "Stn. Officer A. Das", "9435000104", 8, 1, 26.3300, 91.0100),
                team("SDRF-MRG-01", "SDRF Morigaon Unit 1", SDRF, "Morigaon", "SI J. Bora", "9435000105", 10, 2, 26.2520, 92.3420),
                team("MED-NGN-01", "District Medical Response, Nagaon", MEDICAL, "Nagaon", "Dr. S. Saikia", "9435000106", 6, 0, 26.3480, 92.6840),
                team("NDRF-1BN-C", "NDRF 1st Bn, Charlie", NDRF, "Lakhimpur", "Insp. K. Gogoi", "9435000107", 18, 4, 27.2360, 94.1050),
                team("SDRF-DMJ-01", "SDRF Dhemaji Unit 1", SDRF, "Dhemaji", "SI D. Pegu", "9435000108", 10, 3, 27.4800, 94.5800),
                team("CD-DBR-01", "Civil Defence Dibrugarh", CIVIL_DEFENCE, "Dibrugarh", "N. Phukan", "9435000109", 14, 1, 27.4728, 94.9120),
                team("VOL-JRT-01", "Jorhat Flood Volunteers", VOLUNTEER, "Jorhat", "B. Hazarika", "9435000110", 20, 2, 26.7509, 94.2037)
        );
        roster.forEach(teams::register);
        log.info("Seeded {} demo rescue teams", roster.size());
    }

    private static RegisterTeamRequest team(String code, String name, TeamType type, String district, String leader,
                                            String phone, int members, int boats, double lat, double lng) {
        return new RegisterTeamRequest(code, name, type, district, leader, phone, members, boats, lat, lng);
    }
}
