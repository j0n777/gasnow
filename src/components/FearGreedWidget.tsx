import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFearGreedIndex } from '@/hooks/useFearGreedIndex';

const getGaugeColor = (value: number): string => {
  if (value < 25) return 'hsl(0, 84%, 60%)'; // Red
  if (value < 45) return 'hsl(25, 95%, 53%)'; // Orange
  if (value < 55) return 'hsl(45, 93%, 58%)'; // Yellow
  if (value < 75) return 'hsl(142, 71%, 45%)'; // Green
  return 'hsl(142, 76%, 36%)'; // Emerald
};

const getTextColorClass = (value: number): string => {
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
            {/* Semi-circle gauge */}
            <div className="relative h-20 flex items-end justify-center overflow-hidden mb-2">
              <svg viewBox="0 0 200 110" className="w-full">
                {/* Background arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                
                {/* Gradient arc */}
                <defs>
                  <linearGradient id="fearGreedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(0, 84%, 60%)" />
                    <stop offset="25%" stopColor="hsl(25, 95%, 53%)" />
                    <stop offset="50%" stopColor="hsl(45, 93%, 58%)" />
                    <stop offset="75%" stopColor="hsl(142, 71%, 45%)" />
                    <stop offset="100%" stopColor="hsl(142, 76%, 36%)" />
                  </linearGradient>
                </defs>
                
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="url(#fearGreedGradient)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={`${((data?.value || 0) / 100) * 251} 251`}
                />
                
                {/* Pointer */}
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="35"
                  stroke="hsl(var(--foreground))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  transform={`rotate(${((data?.value || 0) / 100) * 180 - 90} 100 100)`}
                />
                <circle cx="100" cy="100" r="6" fill="hsl(var(--foreground))" />
              </svg>
            </div>
            
            {/* Value and classification */}
            <div className="text-center space-y-1">
              <div className={`text-4xl font-bold ${getTextColorClass(data?.value || 50)}`}>
                {data?.value}
              </div>
              <div className="text-lg font-semibold text-muted-foreground">
                {data?.classification}
              </div>
            </div>
            
            {/* Labels */}
            <div className="flex justify-between text-xs text-muted-foreground pt-4">
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
