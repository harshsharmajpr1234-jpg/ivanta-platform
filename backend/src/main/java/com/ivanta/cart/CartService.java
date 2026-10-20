package com.ivanta.cart;

import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.exception.ResourceNotFoundException;
import com.ivanta.common.util.IdService;
import com.ivanta.dto.CartDtos.*;
import com.ivanta.inventory.InventoryService;
import com.ivanta.product.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Cart (§13): one active cart per user. The client NEVER supplies prices —
 * every read recomputes line totals and cart totals from live catalog data,
 * and stock is validated against inventory on every mutation.
 */
@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository carts;
    private final CartItemRepository items;
    private final ProductRepository products;
    private final ProductVariantRepository variants;
    private final ProductImageRepository images;
    private final InventoryService inventory;
    private final IdService ids;

    @Transactional
    public Cart getOrCreate(String userId) {
        // carts.user_id is UNIQUE — one cart row per customer for life.
        // A COMPLETED cart is reopened when the customer starts shopping again
        // (order history lives in order_items, never in the cart).
        return carts.findByUserId(userId).map(c -> {
            if (!"ACTIVE".equals(c.getStatus())) {
                c.setStatus("ACTIVE");
                items.deleteByCartId(c.getId());
                carts.save(c);
            }
            return c;
        }).orElseGet(() -> {
            Cart c = new Cart();
            c.setId(ids.next("carts", "CRT", 5));
            c.setUserId(userId);
            carts.save(c);
            return c;
        });
    }

    @Transactional(readOnly = true)
    public CartView view(String userId) {
        return carts.findByUserIdAndStatus(userId, "ACTIVE")
                .map(this::toView)
                .orElseGet(() -> new CartView(null, List.of(), 0, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
    }

    @Transactional
    public CartView addItem(String userId, AddItemRequest req) {
        Product p = products.findByIdAndDeletedAtIsNull(req.productId())
                .filter(x -> Boolean.TRUE.equals(x.getIsActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Product " + req.productId()));
        ProductVariant v = null;
        BigDecimal unitPrice = p.getPrice();
        BigDecimal mrp = p.getMrp();
        String sku = p.getSku();
        if (req.variantId() != null) {
            v = variants.findById(req.variantId())
                    .filter(x -> x.getProductId().equals(p.getId()) && Boolean.TRUE.equals(x.getIsActive()))
                    .orElseThrow(() -> new BusinessException(ErrorCode.VALIDATION_ERROR,
                            "Variant does not belong to this product"));
            unitPrice = v.getPrice();
            mrp = v.getMrp();
            sku = v.getSku();
        }

        Cart cart = getOrCreate(userId);
        final String vid = req.variantId();
        CartItem item = items.findByCartIdAndProductIdAndVariantId(cart.getId(), p.getId(), vid)
                .orElseGet(() -> {
                    CartItem n = new CartItem();
                    n.setId(ids.next("cart_items", "CIT", 5));
                    n.setCartId(cart.getId());
                    n.setProductId(p.getId());
                    n.setVariantId(vid);
                    n.setQuantity(0);
                    return n;
                });
        int newQty = item.getQuantity() + req.quantity();
        validateStock(p, v, newQty);
        item.setQuantity(newQty);
        item.setUnitPrice(unitPrice);   // refresh snapshot from DB — never from client
        item.setMrp(mrp);
        items.save(item);
        return toView(cart);
    }

    @Transactional
    public CartView updateItem(String userId, String itemId, UpdateItemRequest req) {
        Cart cart = getOrCreate(userId);
        CartItem item = items.findByIdAndCartId(itemId, cart.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cart item " + itemId));
        Product p = products.findByIdAndDeletedAtIsNull(item.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product"));
        ProductVariant v = item.getVariantId() == null ? null
                : variants.findById(item.getVariantId()).orElse(null);
        validateStock(p, v, req.quantity());
        item.setQuantity(req.quantity());
        if (v != null) { item.setUnitPrice(v.getPrice()); item.setMrp(v.getMrp()); }
        else { item.setUnitPrice(p.getPrice()); item.setMrp(p.getMrp()); }
        items.save(item);
        return toView(cart);
    }

    @Transactional
    public CartView removeItem(String userId, String itemId) {
        Cart cart = getOrCreate(userId);
        CartItem item = items.findByIdAndCartId(itemId, cart.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cart item " + itemId));
        items.delete(item);
        return toView(cart);
    }

    /** Called by OrderService after successful placement: close the active cart. */
    @Transactional
    public void completeOrder(String userId) {
        carts.findByUserIdAndStatus(userId, "ACTIVE").ifPresent(c -> {
            items.deleteByCartId(c.getId());
            c.setStatus("COMPLETED");
            carts.save(c);
        });
    }

    @Transactional
    public CartView clear(String userId) {
        Cart cart = getOrCreate(userId);
        items.deleteByCartId(cart.getId());
        return toView(cart);
    }

    private void validateStock(Product p, ProductVariant v, int requested) {
        long available = v != null ? inventory.totalAvailable(v.getId())
                : inventory.totalAvailableForProductStock(p.getId());
        if (available < requested)
            throw new BusinessException(ErrorCode.OUT_OF_STOCK,
                    "Only " + available + " unit(s) available for " + p.getName());
    }

    /* Used by Checkout — items with live prices. */
    @Transactional(readOnly = true)
    public List<CartItem> rawItems(String userId) {
        return carts.findByUserIdAndStatus(userId, "ACTIVE")
                .map(c -> items.findByCartIdOrderByIdAsc(c.getId()))
                .orElse(List.of());
    }

    CartView toView(Cart cart) {
        List<CartItemView> rows = items.findByCartIdOrderByIdAsc(cart.getId()).stream().map(i -> {
            Product p = products.findById(i.getProductId()).orElse(null);
            if (p == null || p.getDeletedAt() != null) return null;
            ProductVariant v = i.getVariantId() == null ? null : variants.findById(i.getVariantId()).orElse(null);
            BigDecimal unit = v != null ? v.getPrice() : p.getPrice();          // live price, not snapshot
            BigDecimal mrp = v != null ? v.getMrp() : p.getMrp();
            long avail = v != null ? inventory.totalAvailable(v.getId()) : inventory.totalAvailableForProductStock(p.getId());
            String img = images.findByProductIdAndIsActiveTrueOrderBySortOrderAsc(p.getId()).stream()
                    .findFirst().map(ProductImage::getStorageKey).orElse(null);
            return new CartItemView(i.getId(), p.getId(), p.getName(), p.getSlug(),
                    v == null ? null : v.getId(), v == null ? null : v.getName(),
                    v == null ? p.getSku() : v.getSku(), img, i.getQuantity(), unit, mrp,
                    unit.multiply(BigDecimal.valueOf(i.getQuantity())), avail, avail >= i.getQuantity());
        }).filter(java.util.Objects::nonNull).toList();

        int count = rows.stream().mapToInt(CartItemView::quantity).sum();
        BigDecimal subtotal = rows.stream().map(CartItemView::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal mrpTotal = rows.stream()
                .map(r -> r.mrp().multiply(BigDecimal.valueOf(r.quantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new CartView(cart.getId(), rows, count, subtotal, mrpTotal, mrpTotal.subtract(subtotal));
    }
}
