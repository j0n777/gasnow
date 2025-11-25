-- Add price and change_24h columns to trending_tokens table
ALTER TABLE public.trending_tokens 
ADD COLUMN IF NOT EXISTS price NUMERIC,
ADD COLUMN IF NOT EXISTS change_24h NUMERIC;