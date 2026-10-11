ALTER TABLE workout_sessions DROP CONSTRAINT IF EXISTS workout_sessions_skipped_reason_check;
ALTER TABLE workout_sessions ADD CONSTRAINT workout_sessions_skipped_reason_check
CHECK (skipped_reason IN ('forza_maggiore', 'pigrizia', 'vacanza'));

ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_skipped_reason_check;
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_skipped_reason_check
CHECK (skipped_reason IN ('forza_maggiore', 'pigrizia', 'vacanza'));
