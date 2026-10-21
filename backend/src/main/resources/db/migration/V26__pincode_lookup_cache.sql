-- =============================================================
-- V26: PIN code lookup cache table
-- Caches external postal lookup responses to avoid upstream rate limits (HTTP 429)
-- and speed up address resolution.
-- =============================================================

CREATE TABLE pincode_lookup_cache (
  pincode       VARCHAR(6) PRIMARY KEY,
  response_json TEXT NOT NULL,
  district      VARCHAR(80) NULL,
  state         VARCHAR(80) NULL,
  cached_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    TIMESTAMP NOT NULL
);

CREATE INDEX idx_pincode_cache_expires ON pincode_lookup_cache (expires_at);
