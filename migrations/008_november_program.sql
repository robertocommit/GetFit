-- Additive only: historical values and legacy timed reps are untouched.
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS training_context jsonb;
ALTER TABLE set_logs ADD COLUMN IF NOT EXISTS hold_seconds integer CHECK (hold_seconds > 0);
ALTER TABLE set_logs ADD COLUMN IF NOT EXISTS side text CHECK (side IN ('left', 'right'));
