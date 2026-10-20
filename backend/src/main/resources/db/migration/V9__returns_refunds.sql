-- =============================================================
-- V9: Returns & refunds (§7 RETURNS, §30, §31)
-- Refund success ONLY after provider confirmation (§31).
-- =============================================================

CREATE TABLE return_requests (
  id               VARCHAR(20) PRIMARY KEY,     -- RET-NNNNN
  order_id         VARCHAR(20) NOT NULL,
  user_id          VARCHAR(16) NOT NULL,
  status           VARCHAR(24) NOT NULL DEFAULT 'REQUESTED',
  -- REQUESTED|APPROVED|REJECTED|PICKUP_SCHEDULED|RECEIVED|INSPECTING|
  -- APPROVED_FOR_REFUND|REFUND_PROCESSING|REFUNDED|CLOSED
  reason           VARCHAR(300) NOT NULL,
  customer_notes   VARCHAR(500) NULL,
  inspection_notes VARCHAR(500) NULL,
  requested_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  resolved_at      DATETIME(3) NULL,
  version          INT NOT NULL DEFAULT 0,
  INDEX idx_ret_order (order_id),
  INDEX idx_ret_user (user_id, status),
  CONSTRAINT fk_ret_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_ret_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE return_items (
  id            VARCHAR(20) PRIMARY KEY,
  return_id     VARCHAR(20) NOT NULL,
  order_item_id VARCHAR(20) NOT NULL,
  product_name  VARCHAR(160) NOT NULL,
  variant_name  VARCHAR(160) NULL,
  quantity      INT NOT NULL,
  refund_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  INDEX idx_ri_return (return_id),
  CONSTRAINT fk_ri_return FOREIGN KEY (return_id) REFERENCES return_requests(id),
  CONSTRAINT fk_ri_oitem FOREIGN KEY (order_item_id) REFERENCES order_items(id)
) ENGINE=InnoDB;

CREATE TABLE refunds (
  id                      VARCHAR(20) PRIMARY KEY,   -- REF-NNNNN
  return_id               VARCHAR(20) NULL,
  order_id                VARCHAR(20) NOT NULL,
  payment_id              VARCHAR(20) NOT NULL,
  amount                  DECIMAL(10,2) NOT NULL,
  status                  VARCHAR(16) NOT NULL DEFAULT 'PENDING',  -- PENDING|PROCESSING|SUCCESS|FAILED
  method                  VARCHAR(16) NOT NULL,      -- original payment method / SOURCE
  provider                VARCHAR(20) NOT NULL DEFAULT 'mock',
  provider_transaction_id VARCHAR(120) NULL,
  failure_reason          VARCHAR(300) NULL,
  created_at              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  processed_at            DATETIME(3) NULL,
  INDEX idx_ref_order (order_id),
  INDEX idx_ref_status (status),
  CONSTRAINT fk_ref_return FOREIGN KEY (return_id) REFERENCES return_requests(id),
  CONSTRAINT fk_ref_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_ref_pay FOREIGN KEY (payment_id) REFERENCES payments(id)
) ENGINE=InnoDB;

CREATE TABLE refund_transactions (
  id                      VARCHAR(20) PRIMARY KEY,
  refund_id               VARCHAR(20) NOT NULL,
  provider                VARCHAR(20) NOT NULL,
  provider_transaction_id VARCHAR(120) NULL,
  amount                  DECIMAL(10,2) NOT NULL,
  status                  VARCHAR(16) NOT NULL,
  raw_response            TEXT NULL,
  created_at              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_rtxn_ref (refund_id),
  CONSTRAINT fk_rtxn_ref FOREIGN KEY (refund_id) REFERENCES refunds(id)
) ENGINE=InnoDB;
