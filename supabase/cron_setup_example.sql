-- Enable the pg_cron extension (requires project restart or admin privileges)
create extension if not exists pg_cron;

-- Schedule the seed function to run every day at 06:00 UTC
select
  cron.schedule(
    'update-bitcoin-cycle', -- job name
    '0 6 * * *',            -- cron schedule (daily at 6 AM)
    $$
    select
      net.http_post(
        url:='https://project-ref.supabase.co/functions/v1/seed-bitcoin-cycle',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body:='{}'::jsonb
      ) as request_id;
    $$
  );

-- To verify it's scheduled:
-- select * from cron.job;
