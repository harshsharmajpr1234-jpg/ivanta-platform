package com.ivanta.product;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductSpecificationRepository extends JpaRepository<ProductSpecification, String> {
    List<ProductSpecification> findByProductIdOrderBySortOrderAsc(String productId);
}
