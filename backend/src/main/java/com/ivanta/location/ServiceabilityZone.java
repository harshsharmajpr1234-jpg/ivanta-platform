package com.ivanta.location;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "serviceability_zones")
@Getter @Setter
public class ServiceabilityZone {
    @Id
    @Column(length = 16)
    private String id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false)
    private Boolean serviceable = true;

    @Column(name = "delivery_fee", nullable = false)
    private java.math.BigDecimal deliveryFee = java.math.BigDecimal.ZERO;

    @Column(name = "eta_min_days", nullable = false)
    private Short etaMinDays = 1;

    @Column(name = "eta_max_days", nullable = false)
    private Short etaMaxDays = 2;


    @Column(name = "planned_date")
    private LocalDate plannedDate;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "zone_pin_prefixes", joinColumns = @JoinColumn(name = "zone_id"))
    @Column(name = "pin_prefix", length = 6)
    private List<String> pinPrefixes;
}
