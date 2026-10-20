package com.ivanta.cart;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, String> {
    Optional<Cart> findByUserIdAndStatus(String userId, String status);
    Optional<Cart> findByUserId(String userId);
}
