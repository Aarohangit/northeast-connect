package in.floodresponse.gateway.security;

import in.floodresponse.gateway.auth.GatewayProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-network limits on the two public write endpoints. Generous on purpose: a whole
 * relief camp may share one mobile hotspot, and blocking a real emergency is far
 * worse than letting a few junk requests through.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class PublicRateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 60_000;

    private record Rule(String path, int perMinute, String message) {
    }

    private final Map<String, Rule> rules;
    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    PublicRateLimitFilter(GatewayProperties props) {
        this.rules = Map.of(
                "/api/sos", new Rule("/api/sos", props.sosRateLimit().perMinute(),
                        "Too many SOS requests from this network. If this is a real emergency, call 112."),
                "/api/ai/assistant", new Rule("/api/ai/assistant", props.assistantRateLimit().perMinute(),
                        "The assistant is busy. Please wait a minute. In an emergency press SOS or call 112."));
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest req) {
        return !"POST".equals(req.getMethod()) || !rules.containsKey(req.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        Rule rule = rules.get(req.getRequestURI());
        long now = System.currentTimeMillis();
        Deque<Long> q = hits.computeIfAbsent(rule.path() + "|" + req.getRemoteAddr(), k -> new ArrayDeque<>());
        boolean allowed;
        synchronized (q) {
            while (!q.isEmpty() && now - q.peekFirst() > WINDOW_MS) q.pollFirst();
            allowed = q.size() < rule.perMinute();
            if (allowed) q.addLast(now);
        }
        if (!allowed) {
            res.setStatus(429);
            res.setHeader("Retry-After", "60");
            res.setContentType("application/problem+json");
            res.getWriter().write("{\"title\":\"Too Many Requests\",\"status\":429,\"detail\":\"" + rule.message() + "\"}");
            return;
        }
        chain.doFilter(req, res);
    }
}
