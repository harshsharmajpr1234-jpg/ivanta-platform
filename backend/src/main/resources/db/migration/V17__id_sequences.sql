-- Atomic per-prefix ID sequences (replaces MAX(id) derivation, which is not
-- transaction-safe: unflushed inserts are invisible to MAX within the same tx).
-- Rows are created lazily on first use, seeded from the current MAX(id).
CREATE TABLE id_sequences (
  seq_name   VARCHAR(80) NOT NULL PRIMARY KEY,
  next_val   BIGINT      NOT NULL DEFAULT 0,
  updated_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
