-- =============================================================
-- V15: PRODUCTION INFRASTRUCTURE & SEEDING REFERENCE
-- Demo products, customers, orders, payments, and coupons removed for production deployment.
-- Catalog starts empty until populated via Admin Console (/admin/products).
-- =============================================================

-- ---------- Warehouses (§28) ----------
INSERT INTO warehouses (id, name, code, city, state, address) VALUES
  ('WH-0001','Main Fulfilment Centre','MFC-1','Jaipur','Rajasthan','Plot 14, Malviya Nagar Industrial Area, Jaipur 302017'),
  ('WH-0002','Delhi Hub','DLR-HUB1','New Delhi','Delhi','Okhla Phase 2, New Delhi 110020'),
  ('WH-0003','Mumbai Hub','BOM-HUB1','Mumbai','Maharashtra','Andheri East, Mumbai 400093');

INSERT INTO inventory_locations (id, warehouse_id, aisle, rack, shelf, label) VALUES
  ('IL-0001','WH-0001','A','R1','S1','Jaipur A-R1-S1'),
  ('IL-0002','WH-0001','A','R2','S1','Jaipur A-R2-S1'),
  ('IL-0003','WH-0002','B','R1','S2','Delhi B-R1-S2');

-- ---------- Shipping methods (§29) ----------
INSERT INTO shipping_methods (id, name, carrier, base_fee, free_above, eta_min_days, eta_max_days, sort_order) VALUES
  ('SM-0001','Standard Delivery','iVanta Logistics',49.00,999.00,3,5,1),
  ('SM-0002','Express Delivery','iVanta Express',199.00,25000.00,1,2,2),
  ('SM-0003','Same-Day (select cities)','iVanta Now',399.00,NULL,0,1,3);
