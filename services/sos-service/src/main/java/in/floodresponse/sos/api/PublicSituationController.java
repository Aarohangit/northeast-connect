package in.floodresponse.sos.api;

import in.floodresponse.sos.domain.*;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * The public picture of what is happening, for the citizen live map. No names,
 * phones or exact positions: locations are rounded to about a kilometre so a
 * family's home can't be pinpointed from it.
 */
@RestController
@RequestMapping("/api/public")
public class PublicSituationController {

    private static final Duration WINDOW = Duration.ofHours(48);
    private static final Set<RescueStatus> HIDDEN = EnumSet.of(RescueStatus.REJECTED, RescueStatus.DUPLICATE);

    private final SosRepository requests;
    private final TriageRepository triages;

    public PublicSituationController(SosRepository requests, TriageRepository triages) {
        this.requests = requests;
        this.triages = triages;
    }

    public record Point(double latitude, double longitude, String severity, String category, String status,
                        String district, long minutesAgo) {
    }

    public record District(String district, int open, int critical, int rescued, String mainHazard) {
    }

    public record Totals(int open, int critical, int rescued, int peopleWaiting, int districtsAffected) {
    }

    public record Situation(Instant updatedAt, Totals totals, List<District> districts, List<Point> points) {
    }

    @GetMapping("/situation")
    public ResponseEntity<Situation> situation() {
        Instant since = Instant.now().minus(WINDOW);
        List<SosRequest> recent = requests.search(null, null).stream()
                .filter(s -> s.getReceivedAt().isAfter(since) && !HIDDEN.contains(s.getStatus()))
                .toList();
        Map<Long, Triage> triageById = recent.isEmpty() ? Map.of()
                : triages.findBySosIds(recent.stream().map(SosRequest::getId).toList()).stream()
                .collect(Collectors.toMap(t -> t.getSos().getId(), Function.identity()));

        Instant now = Instant.now();
        List<Point> points = recent.stream().map(s -> {
            Triage t = triageById.get(s.getId());
            return new Point(round(s.getLatitude()), round(s.getLongitude()),
                    t == null ? "PENDING" : t.getSeverity(), s.getCategory().name(), publicStatus(s.getStatus()),
                    s.getDistrict(), Duration.between(s.getReceivedAt(), now).toMinutes());
        }).toList();

        Map<String, List<Point>> byDistrict = points.stream()
                .filter(p -> p.district() != null)
                .collect(Collectors.groupingBy(Point::district));
        List<District> districts = byDistrict.entrySet().stream().map(e -> {
            List<Point> ps = e.getValue();
            int open = (int) ps.stream().filter(p -> !p.status().equals("RESCUED")).count();
            int critical = (int) ps.stream().filter(p -> !p.status().equals("RESCUED") && "CRITICAL".equals(p.severity())).count();
            int rescued = ps.size() - open;
            String hazard = ps.stream().collect(Collectors.groupingBy(p -> hazardOf(p.category()), Collectors.counting()))
                    .entrySet().stream().max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse("OTHER");
            return new District(e.getKey(), open, critical, rescued, hazard);
        }).sorted(Comparator.comparingInt(District::critical).reversed().thenComparing(Comparator.comparingInt(District::open).reversed())).toList();

        int open = (int) points.stream().filter(p -> !p.status().equals("RESCUED")).count();
        int critical = (int) points.stream().filter(p -> !p.status().equals("RESCUED") && "CRITICAL".equals(p.severity())).count();
        int people = recent.stream().filter(s -> !s.getStatus().isClosed())
                .mapToInt(s -> Optional.ofNullable(s.getPeopleCount()).orElse(1)).sum();
        int affected = (int) districts.stream().filter(d -> d.open() > 0).count();

        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(10, TimeUnit.SECONDS).cachePublic())
                .body(new Situation(now, new Totals(open, critical, points.size() - open, people, affected), districts, points));
    }

    /** Citizens only need to know: help requested, help on the way, or rescued. */
    private static String publicStatus(RescueStatus s) {
        return switch (s) {
            case TEAM_ASSIGNED, IN_PROGRESS -> "HELP_ON_THE_WAY";
            case RESCUED -> "RESCUED";
            default -> "HELP_REQUESTED";
        };
    }

    private static String hazardOf(String category) {
        return switch (category) {
            case "LANDSLIDE" -> "LANDSLIDE";
            case "EARTHQUAKE" -> "EARTHQUAKE";
            case "TRAPPED_IN_WATER" -> "FLOOD";
            default -> "OTHER";
        };
    }

    private static double round(double v) {
        return Math.round(v * 100) / 100.0; // ~1 km
    }
}
