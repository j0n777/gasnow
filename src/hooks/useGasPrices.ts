import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface GasPrices {
  slow: number;
  standard: number;
  fast: number;
  timestamp: number;
}

export const useGasPrices = (blockchain: 'ethereum' | 'bitcoin') => {
  return useQuery({
    queryKey: ['gasPrices', blockchain],
    queryFn: async () => {
      console.log(`[useGasPrices] Fetching gas prices for ${blockchain}...`);
      const { data, error } = await supabase.functions.invoke('get-crypto-data', {
        body: { type: 'gas_prices', blockchain }
      });
      
      if (error) {
        console.error('[useGasPrices] Error:', error);
        throw error;
      }
      
      console.log('[useGasPrices] Success:', data);
      return data.data as GasPrices;
    },
    refetchInterval: 120000, // 2 minutes
  });
};
