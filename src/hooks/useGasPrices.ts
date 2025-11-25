import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface GasPrices {
  slow: number;
  standard: number;
  fast: number;
  timestamp: number;
  slowUsd?: number;
  standardUsd?: number;
  fastUsd?: number;
}

// Approximate gas usage for a standard transfer
const ETH_TRANSFER_GAS = 21000;
const BTC_TRANSFER_SIZE = 250; // bytes

export const useGasPrices = (blockchain: 'ethereum' | 'bitcoin') => {
  return useQuery({
    queryKey: ['gasPrices', blockchain],
    queryFn: async () => {
      console.log(`[useGasPrices] Fetching gas prices for ${blockchain}...`);
      
      // Fetch gas prices
      const { data: gasData, error: gasError } = await supabase.functions.invoke('get-crypto-data', {
        body: { type: 'gas_prices', blockchain }
      });
      
      if (gasError) {
        console.error('[useGasPrices] Error:', gasError);
        throw gasError;
      }
      
      // Fetch crypto prices for USD calculation
      const { data: priceData } = await supabase.functions.invoke('get-crypto-data', {
        body: { type: 'crypto_prices' }
      });
      
      const gasPrices = gasData.data as GasPrices;
      
      // Calculate USD values
      if (priceData?.data) {
        if (blockchain === 'ethereum' && priceData.data.eth) {
          const ethPrice = priceData.data.eth.price;
          // Gwei to ETH conversion: divide by 1e9, then multiply by gas units and ETH price
          gasPrices.slowUsd = (gasPrices.slow / 1e9) * ETH_TRANSFER_GAS * ethPrice;
          gasPrices.standardUsd = (gasPrices.standard / 1e9) * ETH_TRANSFER_GAS * ethPrice;
          gasPrices.fastUsd = (gasPrices.fast / 1e9) * ETH_TRANSFER_GAS * ethPrice;
        } else if (blockchain === 'bitcoin' && priceData.data.btc) {
          const btcPrice = priceData.data.btc.price;
          // sat/vB to BTC conversion: sat/vB * transfer size / 1e8, then multiply by BTC price
          gasPrices.slowUsd = (gasPrices.slow * BTC_TRANSFER_SIZE / 1e8) * btcPrice;
          gasPrices.standardUsd = (gasPrices.standard * BTC_TRANSFER_SIZE / 1e8) * btcPrice;
          gasPrices.fastUsd = (gasPrices.fast * BTC_TRANSFER_SIZE / 1e8) * btcPrice;
        }
      }
      
      console.log('[useGasPrices] Success:', gasPrices);
      return gasPrices;
    },
    refetchInterval: 120000, // 2 minutes
  });
};
