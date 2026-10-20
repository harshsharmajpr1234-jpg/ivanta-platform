package com.ivanta.cart;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, String> {
    List<CartItem> findByCartIdOrderByIdAsc(String cartId);
    Optional<CartItem> findByCartIdAndProductIdAndVariantId(String cartId, String productId, String variantId);
    Optional<CartItem> findByIdAndCartId(String id, String cartId);
    void deleteByCartId(String cartId);
    long countByCartId(String cartId);
}
