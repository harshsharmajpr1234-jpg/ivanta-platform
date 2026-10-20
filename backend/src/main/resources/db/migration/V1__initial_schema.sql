-- =============================================================
-- V1: Foundation — countries + system settings (§7 SYSTEM)
-- MySQL 8 / InnoDB / utf8mb4. Applied by Flyway; immutable once run.
-- =============================================================

CREATE TABLE countries (
  id         VARCHAR(16) PRIMARY KEY,
  name       VARCHAR(80) NOT NULL UNIQUE,
  iso2       CHAR(2) NOT NULL UNIQUE,
  phone_code VARCHAR(6) NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

INSERT INTO countries (id, name, iso2, phone_code) VALUES ('CTY-IN','India','IN','+91');

CREATE TABLE system_settings (
  setting_key   VARCHAR(60) PRIMARY KEY,
  setting_value TEXT NULL,
  category      VARCHAR(30) NOT NULL DEFAULT 'GENERAL',
  description   VARCHAR(255) NULL,
  updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  updated_by    VARCHAR(16) NULL
) ENGINE=InnoDB;

INSERT INTO system_settings (setting_key, setting_value, category, description) VALUES
  ('store.name','iVanta','GENERAL','Storefront name'),
  ('store.currency','INR','GENERAL','Settlement currency'),
  ('store.support_email','support@ivanta.in','GENERAL','Customer support email'),
  ('checkout.cod_enabled','true','CHECKOUT','Allow Cash on Delivery'),
  ('checkout.reservation_ttl_minutes','15','CHECKOUT','Stock reservation expiry'),
  ('checkout.min_order_value','999','CHECKOUT','Minimum order value in INR'),
  ('returns.window_days','7','RETURNS','Return window after delivery'),
  ('shipping.free_above','999','SHIPPING','Free standard shipping above this value');
