import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  image: string;
  publishedAt: string;
  source: string;
}

export const useCryptoNews = (category: string = 'general') => {
  return useQuery({
    queryKey: ['cryptoNews', category],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-crypto-news', {
        body: { category }
      });
      
      if (error) throw error;
      return data.data as NewsArticle[];
    },
    refetchInterval: 1800000, // 30 minutes
  });
};
