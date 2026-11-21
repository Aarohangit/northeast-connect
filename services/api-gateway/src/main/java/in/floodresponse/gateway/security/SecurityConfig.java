package in.floodresponse.gateway.security;

import in.floodresponse.gateway.auth.GatewayProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Configuration
public class SecurityConfig {

    private static final String[] STAFF = {"SUPER_ADMIN", "DISTRICT_ADMIN", "RESCUE_COORDINATOR"};
    private static final String[] FIELD = {"SUPER_ADMIN", "DISTRICT_ADMIN", "RESCUE_COORDINATOR", "RESCUE_TEAM"};

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // stateless bearer tokens, no cookies
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Citizens: no account needed. They only ever see their own request by reference.
                        .requestMatchers(HttpMethod.POST, "/api/sos").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/sos/*/status").permitAll()
                        .requestMatchers(HttpMethod.PATCH, "/api/sos/*/location").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        // The public emergency assistant. Rate-limited per network in PublicRateLimitFilter.
                        .requestMatchers(HttpMethod.POST, "/api/ai/assistant").permitAll()
                        // Public live map: rounded locations and counts, no personal data.
                        .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll()
                        .requestMatchers("/actuator/health", "/error").permitAll()
                        // The citizen app and control room themselves (static files); all data still goes through /api.
                        .requestMatchers(request -> !request.getRequestURI().startsWith("/api")).permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Field teams can report progress on their own operations.
                        .requestMatchers(HttpMethod.POST, "/api/assignments/*/depart", "/api/assignments/*/complete")
                        .hasAnyRole(FIELD)

                        // Everything else: control-room staff only.
                        .requestMatchers("/api/sos", "/api/sos/**").hasAnyRole(STAFF)
                        .requestMatchers("/api/teams", "/api/teams/**").hasAnyRole(STAFF)
                        .requestMatchers("/api/assignments", "/api/assignments/**").hasAnyRole(STAFF)
                        .requestMatchers("/api/ai/**").hasAnyRole(STAFF)
                        .anyRequest().authenticated())
                .oauth2ResourceServer(o -> o.jwt(jwt -> jwt.jwtAuthenticationConverter(rolesFromToken())));
        return http.build();
    }

    @Bean
    JwtDecoder jwtDecoder(GatewayProperties props) {
        var key = new SecretKeySpec(props.jwt().secret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        var decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer("flood-response"));
        return decoder;
    }

    private JwtAuthenticationConverter rolesFromToken() {
        var authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName("roles");
        authorities.setAuthorityPrefix("ROLE_");
        var converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return converter;
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(GatewayProperties props) {
        var cors = new CorsConfiguration();
        cors.setAllowedOrigins(props.cors().origins());
        cors.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
        cors.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        cors.setMaxAge(3600L);
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cors);
        return source;
    }
}
