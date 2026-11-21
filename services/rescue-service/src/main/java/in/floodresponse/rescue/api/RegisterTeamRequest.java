package in.floodresponse.rescue.api;

import in.floodresponse.rescue.domain.TeamType;
import jakarta.validation.constraints.*;

public record RegisterTeamRequest(
        @NotBlank @Size(max = 24) @Pattern(regexp = "^[A-Za-z0-9-]+$", message = "letters, digits and dashes only") String code,
        @NotBlank @Size(max = 100) String name,
        @NotNull TeamType type,
        @NotBlank @Size(max = 60) String district,
        @NotBlank @Size(max = 80) String leaderName,
        @NotBlank @Pattern(regexp = "^\\+?[0-9]{10,13}$", message = "must be a valid phone number") String phone,
        @Min(1) @Max(200) int members,
        @Min(0) @Max(50) Integer boats,
        @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double baseLatitude,
        @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double baseLongitude
) {
}
