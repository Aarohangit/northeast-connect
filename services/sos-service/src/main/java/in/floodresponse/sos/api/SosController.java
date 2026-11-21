package in.floodresponse.sos.api;

import in.floodresponse.sos.domain.RescueStatus;
import in.floodresponse.sos.domain.Triage;
import in.floodresponse.sos.domain.TriageRepository;
import in.floodresponse.sos.service.SosService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sos")
public class SosController {

    private final SosService sos;
    private final TriageRepository triages;

    public SosController(SosService sos, TriageRepository triages) {
        this.sos = sos;
        this.triages = triages;
    }

    /** 201 on first receipt, 200 when the phone is retrying something we already have. */
    @PostMapping
    public ResponseEntity<CitizenStatusView> submit(@Valid @RequestBody SubmitSosRequest body) {
        var result = sos.submit(body);
        var view = citizenView(result.request().getReference());
        return ResponseEntity.status(result.created() ? HttpStatus.CREATED : HttpStatus.OK).body(view);
    }

    @GetMapping("/{reference}/status")
    public CitizenStatusView status(@PathVariable String reference) {
        return citizenView(reference);
    }

    @PatchMapping("/{reference}/location")
    public CitizenStatusView updateLocation(@PathVariable String reference,
                                            @Valid @RequestBody UpdateLocationRequest body) {
        sos.updateLocation(reference, body);
        return citizenView(reference);
    }

    // Control-room endpoints. The gateway only lets authenticated staff through to these.

    @GetMapping
    public List<SosView> list(@RequestParam(required = false) RescueStatus status,
                              @RequestParam(required = false) String district) {
        var found = sos.search(status, district);
        if (found.isEmpty()) return List.of();
        Map<Long, Triage> byId = triages.findBySosIds(found.stream().map(r -> r.getId()).toList()).stream()
                .collect(Collectors.toMap(t -> t.getSos().getId(), Function.identity()));
        return found.stream().map(r -> SosView.of(r, byId.get(r.getId()))).toList();
    }

    @GetMapping("/{reference}")
    public SosView detail(@PathVariable String reference) {
        return withTriage(sos.get(reference));
    }

    @PatchMapping("/{reference}/status")
    public SosView changeStatus(@PathVariable String reference, @Valid @RequestBody ChangeStatusRequest body) {
        return withTriage(sos.changeStatus(reference, body));
    }

    private SosView withTriage(in.floodresponse.sos.domain.SosRequest r) {
        return SosView.of(r, triages.findBySosId(r.getId()).orElse(null));
    }

    private CitizenStatusView citizenView(String reference) {
        var s = sos.get(reference);
        var steps = sos.historyOf(s).stream().map(CitizenStatusView.Step::of).toList();
        return new CitizenStatusView(s.getReference(), s.getStatus(), s.getReceivedAt(), s.getUpdatedAt(), steps);
    }
}
