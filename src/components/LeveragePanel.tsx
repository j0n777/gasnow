import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useDerivativesData, DerivativeData } from '@/hooks/useDerivativesData';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { InfoTooltip, tooltipContent } from '@/components/InfoTooltip';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const getRiskLevel = (data: DerivativeData): { level: string; color: string; icon: React.ReactNode } => {
  const fundingAbs = Math.abs(data.funding_rate || 0);
  const longShortRatio = data.long_short_ratio || 1;
  
  if (fundingAbs > 0.0005 || longShortRatio > 2 || longShortRatio < 0.5) {
    return { level: 'Overleveraged', color: 'text-red-500 bg-red-500/10', icon: <AlertTriangle className="w-3 h-3" /> };
  }
  if (fundingAbs > 0.0002 || longShortRatio > 1.5 || longShortRatio < 0.67) {
    return { level: 'Loaded', color: 'text-yellow-500 bg-yellow-500/10', icon: <TrendingUp className="w-3 h-3" /> };
  }
  return { level: 'Healthy', color: 'text-green-500 bg-green-500/10', icon: <TrendingDown className="w-3 h-3" /> };
};

const getBias = (longShortRatio: number): string => {
  if (longShortRatio > 1.3) return 'Long-heavy';
  if (longShortRatio < 0.77) return 'Short-heavy';
  return 'Neutral';
};

const formatFunding = (rate: number): string => {
  return `${rate >= 0 ? '+' : ''}${(rate * 100).toFixed(4)}%`;
};

const formatOI = (value: number): string => {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toFixed(0)}`;
};

const formatChange = (change: number): string => {
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
};

const getInsightForAsset = (asset: DerivativeData): string => {
  const funding = asset.funding_rate || 0;
  const lsRatio = asset.long_short_ratio || 1;
  
  if (funding > 0.0003) {
    return 'High positive funding → longs paying shorts, potential squeeze';
  }
  if (funding < -0.0003) {
    return 'Negative funding → shorts paying longs, potential short squeeze';
  }
  if (lsRatio > 1.5) {
    return 'Long-heavy positioning → crowded trade, reversal risk';
  }
  if (lsRatio < 0.67) {
    return 'Short-heavy positioning → potential short squeeze';
  }
  return 'Balanced market conditions';
};

// Expandable tooltip content for each asset
const AssetTooltipContent = ({ asset }: { asset: DerivativeData }) => {
  const risk = getRiskLevel(asset);
  
  return (
    <div className="space-y-2 p-1">
      <div className="font-semibold border-b border-border pb-1">
        {asset.symbol.replace('USDT', '')} Details
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-muted-foreground">Price:</span>
        <span>${asset.price?.toLocaleString() || 'N/A'}</span>
        
        <span className="text-muted-foreground">24h Change:</span>
        <span className={asset.price_change_24h && asset.price_change_24h >= 0 ? 'text-green-500' : 'text-red-500'}>
          {formatChange(asset.price_change_24h || 0)}
        </span>
        
        <span className="text-muted-foreground">L/S Ratio:</span>
        <span>{(asset.long_short_ratio || 1).toFixed(2)}</span>
        
        <span className="text-muted-foreground">Liquidations 24h:</span>
        <span>{formatOI(asset.liquidations_24h || 0)}</span>
      </div>
      <div className="pt-1 border-t border-border text-xs italic text-muted-foreground">
        💡 {getInsightForAsset(asset)}
      </div>
    </div>
  );
};

export const LeveragePanel = () => {
  const { data, isLoading, error } = useDerivativesData();

  const assets = data || [];
  const btcData = assets.find(a => a.symbol === 'BTCUSDT');
  const ethData = assets.find(a => a.symbol === 'ETHUSDT');
  const solData = assets.find(a => a.symbol === 'SOLUSDT');

  // Calculate aggregate stats
  const totalOI = assets.reduce((sum, a) => sum + (a.open_interest_usd || 0), 0);
  const avgFunding = assets.length > 0 
    ? assets.reduce((sum, a) => sum + (a.funding_rate || 0), 0) / assets.length 
    : 0;
  const totalLiquidations = assets.reduce((sum, a) => sum + (a.liquidations_24h || 0), 0);

  // Generate insight
  const generateInsight = (): string => {
    if (!btcData) return 'Loading market data...';
    
    const btcFunding = btcData.funding_rate || 0;
    if (btcFunding > 0.0003) {
      return 'High positive funding → longs paying shorts, potential squeeze setup';
    }
    if (btcFunding < -0.0003) {
      return 'High negative funding → shorts paying longs, potential short squeeze';
    }
    if (totalOI > 30e9) {
      return 'Open Interest elevated → market positioning for major move';
    }
    return 'Market positioning within normal parameters';
  };

  const displayAssets = [btcData, ethData, solData].filter(Boolean) as DerivativeData[];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liquidity & Leverage</CardTitle>
        <CardDescription>Derivatives positioning and risk analysis</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        ) : error || assets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Loading derivatives data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top badges with tooltips */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs">
                  Open Interest: {formatOI(totalOI)}
                </Badge>
                <InfoTooltip content={tooltipContent.openInterest} />
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs">
                  Avg Funding: {formatFunding(avgFunding)}
                </Badge>
                <InfoTooltip content={tooltipContent.fundingRate} />
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs">
                  Liquidations (24h): {formatOI(totalLiquidations)}
                </Badge>
                <InfoTooltip content={tooltipContent.liquidations} />
              </div>
            </div>

            {/* Single table without tabs */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-xs border-b border-border">
                    <th className="text-left py-2 font-medium">Asset</th>
                    <th className="text-right py-2 font-medium">
                      <div className="flex items-center justify-end gap-1">
                        OI
                        <InfoTooltip content={tooltipContent.openInterest} />
                      </div>
                    </th>
                    <th className="text-right py-2 font-medium">
                      <div className="flex items-center justify-end gap-1">
                        Funding
                        <InfoTooltip content={tooltipContent.fundingRate} />
                      </div>
                    </th>
                    <th className="text-right py-2 font-medium">
                      <div className="flex items-center justify-end gap-1">
                        Bias
                        <InfoTooltip content={tooltipContent.bias} />
                      </div>
                    </th>
                    <th className="text-right py-2 font-medium">
                      <div className="flex items-center justify-end gap-1">
                        Risk
                        <InfoTooltip content={tooltipContent.riskLevel} />
                      </div>
                    </th>
                    <th className="text-center py-2 font-medium w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  <TooltipProvider delayDuration={200}>
                    {displayAssets.map((asset) => {
                      const risk = getRiskLevel(asset);
                      return (
                        <tr key={asset.symbol} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3 font-medium">{asset.symbol.replace('USDT', '')}</td>
                          <td className="py-3 text-right">{formatOI(asset.open_interest_usd || 0)}</td>
                          <td className={`py-3 text-right ${(asset.funding_rate || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatFunding(asset.funding_rate || 0)}
                          </td>
                          <td className="py-3 text-right text-muted-foreground">
                            {getBias(asset.long_short_ratio || 1)}
                          </td>
                          <td className="py-3 text-right">
                            <Badge variant="secondary" className={`text-xs ${risk.color}`}>
                              {risk.icon}
                              <span className="ml-1">{risk.level}</span>
                            </Badge>
                          </td>
                          <td className="py-3 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button 
                                  type="button"
                                  className="p-1 rounded-full hover:bg-muted transition-colors"
                                  aria-label={`View ${asset.symbol.replace('USDT', '')} details`}
                                >
                                  <span className="text-sm">ℹ️</span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs">
                                <AssetTooltipContent asset={asset} />
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        </tr>
                      );
                    })}
                  </TooltipProvider>
                </tbody>
              </table>
            </div>

            {/* Insight footer */}
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground italic">
                💡 {generateInsight()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
