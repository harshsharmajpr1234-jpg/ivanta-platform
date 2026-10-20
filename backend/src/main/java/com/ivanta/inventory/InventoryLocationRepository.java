package com.ivanta.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InventoryLocationRepository extends JpaRepository<InventoryLocation, String> {
    List<InventoryLocation> findByWarehouseIdAndIsActiveTrue(String warehouseId);
}
