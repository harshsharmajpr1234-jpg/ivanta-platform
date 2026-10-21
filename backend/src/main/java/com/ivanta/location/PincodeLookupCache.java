package com.ivanta.location;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "pincode_lookup_cache")
@Getter
@Setter
@NoArgsConstructor
public class PincodeLookupCache {

    @Id
    @Column(length = 6)
    private String pincode;

    @Column(name = "response_json", nullable = false, columnDefinition = "TEXT")
    private String responseJson;

    @Column(length = 80)
    private String district;

    @Column(length = 80)
    private String state;

    @Column(name = "cached_at", nullable = false)
    private Instant cachedAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    public PincodeLookupCache(String pincode, String responseJson, String district, String state, Instant expiresAt) {
        this.pincode = pincode;
        this.responseJson = responseJson;
        this.district = district;
        this.state = state;
        this.cachedAt = Instant.now();
        this.expiresAt = expiresAt;
    }
}
