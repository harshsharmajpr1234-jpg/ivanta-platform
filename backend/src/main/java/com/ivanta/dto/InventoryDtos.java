package com.ivanta.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

/** Inventory DTOs (§27/§39). */
public final class InventoryDtos {
    private InventoryDtos() { }

    public record InventoryRow(String id, String productId, String productName, String variantId,
                               String variantName, String sku, String warehouseId, String warehouseName,
                               int quantity, int reserved, int available, int reorderLevel, String status) { }

    public record AddStockRequest(@NotNull String productId, String variantId, @NotNull String warehouseId,
                                  String sku, @NotNull Integer quantity, Integer reorderLevel) { }

    public record AdjustRequest(@NotNull Integer delta, String note) { }

    public record TransferRequest(@NotNull String toWarehouseId, @NotNull Integer quantity, String note) { }

    public record MovementView(String id, String type, int change, int after, String referenceType,
                               String referenceId, String note, String createdBy, String createdAt) { }

    public record VariantAvailability(String variantId, String variantName, String sku,
                                      long totalAvailable, Map<String, Long> byWarehouse, String status) { }

    public record ProductAvailability(String productId, String stockStatus, List<VariantAvailability> variants) { }
}
