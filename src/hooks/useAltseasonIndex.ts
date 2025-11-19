import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface AltseasonData {
  value: number;
  btcDominance: number;
  classification: string;
  timestamp: number;
}

export const useAltseasonIndex = () => {
  return useQuery({
    queryKey: ['altseasonIndex'],
    queryFn: async () => {
      console.log('[useAltseasonIndex] Fetching Altseason Index...');
      const { data, error } = await supabase.functions.invoke('get-crypto-data', {
        body: { type: 'altseason' }
      });
      
      if (error) {
        console.error('[useAltseasonIndex] Error:', error);
        throw error;
      }
      
      console.log('[useAltseasonIndex] Success:', data);
      return data.data as AltseasonData;
    },
    refetchInterval: 3600000, // 1 hour
  });
};
