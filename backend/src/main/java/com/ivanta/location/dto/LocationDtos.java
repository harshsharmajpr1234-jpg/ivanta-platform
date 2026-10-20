package com.ivanta.location.dto;

import java.util.List;

/** Location module DTOs (§28). */
public final class LocationDtos {
    private LocationDtos() { }

    public record Suggestion(String id, String type, String label, String sublabel,
                             String city, String state, String pincode, boolean popular) { }

    public record SearchResponse(String query, List<Suggestion> suggestions) { }

    public record PincodeInfo(String code, List<String> cities, List<String> states,
                              List<String> localities, List<String> postOffices, boolean serviceable) { }

    public record ShippingMethodOption(String id, String name, java.math.BigDecimal fee,
                                       Integer etaMinDays, Integer etaMaxDays) { }

    /** §21: serviceability + estimated delivery + shipping methods + delivery charge. */
    public record ServiceabilityResponse(boolean serviceable, String zone, java.math.BigDecimal deliveryCharge,
                                         Integer etaMinDays, Integer etaMaxDays, String plannedDate,
                                         String message, List<ShippingMethodOption> shippingMethods) { }

    public record ReverseGeocodeRequest(Double latitude, Double longitude, String hint) { }

    public record ReverseGeocodeResponse(Double latitude, Double longitude, String locality,
                                         String city, String state, String pincode, String provider) { }

    public record CityResponse(String id, String name, String state, boolean popular) { }

    public record LocalityResponse(String id, String name, String cityId, boolean popular) { }
}
