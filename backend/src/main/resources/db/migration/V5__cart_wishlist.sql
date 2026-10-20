-- =============================================================
-- V5: Cart & wishlist (§7, §13, §15)
-- One active cart per user. Prices in cart_items are SNAPSHOTS for
-- display; totals are ALWAYS recomputed server-side from the catalog.
-- =============================================================

CREATE TABLE carts (
  id         VARCHAR(16) PRIMARY KEY,
  user_id    VARCHAR(16) NOT NULL UNIQUE,
  status     VARCHAR(12) NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE|COMPLETED|ABANDONED
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE cart_items (
  id             VARCHAR(16) PRIMARY KEY,
  cart_id        VARCHAR(16) NOT NULL,
  product_id     VARCHAR(16) NOT NULL,
  variant_id     VARCHAR(16) NULL,
  quantity       INT NOT NULL DEFAULT 1,
  unit_price     DECIMAL(10,2) NOT NULL,    -- snapshot at add-time (display only)
  mrp            DECIMAL(10,2) NOT NULL,
  added_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_cart_item (cart_id, variant_id, product_id),
  INDEX idx_citem_cart (cart_id),
  CONSTRAINT fk_citem_cart FOREIGN KEY (cart_id) REFERENCES carts(id),
  CONSTRAINT fk_citem_prod FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE wishlists (
  id         VARCHAR(16) PRIMARY KEY,
  user_id    VARCHAR(16) NOT NULL UNIQUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_wl_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE wishlist_items (
  id          VARCHAR(16) PRIMARY KEY,
  wishlist_id VARCHAR(16) NOT NULL,
  product_id  VARCHAR(16) NOT NULL,
  added_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_wl_item (wishlist_id, product_id),
  CONSTRAINT fk_wli_wl FOREIGN KEY (wishlist_id) REFERENCES wishlists(id),
  CONSTRAINT fk_wli_prod FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;
