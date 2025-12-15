import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface MarketStressData {
  value: number;
  classification: string;
  funding_score: number;
  oi_score: number;
  volatility_score: number;
  liquidation_score: number;
  btc_dominance_score: number;
  stablecoin_score: number;
  insights: string[];
  timestamp: number;
}

export function useMarketStress() {
  return useQuery({
    queryKey: ['market-stress'],
    queryFn: async () => {
      const response = await supabase.functions.invoke('get-crypto-data', {
        body: { type: 'market_stress' }
      });
      
      if (response.error) throw response.error;
      return response.data?.data as MarketStressData;
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}
