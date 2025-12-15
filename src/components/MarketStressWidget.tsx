import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMarketStress } from '@/hooks/useMarketStress';
import { InfoTooltip, tooltipContent } from '@/components/InfoTooltip';

const getGaugeColor = (value: number): string => {
  if (value <= 30) return 'hsl(142, 76%, 36%)'; // Green - Low Stress
  if (value <= 60) return 'hsl(45, 93%, 58%)'; // Yellow - Neutral
  return 'hsl(0, 84%, 60%)'; // Red - High Stress
};

const getTextColorClass = (value: number): string => {
  if (value <= 30) return 'text-green-500';
  if (value <= 60) return 'text-yellow-500';
  return 'text-red-500';
};

export const MarketStressWidget = () => {
  const { data, isLoading, error } = useMarketStress();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Market Stress Index</CardTitle>
            <CardDescription>Derivatives-based risk indicator</CardDescription>
          </div>
          <InfoTooltip content={tooltipContent.marketStress} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : error || !data ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Loading market stress data...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Semi-circle gauge */}
            <div className="relative h-16 w-full max-w-[200px] mx-auto flex items-end justify-center overflow-hidden">
              <svg viewBox="0 0 200 100" className="w-full h-full" preserveAspectRatio="xMidYMax meet">
                {/* Background arc */}
                <path
                  d="M 20 95 A 75 75 0 0 1 180 95"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                
                {/* Gradient arc - reversed: green to red */}
                <defs>
                  <linearGradient id="stressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(142, 76%, 36%)" />
                    <stop offset="30%" stopColor="hsl(142, 71%, 45%)" />
                    <stop offset="50%" stopColor="hsl(45, 93%, 58%)" />
                    <stop offset="70%" stopColor="hsl(25, 95%, 53%)" />
                    <stop offset="100%" stopColor="hsl(0, 84%, 60%)" />
                  </linearGradient>
                </defs>
                
                <path
                  d="M 20 95 A 75 75 0 0 1 180 95"
                  fill="none"
                  stroke="url(#stressGradient)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${((data.value || 0) / 100) * 236} 236`}
                />
                
                {/* Pointer */}
                <line
                  x1="100"
                  y1="95"
                  x2="100"
                  y2="30"
                  stroke="hsl(var(--foreground))"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  transform={`rotate(${((data.value || 0) / 100) * 180 - 90} 100 95)`}
                />
                <circle cx="100" cy="95" r="5" fill="hsl(var(--foreground))" />
              </svg>
            </div>
            
            {/* Value and classification */}
            <div className="text-center space-y-1 pt-2">
              <div className={`text-3xl font-bold ${getTextColorClass(data.value || 50)}`}>
                {data.value}
              </div>
              <div className="text-base font-semibold text-muted-foreground">
                {data.classification}
              </div>
            </div>
            
            {/* Insights */}
            {data.insights && data.insights.length > 0 && (
              <div className="pt-3 border-t border-border mt-3">
                <ul className="space-y-1">
                  {data.insights.slice(0, 3).map((insight, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                      <span className="text-primary">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
