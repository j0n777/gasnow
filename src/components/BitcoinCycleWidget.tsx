import { useBitcoinCycle } from '@/hooks/useBitcoinCycle';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Label
} from 'recharts';

export const BitcoinCycleWidget = () => {
    const { data, isLoading, error } = useBitcoinCycle();
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <Card className="w-full h-[500px]">
                <CardHeader>
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[400px]">
                    <Skeleton className="h-[350px] w-full" />
                </CardContent>
            </Card>
        );
    }

    if (error || !data) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Failed to load Bitcoin Cycle data.</AlertDescription>
            </Alert>
        );
    }

    if (!data.current) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Bitcoin Market Cycle Position</CardTitle>
                    <CardDescription>Cycle position data not yet available.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[200px]">
                    <div className="text-center text-muted-foreground">
                        <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No cycle position data available.</p>
                        <p className="text-xs mt-1">Run the seed-bitcoin-cycle edge function to populate data.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const { current, cycles, stats } = data;

    // Chart Data Preparation
    const chartDataMap = new Map<number, any>();

    // 1. Stats base
    stats.forEach(s => {
        chartDataMap.set(s.blocks_from_halving, {
            block: s.blocks_from_halving,
            avg: s.avg_normalized_price,
            min: s.min_price,
            max: s.max_price
        });
    });

    // 2. Cycles overlay
    Object.entries(cycles).forEach(([cycleNum, points]) => {
        points.forEach((p) => {
            const bucket = Math.round(p.x / 100) * 100;
            const existing = chartDataMap.get(bucket) || { block: bucket };
            existing[`cycle${cycleNum}`] = p.y;
            chartDataMap.set(bucket, existing);
        });
    });

    const chartData = Array.from(chartDataMap.values()).sort((a, b) => a.block - b.block);

    // Calculate Projection
    // 1. Find the last point of Cycle 5 (Current)
    const currentPoints = cycles[5] || [];
    const lastPoint = currentPoints[currentPoints.length - 1];

    if (lastPoint && chartData.length > 0) {
        // 2. Find the corresponding Average value at that block
        // chartData is sorted by block. Find the bucket closest to lastPoint.x
        // We can just look up in the map or find in array.
        const lastBlockBucket = Math.round(lastPoint.x / 100) * 100;
        const statsAtNow = chartData.find(d => d.block === lastBlockBucket);

        if (statsAtNow && statsAtNow.avg !== undefined) {
            const delta = lastPoint.y - statsAtNow.avg;

            // 3. Apply delta to future stats to create projection
            chartData.forEach(d => {
                if (d.block > lastBlockBucket && d.avg !== undefined) {
                    d.projected = d.avg + delta;
                }
            });
        }
    }

    // Calculate approx blocks for predictions to place reference lines
    const blocksPerDay = 144;
    const getBlockOffset = (dateStr: string) => {
        if (!dateStr || !current.cycle_start_date) return 0;
        const d = new Date(dateStr);
        const start = new Date(current.cycle_start_date);
        const days = (d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        return Math.round(days * blocksPerDay);
    };

    const predictedTopBlock = getBlockOffset(current.predicted_top_date);
    const predictedBottomBlock = getBlockOffset(current.predicted_bottom_date);

    const formatTooltip = (value: number, name: string) => {
        if (typeof value !== 'number') return value;
        if (name === 'block') return value;
        return value.toFixed(2);
    };

    const getPhaseColor = (phase: string) => {
        switch (phase) {
            case 'Accumulation': return '#3b82f6';
            case 'Expansion': return '#10b981';
            case 'Euphoria': return '#f59e0b';
            case 'Distribution': return '#ef4444';
            case 'Bear Market': return '#6366f1';
            default: return '#8884d8';
        }
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                        {t('dashboard.bitcoin_cycle', 'Bitcoin Market Cycle')}
                        <span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full font-normal">
                            Cycle 5
                        </span>
                        <Tooltip contentStyle={{ maxWidth: '300px' }}>
                            <div className="cursor-help inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                                <Info className="h-4 w-4" />
                            </div>
                        </Tooltip>
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full relative">
                    {/* Compact Overlay Stats */}
                    <div className="absolute top-2 left-10 z-10 flex gap-4 text-xs font-mono bg-background/80 backdrop-blur-sm p-2 rounded border shadow-sm">
                        <div className="flex flex-col">
                            <span className="text-muted-foreground font-bold text-[10px] uppercase text-yellow-600">Model Top</span>
                            <span className={new Date() > new Date(current.predicted_top_date || '') ? "text-muted-foreground line-through decoration-yellow-600/50" : "text-foreground"}>
                                {current.predicted_top_date ? format(new Date(current.predicted_top_date), 'MMM yyyy') : '-'}
                            </span>
                        </div>
                        <div className="w-px h-8 bg-border"></div>
                        <div className="flex flex-col">
                            <span className="text-muted-foreground font-bold text-[10px] uppercase text-red-600">Model Bottom</span>
                            <span className="text-foreground">
                                {current.predicted_bottom_date ? format(new Date(current.predicted_bottom_date), 'MMM yyyy') : '-'}
                            </span>
                        </div>
                        <div className="w-px h-8 bg-border"></div>
                        <div className="flex flex-col">
                            <span className="text-muted-foreground font-bold text-[10px] uppercase text-blue-600">Next Halving</span>
                            <span className="text-foreground">
                                {current.predicted_next_halving_date ? format(new Date(current.predicted_next_halving_date), 'MMM yyyy') : 'Apr 2028'}
                            </span>
                        </div>
                    </div>

                    {/* Info Icon Top Right */}
                    <div className="absolute top-0 right-0 z-10 p-2">
                        <div className="group relative">
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            <div className="hidden group-hover:block absolute right-0 top-6 w-64 p-3 bg-popover text-popover-foreground text-xs rounded shadow-md border z-50">
                                This chart overlays the current Bitcoin cycle (Cycle 5) against the average path of historical cycles.
                                Dates are projected based on average time-to-top and time-to-bottom.
                            </div>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.05} vertical={false} />
                            <XAxis
                                dataKey="block"
                                type="number"
                                domain={[0, 'auto']}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                tickFormatter={(val) => {
                                    if (!current.cycle_start_date) return '';
                                    const date = new Date(current.cycle_start_date);
                                    const days = val / 144;
                                    date.setDate(date.getDate() + days);
                                    return format(date, 'MMM yy');
                                }}
                                minTickGap={60}
                            />
                            <YAxis domain={['auto', 'auto']} hide />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', backgroundColor: 'rgba(0,0,0,0.9)', color: '#fff' }}
                                itemStyle={{ padding: 0, fontSize: '12px' }}
                                labelStyle={{ color: '#aaa', marginBottom: '4px', fontSize: '11px' }}
                                labelFormatter={(val: number) => {
                                    if (!current.cycle_start_date) return '';
                                    const date = new Date(current.cycle_start_date);
                                    const days = Math.floor(val / 144);
                                    date.setDate(date.getDate() + days);
                                    return `${format(date, 'MMM d, yyyy')} (Day ${days})`;
                                }}
                                formatter={(value: number, name: string) => {
                                    if (name === 'Current') return [value.toFixed(2), 'Cycle 5 Price Multiplier'];
                                    if (name === 'Forecast') return [value.toFixed(2), 'Projected Multiplier'];
                                    if (name === 'Trend') return [value.toFixed(2), 'Hist. Avg Multiplier'];
                                    return [value, name];
                                }}
                            />

                            {/* Lines */}
                            <Line type="monotone" dataKey="avg" stroke="#525252" strokeDasharray="4 4" dot={false} strokeWidth={1} name="Trend" opacity={0.5} />

                            {/* Past Cycles Faint Background */}
                            <Line type="monotone" dataKey="cycle2" stroke="#333" dot={false} strokeWidth={1} opacity={0.1} name="Cycle 2" connectNulls />
                            <Line type="monotone" dataKey="cycle3" stroke="#333" dot={false} strokeWidth={1} opacity={0.1} name="Cycle 3" connectNulls />
                            <Line type="monotone" dataKey="cycle4" stroke="#333" dot={false} strokeWidth={1} opacity={0.1} name="Cycle 4" connectNulls />

                            <Line type="monotone" dataKey="cycle5" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} name="Current" connectNulls />
                            <Line type="monotone" dataKey="projected" stroke="hsl(var(--primary))" strokeDasharray="3 3" strokeWidth={2} dot={false} name="Forecast" connectNulls />

                            {/* Reference Lines */}
                            {current.predicted_top_date && (
                                <ReferenceLine x={predictedTopBlock} stroke="#eab308" strokeDasharray="3 3" strokeOpacity={0.8}>
                                    <Label value="MODEL TOP" position="insideTop" fill="#eab308" fontSize={10} fontWeight="bold" />
                                </ReferenceLine>
                            )}
                            {current.predicted_bottom_date && (
                                <ReferenceLine x={predictedBottomBlock} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.8}>
                                    <Label value="MODEL BOTTOM" position="insideTop" fill="#ef4444" fontSize={10} fontWeight="bold" />
                                </ReferenceLine>
                            )}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
