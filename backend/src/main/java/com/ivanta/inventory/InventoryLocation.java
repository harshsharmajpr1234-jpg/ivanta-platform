package com.ivanta.inventory;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "inventory_locations")
@Getter @Setter
public class InventoryLocation {
    @Id
    @Column(length = 16)
    private String id;

    @Column(name = "warehouse_id", nullable = false, length = 16)
    private String warehouseId;

    @Column(length = 20)
    private String aisle;

    @Column(length = 20)
    private String rack;

    @Column(length = 20)
    private String shelf;

    @Column(nullable = false, length = 80)
    private String label;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
