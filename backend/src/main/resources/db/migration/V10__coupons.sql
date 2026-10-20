-- =============================================================
-- V10: Coupons (§7 COUPONS, §32) — all validation server-side.
-- =============================================================

CREATE TABLE coupons (
  id                    VARCHAR(16) PRIMARY KEY,
  code                  VARCHAR(40) NOT NULL UNIQUE,
  description           VARCHAR(300) NULL,
  discount_type         VARCHAR(12) NOT NULL,          -- PERCENTAGE | FIXED
  discount_value        DECIMAL(10,2) NOT NULL,
  min_order_value       DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_discount          DECIMAL(10,2) NULL,            -- cap for percentage coupons
  applicable_category_id VARCHAR(16) NULL,
  applicable_product_id  VARCHAR(16) NULL,
  starts_at             DATETIME(3) NOT NULL,
  expires_at            DATETIME(3) NOT NULL,
  usage_limit           INT NULL,                      -- NULL = unlimited
  usage_count           INT NOT NULL DEFAULT 0,
  per_user_limit        INT NOT NULL DEFAULT 1,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_by            VARCHAR(16) NULL,
  created_at            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_coupon_code (code, is_active)
) ENGINE=InnoDB;

CREATE TABLE coupon_usage (
  id              VARCHAR(16) PRIMARY KEY,
  coupon_id       VARCHAR(16) NOT NULL,
  order_id        VARCHAR(20) NOT NULL UNIQUE,
  user_id         VARCHAR(16) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_cusage_coupon_user (coupon_id, user_id),
  CONSTRAINT fk_cusage_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  CONSTRAINT fk_cusage_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;
