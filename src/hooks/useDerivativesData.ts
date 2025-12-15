import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface DerivativeData {
  symbol: string;
  funding_rate: number;
  open_interest: number;
  open_interest_usd: number;
  long_short_ratio: number;
  liquidations_24h: number;
  price: number;
  price_change_24h: number;
  created_at: string;
}

export function useDerivativesData() {
  return useQuery({
    queryKey: ['derivatives-data'],
    queryFn: async () => {
      const response = await supabase.functions.invoke('get-crypto-data', {
        body: { type: 'derivatives_data' }
      });
      
      if (response.error) throw response.error;
      return response.data?.data as DerivativeData[];
    },
    refetchInterval: 2 * 60 * 1000, // 2 minutes
  });
}
