package com.ivanta.inventory;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** Warehouse-level stock for a product/variant (§27). Optimistic-locked against oversell. */
@Entity
@Table(name = "inventory")
@Getter @Setter
public class InventoryItem {
    @Id
    @Column(length = 16)
    private String id;

    @Column(name = "product_id", nullable = false, length = 16)
    private String productId;

    @Column(name = "variant_id", length = 16)
    private String variantId;

    @Column(name = "warehouse_id", nullable = false, length = 16)
    private String warehouseId;

    @Column(name = "inventory_location_id", length = 16)
    private String inventoryLocationId;

    @Column(nullable = false, length = 40)
    private String sku;

    @Column(nullable = false)
    private Integer quantity = 0;

    @Column(name = "reserved_quantity", nullable = false)
    private Integer reservedQuantity = 0;

    /** DB-generated (quantity - reserved_quantity). */
    @Column(name = "available_quantity", insertable = false, updatable = false)
    private Integer availableQuantity;

    @Column(name = "reorder_level", nullable = false)
    private Integer reorderLevel = 5;

    @Column(nullable = false, length = 16)
    private String status = "OUT_OF_STOCK";

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private Integer version;

    public int available() { return quantity - reservedQuantity; }
}
