-- =============================================================
-- V11: Product reviews (§7 REVIEWS, §33)
-- verified_purchase is computed server-side from delivered orders —
-- the client can never set it. One review per user per product.
-- =============================================================

CREATE TABLE product_reviews (
  id                VARCHAR(20) PRIMARY KEY,   -- REV-NNNNN
  product_id        VARCHAR(16) NOT NULL,
  user_id           VARCHAR(16) NOT NULL,
  order_id          VARCHAR(20) NULL,
  rating            TINYINT NOT NULL,          -- 1..5
  title             VARCHAR(140) NULL,
  body              TEXT NULL,
  images            TEXT NULL,                 -- JSON array of storage keys
  verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  status            VARCHAR(10) NOT NULL DEFAULT 'APPROVED',  -- PENDING|APPROVED|REJECTED
  admin_note        VARCHAR(300) NULL,
  created_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_review_user_product (product_id, user_id),
  INDEX idx_rev_product (product_id, status),
  CONSTRAINT fk_rev_prod FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_rev_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;
