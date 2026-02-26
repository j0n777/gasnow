-- Add prediction columns to current_cycle_position
ALTER TABLE current_cycle_position 
ADD COLUMN IF NOT EXISTS predicted_top_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS predicted_bottom_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS predicted_next_halving_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cycle_start_date TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN current_cycle_position.predicted_top_date IS 'Estimated date of cycle top based on historical average days from halving';
COMMENT ON COLUMN current_cycle_position.predicted_bottom_date IS 'Estimated date of cycle bottom based on historical average days from top';
