package in.floodresponse.rescue.service;

import in.floodresponse.rescue.api.RegisterTeamRequest;
import in.floodresponse.rescue.domain.RescueTeam;
import in.floodresponse.rescue.domain.TeamRepository;
import in.floodresponse.rescue.domain.TeamStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class TeamService {

    private final TeamRepository teams;

    public TeamService(TeamRepository teams) {
        this.teams = teams;
    }

    public record TeamDistance(RescueTeam team, double km) {
    }

    @Transactional
    public RescueTeam register(RegisterTeamRequest in) {
        String code = in.code().trim().toUpperCase();
        if (teams.existsByCode(code)) {
            throw new RuleViolationException("A team with code " + code + " already exists");
        }
        RescueTeam t = new RescueTeam();
        t.setCode(code);
        t.setName(in.name().trim());
        t.setType(in.type());
        t.setDistrict(in.district().trim());
        t.setLeaderName(in.leaderName().trim());
        t.setPhone(in.phone());
        t.setMembers(in.members());
        t.setBoats(in.boats() == null ? 0 : in.boats());
        t.setBaseLatitude(in.baseLatitude());
        t.setBaseLongitude(in.baseLongitude());
        return teams.save(t);
    }

    @Transactional(readOnly = true)
    public RescueTeam get(Long id) {
        return teams.findById(id).orElseThrow(() -> new NotFoundException("No team with id " + id));
    }

    @Transactional(readOnly = true)
    public List<RescueTeam> search(TeamStatus status, String district) {
        return teams.search(status, district);
    }

    /** Off duty and back on are the only manual switches. DEPLOYED is set by dispatch only. */
    @Transactional
    public RescueTeam setAvailability(Long id, boolean onDuty) {
        RescueTeam t = get(id);
        if (t.getStatus() == TeamStatus.DEPLOYED) {
            throw new RuleViolationException(t.getCode() + " is on an active operation; close or cancel it first");
        }
        t.setStatus(onDuty ? TeamStatus.AVAILABLE : TeamStatus.OFF_DUTY);
        return t;
    }

    /** Straight-line distance. Good enough to shortlist; the coordinator makes the call. */
    @Transactional(readOnly = true)
    public List<TeamDistance> nearestAvailable(double lat, double lng, int limit) {
        return teams.findByStatus(TeamStatus.AVAILABLE).stream()
                .map(t -> new TeamDistance(t, haversineKm(lat, lng, t.getBaseLatitude(), t.getBaseLongitude())))
                .sorted(Comparator.comparingDouble(TeamDistance::km))
                .limit(limit)
                .toList();
    }

    static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 6371.0 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
