import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGlobalMarketCap } from '@/hooks/useCryptoPrices';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export const MarketStats = () => {
  const { data, isLoading, error } = useGlobalMarketCap();

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  // Generate mock trend data for mini chart
  const chartData = Array.from({ length: 7 }, (_, i) => ({ 
    value: Math.random() * 0.2 + 2.9 
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Combined Market Cap + Volume */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Global Market</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-16 w-full" />
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
              
              {/* Mini chart */}
              <ResponsiveContainer width="100%" height={60}>
                <LineChart data={chartData}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* BTC Dominance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">BTC Dominance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-12 w-24" />
              <Skeleton className="h-2 w-full" />
            </>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-sm text-destructive">Failed to load</p>
            </div>
          ) : (
            <>
              <div className="text-4xl font-bold">
                {data?.btcDominance?.toFixed(2)}%
              </div>
              <Progress value={data?.btcDominance} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
