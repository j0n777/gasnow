-- =============================================================================
-- GasNow 2.0 - Cron Jobs Setup for New Supabase
-- =============================================================================
-- Execute este SQL no SQL Editor do novo Supabase (mddqwppgucgzefzddajy)
-- DEPOIS de fazer deploy das Edge Functions
-- =============================================================================

-- Primeiro, vamos verificar se as extensões estão habilitadas
-- (Se já estiverem, não haverá erro)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =============================================================================
-- CRON JOB 1: Atualizar preços de gas (a cada 5 minutos)
-- =============================================================================
SELECT cron.schedule(
  'update-gas-prices-eth',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mddqwppgucgzefzddajy.supabase.co/functions/v1/update-crypto-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZHF3cHBndWNnemVmemRkYWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDc0ODgsImV4cCI6MjA4MzI4MzQ4OH0.5BpOF1B7C98zdPffSe7wpd1Ch31s_hlJSK0vYGC7HDg'
    ),
    body := jsonb_build_object('type', 'gas_prices', 'blockchain', 'ethereum')
  ) AS request_id;
  $$
);

-- =============================================================================
-- CRON JOB 2: Atualizar preços de Bitcoin gas (a cada 5 minutos)
-- =============================================================================
SELECT cron.schedule(
  'update-gas-prices-btc',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mddqwppgucgzefzddajy.supabase.co/functions/v1/update-crypto-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZHF3cHBndWNnemVmemRkYWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDc0ODgsImV4cCI6MjA4MzI4MzQ4OH0.5BpOF1B7C98zdPffSe7wpd1Ch31s_hlJSK0vYGC7HDg'
    ),
    body := jsonb_build_object('type', 'gas_prices', 'blockchain', 'bitcoin')
  ) AS request_id;
  $$
);

-- =============================================================================
-- CRON JOB 3: Atualizar preços de crypto (a cada 5 minutos)
-- =============================================================================
SELECT cron.schedule(
  'update-crypto-prices',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mddqwppgucgzefzddajy.supabase.co/functions/v1/update-crypto-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZHF3cHBndWNnemVmemRkYWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDc0ODgsImV4cCI6MjA4MzI4MzQ4OH0.5BpOF1B7C98zdPffSe7wpd1Ch31s_hlJSK0vYGC7HDg'
    ),
    body := jsonb_build_object('type', 'crypto_prices')
  ) AS request_id;
  $$
);

-- =============================================================================
-- CRON JOB 4: Atualizar dados de mercado (a cada 10 minutos)
-- =============================================================================
SELECT cron.schedule(
  'update-market-data',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mddqwppgucgzefzddajy.supabase.co/functions/v1/update-crypto-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZHF3cHBndWNnemVmemRkYWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDc0ODgsImV4cCI6MjA4MzI4MzQ4OH0.5BpOF1B7C98zdPffSe7wpd1Ch31s_hlJSK0vYGC7HDg'
    ),
    body := jsonb_build_object('type', 'market_data')
  ) AS request_id;
  $$
);

-- =============================================================================
-- CRON JOB 5: Atualizar Fear & Greed (a cada 30 minutos)
-- =============================================================================
SELECT cron.schedule(
  'update-fear-greed',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mddqwppgucgzefzddajy.supabase.co/functions/v1/update-crypto-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZHF3cHBndWNnemVmemRkYWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDc0ODgsImV4cCI6MjA4MzI4MzQ4OH0.5BpOF1B7C98zdPffSe7wpd1Ch31s_hlJSK0vYGC7HDg'
    ),
    body := jsonb_build_object('type', 'fear_greed')
  ) AS request_id;
  $$
);

-- =============================================================================
-- CRON JOB 6: Atualizar Altseason (a cada 30 minutos)
-- =============================================================================
SELECT cron.schedule(
  'update-altseason',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mddqwppgucgzefzddajy.supabase.co/functions/v1/update-crypto-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZHF3cHBndWNnemVmemRkYWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDc0ODgsImV4cCI6MjA4MzI4MzQ4OH0.5BpOF1B7C98zdPffSe7wpd1Ch31s_hlJSK0vYGC7HDg'
    ),
    body := jsonb_build_object('type', 'altseason')
  ) AS request_id;
  $$
);

-- =============================================================================
-- CRON JOB 7: Atualizar Trending Tokens (a cada 1 hora)
-- =============================================================================
SELECT cron.schedule(
  'update-trending-tokens',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mddqwppgucgzefzddajy.supabase.co/functions/v1/update-crypto-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZHF3cHBndWNnemVmemRkYWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDc0ODgsImV4cCI6MjA4MzI4MzQ4OH0.5BpOF1B7C98zdPffSe7wpd1Ch31s_hlJSK0vYGC7HDg'
    ),
    body := jsonb_build_object('type', 'trending_tokens')
  ) AS request_id;
  $$
);

-- =============================================================================
-- CRON JOB 8: Atualizar Notícias (a cada 2 horas)
-- =============================================================================
SELECT cron.schedule(
  'update-news',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mddqwppgucgzefzddajy.supabase.co/functions/v1/update-crypto-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZHF3cHBndWNnemVmemRkYWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDc0ODgsImV4cCI6MjA4MzI4MzQ4OH0.5BpOF1B7C98zdPffSe7wpd1Ch31s_hlJSK0vYGC7HDg'
    ),
    body := jsonb_build_object('type', 'news')
  ) AS request_id;
  $$
);

-- =============================================================================
-- CRON JOB 9: Atualizar Derivativos (a cada 5 minutos)
-- =============================================================================
SELECT cron.schedule(
  'update-derivatives',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mddqwppgucgzefzddajy.supabase.co/functions/v1/update-crypto-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZHF3cHBndWNnemVmemRkYWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDc0ODgsImV4cCI6MjA4MzI4MzQ4OH0.5BpOF1B7C98zdPffSe7wpd1Ch31s_hlJSK0vYGC7HDg'
    ),
    body := jsonb_build_object('type', 'derivatives')
  ) AS request_id;
  $$
);

-- =============================================================================
-- CRON JOB 10: Atualizar Stablecoin Supply (a cada 30 minutos)
-- =============================================================================
SELECT cron.schedule(
  'update-stablecoin-supply',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mddqwppgucgzefzddajy.supabase.co/functions/v1/update-crypto-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZHF3cHBndWNnemVmemRkYWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDc0ODgsImV4cCI6MjA4MzI4MzQ4OH0.5BpOF1B7C98zdPffSe7wpd1Ch31s_hlJSK0vYGC7HDg'
    ),
    body := jsonb_build_object('type', 'stablecoin_supply')
  ) AS request_id;
  $$
);

-- =============================================================================
-- CRON JOB 11: Atualizar Market Stress Index (a cada 10 minutos)
-- =============================================================================
SELECT cron.schedule(
  'update-market-stress',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mddqwppgucgzefzddajy.supabase.co/functions/v1/update-crypto-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZHF3cHBndWNnemVmemRkYWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDc0ODgsImV4cCI6MjA4MzI4MzQ4OH0.5BpOF1B7C98zdPffSe7wpd1Ch31s_hlJSK0vYGC7HDg'
    ),
    body := jsonb_build_object('type', 'market_stress')
  ) AS request_id;
  $$
);

-- =============================================================================
-- CRON JOB 12: Atualizar Bitcoin Cycle (a cada 1 hora)
-- =============================================================================
SELECT cron.schedule(
  'update-bitcoin-cycle',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mddqwppgucgzefzddajy.supabase.co/functions/v1/update-crypto-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZHF3cHBndWNnemVmemRkYWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDc0ODgsImV4cCI6MjA4MzI4MzQ4OH0.5BpOF1B7C98zdPffSe7wpd1Ch31s_hlJSK0vYGC7HDg'
    ),
    body := jsonb_build_object('type', 'bitcoin_cycle')
  ) AS request_id;
  $$
);

-- =============================================================================
-- Verificar cron jobs criados
-- =============================================================================
SELECT jobid, jobname, schedule 
FROM cron.job 
ORDER BY jobname;

-- =============================================================================
-- FIM DO SETUP DE CRON JOBS
-- =============================================================================
