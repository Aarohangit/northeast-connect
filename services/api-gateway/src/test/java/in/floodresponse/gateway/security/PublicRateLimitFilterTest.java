package in.floodresponse.gateway.security;

import in.floodresponse.gateway.auth.GatewayProperties;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PublicRateLimitFilterTest {

    private final PublicRateLimitFilter filter = new PublicRateLimitFilter(new GatewayProperties(
            new GatewayProperties.Jwt("x".repeat(40), 60), new GatewayProperties.Cors(List.of()),
            new GatewayProperties.RateLimit(3), new GatewayProperties.RateLimit(5), "pw", List.of()));

    private int post(String path, String ip) throws Exception {
        var req = new MockHttpServletRequest("POST", path);
        req.setRemoteAddr(ip);
        var res = new MockHttpServletResponse();
        filter.doFilter(req, res, new MockFilterChain());
        return res.getStatus();
    }

    @Test
    void blocksSosFloodFromOneNetworkButNotOthers() throws Exception {
        for (int i = 0; i < 3; i++) assertThat(post("/api/sos", "10.0.0.1")).isEqualTo(200);
        assertThat(post("/api/sos", "10.0.0.1")).isEqualTo(429);
        assertThat(post("/api/sos", "10.0.0.2")).isEqualTo(200);
    }

    @Test
    void assistantHasItsOwnBudget() throws Exception {
        for (int i = 0; i < 3; i++) post("/api/sos", "10.0.0.3");
        assertThat(post("/api/ai/assistant", "10.0.0.3")).isEqualTo(200);
    }

    @Test
    void readsAreNeverLimited() throws Exception {
        var req = new MockHttpServletRequest("GET", "/api/public/situation");
        var res = new MockHttpServletResponse();
        for (int i = 0; i < 20; i++) filter.doFilter(req, res, new MockFilterChain());
        assertThat(res.getStatus()).isEqualTo(200);
    }
}
