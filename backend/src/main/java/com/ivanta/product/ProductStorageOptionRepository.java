package com.ivanta.product;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductStorageOptionRepository extends JpaRepository<ProductStorageOption, String> {
    List<ProductStorageOption> findByProductIdAndIsActiveTrueOrderBySortOrderAsc(String productId);
}
