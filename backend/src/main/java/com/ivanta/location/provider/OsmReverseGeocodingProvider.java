package com.ivanta.location.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ivanta.location.dto.LocationDtos.ReverseGeocodeResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Production OpenStreetMap Nominatim reverse geocoding provider adapter (§28).
 * Queries official OSM Nominatim API (https://nominatim.openstreetmap.org/reverse)
 * using device latitude and longitude.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "ivanta.geo.provider", havingValue = "osm")
public class OsmReverseGeocodingProvider implements GeocodingProvider {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public OsmReverseGeocodingProvider() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public ReverseGeocodeResponse reverseGeocode(Double latitude, Double longitude, String hint) {
        if (latitude == null || longitude == null) {
            log.warn("[GEO:osm] Null coordinates passed to reverseGeocode");
            return new ReverseGeocodeResponse(latitude, longitude, hint, null, null, null, providerName());
        }

        try {
            String url = String.format("https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=%.7f&lon=%.7f", latitude, longitude);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", "iVanta-ECommerce/1.0 (contact@ivanta.in)")
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(6))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200 && response.body() != null) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode address = root.path("address");

                String locality = firstNonEmpty(
                        address.path("suburb").asText(null),
                        address.path("neighbourhood").asText(null),
                        address.path("residential").asText(null),
                        address.path("road").asText(null),
                        hint
                );

                String city = firstNonEmpty(
                        address.path("city").asText(null),
                        address.path("town").asText(null),
                        address.path("city_district").asText(null),
                        address.path("village").asText(null),
                        address.path("county").asText(null)
                );

                String state = address.path("state").asText(null);
                String pincode = address.path("postcode").asText(null);

                if (pincode != null && pincode.matches(".*\\d{6}.*")) {
                    java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\d{6}").matcher(pincode);
                    if (m.find()) pincode = m.group();
                }

                log.info("[GEO:osm] Resolved ({}, {}) -> locality={}, city={}, state={}, pin={}",
                        latitude, longitude, locality, city, state, pincode);

                return new ReverseGeocodeResponse(latitude, longitude, locality, city, state, pincode, providerName());
            } else {
                log.warn("[GEO:osm] API returned status {}", response.statusCode());
            }
        } catch (Exception e) {
            log.error("[GEO:osm] Exception during reverse geocoding ({}, {}): {}", latitude, longitude, e.getMessage());
        }

        return new ReverseGeocodeResponse(latitude, longitude, hint, null, null, null, providerName());
    }

    @Override
    public String providerName() {
        return "osm";
    }

    private String firstNonEmpty(String... items) {
        for (String item : items) {
            if (item != null && !item.isBlank() && !"null".equalsIgnoreCase(item)) {
                return item.trim();
            }
        }
        return null;
    }
}
