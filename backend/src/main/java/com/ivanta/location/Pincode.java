package com.ivanta.location;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * PIN code (§26): a SEPARATE entity, many-to-many with cities and localities —
 * one PIN may serve several localities and a locality may span several PINs.
 */
@Entity
@Table(name = "pincodes")
@Getter @Setter
public class Pincode {
    @Id
    @Column(length = 16)
    private String id;

    @Column(nullable = false, length = 6, unique = true)
    private String code;

    @Column(name = "state_id", nullable = false, length = 16)
    private String stateId;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "pincode_cities",
            joinColumns = @JoinColumn(name = "pincode_id"),
            inverseJoinColumns = @JoinColumn(name = "city_id"))
    private List<City> cities;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "pincode_localities",
            joinColumns = @JoinColumn(name = "pincode_id"),
            inverseJoinColumns = @JoinColumn(name = "locality_id"))
    private List<Locality> localities;
}
