import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAltseasonIndex } from '@/hooks/useAltseasonIndex';

const getColorByPosition = (value: number): string => {
  // Orange (Bitcoin Season) -> Blue (Altseason)
  if (value < 40) return 'hsl(25, 95%, 53%)'; // Orange
  if (value < 50) return 'hsl(45, 93%, 58%)'; // Yellow-orange
  if (value < 60) return 'hsl(200, 80%, 60%)'; // Light blue
  return 'hsl(217, 91%, 60%)'; // Blue
};

export const MarketCycleWidget = () => {
  const { data, isLoading, error } = useAltseasonIndex();

  const value = data?.value || 50;
  const rotation = (value / 100) * 180 - 90; // Convert 0-100 to -90 to 90 degrees

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Cycle</CardTitle>
        <CardDescription>BTC vs Altcoins dominance</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-destructive">Failed to load data</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Semi-circle gauge */}
            <div className="relative h-24 flex items-end justify-center overflow-hidden">
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
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(25, 95%, 53%)" />
                    <stop offset="50%" stopColor="hsl(45, 93%, 58%)" />
                    <stop offset="100%" stopColor="hsl(217, 91%, 60%)" />
                  </linearGradient>
                </defs>
                
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={`${(value / 100) * 251} 251`}
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
                  transform={`rotate(${rotation} 100 100)`}
                />
                <circle cx="100" cy="100" r="6" fill="hsl(var(--foreground))" />
              </svg>
            </div>
            
            {/* Value and classification */}
            <div className="text-center space-y-1">
              <div className="text-4xl font-bold" style={{ color: getColorByPosition(value) }}>
                {value.toFixed(0)}
              </div>
              <div className="text-lg font-semibold text-muted-foreground">
                {data?.classification}
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="relative h-2 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(25,95%,53%)] via-[hsl(45,93%,58%)] to-[hsl(217,91%,60%)]" />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-foreground rounded-full shadow-lg"
                style={{ left: `${value}%` }}
              />
            </div>
            
            {/* Labels */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Bitcoin Season</span>
              <span>Neutral</span>
              <span>Altseason</span>
            </div>
            
            {/* BTC Dominance info */}
            <div className="text-center text-sm text-muted-foreground pt-2 border-t border-border">
              BTC Dominance: {data?.btcDominance?.toFixed(2)}%
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
