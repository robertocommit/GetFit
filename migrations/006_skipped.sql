ALTER TABLE workout_sessions
ADD COLUMN IF NOT EXISTS skipped_reason text CHECK (skipped_reason IN ('forza_maggiore', 'pigrizia')),
ADD COLUMN IF NOT EXISTS skipped_at timestamptz;

ALTER TABLE workout_sessions
ADD CONSTRAINT workout_sessions_not_completed_and_skipped CHECK (NOT (completed_at IS NOT NULL AND skipped_reason IS NOT NULL));

ALTER TABLE activity_logs
ADD COLUMN IF NOT EXISTS skipped_reason text CHECK (skipped_reason IN ('forza_maggiore', 'pigrizia')),
ADD COLUMN IF NOT EXISTS skipped_at timestamptz;

ALTER TABLE activity_logs ALTER COLUMN completed_at DROP NOT NULL;

ALTER TABLE activity_logs
ADD CONSTRAINT activity_logs_not_completed_and_skipped CHECK (NOT (completed_at IS NOT NULL AND skipped_reason IS NOT NULL));
