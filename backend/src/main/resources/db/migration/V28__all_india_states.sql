-- =============================================================
-- V28: Seed all remaining 31 States & Union Territories of India
-- Ensuring complete country coverage for location services (§18/§19).
-- =============================================================

INSERT INTO states (id, country_id, name, code, is_active) VALUES
  ('ST-AN', 'CTY-IN', 'Andaman And Nicobar Islands', 'AN', TRUE),
  ('ST-AP', 'CTY-IN', 'Andhra Pradesh', 'AP', TRUE),
  ('ST-AR', 'CTY-IN', 'Arunachal Pradesh', 'AR', TRUE),
  ('ST-AS', 'CTY-IN', 'Assam', 'AS', TRUE),
  ('ST-BR', 'CTY-IN', 'Bihar', 'BR', TRUE),
  ('ST-CH', 'CTY-IN', 'Chandigarh', 'CH', TRUE),
  ('ST-CG', 'CTY-IN', 'Chhattisgarh', 'CG', TRUE),
  ('ST-GA', 'CTY-IN', 'Goa', 'GA', TRUE),
  ('ST-HR', 'CTY-IN', 'Haryana', 'HR', TRUE),
  ('ST-HP', 'CTY-IN', 'Himachal Pradesh', 'HP', TRUE),
  ('ST-JK', 'CTY-IN', 'Jammu And Kashmir', 'JK', TRUE),
  ('ST-JH', 'CTY-IN', 'Jharkhand', 'JH', TRUE),
  ('ST-LA', 'CTY-IN', 'Ladakh', 'LA', TRUE),
  ('ST-LD', 'CTY-IN', 'Lakshadweep', 'LD', TRUE),
  ('ST-MP', 'CTY-IN', 'Madhya Pradesh', 'MP', TRUE),
  ('ST-MN', 'CTY-IN', 'Manipur', 'MN', TRUE),
  ('ST-ML', 'CTY-IN', 'Meghalaya', 'ML', TRUE),
  ('ST-MZ', 'CTY-IN', 'Mizoram', 'MZ', TRUE),
  ('ST-NL', 'CTY-IN', 'Nagaland', 'NL', TRUE),
  ('ST-OR', 'CTY-IN', 'Odisha', 'OR', TRUE),
  ('ST-PY', 'CTY-IN', 'Puducherry', 'PY', TRUE),
  ('ST-PB', 'CTY-IN', 'Punjab', 'PB', TRUE),
  ('ST-SK', 'CTY-IN', 'Sikkim', 'SK', TRUE),
  ('ST-TN', 'CTY-IN', 'Tamil Nadu', 'TN', TRUE),
  ('ST-TS', 'CTY-IN', 'Telangana', 'TS', TRUE),
  ('ST-DD', 'CTY-IN', 'The Dadra And Nagar Haveli And Daman And Diu', 'DD', TRUE),
  ('ST-TR', 'CTY-IN', 'Tripura', 'TR', TRUE),
  ('ST-UP', 'CTY-IN', 'Uttar Pradesh', 'UP', TRUE),
  ('ST-UK', 'CTY-IN', 'Uttarakhand', 'UK', TRUE),
  ('ST-WB', 'CTY-IN', 'West Bengal', 'WB', TRUE)
ON DUPLICATE KEY UPDATE is_active = VALUES(is_active);
