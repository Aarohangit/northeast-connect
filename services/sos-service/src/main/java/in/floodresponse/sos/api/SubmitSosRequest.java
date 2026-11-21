package in.floodresponse.sos.api;

import in.floodresponse.sos.domain.DeliveryChannel;
import in.floodresponse.sos.domain.EmergencyCategory;
import jakarta.validation.constraints.*;

import java.time.Instant;

public record SubmitSosRequest(
        @NotBlank @Size(max = 64) String clientRequestId,
        @NotBlank @Size(max = 80) String name,
        @NotBlank @Pattern(regexp = "^\\+?[0-9]{10,13}$", message = "must be a valid phone number") String phone,
        @NotNull EmergencyCategory category,
        @Size(max = 1000) String description,
        @Min(1) @Max(500) Integer peopleCount,
        @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
        @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
        @PositiveOrZero Double accuracyMeters,
        @Size(max = 60) String district,
        @Size(max = 8) String language,
        DeliveryChannel channel,
        @PastOrPresent Instant reportedAt
) {
}
