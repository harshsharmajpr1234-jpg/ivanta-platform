-- =============================================================
-- V12: India location system (§18, §19, §21)
-- Country > State > District > City > Locality hierarchy.
-- PIN codes and post offices are SEPARATE entities linked many-to-many:
-- a PIN is NOT a strict child of one locality (§18).
-- =============================================================

CREATE TABLE states (
  id         VARCHAR(16) PRIMARY KEY,
  country_id VARCHAR(16) NOT NULL DEFAULT 'CTY-IN',
  name       VARCHAR(80) NOT NULL,
  code       CHAR(2) NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uq_state (country_id, name),
  CONSTRAINT fk_state_country FOREIGN KEY (country_id) REFERENCES countries(id)
) ENGINE=InnoDB;

CREATE TABLE districts (
  id        VARCHAR(16) PRIMARY KEY,
  state_id  VARCHAR(16) NOT NULL,
  name      VARCHAR(80) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uq_district (state_id, name),
  INDEX idx_district_name (name),
  CONSTRAINT fk_district_state FOREIGN KEY (state_id) REFERENCES states(id)
) ENGINE=InnoDB;

CREATE TABLE cities (
  id          VARCHAR(16) PRIMARY KEY,
  state_id    VARCHAR(16) NOT NULL,
  district_id VARCHAR(16) NULL,
  name        VARCHAR(80) NOT NULL,
  popular     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  INDEX idx_city_name (name),
  INDEX idx_city_state (state_id),
  CONSTRAINT fk_city_state FOREIGN KEY (state_id) REFERENCES states(id),
  CONSTRAINT fk_city_district FOREIGN KEY (district_id) REFERENCES districts(id)
) ENGINE=InnoDB;

CREATE TABLE localities (
  id        VARCHAR(16) PRIMARY KEY,
  city_id   VARCHAR(16) NOT NULL,
  name      VARCHAR(120) NOT NULL,
  popular   BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  INDEX idx_locality_name (name),
  INDEX idx_locality_city (city_id),
  CONSTRAINT fk_locality_city FOREIGN KEY (city_id) REFERENCES cities(id)
) ENGINE=InnoDB;

CREATE TABLE pincodes (
  id        VARCHAR(16) PRIMARY KEY,
  code      CHAR(6) NOT NULL UNIQUE,
  state_id  VARCHAR(16) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  INDEX idx_pincode_code (code),
  CONSTRAINT fk_pin_state FOREIGN KEY (state_id) REFERENCES states(id)
) ENGINE=InnoDB;

CREATE TABLE post_offices (
  id         VARCHAR(16) PRIMARY KEY,
  pincode_id VARCHAR(16) NOT NULL,
  name       VARCHAR(120) NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  INDEX idx_po_name (name),
  CONSTRAINT fk_po_pin FOREIGN KEY (pincode_id) REFERENCES pincodes(id)
) ENGINE=InnoDB;

CREATE TABLE pincode_cities (
  pincode_id VARCHAR(16) NOT NULL,
  city_id    VARCHAR(16) NOT NULL,
  PRIMARY KEY (pincode_id, city_id),
  CONSTRAINT fk_pc_pin FOREIGN KEY (pincode_id) REFERENCES pincodes(id),
  CONSTRAINT fk_pc_city FOREIGN KEY (city_id) REFERENCES cities(id)
) ENGINE=InnoDB;

CREATE TABLE pincode_localities (
  pincode_id  VARCHAR(16) NOT NULL,
  locality_id VARCHAR(16) NOT NULL,
  PRIMARY KEY (pincode_id, locality_id),
  CONSTRAINT fk_pl_pin FOREIGN KEY (pincode_id) REFERENCES pincodes(id),
  CONSTRAINT fk_pl_loc FOREIGN KEY (locality_id) REFERENCES localities(id)
) ENGINE=InnoDB;

CREATE TABLE roads (
  id          VARCHAR(16) PRIMARY KEY,
  locality_id VARCHAR(16) NOT NULL,
  name        VARCHAR(120) NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  INDEX idx_road_name (name),
  CONSTRAINT fk_road_locality FOREIGN KEY (locality_id) REFERENCES localities(id)
) ENGINE=InnoDB;

-- Delivery serviceability zones: PIN-prefix based, with fees and ETAs (§21)
CREATE TABLE serviceability_zones (
  id             VARCHAR(16) PRIMARY KEY,
  name           VARCHAR(80) NOT NULL,
  serviceable    BOOLEAN NOT NULL DEFAULT TRUE,
  delivery_fee   DECIMAL(8,2) NOT NULL DEFAULT 0,
  eta_min_days   SMALLINT NOT NULL DEFAULT 2,
  eta_max_days   SMALLINT NOT NULL DEFAULT 5,
  planned_date   DATE NULL,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE zone_cities (
  zone_id VARCHAR(16) NOT NULL,
  city_id VARCHAR(16) NOT NULL,
  PRIMARY KEY (zone_id, city_id),
  CONSTRAINT fk_zc_zone FOREIGN KEY (zone_id) REFERENCES serviceability_zones(id),
  CONSTRAINT fk_zc_city FOREIGN KEY (city_id) REFERENCES cities(id)
) ENGINE=InnoDB;

CREATE TABLE zone_pin_prefixes (
  zone_id    VARCHAR(16) NOT NULL,
  pin_prefix VARCHAR(6) NOT NULL,
  PRIMARY KEY (zone_id, pin_prefix),
  CONSTRAINT fk_zpp_zone FOREIGN KEY (zone_id) REFERENCES serviceability_zones(id)
) ENGINE=InnoDB;
