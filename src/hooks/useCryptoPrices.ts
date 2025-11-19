import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

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
      console.log('[useCryptoPrices] Fetching crypto prices...');
      const { data, error } = await supabase.functions.invoke('get-crypto-data', {
        body: { type: 'crypto_prices' }
      });
      
      if (error) {
        console.error('[useCryptoPrices] Error:', error);
        throw error;
      }
      
      console.log('[useCryptoPrices] Success:', data);
      return data.data as CryptoPrices;
    },
    refetchInterval: 300000, // 5 minutes
  });
};

export const useGlobalMarketCap = () => {
  return useQuery({
    queryKey: ['globalMarketCap'],
    queryFn: async () => {
      console.log('[useGlobalMarketCap] Fetching global market cap...');
      const { data, error } = await supabase.functions.invoke('get-crypto-data', {
        body: { type: 'market_data' }
      });
      
      if (error) {
        console.error('[useGlobalMarketCap] Error:', error);
        throw error;
      }
      
      console.log('[useGlobalMarketCap] Success:', data);
      return data.data as {
        totalMarketCap: number;
        totalVolume24h: number;
        btcDominance: number;
        ethDominance: number;
      };
    },
    refetchInterval: 3600000, // 1 hour
  });
};
