import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrendingTokens } from '@/hooks/useTrendingTokens';
import { TrendingUp, Award, Crown } from 'lucide-react';

export const TrendingTokens = () => {
  const { data, isLoading, error } = useTrendingTokens();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Leaders</CardTitle>
        <CardDescription>Top performing tokens</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trending">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trending">
              <TrendingUp className="h-4 w-4 mr-1" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="gainers">
              <Award className="h-4 w-4 mr-1" />
              Gainers
            </TabsTrigger>
            <TabsTrigger value="top5">
              <Crown className="h-4 w-4 mr-1" />
              Top 5
            </TabsTrigger>
          </TabsList>

          {['trending', 'gainers', 'top5'].map((type) => (
            <TabsContent key={type} value={type} className="mt-4">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-4">
                  <p className="text-sm text-destructive">Failed to load</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data?.[type as keyof typeof data]?.map((token, index) => (
                    <div
                      key={token.id}
                      className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-sm">{token.name}</p>
                          <p className="text-xs text-muted-foreground uppercase">
                            {token.symbol}
                          </p>
                        </div>
                      </div>
                      {token.market_cap_rank && (
                        <span className="text-xs text-muted-foreground">
                          Rank #{token.market_cap_rank}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
