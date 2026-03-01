-- Migration 002: Add unique constraint on words(danish, part_of_speech)
-- The same Danish word can be both a noun and a verb (e.g. "arbejde"),
-- so uniqueness requires both columns.
-- Required for upsert ON CONFLICT(danish, part_of_speech) in seed-database.py

ALTER TABLE words ADD CONSTRAINT words_danish_pos_unique UNIQUE (danish, part_of_speech);
