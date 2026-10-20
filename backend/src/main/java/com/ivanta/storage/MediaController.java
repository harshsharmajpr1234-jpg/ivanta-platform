package com.ivanta.storage;

import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;

/**
 * Serves stored media (product images) by provider key: GET /api/v1/media/{folder}/{file}.
 * The provider is swappable (local disk now, S3/Cloudinary later) — keys are stable.
 */
@RestController
@RequiredArgsConstructor
public class MediaController {

    private final StorageProvider storage;

    @GetMapping("/api/v1/media/**")
    public ResponseEntity<byte[]> get(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String key = uri.substring(uri.indexOf("/api/v1/media/") + "/api/v1/media/".length());
        if (key.isBlank() || key.contains("..")) return ResponseEntity.notFound().build();
        byte[] bytes;
        try {
            bytes = storage.load(key);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
        if (bytes == null || bytes.length == 0) return ResponseEntity.notFound().build();
        String lower = key.toLowerCase();
        // Disallow SVG to prevent Stored XSS via embedded SVG scripts
        if (lower.endsWith(".svg")) {
            return ResponseEntity.status(403).build();
        }
        MediaType type = lower.endsWith(".png") ? MediaType.IMAGE_PNG
                : lower.endsWith(".webp") ? MediaType.parseMediaType("image/webp")
                : lower.endsWith(".gif") ? MediaType.IMAGE_GIF
                : MediaType.IMAGE_JPEG;
        return ResponseEntity.ok()
                .contentType(type)
                .header("X-Content-Type-Options", "nosniff")
                .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePublic())
                .body(bytes);
    }
}
