package com.ivanta.location;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "post_offices")
@Getter @Setter
public class PostOffice {
    @Id
    @Column(length = 16)
    private String id;

    @Column(name = "pincode_id", nullable = false, length = 16)
    private String pincodeId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
