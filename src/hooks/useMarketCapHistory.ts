import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface MarketCapHistoryPoint {
  value: number;
  date: string;
}

export const useMarketCapHistory = (days: number = 30) => {
  return useQuery({
    queryKey: ['marketCapHistory', days],
    queryFn: async () => {
      console.log(`[useMarketCapHistory] Fetching ${days} days of history...`);
      const { data, error } = await supabase.functions.invoke('get-crypto-data', {
        body: { type: 'market_data_history', days }
      });
      
      if (error) {
        console.error('[useMarketCapHistory] Error:', error);
        throw error;
      }
      
      console.log('[useMarketCapHistory] Success:', data);
      return data.data as MarketCapHistoryPoint[];
    },
    refetchInterval: 3600000, // 1 hour
  });
};
