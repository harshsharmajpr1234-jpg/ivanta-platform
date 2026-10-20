-- =============================================================
-- V22: Third-Party Delivery & Fulfillment Upgrade
-- Add courier provider columns, label URL, pickup tracking to shipments table
-- Add provider_return_id to return_requests table
-- Add courier_webhooks table for idempotent webhook tracking
-- Seed default warehouse & seller GSTIN system settings
-- =============================================================

ALTER TABLE shipments ADD COLUMN provider_shipment_id VARCHAR(120) NULL;
ALTER TABLE shipments ADD COLUMN label_url VARCHAR(500) NULL;
ALTER TABLE shipments ADD COLUMN pickup_token VARCHAR(120) NULL;
ALTER TABLE shipments ADD COLUMN pickup_scheduled_at DATETIME(3) NULL;
ALTER TABLE shipments ADD COLUMN weight_kg DECIMAL(6,3) NOT NULL DEFAULT 0.500;

CREATE INDEX idx_shp_provider_id ON shipments (provider_shipment_id);

ALTER TABLE return_requests ADD COLUMN provider_return_id VARCHAR(120) NULL;

CREATE TABLE courier_webhooks (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  provider       VARCHAR(30) NOT NULL,
  event_type     VARCHAR(60) NOT NULL,
  tracking_number VARCHAR(120) NULL,
  event_hash     VARCHAR(64) NOT NULL UNIQUE,
  payload        TEXT NOT NULL,
  processed      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_cwh_provider_track (provider, tracking_number),
  INDEX idx_cwh_hash (event_hash)
) ENGINE=InnoDB;

INSERT IGNORE INTO system_settings (setting_key, setting_value, category, description) VALUES
  ('warehouse.name', 'iVanta Main Fulfilment Centre', 'WAREHOUSE', 'Fulfilment centre facility name'),
  ('warehouse.contact_name', 'iVanta Logistics Manager', 'WAREHOUSE', 'Pickup contact person name'),
  ('warehouse.phone', '919876543210', 'WAREHOUSE', 'Pickup contact phone number'),
  ('warehouse.email', 'logistics@ivanta.in', 'WAREHOUSE', 'Pickup contact email'),
  ('warehouse.address_line1', 'iVanta House, Plot 42', 'WAREHOUSE', 'Pickup street address line 1'),
  ('warehouse.address_line2', 'Malviya Nagar Industrial Area', 'WAREHOUSE', 'Pickup street address line 2'),
  ('warehouse.city', 'Jaipur', 'WAREHOUSE', 'Warehouse city'),
  ('warehouse.state', 'Rajasthan', 'WAREHOUSE', 'Warehouse state'),
  ('warehouse.pincode', '302017', 'WAREHOUSE', 'Warehouse 6-digit PIN code'),
  ('seller.gstin', '08ABCDE1234F1Z5', 'WAREHOUSE', 'Seller GSTIN for tax invoice and shipping manifests');
