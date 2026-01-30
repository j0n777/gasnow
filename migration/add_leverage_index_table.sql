-- =============================================================================
-- Leverage Index Table - Add to database
-- =============================================================================
-- Run this SQL in the Supabase SQL Editor to create the leverage_index table
-- =============================================================================

-- Leverage Index Table (like Market Stress Index, calculated in backend)
CREATE TABLE IF NOT EXISTS public.leverage_index (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  value INTEGER NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN ('Healthy', 'Normal', 'Loaded', 'Overleveraged')),
  funding_score NUMERIC,
  oi_score NUMERIC,
  long_short_score NUMERIC,
  liquidation_score NUMERIC,
  total_oi NUMERIC,
  avg_funding NUMERIC,
  avg_long_short_ratio NUMERIC,
  insight TEXT
);

CREATE INDEX IF NOT EXISTS idx_leverage_index_created_at ON public.leverage_index(created_at DESC);

-- Enable RLS
ALTER TABLE public.leverage_index ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read access" ON public.leverage_index FOR SELECT USING (true);

-- Verify table created
SELECT 'leverage_index table created successfully' as status;
