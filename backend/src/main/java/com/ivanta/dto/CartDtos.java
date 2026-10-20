package com.ivanta.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public final class CartDtos {
    private CartDtos() { }

    public record AddItemRequest(@NotNull String productId, String variantId,
                                 @NotNull @Min(1) Integer quantity) { }

    public record UpdateItemRequest(@NotNull @Min(1) Integer quantity) { }

    /** Line prices are ALWAYS the live server-side prices (§13/§45). */
    public record CartItemView(String id, String productId, String productName, String productSlug,
                               String variantId, String variantName, String sku, String imageKey,
                               int quantity, BigDecimal unitPrice, BigDecimal mrp, BigDecimal lineTotal,
                               long available, boolean stockOk) { }

    public record CartView(String id, List<CartItemView> items, int itemCount,
                           BigDecimal subtotal, BigDecimal mrpTotal, BigDecimal savings) { }
}
