-- =============================================================
-- V13: Notifications (§7 NOTIFICATIONS, §42)
-- Provider-agnostic: Email/SMS/WhatsApp/Push plug in behind
-- interfaces; dev providers just log. In-app rows power /account/notifications.
-- =============================================================

CREATE TABLE notification_templates (
  template_key VARCHAR(40) PRIMARY KEY,
  channel      VARCHAR(10) NOT NULL DEFAULT 'IN_APP',  -- IN_APP|EMAIL|SMS|WHATSAPP|PUSH
  subject      VARCHAR(160) NOT NULL,
  body         TEXT NOT NULL,                          -- {{name}}, {{orderNumber}} placeholders
  is_active    BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id           VARCHAR(20) PRIMARY KEY,   -- NTF-NNNNN
  user_id      VARCHAR(16) NULL,
  template_key VARCHAR(40) NULL,
  channel      VARCHAR(10) NOT NULL DEFAULT 'IN_APP',
  title        VARCHAR(160) NOT NULL,
  body         VARCHAR(600) NOT NULL,
  entity_type  VARCHAR(30) NULL,          -- order | payment | shipment | return | refund
  entity_id    VARCHAR(20) NULL,
  read_at      DATETIME(3) NULL,
  created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_notif_user (user_id, read_at, created_at),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_notif_tpl FOREIGN KEY (template_key) REFERENCES notification_templates(template_key)
) ENGINE=InnoDB;

INSERT INTO notification_templates (template_key, channel, subject, body) VALUES
  ('ORDER_PLACED','IN_APP','Order placed','Hi {{name}}, your order {{orderNumber}} has been placed. We''ll notify you as it progresses.'),
  ('ORDER_CONFIRMED','IN_APP','Order confirmed','Order {{orderNumber}} is confirmed and being prepared.'),
  ('PAYMENT_SUCCESS','IN_APP','Payment successful','We received ₹{{amount}} for order {{orderNumber}}.'),
  ('PAYMENT_FAILED','IN_APP','Payment failed','Payment for order {{orderNumber}} could not be completed. No amount has been captured.'),
  ('ORDER_SHIPPED','IN_APP','Order shipped','Order {{orderNumber}} is on the way. Track it any time from your account.'),
  ('OUT_FOR_DELIVERY','IN_APP','Out for delivery','Your order {{orderNumber}} is out for delivery today.'),
  ('ORDER_DELIVERED','IN_APP','Order delivered','Order {{orderNumber}} was delivered. We hope you love it!'),
  ('ORDER_CANCELLED','IN_APP','Order cancelled','Order {{orderNumber}} was cancelled. {{reason}}'),
  ('RETURN_UPDATE','IN_APP','Return update','Return {{returnNumber}} for order {{orderNumber}}: {{status}}.'),
  ('REFUND_UPDATE','IN_APP','Refund update','Refund {{refundNumber}} of ₹{{amount}} is {{status}}.'),
  ('PROMO','IN_APP','Special offer','{{message}}');
