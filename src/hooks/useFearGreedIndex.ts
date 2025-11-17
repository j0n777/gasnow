import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FearGreedIndex {
  value: number;
  classification: string;
  timestamp: number;
}

export const useFearGreedIndex = () => {
  return useQuery({
    queryKey: ['fearGreedIndex'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-fear-greed-index');
      
      if (error) throw error;
      return data.data as FearGreedIndex;
    },
    refetchInterval: 60000,
  });
};
