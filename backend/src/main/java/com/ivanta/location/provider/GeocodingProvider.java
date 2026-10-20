package com.ivanta.location.provider;

import com.ivanta.location.dto.LocationDtos.ReverseGeocodeResponse;

/**
 * Geocoding abstraction (§29): production swaps in Google/Mapbox/OSM/India Post
 * implementations via `ivanta.geo.provider` without changing business code.
 */
public interface GeocodingProvider {

    ReverseGeocodeResponse reverseGeocode(Double latitude, Double longitude, String hint);

    String providerName();
}
