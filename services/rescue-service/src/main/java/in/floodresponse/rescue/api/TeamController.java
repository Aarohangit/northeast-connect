package in.floodresponse.rescue.api;

import in.floodresponse.rescue.domain.TeamStatus;
import in.floodresponse.rescue.service.TeamService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamService teams;

    public TeamController(TeamService teams) {
        this.teams = teams;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Views.Team register(@Valid @RequestBody RegisterTeamRequest body) {
        return Views.Team.of(teams.register(body));
    }

    @GetMapping
    public List<Views.Team> list(@RequestParam(required = false) TeamStatus status,
                                 @RequestParam(required = false) String district) {
        return teams.search(status, district).stream().map(Views.Team::of).toList();
    }

    @GetMapping("/{id}")
    public Views.Team get(@PathVariable Long id) {
        return Views.Team.of(teams.get(id));
    }

    @GetMapping("/nearest")
    public List<Views.NearbyTeam> nearest(@RequestParam double lat, @RequestParam double lng,
                                          @RequestParam(defaultValue = "3") @Min(1) @Max(20) int limit) {
        return teams.nearestAvailable(lat, lng, limit).stream()
                .map(d -> new Views.NearbyTeam(Views.Team.of(d.team()), Math.round(d.km() * 10) / 10.0))
                .toList();
    }

    @PatchMapping("/{id}/availability")
    public Views.Team availability(@PathVariable Long id, @RequestBody DispatchRequests.Availability body) {
        return Views.Team.of(teams.setAvailability(id, body.onDuty()));
    }
}
