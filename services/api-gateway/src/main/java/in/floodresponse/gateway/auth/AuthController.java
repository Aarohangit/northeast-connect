package in.floodresponse.gateway.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final StaffDirectory staff;
    private final TokenService tokens;

    public AuthController(StaffDirectory staff, TokenService tokens) {
        this.staff = staff;
        this.tokens = tokens;
    }

    public record LoginRequest(@NotBlank @Size(max = 60) String username, @NotBlank @Size(max = 100) String password) {
    }

    public record Session(String token, Instant expiresAt, Me user) {
    }

    public record Me(String username, String name, String role, String district) {
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest body) {
        return staff.authenticate(body.username(), body.password())
                .<ResponseEntity<?>>map(s -> {
                    var issued = tokens.issue(s);
                    return ResponseEntity.ok(new Session(issued.token(), issued.expiresAt(),
                            new Me(s.username(), s.name(), s.role().name(), s.district())));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Wrong username or password")));
    }

    @GetMapping("/me")
    public Me me(@AuthenticationPrincipal Jwt jwt) {
        List<String> roles = jwt.getClaimAsStringList("roles");
        return new Me(jwt.getSubject(), jwt.getClaimAsString("name"),
                roles == null || roles.isEmpty() ? null : roles.getFirst(), jwt.getClaimAsString("district"));
    }
}
