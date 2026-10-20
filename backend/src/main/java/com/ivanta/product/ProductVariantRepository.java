package com.ivanta.product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, String> {
    List<ProductVariant> findByProductIdAndIsActiveTrue(String productId);
    Optional<ProductVariant> findBySku(String sku);
    List<ProductVariant> findByProductId(String productId);
}
