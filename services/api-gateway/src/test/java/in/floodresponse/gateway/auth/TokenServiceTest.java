package in.floodresponse.gateway.auth;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TokenServiceTest {

    private static GatewayProperties props(String secret) {
        return new GatewayProperties(new GatewayProperties.Jwt(secret, 60), new GatewayProperties.Cors(List.of()),
                new GatewayProperties.RateLimit(10), new GatewayProperties.RateLimit(20), "pw", List.of());
    }

    @Test
    void issuedTokenCarriesRoleAndDistrictAndVerifiesWithTheSameSecret() {
        String secret = "a-sufficiently-long-test-secret-for-hs256!";
        var staff = new GatewayProperties.Staff("dc.aizawl", "DDMA Aizawl", GatewayProperties.Role.DISTRICT_ADMIN, "Aizawl");

        String token = new TokenService(props(secret)).issue(staff).token();

        var decoder = NimbusJwtDecoder.withSecretKey(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"))
                .macAlgorithm(MacAlgorithm.HS256).build();
        var jwt = decoder.decode(token);
        assertThat(jwt.getSubject()).isEqualTo("dc.aizawl");
        assertThat(jwt.getClaimAsStringList("roles")).containsExactly("DISTRICT_ADMIN");
        assertThat(jwt.getClaimAsString("district")).isEqualTo("Aizawl");
    }

    @Test
    void refusesToStartWithAWeakSecret() {
        assertThatThrownBy(() -> new TokenService(props("short"))).isInstanceOf(IllegalStateException.class);
    }
}
