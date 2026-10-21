package com.ivanta.location;

import com.ivanta.common.api.ApiResponse;
import com.ivanta.location.dto.LocationDtos.*;
import com.ivanta.location.provider.GeocodingProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Public location endpoints (§28). Read-only, cache-friendly. */
@RestController
@RequestMapping("/api/v1/location")
@RequiredArgsConstructor
public class LocationController {

    private final LocationSearchService service;
    private final GeocodingProvider geocoding;
    private final com.ivanta.location.provider.PincodeApiProvider pincodeApiProvider;

    @GetMapping("/search")
    public ApiResponse<SearchResponse> search(@RequestParam("q") String q) {
        return ApiResponse.ok(service.search(q));
    }

    @GetMapping("/pincodes/{code}")
    public ApiResponse<PincodeInfo> pincode(@PathVariable String code) {
        return ApiResponse.ok(service.pincodeInfo(code));
    }

    @GetMapping("/pincode/{pincode}")
    public ApiResponse<com.ivanta.location.dto.PincodeLookupDtos.PincodeLookupResponse> lookupPincode(@PathVariable String pincode) {
        return ApiResponse.ok(pincodeApiProvider.lookup(pincode));
    }

    @GetMapping("/cities")
    public ApiResponse<List<CityResponse>> cities(@RequestParam(value = "state", required = false) String stateId) {
        return ApiResponse.ok(service.listCities(stateId));
    }

    @GetMapping("/localities")
    public ApiResponse<List<LocalityResponse>> localities(@RequestParam("city") String cityId) {
        return ApiResponse.ok(service.listLocalities(cityId));
    }

    @GetMapping("/serviceability")
    public ApiResponse<ServiceabilityResponse> serviceability(@RequestParam("pin") String pin) {
        return ApiResponse.ok(service.isPinServiceable(pin));
    }

    @PostMapping("/reverse-geocode")
    public ApiResponse<ReverseGeocodeResponse> reverseGeocode(@RequestBody ReverseGeocodeRequest req) {
        return ApiResponse.ok(geocoding.reverseGeocode(req.latitude(), req.longitude(), req.hint()));
    }
}
