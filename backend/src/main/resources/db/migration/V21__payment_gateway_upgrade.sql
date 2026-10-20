-- =============================================================
-- V21: Real Payment Gateway Upgrade (§25, §26, §31)
-- Add provider_order_id, provider_payment_id to payments table
-- Add provider_refund_id to refunds table
-- =============================================================

ALTER TABLE payments ADD COLUMN provider_order_id VARCHAR(120) NULL;
ALTER TABLE payments ADD COLUMN provider_payment_id VARCHAR(120) NULL;
ALTER TABLE payments ADD COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

CREATE INDEX idx_pay_rzp_order ON payments (provider_order_id);
CREATE INDEX idx_pay_rzp_pay ON payments (provider_payment_id);

ALTER TABLE refunds ADD COLUMN provider_refund_id VARCHAR(120) NULL;
ALTER TABLE refunds ADD COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

CREATE INDEX idx_ref_rzp_refund ON refunds (provider_refund_id);
