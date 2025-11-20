-- Fix security warning: Add search_path to function
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