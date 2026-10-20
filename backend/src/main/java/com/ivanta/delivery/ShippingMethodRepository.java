package com.ivanta.delivery;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ShippingMethodRepository extends JpaRepository<ShippingMethod, String> {
    List<ShippingMethod> findByIsActiveTrueOrderBySortOrderAsc();
}
