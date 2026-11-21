package in.floodresponse.gateway.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "gateway")
public record GatewayProperties(
        Jwt jwt,
        Cors cors,
        RateLimit sosRateLimit,
        RateLimit assistantRateLimit,
        String staffPassword,
        List<Staff> staff
) {
    public record Jwt(String secret, long ttlMinutes) {
    }

    public record Cors(List<String> origins) {
    }

    public record RateLimit(int perMinute) {
    }

    public record Staff(String username, String name, Role role, String district) {
    }

    public enum Role {
        SUPER_ADMIN,
        DISTRICT_ADMIN,
        RESCUE_COORDINATOR,
        RESCUE_TEAM
    }
}
