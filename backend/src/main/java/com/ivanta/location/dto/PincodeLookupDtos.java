package com.ivanta.location.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public final class PincodeLookupDtos {
    private PincodeLookupDtos() {}

    /* ---------- Upstream Pincode API V1 schema ---------- */

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record UpstreamV1Response(
            Boolean success,
            UpstreamV1Data data,
            UpstreamV1Meta meta
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record UpstreamV1Data(
            String pincode,
            @JsonProperty("post_offices") List<UpstreamPostOffice> postOffices
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record UpstreamPostOffice(
            Long id,
            @JsonProperty("office_name") String officeName,
            @JsonProperty("office_type") String officeType,
            @JsonProperty("delivery_status") String deliveryStatus,
            String district,
            String state,
            String circle,
            String region,
            String division,
            Double latitude,
            Double longitude,
            String digipin
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record UpstreamV1Meta(
            @JsonProperty("api_version") String apiVersion,
            Integer count
    ) {}

    /* ---------- Client Facing DTOs ---------- */

    public record PostOfficeOption(
            String name,
            String district,
            String state,
            String officeType,
            String deliveryStatus
    ) {}

    public record PincodeLookupResponse(
            String pincode,
            String district,
            String state,
            boolean isUnambiguous,
            List<String> districts,
            List<String> states,
            List<PostOfficeOption> postOffices,
            boolean serviceable
    ) {}
}
