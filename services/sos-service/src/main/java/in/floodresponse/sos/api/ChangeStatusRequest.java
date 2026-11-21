package in.floodresponse.sos.api;

import in.floodresponse.sos.domain.RescueStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ChangeStatusRequest(
        @NotNull RescueStatus status,
        @Size(max = 500) String note,
        @Size(max = 80) String changedBy
) {
}
