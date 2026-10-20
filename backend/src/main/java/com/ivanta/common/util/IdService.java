package com.ivanta.common.util;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;

/**
 * Human-readable sequential IDs (ORD-2026-000001, PRD-0001, ...).
 *
 * Backed by the id_sequences table: each (table, prefix) pair owns a counter
 * row incremented with the atomic MySQL LAST_INSERT_ID(expr) idiom, which is
 * safe under concurrency and inside uncommitted transactions. Rows are created
 * lazily on first use, seeded from the current MAX(id) of the owning table so
 * pre-existing (migrated/seeded) rows are never collided with.
 */
@Service
@RequiredArgsConstructor
public class IdService {

    private final JdbcTemplate jdbc;

    // Whitelist of table names to keep the lazy-init SQL strictly parameter-free.
    private static final Set<String> ALLOWED_TABLES = Set.of(
            "users", "addresses", "admin_users", "carts", "cart_items", "wishlists", "wishlist_items",
            "categories", "brands", "products", "product_variants", "product_images", "product_colors",
            "product_storage_options", "product_specifications", "product_prices",
            "warehouses", "inventory_locations", "inventory", "inventory_movements", "stock_reservations",
            "orders", "order_items", "payments", "payment_transactions",
            "invoices", "replacements",
            "delivery_addresses", "shipments", "return_requests", "return_items",
            "refunds", "refund_transactions", "coupons", "coupon_usage",
            "product_reviews", "audit_logs", "notifications",
            "states", "districts", "cities", "localities", "pincodes", "post_offices",
            "roads", "serviceability_zones", "shipping_methods");

    public String next(String table, String prefix, int width) {
        if (!ALLOWED_TABLES.contains(table)) throw new IllegalArgumentException("Unknown id table: " + table);
        String key = table + ":" + prefix;
        String like = prefix + "-%";
        int numberStart = prefix.length() + 2;   // 1-based index of the numeric suffix

        // Lazy, idempotent init: seed the counter from MAX(id) of the owning table.
        try {
            jdbc.update("INSERT INTO id_sequences (seq_name, next_val) "
                            + "SELECT ?, COALESCE(MAX(CAST(SUBSTRING(id, ?) AS BIGINT)), 0) "
                            + "FROM " + table + " WHERE id LIKE ?",
                    key, numberStart, like);
        } catch (Exception ignored) {
            // Row already exists
        }

        // Atomic increment
        jdbc.update("UPDATE id_sequences SET next_val = next_val + 1 WHERE seq_name = ?", key);
        Long n = jdbc.queryForObject("SELECT next_val FROM id_sequences WHERE seq_name = ?", Long.class, key);
        return prefix + "-" + String.format("%0" + width + "d", n == null ? 1 : n);
    }
}
