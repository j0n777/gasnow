import { useEffect } from 'react';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useFearGreedIndex } from '@/hooks/useFearGreedIndex';
import { useGasPrices } from '@/hooks/useGasPrices';

export const SEOHead = () => {
  const { data: cryptoPrices } = useCryptoPrices();
  const { data: fearGreed } = useFearGreedIndex();
  const { data: gasPrices } = useGasPrices('ethereum');

  useEffect(() => {
    // Dynamic title with live data
    const btcPrice = cryptoPrices?.btc?.price;
    const ethPrice = cryptoPrices?.eth?.price;
    const gasPrice = gasPrices?.standard;

    let title = 'GasNow - Real-time Crypto Gas Fees & Market Data';
    
    if (btcPrice && ethPrice && gasPrice) {
      title = `ETH Gas: ${gasPrice?.toFixed(1)} Gwei | BTC: $${btcPrice.toLocaleString()} | GasNow`;
    }

    document.title = title;

    // Update meta description with live data
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && btcPrice && ethPrice) {
      const fearValue = fearGreed?.value || 50;
      const fearClass = fearGreed?.classification || 'Neutral';
      metaDescription.setAttribute(
        'content',
        `Live crypto data: BTC $${btcPrice.toLocaleString()}, ETH $${ethPrice.toLocaleString()}, ETH Gas ${gasPrice?.toFixed(1) || '--'} Gwei. Fear & Greed: ${fearValue} (${fearClass}). Track gas fees, market cap, derivatives & trending tokens.`
      );
    }
  }, [cryptoPrices, fearGreed, gasPrices]);

  return null;
};
