-- Add image_url column to trending_tokens table
ALTER TABLE public.trending_tokens 
ADD COLUMN IF NOT EXISTS image_url TEXT;