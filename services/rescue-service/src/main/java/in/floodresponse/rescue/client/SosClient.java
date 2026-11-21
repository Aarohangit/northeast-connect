package in.floodresponse.rescue.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.function.Supplier;
import java.util.regex.Pattern;

/**
 * Talks to sos-service over HTTP. rescue-service never touches sos_db directly.
 */
@Component
public class SosClient {

    private static final Pattern DETAIL = Pattern.compile("\"detail\"\\s*:\\s*\"([^\"]*)\"");

    private final RestClient http;

    public SosClient(@Value("${services.sos.url}") String baseUrl) {
        // JDK HttpClient, not HttpURLConnection: the latter can't send PATCH.
        var jdk = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1) // h2c upgrade headers make uvicorn drop the body
                .connectTimeout(Duration.ofSeconds(3))
                .build();
        var factory = new JdkClientHttpRequestFactory(jdk);
        factory.setReadTimeout(Duration.ofSeconds(5));
        this.http = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }

    public record SosSummary(String reference, String category, String status, String district,
                             double latitude, double longitude, Integer peopleCount) {
    }

    public SosSummary get(String reference) {
        return call(() -> http.get()
                .uri("/api/sos/{ref}", reference)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    throw rejected(res.getStatusCode(), res.getBody().readAllBytes());
                })
                .body(SosSummary.class));
    }

    public void changeStatus(String reference, String status, String note, String changedBy) {
        call(() -> http.patch()
                .uri("/api/sos/{ref}/status", reference)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "status", status,
                        "note", note == null ? "" : note,
                        "changedBy", changedBy == null ? "rescue-service" : changedBy))
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    throw rejected(res.getStatusCode(), res.getBody().readAllBytes());
                })
                .toBodilessEntity());
    }

    private <T> T call(Supplier<T> request) {
        try {
            return request.get();
        } catch (ResourceAccessException e) {
            throw new SosServiceUnavailableException();
        }
    }

    private static SosRejectedException rejected(HttpStatusCode code, byte[] body) {
        String text = new String(body, StandardCharsets.UTF_8);
        var m = DETAIL.matcher(text);
        return new SosRejectedException(code.value(), m.find() ? m.group(1) : text);
    }
}
