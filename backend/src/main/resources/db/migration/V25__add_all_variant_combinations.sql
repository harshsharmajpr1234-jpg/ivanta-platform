-- V25: Add full storage and color matrix for all showcase Apple devices

INSERT INTO product_variants (id, product_id, sku, name, storage, color, connectivity, size, price, mrp, is_active)
VALUES
  ('VAR-0012', 'PRD-0001', 'IP15PM-256-BLK', '256GB · Black Titanium', '256GB', 'Black Titanium', '5G', '6.7"', 104999.00, 159900.00, TRUE),
  ('VAR-0013', 'PRD-0001', 'IP15PM-512-NAT', '512GB · Natural Titanium', '512GB', 'Natural Titanium', '5G', '6.7"', 119999.00, 179900.00, TRUE),
  ('VAR-0014', 'PRD-0002', 'IP15-128-BLK', '128GB · Black', '128GB', 'Black', '5G', '6.1"', 54999.00, 79900.00, TRUE),
  ('VAR-0015', 'PRD-0002', 'IP15-256-BLU', '256GB · Blue', '256GB', 'Blue', '5G', '6.1"', 62999.00, 89900.00, TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price);

-- Add warehouse inventory for new variants
INSERT INTO inventory (
  id, product_id, variant_id, warehouse_id, inventory_location_id, sku,
  quantity, reserved_quantity, reorder_level, status
) VALUES
  ('INV-0012', 'PRD-0001', 'VAR-0012', 'WH-0001', 'IL-0001', 'IP15PM-256-BLK', 12, 0, 3, 'IN_STOCK'),
  ('INV-0013', 'PRD-0001', 'VAR-0013', 'WH-0001', 'IL-0001', 'IP15PM-512-NAT', 10, 0, 2, 'IN_STOCK'),
  ('INV-0014', 'PRD-0002', 'VAR-0014', 'WH-0001', 'IL-0001', 'IP15-128-BLK', 15, 0, 4, 'IN_STOCK'),
  ('INV-0015', 'PRD-0002', 'VAR-0015', 'WH-0001', 'IL-0001', 'IP15-256-BLU', 10, 0, 3, 'IN_STOCK')
ON DUPLICATE KEY UPDATE quantity=VALUES(quantity), status=VALUES(status);
