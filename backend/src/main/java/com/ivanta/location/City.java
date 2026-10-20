package com.ivanta.location;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "cities")
@Getter @Setter
public class City {
    @Id
    @Column(length = 16)
    private String id;

    @Column(name = "state_id", nullable = false, length = 16)
    private String stateId;

    @Column(name = "district_id", length = 16)
    private String districtId;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false)
    private Boolean popular = false;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "zone_cities",
            joinColumns = @JoinColumn(name = "city_id"),
            inverseJoinColumns = @JoinColumn(name = "zone_id"))
    private List<ServiceabilityZone> zones;
}
