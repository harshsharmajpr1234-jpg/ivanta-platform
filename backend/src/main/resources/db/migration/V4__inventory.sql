-- =============================================================
-- V4: Inventory (§7 INVENTORY, §14, §27, §28)
-- Stock belongs to iVanta, warehouse-aware, with reservations
-- that expire automatically to prevent overselling.
-- =============================================================

CREATE TABLE warehouses (
  id         VARCHAR(16) PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  code       VARCHAR(16) NOT NULL UNIQUE,
  city       VARCHAR(80) NULL,
  state      VARCHAR(80) NULL,
  address    VARCHAR(300) NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

CREATE TABLE inventory_locations (
  id           VARCHAR(16) PRIMARY KEY,
  warehouse_id VARCHAR(16) NOT NULL,
  aisle        VARCHAR(20) NULL,
  rack         VARCHAR(20) NULL,
  shelf        VARCHAR(20) NULL,
  label        VARCHAR(80) NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  INDEX idx_invloc_wh (warehouse_id),
  CONSTRAINT fk_invloc_wh FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
) ENGINE=InnoDB;

CREATE TABLE inventory (
  id                  VARCHAR(16) PRIMARY KEY,
  product_id          VARCHAR(16) NOT NULL,
  variant_id          VARCHAR(16) NULL,
  warehouse_id        VARCHAR(16) NOT NULL,
  inventory_location_id VARCHAR(16) NULL,
  sku                 VARCHAR(40) NOT NULL,
  quantity            INT NOT NULL DEFAULT 0,
  reserved_quantity   INT NOT NULL DEFAULT 0,
  available_quantity  INT AS (quantity - reserved_quantity),
  reorder_level       INT NOT NULL DEFAULT 5,
  status              VARCHAR(16) NOT NULL DEFAULT 'OUT_OF_STOCK',  -- IN_STOCK|LOW_STOCK|OUT_OF_STOCK|DISCONTINUED
  created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  version             INT NOT NULL DEFAULT 0,               -- optimistic locking against oversell
  UNIQUE KEY uq_inv_variant_wh (variant_id, warehouse_id),
  INDEX idx_inv_product (product_id),
  INDEX idx_inv_status (status),
  INDEX idx_inv_sku (sku),
  CONSTRAINT fk_inv_prod FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_inv_var FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  CONSTRAINT fk_inv_wh FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  CONSTRAINT fk_inv_loc FOREIGN KEY (inventory_location_id) REFERENCES inventory_locations(id)
) ENGINE=InnoDB;

-- Append-only movement ledger (§27)
CREATE TABLE inventory_movements (
  id              VARCHAR(16) PRIMARY KEY,
  inventory_id    VARCHAR(16) NOT NULL,
  product_id      VARCHAR(16) NOT NULL,
  variant_id      VARCHAR(16) NULL,
  movement_type   VARCHAR(16) NOT NULL,   -- PURCHASE|RESTOCK|SALE|RESERVATION|RELEASE|RETURN|ADJUSTMENT|TRANSFER
  quantity_change INT NOT NULL,           -- signed
  quantity_after  INT NOT NULL,
  reference_type  VARCHAR(30) NULL,       -- order | return | manual
  reference_id    VARCHAR(20) NULL,
  note            VARCHAR(255) NULL,
  created_by      VARCHAR(16) NULL,
  created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_mov_inv (inventory_id, created_at),
  INDEX idx_mov_ref (reference_type, reference_id),
  CONSTRAINT fk_mov_inv FOREIGN KEY (inventory_id) REFERENCES inventory(id)
) ENGINE=InnoDB;

-- Temporary holds created at checkout; released/consumed by payment outcome (§14).
-- FK to orders is attached in V6 (forward reference).
CREATE TABLE stock_reservations (
  id           VARCHAR(16) PRIMARY KEY,
  order_id     VARCHAR(20) NULL,
  inventory_id VARCHAR(16) NOT NULL,
  variant_id   VARCHAR(16) NULL,
  quantity     INT NOT NULL,
  status       VARCHAR(12) NOT NULL DEFAULT 'RESERVED',  -- RESERVED|CONSUMED|RELEASED|EXPIRED
  expires_at   DATETIME(3) NOT NULL,
  created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  resolved_at  DATETIME(3) NULL,
  INDEX idx_res_status_exp (status, expires_at),
  INDEX idx_res_order (order_id),
  CONSTRAINT fk_res_inv FOREIGN KEY (inventory_id) REFERENCES inventory(id)
) ENGINE=InnoDB;
