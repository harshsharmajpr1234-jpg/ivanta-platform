package com.ivanta.location.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ivanta.location.dto.LocationDtos.PincodeInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Real India Post 6-digit PIN code lookup provider (§28).
 * Queries official India Post PIN service (https://api.postalpincode.in/pincode/{pin})
 * with in-memory concurrent caching.
 */
@Slf4j
@Component
public class IndiaPostPincodeProvider {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final Map<String, PincodeInfo> cache = new ConcurrentHashMap<>();

    public IndiaPostPincodeProvider() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public PincodeInfo lookupPincode(String pin) {
        if (pin == null || !pin.matches("\\d{6}")) {
            return null;
        }

        if (cache.containsKey(pin)) {
            log.debug("[INDIA-POST] Cache hit for PIN {}", pin);
            return cache.get(pin);
        }

        try {
            String url = "https://api.postalpincode.in/pincode/" + pin;
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", "iVanta-ECommerce/1.0")
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(6))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200 && response.body() != null) {
                JsonNode rootArray = objectMapper.readTree(response.body());
                if (rootArray.isArray() && rootArray.size() > 0) {
                    JsonNode resultObj = rootArray.get(0);
                    String status = resultObj.path("Status").asText("");
                    if ("Success".equalsIgnoreCase(status)) {
                        JsonNode postOfficesNode = resultObj.path("PostOffice");
                        List<String> cities = new ArrayList<>();
                        List<String> states = new ArrayList<>();
                        List<String> localities = new ArrayList<>();
                        List<String> postOffices = new ArrayList<>();

                        if (postOfficesNode.isArray()) {
                            for (JsonNode po : postOfficesNode) {
                                String name = po.path("Name").asText(null);
                                String district = po.path("District").asText(null);
                                String stateName = po.path("State").asText(null);
                                String block = po.path("Block").asText(null);

                                if (name != null && !name.isBlank()) {
                                    postOffices.add(name);
                                    if (!localities.contains(name)) {
                                        localities.add(name);
                                    }
                                }
                                if (district != null && !district.isBlank() && !cities.contains(district)) {
                                    cities.add(district);
                                }
                                if (block != null && !block.isBlank() && !"NA".equalsIgnoreCase(block) && !localities.contains(block)) {
                                    localities.add(block);
                                }
                                if (stateName != null && !stateName.isBlank() && !states.contains(stateName)) {
                                    states.add(stateName);
                                }
                            }
                        }

                        PincodeInfo info = new PincodeInfo(pin, cities, states, localities, postOffices, true);
                        cache.put(pin, info);
                        log.info("[INDIA-POST] Resolved PIN {} -> District={}, State={}, PostOffices={}",
                                pin, cities, states, postOffices.size());
                        return info;
                    }
                }
            }
        } catch (Exception e) {
            log.error("[INDIA-POST] Failed lookup for PIN {}: {}", pin, e.getMessage());
        }

        return null;
    }
}
