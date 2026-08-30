---
name: getfit-database
description: Access, inspect, and safely update the production PostgreSQL data for the GetFit workout app deployed as Stormkit app 40, environment 42. Use for workout sessions, set logs, perceived effort, activities, settings, migrations, or production-data diagnostics for GetFit; do not use for unrelated databases on the same servers.
---

# GetFit production database

Use the local SSH alias `stormkit-milhos`. GetFit production data currently lives in the PostgreSQL container on that host, schema `a40e42` (`a{app_id}e{environment_id}`). The separate alias `milhos` does not currently host GetFit tables; do not search it again unless the deployment architecture has changed.

Never print database passwords, container environment values, SSH private keys, or unrelated application data. Do not store credentials in this skill.

## Workflow

1. Inspect the local application migrations and server queries when column semantics matter.
2. Confirm the expected schema and tables before acting. The current application tables are `app_settings`, `workout_sessions`, `set_logs`, `activity_logs`, and `stormkit_schema_migrations`.
3. Read the exact target rows before any mutation. Prefer `psql` with `ON_ERROR_STOP`, pager disabled, and schema-qualified table names.
4. Treat completed workout sessions as locked. Direct SQL bypasses the application lock, so never change a completed session or its set logs unless the user explicitly asks to correct historical data.
5. For an authorized write, use a transaction and a narrow primary-key/date predicate. Review the affected rows with `RETURNING` or a follow-up `SELECT` before considering the task complete. Never mutate `skitapi`, another `a…e…` schema, or Stormkit infrastructure tables.
6. Apply migrations only when the requested code change needs them. Verify migration state before and after; do not rerun arbitrary SQL merely because the schema differs from memory.

To open an interactive database shell without exposing credentials:

```bash
ssh -t stormkit-milhos 'cid=$(docker ps -q --filter name=stormkit_db | head -n1); docker exec -it "$cid" sh -lc '\''psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -P pager=off'\'''
```

Inside `psql`, set the application schema explicitly:

```sql
SET search_path TO a40e42, public;
```

For schema details and useful read-only queries, read [references/schema.md](references/schema.md). Reconfirm the schema through `pg_tables` if the app ID, environment ID, deployment, or Stormkit topology changes.
