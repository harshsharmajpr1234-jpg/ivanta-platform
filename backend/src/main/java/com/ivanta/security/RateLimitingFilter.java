package com.ivanta.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ivanta.common.api.ApiErrorBody;
import com.ivanta.common.api.ErrorCode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Top-tier In-Memory Distributed-ready Rate Limiter:
 * - Anti-DDoS and Anti-Brute-Force
 * - Endpoint categorization (Auth/OTP: 10/min, Coupons: 15/min, Checkout: 40/min, General: 300/min)
 * - Automatic sliding 60-second window cleanup
 * - Proxy-aware client IP extraction (X-Forwarded-For / X-Real-IP)
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitingFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ConcurrentHashMap<String, WindowCounter> requestCounts = new ConcurrentHashMap<>();

    // Limits per 60-second window
    private static final int LIMIT_AUTH_OTP = 10;
    private static final int LIMIT_COUPONS = 15;
    private static final int LIMIT_CHECKOUT = 40;
    private static final int LIMIT_GENERAL = 300;

    private static class WindowCounter {
        final long windowStart;
        final AtomicInteger count;

        WindowCounter(long windowStart) {
            this.windowStart = windowStart;
            this.count = new AtomicInteger(1);
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Skip rate-limiting on preflight OPTIONS and static media assets
        String method = request.getMethod();
        String uri = request.getRequestURI();

        if ("OPTIONS".equalsIgnoreCase(method) || uri.startsWith("/api/v1/media/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = resolveClientIp(request);
        String category = categorizeUri(uri);
        int maxLimit = getLimitForCategory(category);

        long now = System.currentTimeMillis();
        long currentWindow = now / 60000; // 1-minute bucket
        String trackerKey = clientIp + ":" + category + ":" + currentWindow;

        // Periodic cleanup of stale windows if map grows
        if (requestCounts.size() > 5000) {
            requestCounts.entrySet().removeIf(e -> e.getValue().windowStart < (now - 120000));
        }

        WindowCounter counter = requestCounts.compute(trackerKey, (k, v) -> {
            if (v == null || v.windowStart < (now - 60000)) {
                return new WindowCounter(now);
            }
            v.count.incrementAndGet();
            return v;
        });

        if (counter.count.get() > maxLimit) {
            log.warn("[RATE LIMIT EXCEEDED] IP {} hit limit for category '{}' on {}", clientIp, category, uri);
            response.setStatus(429); // HTTP 429 Too Many Requests
            response.setHeader("Retry-After", "60");
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            ApiErrorBody body = ApiErrorBody.of(ErrorCode.RATE_LIMITED, "Too many requests. Please slow down and try again in 1 minute.");
            response.getWriter().write(objectMapper.writeValueAsString(body));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String categorizeUri(String uri) {
        if (uri.contains("/auth/request-otp") || uri.contains("/auth/verify-otp") ||
                uri.contains("/auth/login") || uri.contains("/admin/auth/login")) {
            return "AUTH";
        }
        if (uri.contains("/coupons/validate")) {
            return "COUPON";
        }
        if (uri.contains("/checkout") || uri.contains("/payments/initiate") || uri.contains("/payments/create")) {
            return "CHECKOUT";
        }
        return "GENERAL";
    }

    private int getLimitForCategory(String category) {
        return switch (category) {
            case "AUTH" -> LIMIT_AUTH_OTP;
            case "COUPON" -> LIMIT_COUPONS;
            case "CHECKOUT" -> LIMIT_CHECKOUT;
            default -> LIMIT_GENERAL;
        };
    }

    private String resolveClientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            String[] parts = xff.split(",");
            if (parts.length > 0 && !parts[0].trim().isBlank()) {
                return parts[0].trim();
            }
        }
        String realIp = req.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return req.getRemoteAddr() != null ? req.getRemoteAddr() : "0.0.0.0";
    }
}
