-- V19: replacements.created_at — the Replacement entity maps an append-only
-- created_at audit column (project-wide entity pattern) that the V18 DDL missed.
ALTER TABLE replacements
  ADD COLUMN created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) AFTER requested_at;
