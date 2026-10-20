package com.ivanta.wishlist;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, String> {
    List<WishlistItem> findByWishlistIdOrderByIdDesc(String wishlistId);
    boolean existsByWishlistIdAndProductId(String wishlistId, String productId);
    void deleteByWishlistIdAndProductId(String wishlistId, String productId);
}
