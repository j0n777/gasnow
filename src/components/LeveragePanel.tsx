import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDerivativesData, DerivativeData } from '@/hooks/useDerivativesData';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

const getRiskLevel = (data: DerivativeData): { level: string; color: string; icon: React.ReactNode } => {
  const fundingAbs = Math.abs(data.funding_rate || 0);
  const longShortRatio = data.long_short_ratio || 1;
  
  // High risk: extreme funding (>0.05%) or very unbalanced L/S ratio
  if (fundingAbs > 0.0005 || longShortRatio > 2 || longShortRatio < 0.5) {
    return { level: 'Overleveraged', color: 'text-red-500 bg-red-500/10', icon: <AlertTriangle className="w-3 h-3" /> };
  }
  // Medium risk
  if (fundingAbs > 0.0002 || longShortRatio > 1.5 || longShortRatio < 0.67) {
    return { level: 'Loaded', color: 'text-yellow-500 bg-yellow-500/10', icon: <TrendingUp className="w-3 h-3" /> };
  }
  // Low risk
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

export const LeveragePanel = () => {
  const { data, isLoading, error } = useDerivativesData();
  const [selectedAsset, setSelectedAsset] = useState('all');

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
            {/* Top badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                Open Interest: {formatOI(totalOI)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Avg Funding: {formatFunding(avgFunding)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Liquidations (24h): {formatOI(totalLiquidations)}
              </Badge>
            </div>

            {/* Asset tabs */}
            <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedAsset}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="btc">BTC</TabsTrigger>
                <TabsTrigger value="eth">ETH</TabsTrigger>
                <TabsTrigger value="sol">SOL</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground text-xs border-b border-border">
                        <th className="text-left py-2 font-medium">Asset</th>
                        <th className="text-right py-2 font-medium">OI</th>
                        <th className="text-right py-2 font-medium">Funding</th>
                        <th className="text-right py-2 font-medium">Bias</th>
                        <th className="text-right py-2 font-medium">Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[btcData, ethData, solData].filter(Boolean).map((asset) => {
                        if (!asset) return null;
                        const risk = getRiskLevel(asset);
                        return (
                          <tr key={asset.symbol} className="border-b border-border/50">
                            <td className="py-2 font-medium">{asset.symbol.replace('USDT', '')}</td>
                            <td className="py-2 text-right">{formatOI(asset.open_interest_usd || 0)}</td>
                            <td className={`py-2 text-right ${(asset.funding_rate || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatFunding(asset.funding_rate || 0)}
                            </td>
                            <td className="py-2 text-right text-muted-foreground">
                              {getBias(asset.long_short_ratio || 1)}
                            </td>
                            <td className="py-2 text-right">
                              <Badge variant="secondary" className={`text-xs ${risk.color}`}>
                                {risk.icon}
                                <span className="ml-1">{risk.level}</span>
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              
              {['btc', 'eth', 'sol'].map((coin) => {
                const assetData = coin === 'btc' ? btcData : coin === 'eth' ? ethData : solData;
                if (!assetData) return null;
                const risk = getRiskLevel(assetData);
                
                return (
                  <TabsContent key={coin} value={coin} className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Open Interest</p>
                        <p className="text-lg font-bold">{formatOI(assetData.open_interest_usd || 0)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Funding Rate</p>
                        <p className={`text-lg font-bold ${(assetData.funding_rate || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatFunding(assetData.funding_rate || 0)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">L/S Ratio</p>
                        <p className="text-lg font-bold">{(assetData.long_short_ratio || 1).toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Risk Level</p>
                        <Badge variant="secondary" className={`${risk.color}`}>
                          {risk.icon}
                          <span className="ml-1">{risk.level}</span>
                        </Badge>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <p className="text-xs text-muted-foreground">Price (24h)</p>
                        <p className="text-lg font-bold">
                          ${assetData.price?.toLocaleString() || 'N/A'}
                          <span className={`ml-2 text-sm ${(assetData.price_change_24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatChange(assetData.price_change_24h || 0)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>

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
