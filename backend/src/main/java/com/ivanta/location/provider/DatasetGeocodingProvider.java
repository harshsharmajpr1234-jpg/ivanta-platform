package com.ivanta.location.provider;

import com.ivanta.location.dto.LocationDtos.ReverseGeocodeResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Development geocoding stub: returns a deterministic Jaipur result.
 * Coordinates are echoed but not resolved — a real provider (Google/OSM/Mapbox)
 * implements the same interface for production. Clearly logged on every call.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "ivanta.geo.provider", havingValue = "dataset", matchIfMissing = true)
public class DatasetGeocodingProvider implements GeocodingProvider {

    @Override
    public ReverseGeocodeResponse reverseGeocode(Double latitude, Double longitude, String hint) {
        log.debug("[GEO:dataset] reverse geocode stub for ({}, {})", latitude, longitude);
        String locality = (hint != null && !hint.isBlank()) ? hint : "Vaishali Nagar";
        return new ReverseGeocodeResponse(latitude, longitude, locality, "Jaipur", "Rajasthan", "302021", "dataset");
    }

    @Override
    public String providerName() { return "dataset"; }
}
