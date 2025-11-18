-- Create tables for storing crypto data
CREATE TABLE IF NOT EXISTS public.gas_prices (
  id BIGSERIAL PRIMARY KEY,
  blockchain TEXT NOT NULL,
  slow NUMERIC NOT NULL,
  standard NUMERIC NOT NULL,
  fast NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gas_prices_blockchain ON public.gas_prices(blockchain, created_at DESC);

CREATE TABLE IF NOT EXISTS public.crypto_prices (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  price NUMERIC NOT NULL,
  change_24h NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crypto_prices_symbol ON public.crypto_prices(symbol, created_at DESC);

CREATE TABLE IF NOT EXISTS public.market_data (
  id BIGSERIAL PRIMARY KEY,
  total_market_cap NUMERIC NOT NULL,
  total_volume_24h NUMERIC NOT NULL,
  btc_dominance NUMERIC NOT NULL,
  eth_dominance NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fear_greed_index (
  id BIGSERIAL PRIMARY KEY,
  value INTEGER NOT NULL,
  classification TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.altseason_index (
  id BIGSERIAL PRIMARY KEY,
  value NUMERIC NOT NULL,
  btc_dominance NUMERIC NOT NULL,
  classification TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Enable RLS and create public read policies
ALTER TABLE public.gas_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.gas_prices FOR SELECT USING (true);

ALTER TABLE public.crypto_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.crypto_prices FOR SELECT USING (true);

ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.market_data FOR SELECT USING (true);

ALTER TABLE public.fear_greed_index ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.fear_greed_index FOR SELECT USING (true);

ALTER TABLE public.altseason_index ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.altseason_index FOR SELECT USING (true);

ALTER TABLE public.crypto_news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.crypto_news FOR SELECT USING (true);

-- Enable pg_cron and pg_net extensions for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;