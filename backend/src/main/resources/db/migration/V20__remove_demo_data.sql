-- =============================================================
-- V20: PURGE DEMO / MOCK / TEST BUSINESS DATA FOR PRODUCTION
-- Removes all demo products, variants, inventory items, demo orders,
-- demo payments, demo refunds, demo returns, demo replacements,
-- demo carts, demo wishlists, demo reviews, and demo catalog entries.
-- Schema, tables, RBAC, locations, warehouses, and shipping methods remain intact.
-- =============================================================

DELETE FROM product_images;
DELETE FROM product_specifications;
DELETE FROM product_colors;
DELETE FROM product_storage_options;
DELETE FROM product_prices;
DELETE FROM inventory_movements;
DELETE FROM stock_reservations;
DELETE FROM inventory;
DELETE FROM order_items;
DELETE FROM payment_transactions;
DELETE FROM payments;
DELETE FROM refund_transactions;
DELETE FROM refunds;
DELETE FROM return_items;
DELETE FROM return_requests;
DELETE FROM replacements;
DELETE FROM cart_items;
DELETE FROM carts;
DELETE FROM wishlist_items;
DELETE FROM wishlists;
DELETE FROM product_reviews;
DELETE FROM coupons;
DELETE FROM product_variants;
DELETE FROM products;

-- Clear demo categories and brands (parent FK hierarchy handled)
DELETE FROM categories WHERE parent_id IS NOT NULL;
DELETE FROM categories;
DELETE FROM brands;
