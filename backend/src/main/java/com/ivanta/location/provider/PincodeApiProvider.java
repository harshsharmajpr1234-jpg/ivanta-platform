package com.ivanta.location.provider;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.exception.ResourceNotFoundException;
import com.ivanta.config.IvantaProperties;
import com.ivanta.location.PincodeLookupCache;
import com.ivanta.location.PincodeLookupCacheRepository;
import com.ivanta.location.ZoneRepository;
import com.ivanta.location.dto.PincodeLookupDtos.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
public class PincodeApiProvider {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final PincodeLookupCacheRepository cacheRepo;
    private final ZoneRepository zoneRepo;
    private final IvantaProperties properties;

    @org.springframework.beans.factory.annotation.Autowired
    public PincodeApiProvider(PincodeLookupCacheRepository cacheRepo,
                              ZoneRepository zoneRepo,
                              IvantaProperties properties) {
        this(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build(),
                new ObjectMapper(), cacheRepo, zoneRepo, properties);
    }

    public PincodeApiProvider(HttpClient httpClient,
                              ObjectMapper objectMapper,
                              PincodeLookupCacheRepository cacheRepo,
                              ZoneRepository zoneRepo,
                              IvantaProperties properties) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.cacheRepo = cacheRepo;
        this.zoneRepo = zoneRepo;
        this.properties = properties;
    }

    public PincodeLookupResponse lookup(String pincode) {
        // 1. Validate exactly 6 digits
        if (pincode == null || !pincode.matches("^\\d{6}$")) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "PIN code must contain exactly 6 digits.");
        }

        // 2. Check local DB cache first to avoid rate limiting and speed up responses
        Optional<PincodeLookupCache> cachedOpt = cacheRepo.findByPincodeAndExpiresAtAfter(pincode, Instant.now());
        if (cachedOpt.isPresent()) {
            PincodeLookupCache cached = cachedOpt.get();
            try {
                UpstreamV1Response parsed = objectMapper.readValue(cached.getResponseJson(), UpstreamV1Response.class);
                log.debug("[PINCODE-API] Cache hit for PIN {}", pincode);
                return buildResponse(pincode, parsed);
            } catch (Exception e) {
                log.warn("[PINCODE-API] Corrupt cache entry for PIN {}, re-fetching", pincode);
            }
        }

        // 3. Call Upstream API
        String baseUrl = properties.getLocation().getPincodeApiUrl();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        String targetUrl = baseUrl + "/" + pincode;

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .header("Accept", "application/json")
                    .header("User-Agent", "iVanta-Store/1.0")
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int statusCode = response.statusCode();
            String responseBody = response.body();

            if (statusCode == 200 && responseBody != null) {
                UpstreamV1Response v1 = objectMapper.readValue(responseBody, UpstreamV1Response.class);
                if (v1 == null || v1.data() == null || v1.data().postOffices() == null || v1.data().postOffices().isEmpty()) {
                    throw new ResourceNotFoundException("PIN code " + pincode);
                }

                PincodeLookupResponse lookupRes = buildResponse(pincode, v1);

                // Save to cache
                try {
                    int ttlHours = Math.max(1, properties.getLocation().getCacheTtlHours());
                    Instant expiresAt = Instant.now().plus(ttlHours, ChronoUnit.HOURS);
                    PincodeLookupCache cacheEntry = new PincodeLookupCache(
                            pincode,
                            responseBody,
                            lookupRes.district(),
                            lookupRes.state(),
                            expiresAt
                    );
                    cacheRepo.save(cacheEntry);
                } catch (Exception e) {
                    log.warn("[PINCODE-API] Failed to persist cache for PIN {}: {}", pincode, e.getMessage());
                }

                return lookupRes;
            } else if (statusCode == 404) {
                throw new ResourceNotFoundException("PIN code " + pincode);
            } else if (statusCode == 400) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "PIN code must contain exactly 6 digits.");
            } else if (statusCode == 429) {
                log.warn("[PINCODE-API] Rate limited (429) from upstream for PIN {}", pincode);
                throw new BusinessException(ErrorCode.RATE_LIMITED, "PIN code lookup rate limit reached. Please try again shortly or enter details manually.");
            } else {
                log.error("[PINCODE-API] Upstream error {}: {}", statusCode, responseBody);
                throw new BusinessException(ErrorCode.SERVICE_UNAVAILABLE, "Postal lookup service temporarily unavailable. Please enter details manually.");
            }
        } catch (BusinessException e) {
            throw e;
        } catch (HttpTimeoutException e) {
            log.warn("[PINCODE-API] Timeout looking up PIN {}: {}", pincode, e.getMessage());
            throw new BusinessException(ErrorCode.SERVICE_UNAVAILABLE, "Postal lookup request timed out. Please enter details manually.");
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.error("[PINCODE-API] Network failure looking up PIN {}: {}", pincode, e.getMessage());
            throw new BusinessException(ErrorCode.SERVICE_UNAVAILABLE, "Postal lookup service network error. Please enter details manually.");
        }
    }

    private PincodeLookupResponse buildResponse(String pincode, UpstreamV1Response v1) {
        List<UpstreamPostOffice> offices = (v1.data() != null && v1.data().postOffices() != null)
                ? v1.data().postOffices()
                : List.of();

        Set<String> distinctDistricts = new LinkedHashSet<>();
        Set<String> distinctStates = new LinkedHashSet<>();
        List<PostOfficeOption> options = new ArrayList<>();

        for (UpstreamPostOffice po : offices) {
            String name = po.officeName() != null ? po.officeName().trim() : "";
            String dist = po.district() != null ? po.district().trim() : "";
            String st = po.state() != null ? po.state().trim() : "";
            String type = po.officeType() != null ? po.officeType().trim() : "";
            String delivery = po.deliveryStatus() != null ? po.deliveryStatus().trim() : "";

            if (!dist.isBlank()) distinctDistricts.add(dist);
            if (!st.isBlank()) distinctStates.add(st);

            options.add(new PostOfficeOption(name, dist, st, type, delivery));
        }

        boolean isUnambiguous = distinctDistricts.size() == 1 && distinctStates.size() == 1;
        String resolvedDistrict = isUnambiguous && !distinctDistricts.isEmpty() ? distinctDistricts.iterator().next() : null;
        String resolvedState = isUnambiguous && !distinctStates.isEmpty() ? distinctStates.iterator().next() : null;

        // Check serviceability rules
        boolean serviceable = !zoneRepo.findServiceableByPinPrefix(pincode).isEmpty();

        return new PincodeLookupResponse(
                pincode,
                resolvedDistrict,
                resolvedState,
                isUnambiguous,
                new ArrayList<>(distinctDistricts),
                new ArrayList<>(distinctStates),
                options,
                serviceable
        );
    }
}
