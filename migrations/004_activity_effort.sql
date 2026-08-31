ALTER TABLE activity_logs
DROP CONSTRAINT IF EXISTS activity_logs_rpe_check;

ALTER TABLE activity_logs
ADD CONSTRAINT activity_logs_rpe_check CHECK (rpe BETWEEN 1 AND 4);
