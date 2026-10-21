-- =============================================================
-- V27: Expand Delivery Serviceability to All India
-- Seeds Postal Zones 1 through 9 for nationwide delivery (3-5 days standard)
-- while preserving metro express zones (Jaipur, Delhi, Mumbai, Bengaluru).
-- =============================================================

INSERT INTO serviceability_zones (id, name, serviceable, delivery_fee, eta_min_days, eta_max_days, planned_date)
VALUES ('ZON-0007', 'All India Standard Delivery', TRUE, 49.00, 3, 5, NULL);

INSERT INTO zone_pin_prefixes (zone_id, pin_prefix) VALUES
  ('ZON-0007', '1'),
  ('ZON-0007', '2'),
  ('ZON-0007', '3'),
  ('ZON-0007', '4'),
  ('ZON-0007', '5'),
  ('ZON-0007', '6'),
  ('ZON-0007', '7'),
  ('ZON-0007', '8'),
  ('ZON-0007', '9');
