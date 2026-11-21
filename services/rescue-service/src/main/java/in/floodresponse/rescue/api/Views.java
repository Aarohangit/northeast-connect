package in.floodresponse.rescue.api;

import in.floodresponse.rescue.domain.*;

import java.time.Instant;

public final class Views {

    private Views() {
    }

    public record Team(Long id, String code, String name, TeamType type, String district, String leaderName,
                       String phone, int members, int boats, double baseLatitude, double baseLongitude,
                       TeamStatus status) {
        static Team of(RescueTeam t) {
            return new Team(t.getId(), t.getCode(), t.getName(), t.getType(), t.getDistrict(), t.getLeaderName(),
                    t.getPhone(), t.getMembers(), t.getBoats(), t.getBaseLatitude(), t.getBaseLongitude(),
                    t.getStatus());
        }
    }

    public record NearbyTeam(Team team, double distanceKm) {
    }

    public record Operation(Long id, String sosReference, Long teamId, String teamCode, String teamName,
                            AssignmentStatus status, String assignedBy, String notes, Integer peopleRescued,
                            Instant assignedAt, Instant departedAt, Instant closedAt) {
        static Operation of(Assignment a) {
            return new Operation(a.getId(), a.getSosReference(), a.getTeam().getId(), a.getTeam().getCode(),
                    a.getTeam().getName(), a.getStatus(), a.getAssignedBy(), a.getNotes(), a.getPeopleRescued(),
                    a.getAssignedAt(), a.getDepartedAt(), a.getClosedAt());
        }
    }
}
