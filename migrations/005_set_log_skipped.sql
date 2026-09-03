ALTER TABLE set_logs
ADD COLUMN IF NOT EXISTS skipped boolean NOT NULL DEFAULT false;

ALTER TABLE set_logs
ADD CONSTRAINT set_logs_not_completed_and_skipped CHECK (NOT (completed AND skipped));
