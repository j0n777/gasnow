import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFearGreedIndex } from '@/hooks/useFearGreedIndex';
import { Progress } from '@/components/ui/progress';

const getColorByValue = (value: number) => {
  if (value < 25) return 'text-red-500';
  if (value < 45) return 'text-orange-500';
  if (value < 55) return 'text-yellow-500';
  if (value < 75) return 'text-green-500';
  return 'text-emerald-500';
};

export const FearGreedWidget = () => {
  const { data, isLoading, error } = useFearGreedIndex();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fear & Greed Index</CardTitle>
        <CardDescription>Market sentiment indicator</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-destructive">Failed to load data</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className={`text-5xl font-bold ${getColorByValue(data?.value || 50)}`}>
                {data?.value}
              </div>
              <div className="text-lg font-semibold text-muted-foreground">
                {data?.classification}
              </div>
            </div>
            
            <Progress value={data?.value} className="h-2" />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Extreme Fear</span>
              <span>Neutral</span>
              <span>Extreme Greed</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
