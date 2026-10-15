-- Additive lifecycle fields: historical relationships and scores remain intact.
ALTER TABLE classroom ADD COLUMN archived_at TIMESTAMP(6) WITH TIME ZONE;
ALTER TABLE worksheet_assignment ADD COLUMN removed_at TIMESTAMP(6) WITH TIME ZONE;
