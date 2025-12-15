-- Create derivatives_data table for Binance Futures data
CREATE TABLE public.derivatives_data (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  symbol TEXT NOT NULL, -- 'BTCUSDT', 'ETHUSDT', 'SOLUSDT'
  funding_rate NUMERIC,
  open_interest NUMERIC,
  open_interest_usd NUMERIC,
  long_short_ratio NUMERIC,
  liquidations_24h NUMERIC,
  price NUMERIC,
  price_change_24h NUMERIC
);

-- Create market_stress_index table
CREATE TABLE public.market_stress_index (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  value INTEGER NOT NULL, -- 0-100
  classification TEXT NOT NULL, -- 'Low Stress', 'Neutral', 'High Stress'
  funding_score NUMERIC,
  oi_score NUMERIC,
  volatility_score NUMERIC,
  liquidation_score NUMERIC,
  btc_dominance_score NUMERIC,
  stablecoin_score NUMERIC,
  insights JSONB -- ["Funding elevated", "OI rising faster than price"]
);

-- Create stablecoin_supply table
CREATE TABLE public.stablecoin_supply (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usdt_market_cap NUMERIC,
  usdc_market_cap NUMERIC,
  total_supply NUMERIC,
  change_24h NUMERIC
);

-- Enable RLS on all tables
ALTER TABLE public.derivatives_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_stress_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stablecoin_supply ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Allow public read access" ON public.derivatives_data FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.market_stress_index FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.stablecoin_supply FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX idx_derivatives_symbol ON public.derivatives_data(symbol);
CREATE INDEX idx_derivatives_created_at ON public.derivatives_data(created_at DESC);
CREATE INDEX idx_market_stress_created_at ON public.market_stress_index(created_at DESC);
CREATE INDEX idx_stablecoin_created_at ON public.stablecoin_supply(created_at DESC);