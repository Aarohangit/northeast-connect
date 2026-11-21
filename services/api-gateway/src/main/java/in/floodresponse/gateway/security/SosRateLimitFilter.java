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
 * Caps new SOS submissions per IP. Generous on purpose: a whole relief camp
 * may share one mobile hotspot, and blocking a real emergency is far worse
 * than letting a few junk reports through for an officer to reject.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class SosRateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 60_000;

    private final int limit;
    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    SosRateLimitFilter(GatewayProperties props) {
        this.limit = props.sosRateLimit().perMinute();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest req) {
        return !("POST".equals(req.getMethod()) && "/api/sos".equals(req.getRequestURI()));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        long now = System.currentTimeMillis();
        Deque<Long> q = hits.computeIfAbsent(req.getRemoteAddr(), k -> new ArrayDeque<>());
        boolean allowed;
        synchronized (q) {
            while (!q.isEmpty() && now - q.peekFirst() > WINDOW_MS) q.pollFirst();
            allowed = q.size() < limit;
            if (allowed) q.addLast(now);
        }
        if (!allowed) {
            res.setStatus(429);
            res.setHeader("Retry-After", "60");
            res.setContentType("application/problem+json");
            res.getWriter().write("""
                    {"title":"Too Many Requests","status":429,"detail":"Too many SOS requests from this network. If this is a real emergency, call 112."}""");
            return;
        }
        chain.doFilter(req, res);
    }
}
