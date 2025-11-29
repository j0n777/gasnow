import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGlobalMarketCap } from '@/hooks/useCryptoPrices';
import { useMarketCapHistory } from '@/hooks/useMarketCapHistory';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

export const MarketStats = () => {
  const { data, isLoading, error } = useGlobalMarketCap();
  const { data: historyData, isLoading: historyLoading } = useMarketCapHistory(30);

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <div className="grid gap-4">
      <Card className="relative overflow-hidden">
        {/* Background chart */}
        {!historyLoading && historyData && historyData.length > 0 && (
          <div className="absolute inset-0 opacity-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="marketCapGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis domain={['dataMin', 'dataMax']} hide />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#marketCapGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <CardHeader className="relative z-10">
          <CardTitle className="text-lg">Global Market</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-32" />
            </>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-sm text-destructive">Failed to load</p>
            </div>
          ) : (
            <>
              {/* Total Market Cap */}
              <div>
                <p className="text-sm text-muted-foreground">Total Market Cap</p>
                <p className="text-3xl font-bold">
                  {formatLargeNumber(data?.totalMarketCap || 0)}
                </p>
              </div>
              
              {/* 24h Volume */}
              <div>
                <p className="text-sm text-muted-foreground">24h Volume</p>
                <p className="text-2xl font-bold">
                  {formatLargeNumber(data?.totalVolume24h || 0)}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
