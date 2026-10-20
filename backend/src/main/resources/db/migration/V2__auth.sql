-- =============================================================
-- V2: Authentication & RBAC (§7 AUTH/CUSTOMER, §16, §35, §36)
-- =============================================================

CREATE TABLE users (
  id            VARCHAR(16) PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NULL UNIQUE,
  phone         VARCHAR(20) NULL UNIQUE,
  password_hash VARCHAR(100) NULL,          -- BCrypt; NULL for OTP-only accounts
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at    DATETIME(3) NULL,           -- soft delete only (§44)
  deleted_by    VARCHAR(16) NULL,
  INDEX idx_users_email (email),
  INDEX idx_users_phone (phone)
) ENGINE=InnoDB;

CREATE TABLE customer_profiles (
  user_id          VARCHAR(16) PRIMARY KEY,
  marketing_emails BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_sms    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- HTTP-only cookie sessions; only SHA-256 hashes of tokens are stored (§36)
CREATE TABLE user_sessions (
  token_hash VARCHAR(64) PRIMARY KEY,
  user_id    VARCHAR(16) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  revoked_at DATETIME(3) NULL,
  INDEX idx_usession_user (user_id, revoked_at),
  CONSTRAINT fk_usession_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE otp_codes (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  identifier VARCHAR(190) NOT NULL,         -- email or phone
  channel    VARCHAR(5) NOT NULL DEFAULT 'EMAIL',
  otp_hash   VARCHAR(64) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  used_at    DATETIME(3) NULL,
  attempts   INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_otp_identifier (identifier, used_at, expires_at)
) ENGINE=InnoDB;

CREATE TABLE addresses (
  id             VARCHAR(16) PRIMARY KEY,
  user_id        VARCHAR(16) NOT NULL,
  name           VARCHAR(120) NOT NULL,      -- receiver name
  phone          VARCHAR(20) NOT NULL,
  address_line_1 VARCHAR(200) NOT NULL,
  address_line_2 VARCHAR(200) NULL,
  locality       VARCHAR(120) NULL,
  road           VARCHAR(120) NULL,
  city           VARCHAR(80) NOT NULL,
  district       VARCHAR(80) NULL,
  state          VARCHAR(80) NOT NULL,
  pincode        CHAR(6) NOT NULL,
  country        VARCHAR(80) NOT NULL DEFAULT 'India',
  latitude       DECIMAL(10,7) NULL,
  longitude      DECIMAL(10,7) NULL,
  landmark       VARCHAR(200) NULL,
  address_type   VARCHAR(10) NOT NULL DEFAULT 'HOME',   -- HOME | WORK | OTHER
  is_default     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at     DATETIME(3) NULL,
  INDEX idx_addr_user (user_id, is_active),
  INDEX idx_addr_pin (pincode),
  CONSTRAINT fk_addr_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ---------- Admin console accounts (§34-§36) ----------
CREATE TABLE admin_users (
  id                   VARCHAR(16) PRIMARY KEY,
  name                 VARCHAR(120) NOT NULL,
  email                VARCHAR(190) NOT NULL UNIQUE,
  password_hash        VARCHAR(100) NOT NULL,           -- BCrypt(12), never plaintext
  role                 VARCHAR(32) NOT NULL,
  two_factor_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_secret    VARCHAR(100) NULL,
  failed_attempts      INT NOT NULL DEFAULT 0,
  locked_until         DATETIME(3) NULL,
  last_login_at        DATETIME(3) NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  disabled_at          DATETIME(3) NULL,
  disabled_by          VARCHAR(16) NULL,
  created_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

CREATE TABLE admin_sessions (
  token_hash  VARCHAR(64) PRIMARY KEY,
  admin_id    VARCHAR(16) NOT NULL,
  role        VARCHAR(32) NOT NULL,
  created_at  DATETIME(3) NOT NULL,
  expires_at  DATETIME(3) NOT NULL,
  last_active DATETIME(3) NOT NULL,
  ip_address  VARCHAR(45) NULL,
  user_agent  VARCHAR(255) NULL,
  revoked_at  DATETIME(3) NULL,
  INDEX idx_asession_admin (admin_id, revoked_at),
  CONSTRAINT fk_asession_admin FOREIGN KEY (admin_id) REFERENCES admin_users(id)
) ENGINE=InnoDB;

CREATE TABLE login_attempts (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  identifier VARCHAR(190) NOT NULL,
  scope      VARCHAR(8) NOT NULL DEFAULT 'ADMIN',       -- ADMIN | CUSTOMER
  success    BOOLEAN NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_attempt_ident (identifier, success, created_at)
) ENGINE=InnoDB;

-- ---------- RBAC (§35) ----------
CREATE TABLE roles (
  role        VARCHAR(32) PRIMARY KEY,
  name        VARCHAR(80) NOT NULL,
  description VARCHAR(200) NULL
) ENGINE=InnoDB;

CREATE TABLE permissions (
  permission  VARCHAR(40) PRIMARY KEY,
  description VARCHAR(200) NULL
) ENGINE=InnoDB;

CREATE TABLE user_roles (
  user_id VARCHAR(16) NOT NULL,
  role    VARCHAR(32) NOT NULL,
  PRIMARY KEY (user_id, role),
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_ur_role FOREIGN KEY (role) REFERENCES roles(role)
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
  role       VARCHAR(32) NOT NULL,
  permission VARCHAR(40) NOT NULL,
  PRIMARY KEY (role, permission),
  CONSTRAINT fk_rp_role FOREIGN KEY (role) REFERENCES roles(role),
  CONSTRAINT fk_rp_perm FOREIGN KEY (permission) REFERENCES permissions(permission)
) ENGINE=InnoDB;

INSERT INTO roles (role, name, description) VALUES
  ('SUPER_ADMIN','Super Admin','Full access to every module'),
  ('PRODUCT_MANAGER','Product Manager','Catalog, pricing, variants, images'),
  ('INVENTORY_MANAGER','Inventory Manager','Stock, warehouses, movements'),
  ('ORDER_MANAGER','Order Manager','Order lifecycle and cancellations'),
  ('FINANCE_MANAGER','Finance Manager','Payments, refunds, revenue reports'),
  ('DELIVERY_MANAGER','Delivery Manager','Shipments, carriers, tracking'),
  ('CUSTOMER_SUPPORT','Customer Support','Customers, orders view, returns assistance'),
  ('MARKETING_MANAGER','Marketing Manager','Coupons, promotions, review moderation');

INSERT INTO permissions (permission, description) VALUES
  ('PRODUCT_CREATE','Create products/variants'),
  ('PRODUCT_UPDATE','Edit products, prices, images, specs'),
  ('PRODUCT_DELETE','Hard delete (blocked when history exists)'),
  ('PRODUCT_ARCHIVE','Archive products (soft delete)'),
  ('INVENTORY_VIEW','View stock and movements'),
  ('INVENTORY_UPDATE','Adjust, transfer, reserve, release stock'),
  ('ORDER_VIEW','View orders'),
  ('ORDER_UPDATE','Advance order status'),
  ('ORDER_CANCEL','Cancel orders'),
  ('PAYMENT_VIEW','View payments and transactions'),
  ('REFUND_PROCESS','Process refunds'),
  ('CUSTOMER_VIEW','View customers'),
  ('CUSTOMER_UPDATE','Edit/disable customers'),
  ('DELIVERY_VIEW','View shipments'),
  ('DELIVERY_UPDATE','Create/update shipments and tracking'),
  ('COUPON_MANAGE','Create and manage coupons'),
  ('REVIEW_MODERATE','Approve/reject product reviews'),
  ('LOCATION_MANAGE','Manage location dataset and zones'),
  ('REPORT_VIEW','View business reports'),
  ('AUDIT_VIEW','View audit logs'),
  ('SETTINGS_UPDATE','Update system settings');

-- Permission matrix (SUPER_ADMIN is additionally treated as wildcard in code)
INSERT INTO role_permissions (role, permission) VALUES
  ('SUPER_ADMIN','PRODUCT_CREATE'),('SUPER_ADMIN','PRODUCT_UPDATE'),('SUPER_ADMIN','PRODUCT_DELETE'),
  ('SUPER_ADMIN','PRODUCT_ARCHIVE'),('SUPER_ADMIN','INVENTORY_VIEW'),('SUPER_ADMIN','INVENTORY_UPDATE'),
  ('SUPER_ADMIN','ORDER_VIEW'),('SUPER_ADMIN','ORDER_UPDATE'),('SUPER_ADMIN','ORDER_CANCEL'),
  ('SUPER_ADMIN','PAYMENT_VIEW'),('SUPER_ADMIN','REFUND_PROCESS'),('SUPER_ADMIN','CUSTOMER_VIEW'),
  ('SUPER_ADMIN','CUSTOMER_UPDATE'),('SUPER_ADMIN','DELIVERY_VIEW'),('SUPER_ADMIN','DELIVERY_UPDATE'),
  ('SUPER_ADMIN','COUPON_MANAGE'),('SUPER_ADMIN','REVIEW_MODERATE'),('SUPER_ADMIN','LOCATION_MANAGE'),
  ('SUPER_ADMIN','REPORT_VIEW'),('SUPER_ADMIN','AUDIT_VIEW'),('SUPER_ADMIN','SETTINGS_UPDATE'),
  ('PRODUCT_MANAGER','PRODUCT_CREATE'),('PRODUCT_MANAGER','PRODUCT_UPDATE'),('PRODUCT_MANAGER','PRODUCT_DELETE'),
  ('PRODUCT_MANAGER','PRODUCT_ARCHIVE'),('PRODUCT_MANAGER','REVIEW_MODERATE'),('PRODUCT_MANAGER','REPORT_VIEW'),
  ('INVENTORY_MANAGER','INVENTORY_VIEW'),('INVENTORY_MANAGER','INVENTORY_UPDATE'),
  ('INVENTORY_MANAGER','DELIVERY_VIEW'),('INVENTORY_MANAGER','REPORT_VIEW'),
  ('ORDER_MANAGER','ORDER_VIEW'),('ORDER_MANAGER','ORDER_UPDATE'),('ORDER_MANAGER','ORDER_CANCEL'),
  ('ORDER_MANAGER','CUSTOMER_VIEW'),('ORDER_MANAGER','DELIVERY_VIEW'),('ORDER_MANAGER','DELIVERY_UPDATE'),
  ('ORDER_MANAGER','REPORT_VIEW'),
  ('FINANCE_MANAGER','PAYMENT_VIEW'),('FINANCE_MANAGER','REFUND_PROCESS'),('FINANCE_MANAGER','ORDER_VIEW'),
  ('FINANCE_MANAGER','REPORT_VIEW'),
  ('DELIVERY_MANAGER','DELIVERY_VIEW'),('DELIVERY_MANAGER','DELIVERY_UPDATE'),('DELIVERY_MANAGER','ORDER_VIEW'),
  ('DELIVERY_MANAGER','INVENTORY_VIEW'),('DELIVERY_MANAGER','REPORT_VIEW'),
  ('CUSTOMER_SUPPORT','CUSTOMER_VIEW'),('CUSTOMER_SUPPORT','CUSTOMER_UPDATE'),('CUSTOMER_SUPPORT','ORDER_VIEW'),
  ('CUSTOMER_SUPPORT','ORDER_UPDATE'),('CUSTOMER_SUPPORT','PAYMENT_VIEW'),
  ('MARKETING_MANAGER','COUPON_MANAGE'),('MARKETING_MANAGER','REVIEW_MODERATE'),
  ('MARKETING_MANAGER','CUSTOMER_VIEW'),('MARKETING_MANAGER','REPORT_VIEW');
