import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
      const { data, error } = await supabase.functions.invoke('get-altseason-index');
      
      if (error) throw error;
      return data.data as AltseasonData;
    },
    refetchInterval: 3600000, // 1 hour
  });
};
