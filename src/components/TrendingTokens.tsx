import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrendingTokens } from '@/hooks/useTrendingTokens';
import { TrendingUp, Award, Crown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export const TrendingTokens = () => {
  const { data, isLoading, error } = useTrendingTokens();

  const renderTokenList = (tokens: any[], title: string, icon: React.ReactNode) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {icon}
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-xs text-destructive">Failed to load</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tokens?.slice(0, 5).map((token, index) => (
            <div 
              key={token.id}
              className="flex items-center justify-between text-sm hover:bg-muted/50 p-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs text-muted-foreground font-medium">#{index + 1}</span>
                <img 
                  src={token.image_url || `https://assets.coingecko.com/coins/images/${token.token_id}/small/${token.token_id}.png`}
                  alt={token.symbol}
                  className="w-5 h-5 rounded-full"
                  onError={(e) => { 
                    e.currentTarget.src = '/images/default-crypto-news.jpg'; 
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-xs truncate">{token.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">
                    {token.symbol}
                  </p>
                </div>
              </div>
              
              {/* Sparkline chart */}
              {token.sparkline_7d && token.sparkline_7d.length > 0 && (
                <div className="w-16 h-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={token.sparkline_7d.map((value: number) => ({ value }))}>
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={token.change_24h >= 0 ? '#22c55e' : '#ef4444'}
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              <div className="text-right">
                {token.price && (
                  <p className="text-xs font-semibold">
                    ${token.price.toFixed(2)}
                  </p>
                )}
                {token.change_24h !== undefined && token.change_24h !== null && (
                  <p className={`text-[10px] font-medium ${
                    token.change_24h > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {token.change_24h > 0 ? '+' : ''}
                    {token.change_24h.toFixed(2)}%
                  </p>
                )}
                {token.market_cap_rank && !token.price && (
                  <p className="text-[10px] text-muted-foreground">
                    Rank #{token.market_cap_rank}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Leaders</CardTitle>
        <CardDescription>Top performing tokens</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderTokenList(
            data?.trending || [], 
            'Trending',
            <TrendingUp className="h-4 w-4 text-blue-500" />
          )}
          
          {renderTokenList(
            data?.gainers || [], 
            'Gainers',
            <Award className="h-4 w-4 text-green-500" />
          )}
          
          {renderTokenList(
            data?.top5 || [], 
            'Top 5',
            <Crown className="h-4 w-4 text-yellow-500" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
