CREATE TABLE IF NOT EXISTS app_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO app_settings (id, start_date) VALUES (1, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS workout_sessions (
  id bigserial PRIMARY KEY,
  workout_date date NOT NULL UNIQUE,
  workout_type char(1) NOT NULL CHECK (workout_type IN ('A', 'B', 'C')),
  duration_minutes integer,
  cardio_minutes integer,
  notes text NOT NULL DEFAULT '',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS set_logs (
  id bigserial PRIMARY KEY,
  session_id bigint NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id text NOT NULL,
  set_number integer NOT NULL CHECK (set_number > 0),
  reps integer CHECK (reps >= 0),
  weight numeric(7,2) CHECK (weight >= 0),
  rir integer CHECK (rir BETWEEN 0 AND 10),
  completed boolean NOT NULL DEFAULT false,
  UNIQUE (session_id, exercise_id, set_number)
);

CREATE INDEX IF NOT EXISTS workout_sessions_date_idx ON workout_sessions(workout_date);
CREATE INDEX IF NOT EXISTS set_logs_session_idx ON set_logs(session_id);
