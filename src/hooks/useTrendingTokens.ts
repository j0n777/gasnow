import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface TrendingToken {
  id: number;
  token_id: string;
  symbol: string;
  name: string;
  rank: number;
  price_btc: number | null;
  market_cap_rank: number;
  token_type: string;
  created_at: string;
}

export interface TrendingData {
  trending: TrendingToken[];
  gainers: TrendingToken[];
  top5: TrendingToken[];
}

export const useTrendingTokens = () => {
  return useQuery({
    queryKey: ['trendingTokens'],
    queryFn: async () => {
      console.log('[useTrendingTokens] Fetching trending tokens...');
      const { data, error } = await supabase.functions.invoke('get-crypto-data', {
        body: { type: 'trending_tokens' }
      });
      
      if (error) {
        console.error('[useTrendingTokens] Error:', error);
        throw error;
      }
      
      console.log('[useTrendingTokens] Success:', data);
      return data.data as TrendingData;
    },
    refetchInterval: 3600000, // 1 hour
  });
};
