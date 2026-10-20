package com.ivanta.inventory;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** Append-only stock ledger (§27). */
@Entity
@Table(name = "inventory_movements")
@Getter @Setter
public class InventoryMovement {
    public enum Type { PURCHASE, RESTOCK, SALE, RESERVATION, RELEASE, RETURN, ADJUSTMENT, TRANSFER }

    @Id
    @Column(length = 16)
    private String id;

    @Column(name = "inventory_id", nullable = false, length = 16)
    private String inventoryId;

    @Column(name = "product_id", nullable = false, length = 16)
    private String productId;

    @Column(name = "variant_id", length = 16)
    private String variantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 16)
    private Type movementType;

    @Column(name = "quantity_change", nullable = false)
    private Integer quantityChange;

    @Column(name = "quantity_after", nullable = false)
    private Integer quantityAfter;

    @Column(name = "reference_type", length = 30)
    private String referenceType;

    @Column(name = "reference_id", length = 20)
    private String referenceId;

    @Column(length = 255)
    private String note;

    @Column(name = "created_by", updatable = false)
    private String createdBy;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @PrePersist
    void prePersist() { createdAt = Instant.now(); }
}
