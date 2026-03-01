-- Migration 002: Add unique constraint on words.danish
-- Required for upsert ON CONFLICT(danish) in seed-database.py
-- Applied: 2026-03-01

ALTER TABLE words ADD CONSTRAINT words_danish_unique UNIQUE (danish);
