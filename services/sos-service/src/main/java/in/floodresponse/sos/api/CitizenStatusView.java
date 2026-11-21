package in.floodresponse.sos.api;

import in.floodresponse.sos.domain.RescueStatus;
import in.floodresponse.sos.domain.StatusChange;

import java.time.Instant;
import java.util.List;

/**
 * What the citizen's phone sees when it polls. Anyone holding the reference
 * can call this, so it carries no name, phone or exact coordinates.
 */
public record CitizenStatusView(
        String reference,
        RescueStatus status,
        Instant receivedAt,
        Instant updatedAt,
        List<Step> history
) {
    public record Step(RescueStatus status, String note, Instant at) {
        static Step of(StatusChange c) {
            return new Step(c.getToStatus(), c.getNote(), c.getChangedAt());
        }
    }
}
