-- =============================================================
-- V8: Delivery (§7 DELIVERY, §29)
-- Shipping methods, per-order address snapshots, shipments with
-- tracking events. Carrier integrations plug in behind services.
-- =============================================================

CREATE TABLE shipping_methods (
  id            VARCHAR(16) PRIMARY KEY,
  name          VARCHAR(80) NOT NULL,          -- Standard / Express / Same-day
  carrier       VARCHAR(80) NULL,
  base_fee      DECIMAL(8,2) NOT NULL DEFAULT 0,
  free_above    DECIMAL(10,2) NULL,            -- free when order subtotal >= this
  eta_min_days  SMALLINT NOT NULL DEFAULT 2,
  eta_max_days  SMALLINT NOT NULL DEFAULT 5,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- Immutable delivery address snapshot per order (§7 delivery_addresses)
CREATE TABLE delivery_addresses (
  id             VARCHAR(16) PRIMARY KEY,
  order_id       VARCHAR(20) NOT NULL UNIQUE,
  name           VARCHAR(120) NOT NULL,
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
  landmark       VARCHAR(200) NULL,
  address_type   VARCHAR(10) NOT NULL DEFAULT 'HOME',
  latitude       DECIMAL(10,7) NULL,
  longitude      DECIMAL(10,7) NULL,
  INDEX idx_daddr_pin (pincode),
  CONSTRAINT fk_daddr_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

CREATE TABLE shipments (
  id                 VARCHAR(20) PRIMARY KEY,   -- SHP-NNNNN
  order_id           VARCHAR(20) NOT NULL,
  shipping_method_id VARCHAR(16) NOT NULL,
  address_id         VARCHAR(16) NOT NULL,
  carrier            VARCHAR(80) NULL,
  tracking_number    VARCHAR(60) NULL UNIQUE,
  status             VARCHAR(24) NOT NULL DEFAULT 'LABEL_CREATED',
  -- LABEL_CREATED|PICKED_UP|IN_TRANSIT|OUT_FOR_DELIVERY|DELIVERED|FAILED|RETURN_TO_ORIGIN
  estimated_delivery DATE NULL,
  shipped_at         DATETIME(3) NULL,
  delivered_at       DATETIME(3) NULL,
  created_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_ship_order (order_id),
  INDEX idx_ship_track (tracking_number),
  CONSTRAINT fk_ship_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_ship_method FOREIGN KEY (shipping_method_id) REFERENCES shipping_methods(id),
  CONSTRAINT fk_ship_addr FOREIGN KEY (address_id) REFERENCES delivery_addresses(id)
) ENGINE=InnoDB;

CREATE TABLE shipment_tracking_events (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  shipment_id VARCHAR(20) NOT NULL,
  status      VARCHAR(24) NOT NULL,
  description VARCHAR(300) NULL,
  location    VARCHAR(120) NULL,
  event_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_ste_ship (shipment_id, event_at),
  CONSTRAINT fk_ste_ship FOREIGN KEY (shipment_id) REFERENCES shipments(id)
) ENGINE=InnoDB;

ALTER TABLE orders ADD CONSTRAINT fk_ord_ship_method FOREIGN KEY (shipping_method_id) REFERENCES shipping_methods(id);
ALTER TABLE orders ADD CONSTRAINT fk_ord_daddr FOREIGN KEY (shipping_address_id) REFERENCES delivery_addresses(id);

