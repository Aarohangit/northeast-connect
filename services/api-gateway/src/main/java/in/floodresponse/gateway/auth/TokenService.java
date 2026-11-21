package in.floodresponse.gateway.auth;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class TokenService {

    static final String ISSUER = "flood-response";

    private final JwtEncoder encoder;
    private final long ttlMinutes;

    public TokenService(GatewayProperties props) {
        this.encoder = new NimbusJwtEncoder(new ImmutableSecret<>(key(props)));
        this.ttlMinutes = props.jwt().ttlMinutes();
    }

    static SecretKey key(GatewayProperties props) {
        byte[] bytes = props.jwt().secret().getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("gateway.jwt.secret must be at least 32 bytes");
        }
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    public record Issued(String token, Instant expiresAt) {
    }

    public Issued issue(GatewayProperties.Staff staff) {
        Instant now = Instant.now();
        Instant exp = now.plus(ttlMinutes, ChronoUnit.MINUTES);
        var claims = JwtClaimsSet.builder()
                .issuer(ISSUER)
                .subject(staff.username())
                .issuedAt(now)
                .expiresAt(exp)
                .claim("name", staff.name())
                .claim("roles", List.of(staff.role().name()));
        if (staff.district() != null) {
            claims.claim("district", staff.district());
        }
        var header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = encoder.encode(JwtEncoderParameters.from(header, claims.build())).getTokenValue();
        return new Issued(token, exp);
    }
}
