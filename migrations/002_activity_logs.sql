CREATE TABLE IF NOT EXISTS activity_logs (
  id bigserial PRIMARY KEY,
  activity_date date NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('run', 'wing_chun')),
  duration_minutes integer CHECK (duration_minutes > 0),
  distance_km numeric(6,2) CHECK (distance_km > 0),
  rpe integer CHECK (rpe BETWEEN 1 AND 10),
  sprint_completed boolean NOT NULL DEFAULT false,
  notes text NOT NULL DEFAULT '',
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (activity_date, activity_type)
);

CREATE INDEX IF NOT EXISTS activity_logs_date_idx ON activity_logs(activity_date);
