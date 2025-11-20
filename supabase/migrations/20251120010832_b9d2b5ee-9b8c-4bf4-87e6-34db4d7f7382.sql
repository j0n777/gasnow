-- Create trending_tokens table
CREATE TABLE IF NOT EXISTS public.trending_tokens (
  id BIGSERIAL PRIMARY KEY,
  token_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  rank INTEGER,
  price_btc NUMERIC,
  market_cap_rank INTEGER,
  token_type TEXT NOT NULL CHECK (token_type IN ('trending', 'gainer', 'top5')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_trending_tokens_type ON public.trending_tokens(token_type);
CREATE INDEX idx_trending_tokens_created_at ON public.trending_tokens(created_at DESC);

-- Enable RLS
ALTER TABLE public.trending_tokens ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access"
  ON public.trending_tokens
  FOR SELECT
  USING (true);

-- Allow service role write access (for edge functions)
CREATE POLICY "Allow service role write access"
  ON public.trending_tokens
  FOR INSERT
  WITH CHECK (true);

-- Function to cleanup old trending tokens (keep only last 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_trending_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM public.trending_tokens
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create cron job to update trending tokens every hour
SELECT cron.schedule(
  'update-trending-tokens',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://pqmfzeqczfsidxaabvok.supabase.co/functions/v1/update-crypto-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbWZ6ZXFjemZzaWR4YWFidm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzI0NDgsImV4cCI6MjA3ODcwODQ0OH0.FojMHR09ZWi7N6ZQXlEC7ltI2vrrl_Yk8qdEDXdY1wk'
    ),
    body := jsonb_build_object('type', 'trending_tokens')
  ) AS request_id;
  $$
);