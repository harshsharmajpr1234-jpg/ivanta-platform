-- iVanta — used Apple device acquisition platform
-- MySQL 8.0 relational schema (source of truth). The in-memory mock server (src/server/db.ts)
-- mirrors these tables 1:1 so a Spring Boot + MySQL backend can replace it unchanged.
-- Rules enforced by design:
--   * No hard deletes of financial records — soft delete via is_active/deleted_at/deleted_by.
--   * All status changes are append-only history tables (never overwrite).
--   * Audit logs capture who/what/entity/id/old→new/IP.

CREATE DATABASE IF NOT EXISTS ivanta CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ivanta;

-- ================= USERS & AUTH =================
CREATE TABLE users (
  id            VARCHAR(16) PRIMARY KEY,              -- USR-0001
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  phone         VARCHAR(20),
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at    DATETIME(3) NULL,
  deleted_by    VARCHAR(16) NULL,
  INDEX idx_users_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE otp_codes (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(190) NOT NULL,
  otp_hash   CHAR(64) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  used_at    DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_otp_email (email, expires_at)
) ENGINE=InnoDB;

CREATE TABLE user_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id    VARCHAR(16) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE addresses (
  id         VARCHAR(16) PRIMARY KEY,                 -- ADR-xxxx
  user_id    VARCHAR(16) NOT NULL,
  label      VARCHAR(40) NOT NULL DEFAULT 'Home',
  full_name  VARCHAR(120) NOT NULL,
  phone      VARCHAR(20) NOT NULL,
  line1      VARCHAR(255) NOT NULL,
  line2      VARCHAR(255) NULL,
  road_id    VARCHAR(16) NULL,
  locality_id VARCHAR(16) NULL,
  city_id    VARCHAR(16) NULL,
  district_id VARCHAR(16) NULL,
  state_id   VARCHAR(16) NULL,
  pincode    CHAR(6) NOT NULL,
  type       ENUM('home','work','other') NOT NULL DEFAULT 'home',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at DATETIME(3) NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_addr_user (user_id, is_active)
) ENGINE=InnoDB;

-- ================= ADMIN AUTH & RBAC =================
CREATE TABLE admin_roles (
  role        VARCHAR(32) PRIMARY KEY,                -- SUPER_ADMIN, OPERATIONS_MANAGER, ...
  label       VARCHAR(80) NOT NULL,
  description VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE permissions (
  permission VARCHAR(40) PRIMARY KEY                  -- DASHBOARD_VIEW, SELL_REQUEST_MANAGEMENT, ...
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
  role        VARCHAR(32) NOT NULL,
  permission  VARCHAR(40) NOT NULL,                   -- SUPER_ADMIN holds '*' wildcard row
  PRIMARY KEY (role, permission),
  FOREIGN KEY (role) REFERENCES admin_roles(role),
  FOREIGN KEY (permission) REFERENCES permissions(permission)
) ENGINE=InnoDB;

CREATE TABLE admin_users (
  id                 VARCHAR(16) PRIMARY KEY,         -- ADM-0001
  name               VARCHAR(120) NOT NULL,
  email              VARCHAR(190) NOT NULL UNIQUE,
  role               VARCHAR(32) NOT NULL,
  password_hash      CHAR(128) NOT NULL,              -- scrypt, 64 bytes hex
  password_salt      CHAR(32) NOT NULL,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_secret  VARCHAR(64) NULL,                -- TOTP seed (encrypted at rest)
  last_login_at      DATETIME(3) NULL,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  deleted_at         DATETIME(3) NULL,
  deleted_by         VARCHAR(16) NULL,
  FOREIGN KEY (role) REFERENCES admin_roles(role)
) ENGINE=InnoDB;

CREATE TABLE admin_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  admin_id   VARCHAR(16) NOT NULL,
  role       VARCHAR(32) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  last_active DATETIME(3) NOT NULL,
  ip         VARCHAR(45),
  FOREIGN KEY (admin_id) REFERENCES admin_users(id)
) ENGINE=InnoDB;

CREATE TABLE login_attempts (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(190) NOT NULL,
  success    BOOLEAN NOT NULL,
  ip         VARCHAR(45),
  user_agent VARCHAR(255),
  at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_attempts_email (email, at)
) ENGINE=InnoDB;

CREATE TABLE account_lockouts (
  email        VARCHAR(190) PRIMARY KEY,
  fails        INT NOT NULL DEFAULT 0,
  locked_until DATETIME(3) NULL
) ENGINE=InnoDB;

-- ================= DEVICE CATALOG (models iVanta buys) =================
CREATE TABLE apple_models (
  id                    VARCHAR(16) PRIMARY KEY,      -- MDL-0001
  category              VARCHAR(30) NOT NULL,         -- iphone|mac|ipad|apple-watch|airpods|accessories
  name                  VARCHAR(120) NOT NULL,
  base_price            DECIMAL(10,2) NOT NULL,       -- max payout anchor for LIKE_NEW base storage
  launch_year           SMALLINT NOT NULL,
  depreciation_per_year DECIMAL(4,3) NOT NULL DEFAULT 0.150,
  demand_factor         DECIMAL(4,3) NOT NULL DEFAULT 1.000,
  imei_required         BOOLEAN NOT NULL DEFAULT TRUE,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at            DATETIME(3) NULL,             -- soft delete only
  deleted_by            VARCHAR(16) NULL,
  created_at            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_models_cat (category, is_active)
) ENGINE=InnoDB;

CREATE TABLE model_storage_variants (
  id       BIGINT AUTO_INCREMENT PRIMARY KEY,
  model_id VARCHAR(16) NOT NULL,
  storage  VARCHAR(20) NOT NULL,                      -- 64GB, 128GB, ...
  premium  DECIMAL(10,2) NOT NULL DEFAULT 0,          -- added to base_price
  FOREIGN KEY (model_id) REFERENCES apple_models(id),
  UNIQUE KEY uq_model_storage (model_id, storage)
) ENGINE=InnoDB;

CREATE TABLE model_colors (
  model_id VARCHAR(16) NOT NULL,
  color    VARCHAR(40) NOT NULL,
  PRIMARY KEY (model_id, color),
  FOREIGN KEY (model_id) REFERENCES apple_models(id)
) ENGINE=InnoDB;

-- ================= SELL REQUESTS (acquisition pipeline) =================
CREATE TABLE sell_requests (
  id               VARCHAR(20) PRIMARY KEY,           -- IVS-2026-000001
  user_id          VARCHAR(16) NOT NULL,
  model_id         VARCHAR(16) NOT NULL,
  category         VARCHAR(30) NOT NULL,
  storage          VARCHAR(20) NULL,
  color            VARCHAR(40) NULL,
  imei             VARCHAR(20) NULL,
  serial           VARCHAR(30) NULL,
  purchase_year    SMALLINT NULL,
  invoice_available BOOLEAN NOT NULL DEFAULT FALSE,
  warranty_active  BOOLEAN NOT NULL DEFAULT FALSE,
  condition_json   JSON NOT NULL,                     -- 14 question answers + batteryHealth
  photos_json      JSON NOT NULL,                     -- 9 photo slots {slot, url, uploadedAt}
  estimated_value  DECIMAL(10,2) NOT NULL,
  estimate_breakdown_json JSON NOT NULL,
  pickup_address_id VARCHAR(16) NULL,
  pickup_slot      VARCHAR(80) NULL,
  payout_json      JSON NULL,                         -- {method, upiId|accountNumber,ifsc,accountHolder}
  status           VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
  inspection_id    VARCHAR(16) NULL,
  offer_id         VARCHAR(16) NULL,
  payment_id       VARCHAR(16) NULL,
  inventory_id     VARCHAR(16) NULL,
  created_at       DATETIME(3) NOT NULL,
  updated_at       DATETIME(3) NOT NULL,
  created_by       VARCHAR(16) NOT NULL,
  updated_by       VARCHAR(16) NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,     -- soft delete only
  deleted_at       DATETIME(3) NULL,
  deleted_by       VARCHAR(16) NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (model_id) REFERENCES apple_models(id),
  INDEX idx_sr_user (user_id, is_active),
  INDEX idx_sr_status (status)
) ENGINE=InnoDB;

-- Append-only: status is NEVER overwritten here; every transition inserts a row.
CREATE TABLE sell_request_status_history (
  id            VARCHAR(16) PRIMARY KEY,              -- HST-xxxx
  sell_request_id VARCHAR(20) NOT NULL,
  status        VARCHAR(30) NOT NULL,
  actor         VARCHAR(120) NOT NULL,                -- person/system that caused it
  actor_role    VARCHAR(32) NULL,
  note          VARCHAR(255) NULL,
  at            DATETIME(3) NOT NULL,
  FOREIGN KEY (sell_request_id) REFERENCES sell_requests(id),
  INDEX idx_srh_req (sell_request_id, at)
) ENGINE=InnoDB;

-- ================= INSPECTION (permanent record) =================
CREATE TABLE inspections (
  id             VARCHAR(16) PRIMARY KEY,             -- INS-0001
  sell_request_id VARCHAR(20) NOT NULL UNIQUE,
  inspector_id   VARCHAR(16) NOT NULL,
  items_json     JSON NOT NULL,                       -- 16 checklist items {id, result P/W/F, notes, photo}
  grade          ENUM('LIKE_NEW','EXCELLENT','GOOD','FAIR','POOR') NULL,
  battery_health TINYINT NULL,
  imei_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  notes          TEXT NULL,
  issues_json    JSON NULL,
  repair_observations TEXT NULL,
  photo_count    SMALLINT NOT NULL DEFAULT 0,
  started_at     DATETIME(3) NULL,
  completed_at   DATETIME(3) NULL,
  status         ENUM('PENDING','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'PENDING',
  created_at     DATETIME(3) NOT NULL,
  FOREIGN KEY (sell_request_id) REFERENCES sell_requests(id),
  FOREIGN KEY (inspector_id) REFERENCES admin_users(id)
) ENGINE=InnoDB;

CREATE TABLE inspection_status_history (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  inspection_id VARCHAR(16) NOT NULL,
  status        ENUM('PENDING','IN_PROGRESS','COMPLETED') NOT NULL,
  actor         VARCHAR(120) NOT NULL,
  at            DATETIME(3) NOT NULL,
  FOREIGN KEY (inspection_id) REFERENCES inspections(id)
) ENGINE=InnoDB;

-- ================= OFFERS =================
CREATE TABLE offers (
  id                   VARCHAR(16) PRIMARY KEY,       -- OFR-10001
  sell_request_id      VARCHAR(20) NOT NULL UNIQUE,
  estimated_value      DECIMAL(10,2) NOT NULL,
  inspection_adjustment DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount               DECIMAL(10,2) NOT NULL,        -- final offer = estimated + adjustment
  status               ENUM('GENERATED','SENT','ACCEPTED','DECLINED','EXPIRED','CHANGED') NOT NULL,
  created_at           DATETIME(3) NOT NULL,
  expires_at           DATETIME(3) NOT NULL,
  accepted_at          DATETIME(3) NULL,
  declined_at          DATETIME(3) NULL,
  FOREIGN KEY (sell_request_id) REFERENCES sell_requests(id)
) ENGINE=InnoDB;

CREATE TABLE offer_history (                          -- append-only: generated/sent/accepted/declined/changed w/ old→new
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  offer_id   VARCHAR(16) NOT NULL,
  action     VARCHAR(30) NOT NULL,
  actor      VARCHAR(120) NOT NULL,
  old_value  VARCHAR(40) NULL,
  new_value  VARCHAR(40) NULL,
  at         DATETIME(3) NOT NULL,
  FOREIGN KEY (offer_id) REFERENCES offers(id)
) ENGINE=InnoDB;

-- ================= PAYMENTS (payouts TO sellers — never deleted) =================
CREATE TABLE payout_accounts (
  id             VARCHAR(16) PRIMARY KEY,
  user_id        VARCHAR(16) NOT NULL,
  method         ENUM('UPI','BANK_TRANSFER') NOT NULL,
  upi_id         VARCHAR(100) NULL,
  account_number VARCHAR(30) NULL,                    -- encrypted at rest in production
  ifsc           VARCHAR(11) NULL,
  account_holder VARCHAR(120) NULL,
  is_default     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE payments (
  id                   VARCHAR(16) PRIMARY KEY,       -- PAY-0001
  sell_request_id      VARCHAR(20) NOT NULL UNIQUE,
  user_id              VARCHAR(16) NOT NULL,
  amount               DECIMAL(10,2) NOT NULL,
  method               ENUM('UPI','BANK_TRANSFER') NOT NULL,
  status               ENUM('PENDING','PROCESSING','SUCCESS','FAILED','REVERSED') NOT NULL DEFAULT 'PENDING',
  transaction_reference VARCHAR(60) NULL,             -- UTR / bank reference
  created_at           DATETIME(3) NOT NULL,
  processed_at         DATETIME(3) NULL,
  FOREIGN KEY (sell_request_id) REFERENCES sell_requests(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_pay_status (status)
) ENGINE=InnoDB;

CREATE TABLE payment_transactions (                   -- append-only gateway/UTR ledger entries
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  payment_id VARCHAR(16) NOT NULL,
  status     ENUM('PENDING','PROCESSING','SUCCESS','FAILED','REVERSED') NOT NULL,
  reference  VARCHAR(60) NULL,
  actor      VARCHAR(120) NOT NULL,
  at         DATETIME(3) NOT NULL,
  FOREIGN KEY (payment_id) REFERENCES payments(id)
) ENGINE=InnoDB;

-- ================= INVENTORY (acquired devices) =================
CREATE TABLE inventory (
  id                 VARCHAR(16) PRIMARY KEY,         -- INV-0001
  sell_request_id    VARCHAR(20) NOT NULL UNIQUE,
  imei               VARCHAR(20) NULL,
  serial             VARCHAR(30) NULL,
  category           VARCHAR(30) NOT NULL,
  model              VARCHAR(120) NOT NULL,
  storage            VARCHAR(20) NULL,
  color              VARCHAR(40) NULL,
  condition_grade    ENUM('LIKE_NEW','EXCELLENT','GOOD','FAIR','POOR') NOT NULL,
  battery_health     TINYINT NULL,
  acquisition_price  DECIMAL(10,2) NOT NULL DEFAULT 0,
  current_valuation  DECIMAL(10,2) NOT NULL,
  warehouse          VARCHAR(80) NULL,
  status             ENUM('RECEIVED','INSPECTION','AVAILABLE','RESERVED','SOLD','RETURNED','DAMAGED','ARCHIVED') NOT NULL DEFAULT 'RECEIVED',
  acquired_date      DATETIME(3) NOT NULL,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,   -- soft delete only
  deleted_at         DATETIME(3) NULL,
  deleted_by         VARCHAR(16) NULL,
  FOREIGN KEY (sell_request_id) REFERENCES sell_requests(id),
  INDEX idx_inv_status (status, is_active)
) ENGINE=InnoDB;

CREATE TABLE inventory_status_history (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  inventory_id VARCHAR(16) NOT NULL,
  status      ENUM('RECEIVED','INSPECTION','AVAILABLE','RESERVED','SOLD','RETURNED','DAMAGED','ARCHIVED') NOT NULL,
  actor       VARCHAR(120) NOT NULL,
  at          DATETIME(3) NOT NULL,
  FOREIGN KEY (inventory_id) REFERENCES inventory(id)
) ENGINE=InnoDB;

-- ================= LOCATION HIERARCHY (India) =================
-- A PIN code maps to multiple post offices and localities; a locality may span PINs —
-- so pincodes↔localities is many-to-many, and pincodes↔cities is many-to-many aware.
CREATE TABLE states (
  id   VARCHAR(16) PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  code CHAR(2) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE districts (
  id       VARCHAR(16) PRIMARY KEY,
  state_id VARCHAR(16) NOT NULL,
  name     VARCHAR(80) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (state_id) REFERENCES states(id),
  UNIQUE KEY uq_district (state_id, name)
) ENGINE=InnoDB;

CREATE TABLE cities (
  id          VARCHAR(16) PRIMARY KEY,
  state_id    VARCHAR(16) NOT NULL,
  district_id VARCHAR(16) NULL,
  name        VARCHAR(80) NOT NULL,
  popular     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (state_id) REFERENCES states(id),
  FOREIGN KEY (district_id) REFERENCES districts(id)
) ENGINE=InnoDB;

CREATE TABLE localities (
  id       VARCHAR(16) PRIMARY KEY,
  city_id  VARCHAR(16) NOT NULL,
  name     VARCHAR(120) NOT NULL,
  popular  BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (city_id) REFERENCES cities(id)
) ENGINE=InnoDB;

CREATE TABLE pincodes (
  id          VARCHAR(16) PRIMARY KEY,
  code        CHAR(6) NOT NULL,
  post_office VARCHAR(120) NOT NULL,
  state_id    VARCHAR(16) NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uq_pin_po (code, post_office),
  FOREIGN KEY (state_id) REFERENCES states(id),
  INDEX idx_pin_code (code)
) ENGINE=InnoDB;

CREATE TABLE pincode_cities (                          -- many-to-many
  pincode_id VARCHAR(16) NOT NULL,
  city_id    VARCHAR(16) NOT NULL,
  PRIMARY KEY (pincode_id, city_id),
  FOREIGN KEY (pincode_id) REFERENCES pincodes(id),
  FOREIGN KEY (city_id) REFERENCES cities(id)
) ENGINE=InnoDB;

CREATE TABLE pincode_localities (                      -- many-to-many
  pincode_id  VARCHAR(16) NOT NULL,
  locality_id VARCHAR(16) NOT NULL,
  PRIMARY KEY (pincode_id, locality_id),
  FOREIGN KEY (pincode_id) REFERENCES pincodes(id),
  FOREIGN KEY (locality_id) REFERENCES localities(id)
) ENGINE=InnoDB;

CREATE TABLE roads (
  id          VARCHAR(16) PRIMARY KEY,
  locality_id VARCHAR(16) NOT NULL,
  name        VARCHAR(120) NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (locality_id) REFERENCES localities(id)
) ENGINE=InnoDB;

CREATE TABLE serviceability_zones (
  id           VARCHAR(16) PRIMARY KEY,
  name         VARCHAR(80) NOT NULL,
  serviceable  BOOLEAN NOT NULL DEFAULT TRUE,
  eta_hours    SMALLINT NOT NULL DEFAULT 24,
  pickup_fee   DECIMAL(8,2) NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  planned_date DATE NULL                               -- for planned-but-not-serviceable zones
) ENGINE=InnoDB;

CREATE TABLE zone_cities (
  zone_id VARCHAR(16) NOT NULL,
  city_id VARCHAR(16) NOT NULL,
  PRIMARY KEY (zone_id, city_id),
  FOREIGN KEY (zone_id) REFERENCES serviceability_zones(id),
  FOREIGN KEY (city_id) REFERENCES cities(id)
) ENGINE=InnoDB;

CREATE TABLE zone_pin_prefixes (                       -- e.g. '302' covers all Jaipur PINs 302xxx
  zone_id    VARCHAR(16) NOT NULL,
  pin_prefix CHAR(3) NOT NULL,
  PRIMARY KEY (zone_id, pin_prefix),
  FOREIGN KEY (zone_id) REFERENCES serviceability_zones(id)
) ENGINE=InnoDB;

-- ================= NOTIFICATIONS =================
CREATE TABLE notifications (
  id       VARCHAR(16) PRIMARY KEY,
  user_id  VARCHAR(16) NOT NULL,
  type     VARCHAR(30) NOT NULL,
  title    VARCHAR(160) NOT NULL,
  body     VARCHAR(500) NOT NULL,
  channels JSON NOT NULL,                              -- ["push","email","sms","whatsapp"]
  `read`   BOOLEAN NOT NULL DEFAULT FALSE,
  at       DATETIME(3) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_notif_user (user_id, `read`)
) ENGINE=InnoDB;

-- ================= AUDIT LOG (append-only, never updated/deleted) =================
CREATE TABLE audit_logs (
  id         VARCHAR(16) PRIMARY KEY,
  actor      VARCHAR(120) NOT NULL,
  actor_role VARCHAR(32) NOT NULL,
  action     VARCHAR(40) NOT NULL,
  entity     VARCHAR(40) NOT NULL,
  entity_id  VARCHAR(20) NOT NULL,
  old_value  TEXT NULL,
  new_value  TEXT NULL,
  ip         VARCHAR(45) NULL,
  at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_audit_entity (entity, entity_id),
  INDEX idx_audit_at (at)
) ENGINE=InnoDB;

-- ================= SETTINGS =================
CREATE TABLE settings (
  `key`   VARCHAR(60) PRIMARY KEY,
  value   JSON NOT NULL,                               -- valuation multipliers, offerValidityDays, supportedCategories
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  updated_by VARCHAR(16) NULL
) ENGINE=InnoDB;

-- ================= MEDIA (photo uploads) =================
CREATE TABLE media (
  id            VARCHAR(16) PRIMARY KEY,
  entity_type   ENUM('sell_request','inspection','inventory') NOT NULL,
  entity_id     VARCHAR(20) NOT NULL,
  slot          VARCHAR(40) NULL,                      -- front, back, screen-on, imei ...
  url           VARCHAR(500) NOT NULL,                 -- S3/Cloudinary key
  mime          VARCHAR(40) NOT NULL,
  size_bytes    INT NOT NULL,
  uploaded_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_media_entity (entity_type, entity_id)
) ENGINE=InnoDB;
