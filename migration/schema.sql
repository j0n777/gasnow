-- =============================================================================
-- GasNow 2.0 - Complete Database Schema for New Supabase
-- =============================================================================
-- Run this on the new Supabase database before importing data
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Gas Prices Table
CREATE TABLE IF NOT EXISTS public.gas_prices (
  id BIGSERIAL PRIMARY KEY,
  blockchain TEXT NOT NULL,
  slow NUMERIC NOT NULL,
  standard NUMERIC NOT NULL,
  fast NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gas_prices_blockchain ON public.gas_prices(blockchain, created_at DESC);

-- Crypto Prices Table
CREATE TABLE IF NOT EXISTS public.crypto_prices (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  price NUMERIC NOT NULL,
  change_24h NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crypto_prices_symbol ON public.crypto_prices(symbol, created_at DESC);

-- Market Data Table
CREATE TABLE IF NOT EXISTS public.market_data (
  id BIGSERIAL PRIMARY KEY,
  total_market_cap NUMERIC NOT NULL,
  total_volume_24h NUMERIC NOT NULL,
  btc_dominance NUMERIC NOT NULL,
  eth_dominance NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fear & Greed Index Table
CREATE TABLE IF NOT EXISTS public.fear_greed_index (
  id BIGSERIAL PRIMARY KEY,
  value INTEGER NOT NULL,
  classification TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Altseason Index Table
CREATE TABLE IF NOT EXISTS public.altseason_index (
  id BIGSERIAL PRIMARY KEY,
  value NUMERIC NOT NULL,
  btc_dominance NUMERIC NOT NULL,
  classification TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crypto News Table
CREATE TABLE IF NOT EXISTS public.crypto_news (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL UNIQUE,
  image_url TEXT,
  source TEXT NOT NULL,
  category TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crypto_news_published ON public.crypto_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_news_category ON public.crypto_news(category);

-- Trending Tokens Table
CREATE TABLE IF NOT EXISTS public.trending_tokens (
  id BIGSERIAL PRIMARY KEY,
  token_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  rank INTEGER,
  price_btc NUMERIC,
  market_cap_rank INTEGER,
  token_type TEXT NOT NULL CHECK (token_type IN ('trending', 'gainer', 'top5')),
  price NUMERIC,
  change_24h NUMERIC,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trending_tokens_type ON public.trending_tokens(token_type);
CREATE INDEX idx_trending_tokens_created_at ON public.trending_tokens(created_at DESC);

-- =============================================================================
-- DERIVATIVES & STRESS TABLES
-- =============================================================================

-- Derivatives Data Table
CREATE TABLE IF NOT EXISTS public.derivatives_data (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  symbol TEXT NOT NULL,
  funding_rate NUMERIC,
  open_interest NUMERIC,
  open_interest_usd NUMERIC,
  long_short_ratio NUMERIC,
  liquidations_24h NUMERIC,
  price NUMERIC,
  price_change_24h NUMERIC
);

CREATE INDEX idx_derivatives_symbol ON public.derivatives_data(symbol);
CREATE INDEX idx_derivatives_created_at ON public.derivatives_data(created_at DESC);

-- Market Stress Index Table
CREATE TABLE IF NOT EXISTS public.market_stress_index (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  value INTEGER NOT NULL,
  classification TEXT NOT NULL,
  funding_score NUMERIC,
  oi_score NUMERIC,
  volatility_score NUMERIC,
  liquidation_score NUMERIC,
  btc_dominance_score NUMERIC,
  stablecoin_score NUMERIC,
  insights JSONB
);

CREATE INDEX idx_market_stress_created_at ON public.market_stress_index(created_at DESC);

-- Stablecoin Supply Table
CREATE TABLE IF NOT EXISTS public.stablecoin_supply (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usdt_market_cap NUMERIC,
  usdc_market_cap NUMERIC,
  total_supply NUMERIC,
  change_24h NUMERIC
);

CREATE INDEX idx_stablecoin_created_at ON public.stablecoin_supply(created_at DESC);

-- =============================================================================
-- BITCOIN CYCLE TABLES
-- =============================================================================

-- Bitcoin Cycle Data Table
CREATE TABLE IF NOT EXISTS public.bitcoin_cycle_data (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  block_height INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  price_usd NUMERIC NOT NULL,
  cycle_number INTEGER NOT NULL,
  blocks_from_halving INTEGER NOT NULL,
  normalized_price NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cycle_blocks ON public.bitcoin_cycle_data(cycle_number, blocks_from_halving);
CREATE INDEX IF NOT EXISTS idx_block_height ON public.bitcoin_cycle_data(block_height);

-- Cycle Statistics Table
CREATE TABLE IF NOT EXISTS public.cycle_statistics (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  blocks_from_halving INTEGER NOT NULL UNIQUE,
  avg_normalized_price NUMERIC,
  std_deviation NUMERIC,
  min_price NUMERIC,
  max_price NUMERIC,
  percentile_25 NUMERIC,
  percentile_75 NUMERIC,
  sample_count INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Current Cycle Position Table
CREATE TABLE IF NOT EXISTS public.current_cycle_position (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  current_block INTEGER NOT NULL,
  current_halving_block INTEGER DEFAULT 840000,
  blocks_from_halving INTEGER NOT NULL,
  cycle_progress NUMERIC,
  current_price NUMERIC,
  normalized_price NUMERIC,
  historical_percentile NUMERIC,
  phase TEXT,
  phase_confidence NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.gas_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fear_greed_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.altseason_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.derivatives_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_stress_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stablecoin_supply ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitcoin_cycle_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.current_cycle_position ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Allow public read access" ON public.gas_prices FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.crypto_prices FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.market_data FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.fear_greed_index FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.altseason_index FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.crypto_news FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.trending_tokens FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.derivatives_data FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.market_stress_index FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.stablecoin_supply FOR SELECT USING (true);
CREATE POLICY "Public read access for bitcoin_cycle_data" ON public.bitcoin_cycle_data FOR SELECT USING (true);
CREATE POLICY "Public read access for cycle_statistics" ON public.cycle_statistics FOR SELECT USING (true);
CREATE POLICY "Public read access for current_cycle_position" ON public.current_cycle_position FOR SELECT USING (true);

-- Write access for trending_tokens (used by edge functions)
CREATE POLICY "Allow service role write access" ON public.trending_tokens FOR INSERT WITH CHECK (true);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Cleanup old trending tokens function
CREATE OR REPLACE FUNCTION cleanup_old_trending_tokens()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.trending_tokens
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- =============================================================================
-- CRON JOBS (Update these URLs after deployment)
-- =============================================================================

-- Note: Update the URL and Authorization header with your new Supabase project details
-- These will be set up after the edge functions are deployed

-- Example cron job setup (uncomment and update after deployment):
/*
SELECT cron.schedule(
  'update-trending-tokens',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_NEW_SUPABASE_URL.supabase.co/functions/v1/update-crypto-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_NEW_ANON_KEY'
    ),
    body := jsonb_build_object('type', 'trending_tokens')
  ) AS request_id;
  $$
);
*/

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
