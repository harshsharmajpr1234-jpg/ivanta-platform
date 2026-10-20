-- =============================================================
-- V23: PRODUCTION HARDENING & PERFORMANCE INDEXES (§36, §38)
-- Adds optimized composite indexes for address PIN lookups, admin authentication,
-- and provider transaction audit records.
-- =============================================================

-- Composite index for user default & PIN code queries
ALTER TABLE addresses
  ADD INDEX idx_addr_pin_active (pincode, is_active);

-- Index for active admin user lookup by email
ALTER TABLE admin_users
  ADD INDEX idx_admin_email_active (email, is_active);
