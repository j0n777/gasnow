import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, TrendingUp, Rocket } from 'lucide-react';

interface GasPriceCardProps {
  speed: 'slow' | 'standard' | 'fast';
  price: number;
  blockchain: 'ethereum' | 'bitcoin';
  isLoading?: boolean;
}

const speedConfig = {
  slow: {
    icon: TrendingUp,
    label: 'Slow',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  standard: {
    icon: Zap,
    label: 'Standard',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  fast: {
    icon: Rocket,
    label: 'Fast',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
};

export const GasPriceCard = ({ speed, price, blockchain, isLoading }: GasPriceCardProps) => {
  const config = speedConfig[speed];
  const Icon = config.icon;
  const unit = blockchain === 'ethereum' ? 'Gwei' : 'sat/vB';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{config.label}</CardTitle>
          <div className={`p-2 rounded-lg ${config.bgColor}`}>
            <Icon className={`h-5 w-5 ${config.color}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <div className="space-y-1">
            <div className="text-3xl font-bold">
              {price}
              <span className="text-sm font-normal text-muted-foreground ml-2">{unit}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {speed === 'slow' && 'Lower fees, longer wait'}
              {speed === 'standard' && 'Balanced speed & cost'}
              {speed === 'fast' && 'Quick confirmation'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
