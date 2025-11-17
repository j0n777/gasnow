import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CryptoPriceData {
  price: number;
  change24h: number;
}

export interface CryptoPrices {
  btc: CryptoPriceData;
  eth: CryptoPriceData;
  sol: CryptoPriceData;
  ton: CryptoPriceData;
}

export const useCryptoPrices = () => {
  return useQuery({
    queryKey: ['cryptoPrices'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-crypto-prices', {
        body: { type: 'prices' }
      });
      
      if (error) throw error;
      return data.data as CryptoPrices;
    },
    refetchInterval: 30000,
  });
};

export const useGlobalMarketCap = () => {
  return useQuery({
    queryKey: ['globalMarketCap'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-crypto-prices', {
        body: { type: 'global' }
      });
      
      if (error) throw error;
      return data.data as {
        totalMarketCap: number;
        totalVolume24h: number;
        btcDominance: number;
        ethDominance: number;
      };
    },
    refetchInterval: 60000,
  });
};
