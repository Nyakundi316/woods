-- Schedule daily drop ingestion at 06:00 UTC
-- Requires pg_cron extension (enabled in 0001_initial_schema.sql)
SELECT cron.schedule(
  'ingest-drops-daily',
  '0 6 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_functions_url') || '/ingest-drops',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{}'::jsonb
    )
  $$
);
