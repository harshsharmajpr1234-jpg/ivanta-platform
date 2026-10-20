-- =============================================================
-- V3: Product catalog (§7 PRODUCT CATALOG, §8, §9, §10)
-- iVanta SELLS Apple products: categories -> products -> variants.
-- =============================================================

CREATE TABLE categories (
  id          VARCHAR(16) PRIMARY KEY,
  parent_id   VARCHAR(16) NULL,               -- hierarchy: Apple > iPhone > (models are products)
  name        VARCHAR(80) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(300) NULL,
  image_key   VARCHAR(255) NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_cat_parent (parent_id),
  CONSTRAINT fk_cat_parent FOREIGN KEY (parent_id) REFERENCES categories(id)
) ENGINE=InnoDB;

CREATE TABLE brands (
  id         VARCHAR(16) PRIMARY KEY,
  name       VARCHAR(80) NOT NULL UNIQUE,
  slug       VARCHAR(100) NOT NULL UNIQUE,
  logo_key   VARCHAR(255) NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE products (
  id                VARCHAR(16) PRIMARY KEY,
  sku               VARCHAR(40) NOT NULL UNIQUE,
  name              VARCHAR(160) NOT NULL,
  slug              VARCHAR(180) NOT NULL UNIQUE,
  brand_id          VARCHAR(16) NOT NULL,
  category_id       VARCHAR(16) NOT NULL,
  model             VARCHAR(120) NULL,
  short_description VARCHAR(400) NULL,
  description       TEXT NULL,
  price             DECIMAL(10,2) NOT NULL,           -- current selling price (server-side truth)
  mrp               DECIMAL(10,2) NOT NULL,           -- list price for discount display
  tax_rate          DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
  stock_status      VARCHAR(16) NOT NULL DEFAULT 'OUT_OF_STOCK',  -- cached rollup: IN_STOCK|LOW_STOCK|OUT_OF_STOCK|DISCONTINUED
  release_year      SMALLINT NULL,
  warranty_months   SMALLINT NOT NULL DEFAULT 12,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  featured          BOOLEAN NOT NULL DEFAULT FALSE,
  rating_avg        DECIMAL(3,2) NOT NULL DEFAULT 0,  -- cached from approved reviews
  rating_count      INT NOT NULL DEFAULT 0,
  views_count       INT NOT NULL DEFAULT 0,
  created_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at        DATETIME(3) NULL,                  -- archive/soft delete only (§38/§44)
  deleted_by        VARCHAR(16) NULL,
  version           INT NOT NULL DEFAULT 0,            -- optimistic locking
  INDEX idx_prod_cat (category_id, is_active),
  INDEX idx_prod_brand (brand_id),
  INDEX idx_prod_slug (slug),
  INDEX idx_prod_featured (featured, is_active),
  INDEX idx_prod_price (price),
  CONSTRAINT fk_prod_brand FOREIGN KEY (brand_id) REFERENCES brands(id),
  CONSTRAINT fk_prod_cat FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

CREATE TABLE product_colors (
  id         VARCHAR(16) PRIMARY KEY,
  product_id VARCHAR(16) NOT NULL,
  name       VARCHAR(40) NOT NULL,
  hex        CHAR(7) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uq_color (product_id, name),
  CONSTRAINT fk_color_prod FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE product_storage_options (
  id         VARCHAR(16) PRIMARY KEY,
  product_id VARCHAR(16) NOT NULL,
  storage    VARCHAR(20) NOT NULL,            -- 128GB / 256GB / 16GB(RAM) ...
  sort_order INT NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uq_storage (product_id, storage),
  CONSTRAINT fk_storage_prod FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE product_variants (
  id              VARCHAR(16) PRIMARY KEY,
  product_id      VARCHAR(16) NOT NULL,
  sku             VARCHAR(40) NOT NULL UNIQUE,
  name            VARCHAR(160) NOT NULL,      -- "256GB · Natural Titanium"
  storage         VARCHAR(20) NULL,
  color           VARCHAR(40) NULL,
  connectivity    VARCHAR(40) NULL,           -- Wi-Fi / Wi-Fi + Cellular / GPS + Cellular
  size            VARCHAR(20) NULL,           -- 41mm / 13" / 14"
  model_number    VARCHAR(40) NULL,
  price           DECIMAL(10,2) NOT NULL,
  mrp             DECIMAL(10,2) NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  version         INT NOT NULL DEFAULT 0,
  INDEX idx_var_product (product_id, is_active),
  INDEX idx_var_sku (sku),
  CONSTRAINT fk_var_prod FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE product_images (
  id          VARCHAR(16) PRIMARY KEY,
  product_id  VARCHAR(16) NOT NULL,
  variant_id  VARCHAR(16) NULL,               -- variant-specific imagery (§10)
  storage_key VARCHAR(255) NOT NULL,          -- provider-agnostic key (local/S3/Cloudinary)
  alt         VARCHAR(200) NULL,
  is_main     BOOLEAN NOT NULL DEFAULT FALSE,
  is_thumbnail BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  INDEX idx_img_product (product_id, sort_order),
  CONSTRAINT fk_img_prod FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_img_var FOREIGN KEY (variant_id) REFERENCES product_variants(id)
) ENGINE=InnoDB;

CREATE TABLE product_specifications (
  id         VARCHAR(16) PRIMARY KEY,
  product_id VARCHAR(16) NOT NULL,
  spec_key   VARCHAR(80) NOT NULL,
  spec_value VARCHAR(400) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  INDEX idx_spec_prod (product_id),
  CONSTRAINT fk_spec_prod FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- Price history: current price lives on products/variants; every change inserts a
-- superseding row here. Rows are never modified or deleted (§44).
CREATE TABLE product_prices (
  id             VARCHAR(16) PRIMARY KEY,
  product_id     VARCHAR(16) NOT NULL,
  variant_id     VARCHAR(16) NULL,
  price          DECIMAL(10,2) NOT NULL,
  mrp            DECIMAL(10,2) NOT NULL,
  effective_from DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  effective_to   DATETIME(3) NULL,
  created_by     VARCHAR(16) NULL,
  INDEX idx_price_prod (product_id, effective_to),
  CONSTRAINT fk_price_prod FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;
