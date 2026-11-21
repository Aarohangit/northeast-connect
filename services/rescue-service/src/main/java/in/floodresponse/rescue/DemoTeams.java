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

/** Loads a starting roster of rescue teams across the North East. Only runs against an empty table. */
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
                team("VOL-JRT-01", "Jorhat Flood Volunteers", VOLUNTEER, "Jorhat", "B. Hazarika", "9435000110", 20, 2, 26.7509, 94.2037),
                team("NDRF-12BN-A", "NDRF 12th Bn, Alpha", NDRF, "Papum Pare", "Insp. T. Riba", "9436000111", 18, 2, 27.1800, 93.7500),
                team("SDRF-AZL-01", "Mizoram SDRF Aizawl", SDRF, "Aizawl", "SI Lalthanzuala", "9436000112", 12, 0, 23.7271, 92.7176),
                team("SDRF-SHL-01", "Meghalaya SDRF Shillong", SDRF, "East Khasi Hills", "SI B. Lyngdoh", "9436000113", 12, 1, 25.5788, 91.8933),
                team("FES-TUR-01", "Fire & Emergency Tura", FIRE_AND_EMERGENCY, "West Garo Hills", "Stn. Officer R. Sangma", "9436000114", 8, 2, 25.5138, 90.2036),
                team("SDRF-IMP-01", "Manipur SDRF Imphal", SDRF, "Imphal West", "SI K. Singh", "9436000115", 14, 1, 24.8170, 93.9368),
                team("SDRF-GTK-01", "Sikkim SDRF Gangtok", SDRF, "Gangtok", "SI P. Lepcha", "9436000116", 10, 0, 27.3314, 88.6138),
                team("VOL-MNG-01", "Mangan Rescue Volunteers", VOLUNTEER, "Mangan", "D. Bhutia", "9436000117", 15, 0, 27.5080, 88.5290),
                team("SDRF-KOH-01", "Nagaland SDRF Kohima", SDRF, "Kohima", "SI V. Angami", "9436000118", 12, 0, 25.6751, 94.1086),
                team("SDRF-AGT-01", "Tripura SDRF Agartala", SDRF, "West Tripura", "SI S. Debbarma", "9436000119", 14, 3, 23.8315, 91.2868)
        );
        roster.forEach(teams::register);
        log.info("Seeded {} demo rescue teams", roster.size());
    }

    private static RegisterTeamRequest team(String code, String name, TeamType type, String district, String leader,
                                            String phone, int members, int boats, double lat, double lng) {
        return new RegisterTeamRequest(code, name, type, district, leader, phone, members, boats, lat, lng);
    }
}
