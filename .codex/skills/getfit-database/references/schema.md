# GetFit production schema

Current routing, verified 2026-08-30:

- Stormkit application: `40`
- Stormkit environment: `42`
- SSH host alias: `stormkit-milhos`
- PostgreSQL Docker service/container filter: `stormkit_db`
- PostgreSQL schema: `a40e42`
- `ssh milhos` is a separate PostgreSQL server and does not currently contain GetFit tables.

## Tables

### `app_settings`

- `id`: singleton key (`1`)
- `start_date`: beginning of the training program
- `updated_at`

### `workout_sessions`

- `id`: primary key
- `workout_date`: unique training date
- `workout_type`: `A`, `B`, or `C`
- `duration_minutes`, `cardio_minutes`, `notes`
- `completed_at`: non-null means the application treats the session as locked
- `created_at`, `updated_at`

### `set_logs`

- `id`: primary key
- `session_id`: foreign key to `workout_sessions`
- `exercise_id`, `set_number`
- `reps`, `weight`, `effort`, `skipped`
- `completed`
- unique key: `(session_id, exercise_id, set_number)`
- Perceived effort is constrained to `1..4`; the same exercise-level value is stored on every set. Null means it was not recorded.
- `skipped` marks an exercise as deliberately excluded from that session; all of its set rows carry the same value.
- The legacy `rir` column may still exist for backward compatibility but is no longer used by the application.

### `activity_logs`

- `id`: primary key
- `activity_date`, `activity_type`
- activity type: `run` or `wing_chun`
- `duration_minutes`, `distance_km`, `rpe`, `sprint_completed`, `notes`
- `rpe` is the perceived activity intensity on the same `1..4` scale used for exercise effort; null means it was not recorded.
- `completed_at`, `created_at`, `updated_at`
- unique key: `(activity_date, activity_type)`

## Read-only checks

After opening `psql` and setting `search_path`:

```sql
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'a40e42'
ORDER BY tablename;
```

Recent completed workouts:

```sql
SELECT workout_date, workout_type, duration_minutes, cardio_minutes,
       notes, completed_at
FROM workout_sessions
WHERE completed_at IS NOT NULL
ORDER BY workout_date DESC
LIMIT 20;
```

Sets with exercise context:

```sql
SELECT s.workout_date, s.workout_type, l.exercise_id, l.set_number,
       l.reps, l.weight, l.effort, l.completed
FROM set_logs AS l
JOIN workout_sessions AS s ON s.id = l.session_id
ORDER BY s.workout_date DESC, l.exercise_id, l.set_number;
```

Recent supplemental activities:

```sql
SELECT activity_date, activity_type, duration_minutes, distance_km,
       rpe, sprint_completed, notes
FROM activity_logs
ORDER BY activity_date DESC, activity_type;
```

## Mutation safeguards

- Start with `BEGIN;` and use schema-qualified tables or an explicit `search_path`.
- Select the target row and its stable identifier first.
- Use exact IDs or unique dates/types in `WHERE`; do not perform unbounded updates or deletes.
- For corrections to completed sessions, require an explicit user request naming the historical data to correct.
- Verify affected rows, then `COMMIT`; use `ROLLBACK` on any mismatch.
- Before a destructive or broad transformation, create a recoverable database backup appropriate to its scope.
