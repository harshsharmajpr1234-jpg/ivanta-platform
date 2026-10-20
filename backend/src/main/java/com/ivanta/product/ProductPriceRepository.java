package com.ivanta.product;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductPriceRepository extends JpaRepository<ProductPrice, String> {
    List<ProductPrice> findByProductIdOrderByEffectiveFromDesc(String productId);
}
