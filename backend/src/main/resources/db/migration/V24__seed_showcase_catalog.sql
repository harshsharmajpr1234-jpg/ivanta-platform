-- =============================================================
-- V24: SEED SHOWCASE CATALOG FOR CLIENT DEMO & RETAIL STORE
-- Populates Apple Brand, Categories, Products, Variants, Colors,
-- Storage, Specs, and Inventory so the storefront is 100% functional.
-- =============================================================

-- 1. BRAND
INSERT INTO brands (id, name, slug, logo_key, is_active)
VALUES ('BRD-0001', 'Apple', 'apple', NULL, TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. CATEGORIES
INSERT INTO categories (id, parent_id, name, slug, description, image_key, sort_order, is_active)
VALUES 
  ('CAT-ROOT', NULL, 'Apple', 'apple', 'All Certified Pre-Owned Apple Products', NULL, 0, TRUE),
  ('CAT-0001', 'CAT-ROOT', 'iPhone', 'iphone', 'Certified pre-owned iPhones with 32-point QC and 1-month warranty', NULL, 1, TRUE),
  ('CAT-0002', 'CAT-ROOT', 'Mac', 'mac', 'MacBook Pro, MacBook Air and Mac mini powered by Apple Silicon', NULL, 2, TRUE),
  ('CAT-0003', 'CAT-ROOT', 'iPad', 'ipad', 'iPad Pro, iPad Air and iPad standard with Retina displays', NULL, 3, TRUE),
  ('CAT-0004', 'CAT-ROOT', 'Watch', 'watch', 'Apple Watch Ultra, Series 9 and SE for fitness and health', NULL, 4, TRUE),
  ('CAT-0005', 'CAT-ROOT', 'AirPods', 'airpods', 'AirPods Pro, AirPods Max and AirPods with Spatial Audio', NULL, 5, TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description);

-- 3. PRODUCTS
INSERT INTO products (
  id, sku, name, slug, brand_id, category_id, model, short_description, description,
  price, mrp, tax_rate, stock_status, release_year, warranty_months, is_active, featured,
  rating_avg, rating_count, views_count
) VALUES
  ('PRD-0001', 'IPHONE-15-PRO-MAX', 'iPhone 15 Pro Max (Certified Pre-Owned)', 'iphone-15-pro-max-pre-owned',
   'BRD-0001', 'CAT-0001', 'A3106',
   'Aerospace-grade titanium design with A17 Pro chip, 48MP camera system, Action button and USB-C.',
   'Full 32-point inspection verified. Battery health 90%+. Includes original charging cable and 1-month replacement warranty with GST invoice.',
   104999.00, 159900.00, 0.1800, 'IN_STOCK', 2023, 12, TRUE, TRUE, 4.90, 142, 1250),

  ('PRD-0002', 'IPHONE-15-BASE', 'iPhone 15 (Certified Pre-Owned)', 'iphone-15-pre-owned',
   'BRD-0001', 'CAT-0001', 'A3090',
   'Dynamic Island, 48MP main camera with 2x Telephoto, durable color-infused glass and USB-C.',
   'Inspected and sanitized by technicians. 100% genuine parts, screen and sensors tested. Open Box Delivery supported.',
   54999.00, 79900.00, 0.1800, 'IN_STOCK', 2023, 12, TRUE, TRUE, 4.85, 89, 980),

  ('PRD-0003', 'IPHONE-14-BASE', 'iPhone 14 (Certified Pre-Owned)', 'iphone-14-pre-owned',
   'BRD-0001', 'CAT-0001', 'A2882',
   'Super Retina XDR display, dual-camera system with Photonic Engine, Crash Detection and all-day battery.',
   'Top-selling pre-owned value. Clean condition, zero functional issues, covered by Flyphones 6-month limited warranty.',
   42999.00, 69900.00, 0.1800, 'IN_STOCK', 2022, 12, TRUE, TRUE, 4.80, 215, 2100),

  ('PRD-0004', 'MBP-14-M3', 'MacBook Pro 14" M3 Chip (Certified Pre-Owned)', 'macbook-pro-14-m3-pre-owned',
   'BRD-0001', 'CAT-0002', 'MRX33HN/A',
   'Liquid Retina XDR display, M3 8-core CPU, 10-core GPU, up to 22 hours of battery life and HDMI/SD ports.',
   'Pristine condition enterprise lease return. Battery cycles < 50. Pre-installed with clean macOS Sonoma.',
   129999.00, 169900.00, 0.1800, 'IN_STOCK', 2023, 12, TRUE, TRUE, 4.95, 64, 820),

  ('PRD-0005', 'MBA-13-M2', 'MacBook Air 13" M2 Chip (Certified Pre-Owned)', 'macbook-air-13-m2-pre-owned',
   'BRD-0001', 'CAT-0002', 'MLY33HN/A',
   'Incredibly thin aluminum unibody, 13.6-inch Liquid Retina display, MagSafe 3 charging and silent fanless design.',
   'Lightweight, battery health tested at 92%+, original Apple charger included. Ideal for professionals and students.',
   69999.00, 99900.00, 0.1800, 'IN_STOCK', 2022, 12, TRUE, TRUE, 4.90, 178, 1650),

  ('PRD-0006', 'IPAD-AIR-11-M2', 'iPad Air 11" M2 Chip (Certified Pre-Owned)', 'ipad-air-11-m2-pre-owned',
   'BRD-0001', 'CAT-0003', 'MU9D3HN/A',
   'Liquid Retina display with True Tone, M2 chip, Landscape 12MP Ultra Wide front camera and Apple Pencil Pro support.',
   'Like new condition with immaculate screen. Tested for touch sensitivity, speaker clarity, and biometric authentication.',
   46999.00, 59900.00, 0.1800, 'IN_STOCK', 2024, 12, TRUE, TRUE, 4.82, 53, 640),

  ('PRD-0007', 'WATCH-ULTRA-2', 'Apple Watch Ultra 2 GPS + Cellular 49mm (Certified Pre-Owned)', 'apple-watch-ultra-2-pre-owned',
   'BRD-0001', 'CAT-0004', 'A2986',
   'Rugged 49mm titanium case, 3000 nits display, dual-frequency GPS, Action button, and 36-hour battery life.',
   'Extreme adventure smartwatch. Water resistance and sensor array recalibrated. Complete with magnetic charger.',
   64999.00, 89900.00, 0.1800, 'IN_STOCK', 2023, 12, TRUE, TRUE, 4.92, 41, 510),

  ('PRD-0008', 'WATCH-SERIES-9', 'Apple Watch Series 9 GPS 45mm (Certified Pre-Owned)', 'apple-watch-series-9-pre-owned',
   'BRD-0001', 'CAT-0004', 'MR993HN/A',
   'S9 SiP chip with Double Tap gesture, brighter 2000-nit display, on-device Siri, and advanced ECG / blood oxygen sensors.',
   'Flawless sapphire glass, battery condition checked, packaged in premium Flyphones box with certified charger.',
   29999.00, 44900.00, 0.1800, 'IN_STOCK', 2023, 12, TRUE, TRUE, 4.88, 97, 1100),

  ('PRD-0009', 'AIRPODS-PRO-2-USBC', 'AirPods Pro 2nd Gen with MagSafe USB-C (Certified Pre-Owned)', 'airpods-pro-2-usbc-pre-owned',
   'BRD-0001', 'CAT-0005', 'MTJV3HN/A',
   'Up to 2x more Active Noise Cancellation, Transparency mode, Adaptive Audio, and USB-C MagSafe Case with speaker.',
   'Deep ultrasonic cleaning and sterilization. New ear tips installed. Sound profile and microphones 100% matched.',
   16999.00, 24900.00, 0.1800, 'IN_STOCK', 2023, 12, TRUE, TRUE, 4.91, 310, 3400)
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), mrp=VALUES(mrp);

-- 4. PRODUCT VARIANTS
INSERT INTO product_variants (id, product_id, sku, name, storage, color, connectivity, size, price, mrp, is_active)
VALUES
  ('VAR-0001', 'PRD-0001', 'IP15PM-256-NAT', '256GB · Natural Titanium', '256GB', 'Natural Titanium', '5G', '6.7"', 104999.00, 159900.00, TRUE),
  ('VAR-0002', 'PRD-0001', 'IP15PM-512-BLK', '512GB · Black Titanium', '512GB', 'Black Titanium', '5G', '6.7"', 119999.00, 179900.00, TRUE),
  ('VAR-0003', 'PRD-0002', 'IP15-128-BLU', '128GB · Blue', '128GB', 'Blue', '5G', '6.1"', 54999.00, 79900.00, TRUE),
  ('VAR-0004', 'PRD-0002', 'IP15-256-BLK', '256GB · Black', '256GB', 'Black', '5G', '6.1"', 62999.00, 89900.00, TRUE),
  ('VAR-0005', 'PRD-0003', 'IP14-128-MID', '128GB · Midnight', '128GB', 'Midnight', '5G', '6.1"', 42999.00, 69900.00, TRUE),
  ('VAR-0006', 'PRD-0004', 'MBP14-M3-512-GRY', '512GB SSD · 8GB RAM · Space Grey', '512GB', 'Space Grey', 'Wi-Fi 6E', '14.2"', 129999.00, 169900.00, TRUE),
  ('VAR-0007', 'PRD-0005', 'MBA13-M2-256-MID', '256GB SSD · 8GB RAM · Midnight', '256GB', 'Midnight', 'Wi-Fi 6', '13.6"', 69999.00, 99900.00, TRUE),
  ('VAR-0008', 'PRD-0006', 'IPADAIR-128-WIFI-GRY', '128GB · Wi-Fi · Space Grey', '128GB', 'Space Grey', 'Wi-Fi 6E', '11"', 46999.00, 59900.00, TRUE),
  ('VAR-0009', 'PRD-0007', 'AWU2-49-ORG', '49mm · Titanium · Orange Ocean Band', '64GB', 'Titanium', 'GPS + Cellular', '49mm', 64999.00, 89900.00, TRUE),
  ('VAR-0010', 'PRD-0008', 'AWS9-45-MID', '45mm · Midnight Aluminium · Sport Band', '64GB', 'Midnight', 'GPS', '45mm', 29999.00, 44900.00, TRUE),
  ('VAR-0011', 'PRD-0009', 'APP2-USBC-WHT', 'USB-C Charging Case · White', NULL, 'White', 'Bluetooth 5.3', 'In-Ear', 16999.00, 24900.00, TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price);

-- 5. COLORS
INSERT INTO product_colors (id, product_id, name, hex, sort_order, is_active)
VALUES
  ('CLR-0001', 'PRD-0001', 'Natural Titanium', '#9c958d', 1, TRUE),
  ('CLR-0002', 'PRD-0001', 'Black Titanium', '#2f2f31', 2, TRUE),
  ('CLR-0003', 'PRD-0002', 'Blue', '#88a3b8', 1, TRUE),
  ('CLR-0004', 'PRD-0002', 'Black', '#252627', 2, TRUE),
  ('CLR-0005', 'PRD-0003', 'Midnight', '#1e242c', 1, TRUE),
  ('CLR-0006', 'PRD-0004', 'Space Grey', '#535458', 1, TRUE),
  ('CLR-0007', 'PRD-0005', 'Midnight', '#1e242c', 1, TRUE),
  ('CLR-0008', 'PRD-0006', 'Space Grey', '#535458', 1, TRUE),
  ('CLR-0009', 'PRD-0007', 'Titanium', '#d3cdc6', 1, TRUE),
  ('CLR-0010', 'PRD-0008', 'Midnight', '#1e242c', 1, TRUE),
  ('CLR-0011', 'PRD-0009', 'White', '#ffffff', 1, TRUE)
ON DUPLICATE KEY UPDATE hex=VALUES(hex);

-- 6. STORAGE OPTIONS
INSERT INTO product_storage_options (id, product_id, storage, sort_order, is_active)
VALUES
  ('STR-0001', 'PRD-0001', '256GB', 1, TRUE),
  ('STR-0002', 'PRD-0001', '512GB', 2, TRUE),
  ('STR-0003', 'PRD-0002', '128GB', 1, TRUE),
  ('STR-0004', 'PRD-0002', '256GB', 2, TRUE),
  ('STR-0005', 'PRD-0003', '128GB', 1, TRUE),
  ('STR-0006', 'PRD-0004', '512GB', 1, TRUE),
  ('STR-0007', 'PRD-0005', '256GB', 1, TRUE),
  ('STR-0008', 'PRD-0006', '128GB', 1, TRUE)
ON DUPLICATE KEY UPDATE sort_order=VALUES(sort_order);

-- 7. INVENTORY (Warehouse stock so products can be purchased & added to cart)
INSERT INTO inventory (
  id, product_id, variant_id, warehouse_id, inventory_location_id, sku,
  quantity, reserved_quantity, reorder_level, status
) VALUES
  ('INV-0001', 'PRD-0001', 'VAR-0001', 'WH-0001', 'IL-0001', 'IP15PM-256-NAT', 15, 0, 3, 'IN_STOCK'),
  ('INV-0002', 'PRD-0001', 'VAR-0002', 'WH-0001', 'IL-0001', 'IP15PM-512-BLK', 10, 0, 2, 'IN_STOCK'),
  ('INV-0003', 'PRD-0002', 'VAR-0003', 'WH-0001', 'IL-0001', 'IP15-128-BLU', 25, 0, 5, 'IN_STOCK'),
  ('INV-0004', 'PRD-0002', 'VAR-0004', 'WH-0001', 'IL-0001', 'IP15-256-BLK', 18, 0, 4, 'IN_STOCK'),
  ('INV-0005', 'PRD-0003', 'VAR-0005', 'WH-0001', 'IL-0001', 'IP14-128-MID', 30, 0, 5, 'IN_STOCK'),
  ('INV-0006', 'PRD-0004', 'VAR-0006', 'WH-0001', 'IL-0001', 'MBP14-M3-512-GRY', 8, 0, 2, 'IN_STOCK'),
  ('INV-0007', 'PRD-0005', 'VAR-0007', 'WH-0001', 'IL-0001', 'MBA13-M2-256-MID', 14, 0, 3, 'IN_STOCK'),
  ('INV-0008', 'PRD-0006', 'VAR-0008', 'WH-0001', 'IL-0001', 'IPADAIR-128-WIFI-GRY', 12, 0, 3, 'IN_STOCK'),
  ('INV-0009', 'PRD-0007', 'VAR-0009', 'WH-0001', 'IL-0001', 'AWU2-49-ORG', 7, 0, 2, 'IN_STOCK'),
  ('INV-0010', 'PRD-0008', 'VAR-0010', 'WH-0001', 'IL-0001', 'AWS9-45-MID', 20, 0, 4, 'IN_STOCK'),
  ('INV-0011', 'PRD-0009', 'VAR-0011', 'WH-0001', 'IL-0001', 'APP2-USBC-WHT', 45, 0, 5, 'IN_STOCK')
ON DUPLICATE KEY UPDATE quantity=VALUES(quantity), status=VALUES(status);
