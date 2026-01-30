import { useBitcoinCycle, CycleDataPoint } from '@/hooks/useBitcoinCycle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import {
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    ReferenceArea
} from 'recharts';

export const BitcoinCycleWidget = () => {
    const { data, isLoading, error } = useBitcoinCycle();

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

    // Check if current cycle position data exists
    if (!data.current) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Bitcoin Market Cycle Position</CardTitle>
                    <CardDescription>Cycle position data not yet available. Please wait for the next data sync.</CardDescription>
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

    // Prepare chart data
    // We need a unified X-axis domain to plot multiple lines. 
    // We can just pass the arrays to Recharts if we format it right, 
    // but Recharts ComposedChart usually likes a single array of objects with keys for lines.
    // However, for uneven series (cycles have different lengths), it's better to allow "connectNulls" or pre-process.
    // Since we have "stats" which covers the whole range, we can use that as the base array 
    // and merge cycle data into it by matching "blocks_from_halving".

    // Create a map from block to object
    const chartDataMap = new Map<number, any>();

    // 1. Populate with stats (base layer)
    stats.forEach(s => {
        chartDataMap.set(s.blocks_from_halving, {
            block: s.blocks_from_halving,
            avg: s.avg_normalized_price,
            p25: s.percentile_25,
            p75: s.percentile_75,
            // band: [s.percentile_25, s.percentile_75] // Area expects a tuple? No, usually range data
        });
    });

    // 2. Merge cycles
    Object.entries(cycles).forEach(([cycleNum, points]) => {
        points.forEach((p) => {
            // Find nearest bucket or map directly if we match resolution.
            // Stats are bucketed by 100. Points might be daily (144).
            // Let's bucket points to 100 too for chart alignment?
            const bucket = Math.round(p.x / 100) * 100;

            const existing = chartDataMap.get(bucket) || { block: bucket };
            existing[`cycle${cycleNum}`] = p.y;
            chartDataMap.set(bucket, existing);
        });
    });

    // 3. Convert to array and sort
    const chartData = Array.from(chartDataMap.values()).sort((a, b) => a.block - b.block);

    // Tooltip formatter
    const formatTooltip = (value: number, name: string) => {
        if (name === 'block') return value;
        return value ? value.toFixed(2) : 'N/A';
    };

    // Phase colors
    const getPhaseColor = (phase: string) => {
        switch (phase) {
            case 'Accumulation': return 'hsl(var(--primary))'; // Blue-ish usually or Orange
            case 'Expansion': return '#10b981'; // Green
            case 'Euphoria': return '#f59e0b'; // Yellow/Orange
            case 'Distribution': return '#ef4444'; // Red
            case 'Bear Market': return '#6366f1'; // Indigo
            default: return '#8884d8';
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            Bitcoin Market Cycle Position
                            <span className="text-xs px-2 py-1 bg-secondary rounded-full font-normal opacity-70">
                                Cycle 5 (Current)
                            </span>
                        </CardTitle>
                        <CardDescription>
                            Block-based analysis relative to Halving (Block {current.current_halving_block.toLocaleString()})
                        </CardDescription>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: getPhaseColor(current.phase) }}>
                            {current.phase}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Confidence: {(current.phase_confidence * 100).toFixed(0)}%
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis
                                dataKey="block"
                                type="number"
                                domain={['dataMin', 'dataMax']}
                                tickFormatter={(val) => Math.round(val / 1000) + 'k'}
                                label={{ value: 'Blocks from Halving', position: 'bottom', offset: 0 }}
                            />
                            <YAxis
                                label={{ value: 'Norm Price (Log)', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip
                                labelFormatter={(label) => `Block Offset: ${label}`}
                                formatter={formatTooltip}
                            />

                            {/* Stats Band - using Area for p25 to p75? 
                  Recharts Area is usually 0 to value. For range, use [p25, p75] with type="range" (recharts v2.13+ supports area range)
                  If v2.12 doesn't support range area easily, we can simulate with stacked or just show average line.
                  Let's show Average line + simple lines for cycles.
              */}
                            <Line
                                type="monotone"
                                dataKey="avg"
                                stroke="#666"
                                strokeDasharray="5 5"
                                strokeWidth={1}
                                dot={false}
                                name="Hist. Average"
                            />

                            {/* Historical Cycles */}
                            <Line type="monotone" dataKey="cycle2" stroke="#ccc" dot={false} strokeWidth={1} name="Cycle 2 (2012)" connectNulls />
                            <Line type="monotone" dataKey="cycle3" stroke="#999" dot={false} strokeWidth={1} name="Cycle 3 (2016)" connectNulls />
                            <Line type="monotone" dataKey="cycle4" stroke="#666" dot={false} strokeWidth={1} name="Cycle 4 (2020)" connectNulls />

                            {/* Current Cycle */}
                            <Line
                                type="monotone"
                                dataKey="cycle5"
                                stroke="hsl(var(--primary))"
                                strokeWidth={3}
                                dot={false}
                                name="Cycle 5 (2024)"
                                connectNulls
                            />

                            {/* Current Position Marker */}
                            <ReferenceLine x={current.blocks_from_halving} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label="YOU ARE HERE" />

                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="text-xs text-muted-foreground uppercase">Current Block</div>
                        <div className="text-lg font-mono font-medium">{current.current_block.toLocaleString()}</div>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="text-xs text-muted-foreground uppercase">From Halving</div>
                        <div className={current.blocks_from_halving > 0 ? "text-lg font-mono font-medium text-green-500" : "text-lg font-mono font-medium"}>
                            {current.blocks_from_halving > 0 ? '+' : ''}{current.blocks_from_halving.toLocaleString()}
                        </div>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="text-xs text-muted-foreground uppercase">Price Norm.</div>
                        <div className="text-lg font-mono font-medium">{current.normalized_price.toFixed(3)}</div>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="text-xs text-muted-foreground uppercase">Hist. Percentile</div>
                        <div className="text-lg font-mono font-medium">{(current.historical_percentile * 100).toFixed(1)}%</div>
                    </div>
                </div>

                <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="h-4 w-4 mt-0.5" />
                    <p>
                        This metric estimates the current market phase based on historical halving cycles and block-based supply dynamics.
                        Past performance does not guarantee future results. This is not financial advice.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
