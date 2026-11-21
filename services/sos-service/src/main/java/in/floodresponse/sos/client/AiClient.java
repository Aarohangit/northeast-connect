package in.floodresponse.sos.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

/** Thin client for ai-service. Callers must treat every call as optional. */
@Component
public class AiClient {

    private final RestClient http;

    public AiClient(@Value("${services.ai.url}") String baseUrl) {
        var jdk = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1) // h2c upgrade headers make uvicorn drop the body
                .connectTimeout(Duration.ofSeconds(3))
                .build();
        var factory = new JdkClientHttpRequestFactory(jdk);
        // Claude can take a while on a long report; this runs off the request thread anyway.
        factory.setReadTimeout(Duration.ofSeconds(60));
        this.http = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
    }

    public record TriageRequest(String text, String category, Integer people_count, String language) {
    }

    public record TriageResult(String category, String severity, String severity_reason, String summary,
                               String translation, String detected_language, Integer people_count,
                               List<String> vulnerable, List<String> medical_conditions, List<String> needs,
                               List<String> location_hints, String water_level, boolean water_rising,
                               String confidence, boolean needs_human_review, String engine, String model) {
    }

    public record Report(String reference, double latitude, double longitude, Instant received_at,
                         String phone, String category, String description) {
    }

    public record DuplicateMatch(String reference, double score, int distance_m, int minutes_apart,
                                 List<String> reasons) {
    }

    public record DuplicateResult(boolean likely_duplicate, List<DuplicateMatch> matches) {
    }

    public TriageResult triage(TriageRequest req) {
        return http.post().uri("/api/ai/triage").contentType(MediaType.APPLICATION_JSON)
                .body(req).retrieve().body(TriageResult.class);
    }

    public DuplicateResult duplicates(Report report, List<Report> candidates) {
        record Body(Report report, List<Report> candidates) {
        }
        return http.post().uri("/api/ai/duplicates").contentType(MediaType.APPLICATION_JSON)
                .body(new Body(report, candidates)).retrieve().body(DuplicateResult.class);
    }
}
