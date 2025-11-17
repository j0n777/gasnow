import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
      const { data, error } = await supabase.functions.invoke('get-gas-prices', {
        body: { blockchain }
      });
      
      if (error) throw error;
      return data.data as GasPrices;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
