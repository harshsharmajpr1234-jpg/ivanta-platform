package com.ivanta.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
    List<InventoryItem> findByProductId(String productId);
    List<InventoryItem> findByVariantId(String variantId);
    Optional<InventoryItem> findByVariantIdAndWarehouseId(String variantId, String warehouseId);
    List<InventoryItem> findByStatus(String status);
    long countByStatusIn(List<String> statuses);

    @Query("SELECT COALESCE(SUM(i.quantity - i.reservedQuantity), 0) FROM InventoryItem i WHERE i.variantId = :variantId")
    long totalAvailableForVariant(@Param("variantId") String variantId);

    @Query("SELECT COALESCE(SUM(i.quantity - i.reservedQuantity), 0) FROM InventoryItem i WHERE i.productId = :productId")
    long totalAvailableForProduct(@Param("productId") String productId);

    @Query("SELECT COALESCE(SUM(i.reservedQuantity), 0) FROM InventoryItem i WHERE i.productId = :productId")
    long totalReservedForProduct(@Param("productId") String productId);

    @Query("SELECT COALESCE(SUM(i.quantity), 0) FROM InventoryItem i")
    long totalUnits();
}
