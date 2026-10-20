package com.ivanta.product;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductColorRepository extends JpaRepository<ProductColor, String> {
    List<ProductColor> findByProductIdAndIsActiveTrueOrderBySortOrderAsc(String productId);
}
