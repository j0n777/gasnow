-- Force recalculation of Cycle 5 predictions
-- Logic: Exclude Cycle 2 (Fast Cycle) from average.
-- Avg Days Halving to Top (Cycle 3, 4) = (525 + 546) / 2 = 535.5 -> 536 days
-- Avg Days Top to Bottom (Cycle 3, 4) = (364 + 378) / 2 = 371 days
-- Cycle 5 Start (Halving): 2024-04-20 (approx, derived from existing start_date)

UPDATE cycle_predictions
SET 
    -- 536 days after start
    predicted_top_date = start_date + INTERVAL '536 days',
    
    -- 536 + 371 = 907 days after start
    predicted_bottom_date = start_date + INTERVAL '907 days',
    
    updated_at = NOW()
WHERE cycle_number = 5;
