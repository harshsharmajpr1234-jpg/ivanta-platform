-- =============================================================
-- V18: Amazon/Flipkart-grade order management upgrade
--  * human-friendly order numbers  IVN-YYYYMMDD-NNNNNN
--  * richer status model (PLACED / PENDING_PAYMENT / PAYMENT_FAILED /
--    IN_TRANSIT / CANCEL_REQUESTED / RETURN_* / REFUND_INITIATED /
--    REPLACEMENT_*)
--  * denormalised payment_status / shipping_status + lifecycle stamps
--  * order item variant snapshot columns (color / storage)
--  * order_notes, order_documents, invoices, replacements
--  * per-product return window override
-- All historical rows are migrated in place; history tables are
-- append-only and are NEVER rewritten except for the status rename map.
-- =============================================================

-- ---------- 1. orders: new columns ----------
ALTER TABLE orders ADD order_number VARCHAR(24) NULL;
ALTER TABLE orders ADD payment_status VARCHAR(24) NULL;
ALTER TABLE orders ADD shipping_status VARCHAR(24) NULL;
ALTER TABLE orders ADD confirmed_at DATETIME(3) NULL;
ALTER TABLE orders ADD shipped_at DATETIME(3) NULL;
ALTER TABLE orders ADD delivered_at DATETIME(3) NULL;
ALTER TABLE orders ADD cancelled_by_type VARCHAR(10) NULL;
ALTER TABLE orders ADD cancelled_by VARCHAR(16) NULL;

-- ---------- 2. order_items: variant snapshot columns ----------
ALTER TABLE order_items ADD color VARCHAR(60) NULL;
ALTER TABLE order_items ADD storage VARCHAR(40) NULL;

UPDATE order_items oi
SET color = (SELECT v.color FROM product_variants v WHERE v.id = oi.variant_id),
    storage = (SELECT v.storage FROM product_variants v WHERE v.id = oi.variant_id)
WHERE oi.variant_id IS NOT NULL;

-- ---------- 3. per-product return window override ----------
ALTER TABLE products
  ADD COLUMN return_window_days INT NULL COMMENT 'overrides global returns.window-days when set';

-- ---------- 4. order notes (admin/customer conversation, append-only) ----------
CREATE TABLE order_notes (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id    VARCHAR(20)  NOT NULL,
  note        VARCHAR(1000) NOT NULL,
  added_by_type VARCHAR(10) NOT NULL DEFAULT 'ADMIN',   -- ADMIN|CUSTOMER|SYSTEM
  added_by    VARCHAR(16)  NULL,
  visibility  VARCHAR(10)  NOT NULL DEFAULT 'INTERNAL', -- INTERNAL|PUBLIC
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_onote_order (order_id, created_at),
  CONSTRAINT fk_onote_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

-- ---------- 5. order documents (invoice PDFs, packing slips, ...) ----------
CREATE TABLE order_documents (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id    VARCHAR(20)  NOT NULL,
  doc_type    VARCHAR(20)  NOT NULL,            -- INVOICE|PACKING_SLIP|OTHER
  storage_key VARCHAR(255) NOT NULL,
  file_name   VARCHAR(200) NOT NULL,
  mime_type   VARCHAR(80)  NOT NULL DEFAULT 'application/pdf',
  created_by  VARCHAR(16)  NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_odoc_order (order_id, doc_type),
  CONSTRAINT fk_odoc_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

-- ---------- 6. invoices ----------
CREATE TABLE invoices (
  id             VARCHAR(20) PRIMARY KEY,        -- INV-YYYY-NNNNNN (also the invoice number)
  order_id       VARCHAR(20) NOT NULL UNIQUE,
  pdf_key        VARCHAR(255) NOT NULL,
  subtotal       DECIMAL(10,2) NOT NULL,
  discount_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_total      DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_fee   DECIMAL(10,2) NOT NULL DEFAULT 0,
  grand_total    DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(16) NULL,
  issued_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_inv_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

-- ---------- 7. replacements ----------
CREATE TABLE replacements (
  id                   VARCHAR(20) PRIMARY KEY,   -- REP-NNNNNN
  order_id             VARCHAR(20) NOT NULL,
  order_item_id        VARCHAR(20) NOT NULL,
  user_id              VARCHAR(16) NOT NULL,
  status               VARCHAR(28) NOT NULL DEFAULT 'REQUESTED',
  -- REQUESTED|APPROVED|REJECTED|PROCESSING|SHIPPED|DELIVERED|CLOSED
  reason               VARCHAR(300) NOT NULL,
  replacement_order_id VARCHAR(20) NULL,
  approved_by          VARCHAR(16) NULL,
  requested_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  resolved_at          DATETIME(3) NULL,
  version              INT NOT NULL DEFAULT 0,
  INDEX idx_repl_order (order_id),
  INDEX idx_repl_user (user_id, status),
  CONSTRAINT fk_repl_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_repl_user  FOREIGN KEY (user_id)  REFERENCES users(id)
) ENGINE=InnoDB;

-- ---------- 8. status remap: legacy -> new canonical model ----------
-- orders
UPDATE orders SET status = 'PENDING_PAYMENT' WHERE status = 'PAYMENT_PENDING';
UPDATE orders SET status = 'CONFIRMED'       WHERE status = 'PAID';
UPDATE orders SET status = 'PLACED'          WHERE status = 'PENDING';
UPDATE orders SET status = 'RETURN_RECEIVED' WHERE status = 'RETURNED';
-- append-only history ledger: rename statuses in place (no rows added/removed)
UPDATE order_status_history SET new_status = 'PENDING_PAYMENT' WHERE new_status = 'PAYMENT_PENDING';
UPDATE order_status_history SET new_status = 'CONFIRMED'       WHERE new_status = 'PAID';
UPDATE order_status_history SET new_status = 'PLACED'          WHERE new_status = 'PENDING';
UPDATE order_status_history SET new_status = 'RETURN_RECEIVED' WHERE new_status = 'RETURNED';
UPDATE order_status_history SET previous_status = 'PENDING_PAYMENT' WHERE previous_status = 'PAYMENT_PENDING';
UPDATE order_status_history SET previous_status = 'CONFIRMED'       WHERE previous_status = 'PAID';
UPDATE order_status_history SET previous_status = 'PLACED'          WHERE previous_status = 'PENDING';
UPDATE order_status_history SET previous_status = 'RETURN_RECEIVED' WHERE previous_status = 'RETURNED';
-- returns: INSPECTING -> INSPECTION, add PICKED_UP to the vocabulary
UPDATE return_requests SET status = 'INSPECTION' WHERE status = 'INSPECTING';

-- ---------- 9. order numbers IVN-YYYYMMDD-NNNNNN (backfill + unique) ----------
UPDATE orders
SET order_number = CONCAT('IVN-20260925-', LPAD(RIGHT(id, 6), 6, '0'))
WHERE order_number IS NULL;

ALTER TABLE orders ALTER COLUMN order_number VARCHAR(24) NOT NULL;
ALTER TABLE orders ADD CONSTRAINT uq_ord_number UNIQUE (order_number);

-- seed the per-day IdService counters so future numbers never collide
MERGE INTO id_sequences (seq_name, next_val) KEY (seq_name)
SELECT CONCAT('orders:IVN-', REPLACE(SUBSTR(CAST(placed_at AS VARCHAR), 1, 10), '-', '')), COUNT(*)
FROM orders GROUP BY SUBSTR(CAST(placed_at AS VARCHAR), 1, 10);

-- ---------- 10. denormalised payment/shipping status + lifecycle stamps ----------
UPDATE orders o SET o.payment_status = COALESCE(
  (SELECT p.status FROM payments p WHERE p.order_id = o.id ORDER BY p.created_at DESC, p.id DESC LIMIT 1),
  'PENDING');

UPDATE orders SET shipping_status = CASE
  WHEN status IN ('DELIVERED','RETURN_REQUESTED','RETURN_APPROVED','RETURN_PICKUP_SCHEDULED',
                  'RETURN_PICKED_UP','RETURN_RECEIVED','RETURN_INSPECTION','REFUND_INITIATED',
                  'REFUNDED','REPLACEMENT_DELIVERED') THEN 'DELIVERED'
  WHEN status = 'OUT_FOR_DELIVERY' THEN 'OUT_FOR_DELIVERY'
  WHEN status IN ('SHIPPED','IN_TRANSIT','CANCEL_REQUESTED') THEN 'SHIPPED'
  WHEN status = 'PACKED' THEN 'PACKED'
  WHEN status = 'CANCELLED' THEN 'CANCELLED'
  ELSE 'PENDING' END;

UPDATE orders o SET o.confirmed_at =
  (SELECT MIN(h.created_at) FROM order_status_history h WHERE h.order_id = o.id AND h.new_status = 'CONFIRMED');
UPDATE orders o SET o.shipped_at =
  (SELECT MIN(h.created_at) FROM order_status_history h WHERE h.order_id = o.id AND h.new_status = 'SHIPPED');
UPDATE orders o SET o.delivered_at =
  (SELECT MIN(h.created_at) FROM order_status_history h WHERE h.order_id = o.id AND h.new_status = 'DELIVERED');
UPDATE orders o SET o.cancelled_by_type = 'SYSTEM' WHERE o.status = 'CANCELLED' AND o.cancelled_at IS NOT NULL;

-- ---------- 11. notification templates for the new lifecycle events ----------
INSERT IGNORE INTO notification_templates (template_key, channel, subject, body) VALUES
  ('ORDER_PROCESSING','IN_APP','Order processing','Order {{orderNumber}} is being processed at our fulfilment centre.'),
  ('ORDER_PACKED','IN_APP','Order packed','Order {{orderNumber}} is packed and ready to ship.'),
  ('ORDER_IN_TRANSIT','IN_APP','Order in transit','Order {{orderNumber}} is in transit{{location}}.'),
  ('CANCEL_REQUESTED','IN_APP','Cancellation requested','We received your cancellation request for order {{orderNumber}}. Our team will review it shortly.'),
  ('CANCEL_REQUEST_RESOLVED','IN_APP','Cancellation request update','Cancellation request for order {{orderNumber}}: {{status}}.'),
  ('RETURN_REQUESTED','IN_APP','Return requested','Return {{returnNumber}} for order {{orderNumber}} has been requested.'),
  ('RETURN_APPROVED','IN_APP','Return approved','Return {{returnNumber}} for order {{orderNumber}} was approved. Pickup will be scheduled shortly.'),
  ('REFUND_INITIATED','IN_APP','Refund initiated','A refund of ₹{{amount}} for order {{orderNumber}} has been initiated.'),
  ('REFUND_SUCCESS','IN_APP','Refund completed','₹{{amount}} for order {{orderNumber}} was refunded to your original payment method.'),
  ('REPLACEMENT_REQUESTED','IN_APP','Replacement requested','Replacement {{replacementNumber}} for order {{orderNumber}} has been requested.'),
  ('REPLACEMENT_APPROVED','IN_APP','Replacement approved','Your replacement for order {{orderNumber}} was approved. Replacement order {{replacementOrderNumber}} is being prepared.'),
  ('REPLACEMENT_REJECTED','IN_APP','Replacement rejected','Replacement {{replacementNumber}} for order {{orderNumber}} was rejected. {{reason}}'),
  ('REPLACEMENT_SHIPPED','IN_APP','Replacement shipped','Your replacement for order {{orderNumber}} has shipped.'),
  ('REPLACEMENT_DELIVERED','IN_APP','Replacement delivered','Your replacement for order {{orderNumber}} was delivered.'),
  ('INVOICE_READY','IN_APP','Invoice ready','Invoice {{invoiceNumber}} for order {{orderNumber}} is ready to download.');

-- ---------- 12. settings for the new order engine ----------
INSERT IGNORE INTO system_settings (setting_key, setting_value, category, description) VALUES
  ('order.customer_cancellable_statuses','PENDING_PAYMENT,PAYMENT_FAILED,PLACED,CONFIRMED,PROCESSING','ORDER','Statuses from which customers may cancel directly'),
  ('order.customer_cancel_request_statuses','SHIPPED,IN_TRANSIT,OUT_FOR_DELIVERY','ORDER','Statuses from which customers may request cancellation (admin approves)'),
  ('order.replacement_enabled','true','ORDER','Whether customers may request replacements'),
  ('invoice.seller_name','Hansh Technologies (Flyphones)','INVOICE','Seller name printed on invoices'),
  ('invoice.seller_address','510, Suneja Tower 2, District Center, Janakpuri West, New Delhi, 110078','INVOICE','Seller address printed on invoices');
