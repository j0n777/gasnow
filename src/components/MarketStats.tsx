import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGlobalMarketCap } from '@/hooks/useCryptoPrices';
import { TrendingUp, Activity, PieChart } from 'lucide-react';

export const MarketStats = () => {
  const { data, isLoading, error } = useGlobalMarketCap();

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const stats = [
    {
      icon: TrendingUp,
      label: 'Total Market Cap',
      value: data?.totalMarketCap || 0,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Activity,
      label: '24h Volume',
      value: data?.totalVolume24h || 0,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: PieChart,
      label: 'BTC Dominance',
      value: `${data?.btcDominance.toFixed(1)}%` || '0%',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      isPercentage: true,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-sm text-destructive">Failed to load</p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">
                    {stat.isPercentage ? stat.value : formatLargeNumber(Number(stat.value))}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
