package in.floodresponse.rescue.api;

import jakarta.validation.constraints.*;

public final class DispatchRequests {

    private DispatchRequests() {
    }

    public record Dispatch(
            @NotBlank @Size(max = 16) String sosReference,
            @NotNull Long teamId,
            @Size(max = 80) String assignedBy,
            @Size(max = 500) String note
    ) {
    }

    public record Complete(
            @Min(0) @Max(500) Integer peopleRescued,
            @Size(max = 500) String note,
            @Size(max = 80) String by
    ) {
    }

    public record Cancel(
            @Size(max = 500) String reason,
            @Size(max = 80) String by
    ) {
    }

    public record Actor(@Size(max = 80) String by) {
    }

    public record Availability(boolean onDuty) {
    }
}
