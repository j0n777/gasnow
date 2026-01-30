-- Create bitcoin_cycle_data table
CREATE TABLE IF NOT EXISTS bitcoin_cycle_data (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  block_height INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  price_usd NUMERIC NOT NULL,
  cycle_number INTEGER NOT NULL, -- 1, 2, 3, 4, 5
  blocks_from_halving INTEGER NOT NULL, -- negative before, positive after
  normalized_price NUMERIC, -- log(price / price_at_halving)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indicies for fast querying
CREATE INDEX IF NOT EXISTS idx_cycle_blocks ON bitcoin_cycle_data(cycle_number, blocks_from_halving);
CREATE INDEX IF NOT EXISTS idx_block_height ON bitcoin_cycle_data(block_height);

-- Create cycle_statistics table (pre-calculated stats per block offset)
CREATE TABLE IF NOT EXISTS cycle_statistics (
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

-- Create current_cycle_position table (latest live data)
CREATE TABLE IF NOT EXISTS current_cycle_position (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  current_block INTEGER NOT NULL,
  current_halving_block INTEGER DEFAULT 840000,
  blocks_from_halving INTEGER NOT NULL,
  cycle_progress NUMERIC, -- 0 to 1
  current_price NUMERIC,
  normalized_price NUMERIC,
  historical_percentile NUMERIC,
  phase TEXT, -- accumulation, expansion, euphoria, distribution, bear
  phase_confidence NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE bitcoin_cycle_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_cycle_position ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access for bitcoin_cycle_data" ON bitcoin_cycle_data
  FOR SELECT USING (true);

CREATE POLICY "Public read access for cycle_statistics" ON cycle_statistics
  FOR SELECT USING (true);

CREATE POLICY "Public read access for current_cycle_position" ON current_cycle_position
  FOR SELECT USING (true);

-- Allow service role write access (implicit, but good to be explicit for clarity if needed, though service role bypasses RLS)
-- We strictly rely on service_role for updates via Edge Functions.
