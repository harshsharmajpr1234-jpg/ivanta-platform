package com.ivanta.product;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductImageRepository extends JpaRepository<ProductImage, String> {
    List<ProductImage> findByProductIdAndIsActiveTrueOrderBySortOrderAsc(String productId);
}
