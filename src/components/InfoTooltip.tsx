import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InfoTooltipProps {
  content: string | React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export const InfoTooltip = ({ content, side = 'top', className = '' }: InfoTooltipProps) => {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            type="button" 
            className={`inline-flex items-center justify-center p-0.5 rounded-full hover:bg-muted transition-colors ${className}`}
            aria-label="More information"
          >
            <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs text-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Tooltip content definitions for reuse
export const tooltipContent = {
  // Gas fees
  gasFeeSlow: "Lower priority transaction. Best for non-urgent transfers. Confirmation in ~10-30 minutes.",
  gasFeeStandard: "Average priority. Good balance between speed and cost. Confirmation in ~3-10 minutes.",
  gasFeeFast: "High priority. Best for urgent transactions. Confirmation in ~15-60 seconds.",
  
  // Market stats
  totalMarketCap: "Total value of all cryptocurrencies combined. Indicates overall market size and health.",
  volume24h: "Total trading volume across all exchanges in the last 24 hours. High volume indicates active trading.",
  
  // Fear & Greed
  fearGreed: "0-24: Extreme Fear (buying opportunity?), 25-49: Fear, 50-74: Greed, 75-100: Extreme Greed (potential correction).",
  
  // Market Stress
  marketStress: "Measures structural market risk. Components: funding rates (25%), OI delta (20%), volatility (20%), liquidations (15%), BTC dominance (10%), stablecoin supply (10%).",
  
  // Market Cycle
  marketCycle: "Bitcoin Season (<25): BTC outperforming altcoins. Altseason (>75): Altcoins outperforming BTC. Based on top 50 altcoin performance vs BTC.",
  
  // Derivatives
  openInterest: "Total value of outstanding derivative contracts. Rising OI with rising price = bullish. Rising OI with falling price = bearish.",
  fundingRate: "Fee paid between longs and shorts every 8h. Positive = longs pay shorts (bullish sentiment). Negative = shorts pay longs (bearish sentiment).",
  bias: "Long-heavy: More traders betting on price increase. Short-heavy: More traders betting on price decrease. Neutral: Balanced positioning.",
  riskLevel: "Healthy: Normal market conditions. Loaded: Elevated leverage. Overleveraged: High liquidation risk.",
  liquidations: "Value of positions forcibly closed in the last 24 hours due to insufficient margin. High liquidations often indicate market volatility.",
  
  // Market Leaders
  trending: "Coins with the highest search interest and social buzz in the last 24 hours.",
  gainers: "Top performing coins by price increase percentage in the last 24 hours.",
  top5: "The five largest cryptocurrencies by total market capitalization.",
};
