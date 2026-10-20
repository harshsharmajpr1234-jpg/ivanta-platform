package com.ivanta.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, String>, JpaSpecificationExecutor<Product> {
    Optional<Product> findByIdAndDeletedAtIsNull(String id);
    Optional<Product> findBySlugAndDeletedAtIsNullAndIsActiveTrue(String slug);
    Optional<Product> findByNameIgnoreCaseAndDeletedAtIsNull(String name);
    List<Product> findByCategoryIdAndIsActiveTrueAndDeletedAtIsNullOrderByNameAsc(String categoryId);
    List<Product> findByFeaturedTrueAndIsActiveTrueAndDeletedAtIsNullOrderByCreatedAtDesc();
    long countByIsActiveTrueAndDeletedAtIsNull();
}
