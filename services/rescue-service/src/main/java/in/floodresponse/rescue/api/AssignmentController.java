package in.floodresponse.rescue.api;

import in.floodresponse.rescue.service.AssignmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    private final AssignmentService assignments;

    public AssignmentController(AssignmentService assignments) {
        this.assignments = assignments;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Views.Operation dispatch(@Valid @RequestBody DispatchRequests.Dispatch body) {
        return Views.Operation.of(assignments.dispatch(body.sosReference(), body.teamId(), body.assignedBy(), body.note()));
    }

    @GetMapping
    public List<Views.Operation> list(@RequestParam(required = false) String sosReference,
                                      @RequestParam(required = false) Long teamId,
                                      @RequestParam(defaultValue = "false") boolean open) {
        return assignments.list(sosReference, teamId, open).stream().map(Views.Operation::of).toList();
    }

    @GetMapping("/{id}")
    public Views.Operation get(@PathVariable Long id) {
        return Views.Operation.of(assignments.get(id));
    }

    @PostMapping("/{id}/depart")
    public Views.Operation depart(@PathVariable Long id, @Valid @RequestBody(required = false) DispatchRequests.Actor body) {
        return Views.Operation.of(assignments.depart(id, body == null ? null : body.by()));
    }

    @PostMapping("/{id}/complete")
    public Views.Operation complete(@PathVariable Long id, @Valid @RequestBody DispatchRequests.Complete body) {
        return Views.Operation.of(assignments.complete(id, body.peopleRescued(), body.note(), body.by()));
    }

    @PostMapping("/{id}/cancel")
    public Views.Operation cancel(@PathVariable Long id, @Valid @RequestBody DispatchRequests.Cancel body) {
        return Views.Operation.of(assignments.cancel(id, body.reason(), body.by()));
    }
}
