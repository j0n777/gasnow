import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Halving constants
const HALVINGS = [
    { cycle: 1, block: 210000, date: new Date('2012-11-28'), price: 12.35 },
    { cycle: 2, block: 420000, date: new Date('2016-07-09'), price: 650.63 },
    { cycle: 3, block: 630000, date: new Date('2020-05-11'), price: 8566.72 },
    { cycle: 4, block: 840000, date: new Date('2024-04-20'), price: 63800.00 },
];

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        console.log('Starting Bitcoin Cycle Seed...');

        // 1. Fetch historical data from CoinGecko (max range)
        // We fetch from 2011 to ensure we cover Cycle 1 pre-halving
        console.log('Fetching historical prices from CoinGecko...');
        const response = await fetch(
            'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=1325376000&to=1924905600'
        );
        const data = await response.json();
        const prices = data.prices; // [timestamp, price][]

        if (!prices || prices.length === 0) {
            throw new Error('No price data returned from CoinGecko');
        }

        console.log(`Fetched ${prices.length} data points`);

        // 2. Process data and map to blocks
        const cycleData: any[] = [];
        const statsMap = new Map<number, number[]>(); // blocks_from_halving -> [normalized_prices]

        for (const [ts, price] of prices) {
            const date = new Date(ts);

            // Determine which cycle this date belongs to
            // We look for the "nearest" halving interactions
            // Actually simpler: Determine cycle based on date ranges

            let currentHalving = HALVINGS[0];
            let cycleNum = 1;

            if (date < HALVINGS[0].date) {
                // Pre-cycle 2 (Cycle 1 ending) - actually let's define cycles by halving-to-halving for simplicity in our graph?
                // Standard definition: Cycle X starts at Halving X-1 and ends at Halving X.
                // But our graph centers on Halving.
                // Let's find the relevant halving for this date.

                // If date is before 2012 halving, it's Cycle 1 context (but usually mapped to 2012 halving as anchor)
                currentHalving = HALVINGS[0]; // Anchor to 2012
                cycleNum = 1; // "Era 1"
            } else if (date < HALVINGS[1].date) {
                currentHalving = HALVINGS[0]; // Anchor to 2012? No, we want overlay. 
                // For overlay, we usually want "Days Since Halving".
                // But our metric is "Blocks From Halving".
                // If we are in 2013, we are +X blocks from 2012 halving.
                currentHalving = HALVINGS[0];
                cycleNum = 2; // The cycle AFTER the 1st halving is often called Cycle 2 (2012-2016)
            } else if (date < HALVINGS[2].date) {
                currentHalving = HALVINGS[1]; // 2016 anchor
                cycleNum = 3; // 2016-2020
            } else if (date < HALVINGS[3].date) {
                currentHalving = HALVINGS[2]; // 2020 anchor
                cycleNum = 4; // 2020-2024
            } else {
                currentHalving = HALVINGS[3]; // 2024 anchor
                cycleNum = 5; // 2024+
            }

            // Calculate approximate block
            const msDiff = date.getTime() - currentHalving.date.getTime();
            const daysDiff = msDiff / (1000 * 60 * 60 * 24);
            // Approx 144 blocks per day
            const blocksDiff = Math.round(daysDiff * 144);

            // Calculate normalized price
            // We normalize against the Halving Price of that cycle
            const normalizedPrice = Math.log(price / currentHalving.price);

            // We only care about data roughly -200k to +200k blocks around halving
            // (Full cycle is ~210k blocks). 
            // Let's cap it slightly to avoid extreme outliers if any

            cycleData.push({
                block_height: currentHalving.block + blocksDiff,
                timestamp: date.toISOString(),
                price_usd: price,
                cycle_number: cycleNum,
                blocks_from_halving: blocksDiff,
                normalized_price: normalizedPrice,
            });

            // Aggregate for stats (only complete cycles 2, 3)
            // Cycle 4 is complete too now. Cycle 5 is current.
            // We want stats from previous completed activity mostly, or all historical?
            // Let's use all historical except current running one for stats, or all?
            // Usually "Historical Average" implies past cycles.
            if (cycleNum >= 2 && cycleNum <= 4) {
                // Bucketize blocks to reduce noise? 
                // Let's keep raw resolution for now, or round to nearest 100 blocks?
                // CoinGecko gives daily data (144 blocks).
                // Let's round `blocksDiff` to nearest 10 or 100 for smoother stats?
                // Let's stick to the daily resolution (approx 144 steps).

                // To make stats usable, we need to group similar "blocks_from_halving".
                // Since dates strictly map to blocks linearly in our approx model, 
                // we might not have overlaps at exact integers.
                // Strategy: Round `blocks_from_halving` to nearest 100 blocks for statistics binning.
                const bin = Math.round(blocksDiff / 100) * 100;
                if (!statsMap.has(bin)) statsMap.set(bin, []);
                statsMap.get(bin)!.push(normalizedPrice);
            }
        }

        // 3. Insert Raw Data
        console.log(`Inserting ${cycleData.length} rows into bitcoin_cycle_data...`);
        // Insert in chunks of 1000
        for (let i = 0; i < cycleData.length; i += 1000) {
            const chunk = cycleData.slice(i, i + 1000);
            const { error } = await supabase.from('bitcoin_cycle_data').insert(chunk);
            if (error) {
                console.error('Error inserting chunk:', error);
                throw error;
            }
        }

        // 4. Calculate and Insert Statistics
        console.log('Calculating statistics...');
        const statsData = [];
        for (const [bin, values] of statsMap.entries()) {
            // Sort for percentiles
            values.sort((a, b) => a - b);

            const count = values.length;
            const sum = values.reduce((a, b) => a + b, 0);
            const avg = sum / count;
            const min = values[0];
            const max = values[count - 1];

            // Std Dev
            const sqDiffs = values.map(v => Math.pow(v - avg, 2));
            const avgSqDiff = sqDiffs.reduce((a, b) => a + b, 0) / count;
            const stdDev = Math.sqrt(avgSqDiff);

            // Percentiles
            const p25 = values[Math.floor(count * 0.25)];
            const p75 = values[Math.floor(count * 0.75)];

            statsData.push({
                blocks_from_halving: bin,
                avg_normalized_price: avg,
                std_deviation: stdDev,
                min_price: min,
                max_price: max,
                percentile_25: p25,
                percentile_75: p75,
                sample_count: count,
            });
        }

        console.log(`Inserting ${statsData.length} stats rows...`);
        // Clear old stats first if any
        await supabase.from('cycle_statistics').delete().neq('id', 0);

        // Insert in chunks
        for (let i = 0; i < statsData.length; i += 1000) {
            const chunk = statsData.slice(i, i + 1000);
            const { error } = await supabase.from('cycle_statistics').insert(chunk);
            if (error) throw error;
        }

        console.log('Seed completed successfully!');

        return new Response(JSON.stringify({ success: true, rows: cycleData.length, stats: statsData.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Seed Error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
