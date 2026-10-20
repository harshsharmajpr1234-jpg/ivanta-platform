package com.ivanta.inventory;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, String> {
    List<InventoryMovement> findByInventoryIdOrderByIdDesc(String inventoryId, Pageable page);
    List<InventoryMovement> findByProductIdOrderByIdDesc(String productId, Pageable page);
}
