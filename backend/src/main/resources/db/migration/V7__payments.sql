-- =============================================================
-- V7: Payments (§7 PAYMENTS, §25, §26)
-- Provider-based (mock in dev, Razorpay-ready). Payment success is
-- ONLY ever set by server-side verification — never from the client.
-- =============================================================

CREATE TABLE payments (
  id                      VARCHAR(20) PRIMARY KEY,     -- PAY-NNNNN
  order_id                VARCHAR(20) NOT NULL,
  user_id                 VARCHAR(16) NOT NULL,
  amount                  DECIMAL(10,2) NOT NULL,
  currency                CHAR(3) NOT NULL DEFAULT 'INR',
  method                  VARCHAR(16) NOT NULL,        -- UPI|CARD|NETBANKING|WALLET|COD
  provider                VARCHAR(20) NOT NULL DEFAULT 'mock',
  status                  VARCHAR(24) NOT NULL DEFAULT 'PENDING',
  -- PENDING|PROCESSING|SUCCESS|FAILED|REFUNDED|PARTIALLY_REFUNDED
  provider_transaction_id VARCHAR(120) NULL,
  provider_reference      VARCHAR(128) NULL,           -- server-issued verification reference
  failure_reason          VARCHAR(300) NULL,
  created_at              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  processed_at            DATETIME(3) NULL,
  version                 INT NOT NULL DEFAULT 0,
  INDEX idx_pay_order (order_id),
  INDEX idx_pay_status (status),
  INDEX idx_pay_user (user_id),
  CONSTRAINT fk_pay_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_pay_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE payment_transactions (
  id                      VARCHAR(20) PRIMARY KEY,
  payment_id              VARCHAR(20) NOT NULL,
  provider                VARCHAR(20) NOT NULL,
  provider_transaction_id VARCHAR(120) NULL,
  txn_type                VARCHAR(16) NOT NULL,        -- INITIATE|VERIFY|CAPTURE|REFUND
  amount                  DECIMAL(10,2) NOT NULL,
  status                  VARCHAR(16) NOT NULL,        -- SUCCESS|FAILED|PENDING
  raw_response            TEXT NULL,                   -- provider payload for reconciliation
  created_at              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_ptxn_pay (payment_id),
  CONSTRAINT fk_ptxn_pay FOREIGN KEY (payment_id) REFERENCES payments(id)
) ENGINE=InnoDB;

CREATE TABLE payment_status_history (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  payment_id      VARCHAR(20) NOT NULL,
  previous_status VARCHAR(24) NULL,
  new_status      VARCHAR(24) NOT NULL,
  reason          VARCHAR(300) NULL,
  changed_by      VARCHAR(16) NULL,
  created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_psh_pay (payment_id, created_at),
  CONSTRAINT fk_psh_pay FOREIGN KEY (payment_id) REFERENCES payments(id)
) ENGINE=InnoDB;
