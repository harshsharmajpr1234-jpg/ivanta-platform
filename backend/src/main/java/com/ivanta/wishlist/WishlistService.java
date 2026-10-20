package com.ivanta.wishlist;

import com.ivanta.common.exception.ResourceNotFoundException;
import com.ivanta.common.util.IdService;
import com.ivanta.dto.ProductDtos.ProductListItem;
import com.ivanta.product.ProductRepository;
import com.ivanta.product.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Wishlist (§15): strictly per authenticated user. */
@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlists;
    private final WishlistItemRepository items;
    private final ProductRepository products;
    private final ProductService catalog;
    private final IdService ids;

    @Transactional
    public Wishlist getOrCreate(String userId) {
        return wishlists.findByUserId(userId).orElseGet(() -> {
            Wishlist w = new Wishlist();
            w.setId(ids.next("wishlists", "WSH", 5));
            w.setUserId(userId);
            wishlists.save(w);
            return w;
        });
    }

    @Transactional(readOnly = true)
    public List<ProductListItem> view(String userId) {
        return wishlists.findByUserId(userId).map(w ->
                items.findByWishlistIdOrderByIdDesc(w.getId()).stream()
                        .map(i -> products.findByIdAndDeletedAtIsNull(i.getProductId()).orElse(null))
                        .filter(p -> p != null && Boolean.TRUE.equals(p.getIsActive()))
                        .map(catalog::toListItem)
                        .toList()
        ).orElse(List.of());
    }

    @Transactional(readOnly = true)
    public List<String> productIds(String userId) {
        return wishlists.findByUserId(userId).map(w ->
                items.findByWishlistIdOrderByIdDesc(w.getId()).stream()
                        .map(WishlistItem::getProductId).toList()
        ).orElse(List.of());
    }

    @Transactional
    public void add(String userId, String productId) {
        products.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product " + productId));
        Wishlist w = getOrCreate(userId);
        if (items.existsByWishlistIdAndProductId(w.getId(), productId)) return;
        WishlistItem i = new WishlistItem();
        i.setId(ids.next("wishlist_items", "WIT", 5));
        i.setWishlistId(w.getId());
        i.setProductId(productId);
        items.save(i);
    }

    @Transactional
    public void remove(String userId, String productId) {
        Wishlist w = getOrCreate(userId);
        items.deleteByWishlistIdAndProductId(w.getId(), productId);
    }
}
