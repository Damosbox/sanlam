CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

ALTER TABLE public.scoring_job_runs
  ADD COLUMN IF NOT EXISTS clients_total integer,
  ADD COLUMN IF NOT EXISTS clients_unscored integer;