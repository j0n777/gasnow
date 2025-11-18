import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAltseasonIndex } from '@/hooks/useAltseasonIndex';
import { Progress } from '@/components/ui/progress';

const getColorByValue = (value: number) => {
  if (value < 40) return 'text-red-500';
  if (value < 50) return 'text-orange-500';
  if (value < 60) return 'text-yellow-500';
  return 'text-green-500';
};

export const AltseasonWidget = () => {
  const { data, isLoading } = useAltseasonIndex();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Altseason Index</CardTitle>
        <CardDescription>Market cycle indicator</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-full" />
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
              <div className="text-xs text-muted-foreground">
                BTC Dominance: {data?.btcDominance}%
              </div>
            </div>
            
            <Progress value={data?.value} className="h-2" />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Bitcoin Season</span>
              <span>Neutral</span>
              <span>Altseason</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
