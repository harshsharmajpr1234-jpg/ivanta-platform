-- =============================================================
-- V14: Audit log (§43) — immutable, append-only, no update/delete
-- paths exist in the application layer.
-- =============================================================

CREATE TABLE audit_logs (
  id            VARCHAR(16) PRIMARY KEY,
  actor_type    VARCHAR(10) NOT NULL DEFAULT 'SYSTEM',   -- CUSTOMER|ADMIN|SYSTEM
  actor_user_id VARCHAR(16) NULL,
  actor_name    VARCHAR(120) NOT NULL,
  actor_role    VARCHAR(32) NULL,
  action        VARCHAR(40) NOT NULL,                    -- ADMIN_LOGIN, PRODUCT_CREATED, PRICE_CHANGED,
                                                         -- INVENTORY_UPDATED, ORDER_STATUS_CHANGED,
                                                         -- PAYMENT_STATUS_CHANGED, REFUND_PROCESSED,
                                                         -- USER_ROLE_CHANGED, COUPON_CREATED, LOCATION_UPDATED...
  entity_type   VARCHAR(40) NOT NULL,
  entity_id     VARCHAR(20) NOT NULL,
  old_value     TEXT NULL,
  new_value     TEXT NULL,
  ip_address    VARCHAR(45) NULL,
  user_agent    VARCHAR(255) NULL,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_actor (actor_user_id),
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_action (action)
) ENGINE=InnoDB;
