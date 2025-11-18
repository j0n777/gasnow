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
      console.log(`[useCryptoNews] Fetching news for category: ${category}...`);
      const { data, error } = await supabase.functions.invoke('get-crypto-data', {
        body: { type: 'news', category }
      });
      
      if (error) {
        console.error('[useCryptoNews] Error:', error);
        throw error;
      }
      
      console.log('[useCryptoNews] Success:', data);
      return data.data as NewsArticle[];
    },
    refetchInterval: 60000, // 1 minute
  });
};
