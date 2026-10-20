-- =============================================================
-- V16: DEVELOPMENT location seed (§19/§21) — Jaipur-rich demo data.
-- =============================================================

INSERT INTO states (id, name, code) VALUES
  ('ST-RJ','Rajasthan','RJ'),('ST-DL','Delhi','DL'),('ST-MH','Maharashtra','MH'),('ST-KA','Karnataka','KA'),('ST-GJ','Gujarat','GJ');

INSERT INTO districts (id, state_id, name) VALUES
  ('DIS-JPR','ST-RJ','Jaipur'),('DIS-JOD','ST-RJ','Jodhpur'),('DIS-NDL','ST-DL','New Delhi'),('DIS-MUM','ST-MH','Mumbai Suburban'),('DIS-BLR','ST-KA','Bengaluru Urban');

INSERT INTO cities (id, state_id, district_id, name, popular) VALUES
  ('CTY-JPR','ST-RJ','DIS-JPR','Jaipur',TRUE),
  ('CTY-JOD','ST-RJ','DIS-JOD','Jodhpur',FALSE),
  ('CTY-DEL','ST-DL','DIS-NDL','New Delhi',TRUE),
  ('CTY-MUM','ST-MH','DIS-MUM','Mumbai',TRUE),
  ('CTY-BLR','ST-KA','DIS-BLR','Bengaluru',TRUE);

INSERT INTO localities (id, city_id, name, popular) VALUES
  ('LOC-0001','CTY-JPR','Vaishali Nagar',TRUE),('LOC-0002','CTY-JPR','Malviya Nagar',TRUE),
  ('LOC-0003','CTY-JPR','Mansarovar',TRUE),('LOC-0004','CTY-JPR','C-Scheme',FALSE),
  ('LOC-0005','CTY-JPR','Raja Park',FALSE),('LOC-0006','CTY-JPR','Jagatpura',FALSE),
  ('LOC-0007','CTY-JPR','Pratap Nagar',FALSE),('LOC-0008','CTY-JPR','Tonk Road',FALSE),
  ('LOC-0009','CTY-JOD','Sardarpura',FALSE),('LOC-0010','CTY-DEL','Greater Kailash I',TRUE),
  ('LOC-0011','CTY-DEL','Dwarka Sector 12',FALSE),('LOC-0012','CTY-MUM','Bandra West',TRUE),
  ('LOC-0013','CTY-MUM','Andheri East',FALSE),('LOC-0014','CTY-BLR','Indiranagar',TRUE),
  ('LOC-0015','CTY-BLR','Koramangala',TRUE);

INSERT INTO pincodes (id, code, state_id) VALUES
  ('PIN-0001','302001','ST-RJ'),('PIN-0002','302004','ST-RJ'),('PIN-0003','302012','ST-RJ'),
  ('PIN-0004','302017','ST-RJ'),('PIN-0005','302018','ST-RJ'),('PIN-0006','302019','ST-RJ'),
  ('PIN-0007','302020','ST-RJ'),('PIN-0008','302021','ST-RJ'),('PIN-0009','302022','ST-RJ'),
  ('PIN-0010','302023','ST-RJ'),('PIN-0011','342001','ST-RJ'),('PIN-0012','110024','ST-DL'),
  ('PIN-0013','110075','ST-DL'),('PIN-0014','400050','ST-MH'),('PIN-0015','400053','ST-MH'),
  ('PIN-0016','560038','ST-KA'),('PIN-0017','560034','ST-KA');

INSERT INTO post_offices (id, pincode_id, name) VALUES
  ('PO-0001','PIN-0001','Jaipur City'),('PO-0002','PIN-0003','Vaishali Nagar'),('PO-0003','PIN-0004','Malviya Nagar'),
  ('PO-0004','PIN-0005','Mansarovar'),('PO-0005','PIN-0008','Pratap Nagar'),('PO-0006','PIN-0011','Jodhpur City'),
  ('PO-0007','PIN-0012','Greater Kailash'),('PO-0008','PIN-0013','Dwarka'),('PO-0009','PIN-0015','Bandra West'),
  ('PO-0010','PIN-0016','Indiranagar'),('PO-0011','PIN-0017','Koramangala');

INSERT INTO pincode_cities (pincode_id, city_id) VALUES
  ('PIN-0001','CTY-JPR'),('PIN-0002','CTY-JPR'),('PIN-0003','CTY-JPR'),('PIN-0004','CTY-JPR'),('PIN-0005','CTY-JPR'),
  ('PIN-0006','CTY-JPR'),('PIN-0007','CTY-JPR'),('PIN-0008','CTY-JPR'),('PIN-0009','CTY-JPR'),('PIN-0010','CTY-JPR'),
  ('PIN-0011','CTY-JOD'),('PIN-0012','CTY-DEL'),('PIN-0013','CTY-DEL'),('PIN-0014','CTY-MUM'),('PIN-0015','CTY-MUM'),
  ('PIN-0016','CTY-BLR'),('PIN-0017','CTY-BLR');

INSERT INTO pincode_localities (pincode_id, locality_id) VALUES
  ('PIN-0002','LOC-0004'),('PIN-0003','LOC-0001'),('PIN-0004','LOC-0002'),('PIN-0005','LOC-0003'),
  ('PIN-0006','LOC-0005'),('PIN-0007','LOC-0008'),('PIN-0008','LOC-0007'),('PIN-0009','LOC-0006'),
  ('PIN-0011','LOC-0009'),('PIN-0012','LOC-0010'),('PIN-0013','LOC-0011'),('PIN-0015','LOC-0012'),
  ('PIN-0014','LOC-0013'),('PIN-0016','LOC-0014'),('PIN-0017','LOC-0015'),
  ('PIN-0007','LOC-0002');   -- one PIN serving two localities (§18: not a strict hierarchy)

INSERT INTO roads (id, locality_id, name) VALUES
  ('RD-0001','LOC-0001','Amrapali Marg'),('RD-0002','LOC-0002','JLN Marg'),('RD-0003','LOC-0003','Mansarovar Main Road'),
  ('RD-0004','LOC-0010','GK1 Market Road'),('RD-0005','LOC-0014','100 Feet Road');

INSERT INTO serviceability_zones (id, name, serviceable, delivery_fee, eta_min_days, eta_max_days, planned_date) VALUES
  ('ZON-0001','Jaipur Metro',TRUE,0.00,1,2,NULL),
  ('ZON-0002','Jaipur Outer',TRUE,49.00,2,3,NULL),
  ('ZON-0003','Jodhpur',FALSE,0.00,3,5,'2026-12-01'),
  ('ZON-0004','Delhi NCR',TRUE,0.00,1,2,NULL),
  ('ZON-0005','Mumbai Metro',TRUE,0.00,1,3,NULL),
  ('ZON-0006','Bengaluru Metro',TRUE,0.00,1,2,NULL);

INSERT INTO zone_cities (zone_id, city_id) VALUES
  ('ZON-0001','CTY-JPR'),('ZON-0002','CTY-JPR'),('ZON-0003','CTY-JOD'),('ZON-0004','CTY-DEL'),('ZON-0005','CTY-MUM'),('ZON-0006','CTY-BLR');

INSERT INTO zone_pin_prefixes (zone_id, pin_prefix) VALUES
  ('ZON-0001','302'),('ZON-0002','303'),('ZON-0003','342'),('ZON-0004','110'),('ZON-0005','400'),('ZON-0006','560');
