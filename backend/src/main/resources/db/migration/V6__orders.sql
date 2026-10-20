-- =============================================================
-- V6: Orders (§7 ORDERS, §23, §24)
-- Totals are computed server-side at checkout. Items store full
-- snapshots so historical orders survive later price changes.
-- =============================================================

CREATE TABLE orders (
  id                   VARCHAR(20) PRIMARY KEY,        -- ORD-YYYY-NNNNNN
  user_id              VARCHAR(16) NOT NULL,
  status               VARCHAR(24) NOT NULL DEFAULT 'PENDING',
  -- PENDING|CONFIRMED|PAYMENT_PENDING|PAID|PROCESSING|PACKED|SHIPPED|
  -- OUT_FOR_DELIVERY|DELIVERED|CANCELLED|RETURN_REQUESTED|RETURNED|REFUNDED
  subtotal             DECIMAL(10,2) NOT NULL,
  discount_total       DECIMAL(10,2) NOT NULL DEFAULT 0,
  coupon_code          VARCHAR(40) NULL,
  coupon_discount      DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_total            DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_fee         DECIMAL(10,2) NOT NULL DEFAULT 0,
  grand_total          DECIMAL(10,2) NOT NULL,
  currency             CHAR(3) NOT NULL DEFAULT 'INR',
  payment_method       VARCHAR(16) NULL,                -- UPI|CARD|NETBANKING|WALLET|COD
  shipping_method_id   VARCHAR(16) NULL,                -- FK attached in V8
  shipping_address_id  VARCHAR(16) NULL,                -- FK attached in V8 (snapshot row)
  contact_email        VARCHAR(190) NULL,
  contact_phone        VARCHAR(20) NULL,
  customer_note        VARCHAR(400) NULL,
  cancellation_reason  VARCHAR(300) NULL,
  cancelled_at         DATETIME(3) NULL,
  placed_at            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expected_delivery    DATE NULL,
  created_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  version              INT NOT NULL DEFAULT 0,
  INDEX idx_ord_user (user_id, created_at),
  INDEX idx_ord_status (status),
  INDEX idx_ord_created (created_at),
  CONSTRAINT fk_ord_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id            VARCHAR(20) PRIMARY KEY,
  order_id      VARCHAR(20) NOT NULL,
  product_id    VARCHAR(16) NOT NULL,
  variant_id    VARCHAR(16) NULL,
  product_name  VARCHAR(160) NOT NULL,     -- snapshot (§24)
  variant_name  VARCHAR(160) NULL,
  sku           VARCHAR(40) NOT NULL,
  image_key     VARCHAR(255) NULL,
  quantity      INT NOT NULL,
  unit_price    DECIMAL(10,2) NOT NULL,
  discount      DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate      DECIMAL(5,4) NOT NULL DEFAULT 0,
  tax_amount    DECIMAL(10,2) NOT NULL DEFAULT 0,
  final_price   DECIMAL(10,2) NOT NULL,    -- qty*unit - discount + tax
  INDEX idx_oi_order (order_id),
  CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

-- Append-only status ledger (§23)
CREATE TABLE order_status_history (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id        VARCHAR(20) NOT NULL,
  previous_status VARCHAR(24) NULL,
  new_status      VARCHAR(24) NOT NULL,
  changed_by_type VARCHAR(10) NOT NULL DEFAULT 'SYSTEM',  -- CUSTOMER|ADMIN|SYSTEM
  changed_by      VARCHAR(16) NULL,
  reason          VARCHAR(300) NULL,
  created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_osh_order (order_id, created_at),
  CONSTRAINT fk_osh_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

ALTER TABLE stock_reservations
  ADD CONSTRAINT fk_res_order FOREIGN KEY (order_id) REFERENCES orders(id);
