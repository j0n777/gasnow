import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Halving constants
// Halving constants (Historical)
const HALVINGS = [
    { cycle: 1, block: 210000, date: new Date('2012-11-28'), price: 12.35 },
    { cycle: 2, block: 420000, date: new Date('2016-07-09'), price: 650.63 },
    { cycle: 3, block: 630000, date: new Date('2020-05-11'), price: 8566.72 },
    { cycle: 4, block: 840000, date: new Date('2024-04-20'), price: 63800.00 },
];

const ONE_DAY_MS = 1000 * 60 * 60 * 24;
const BLOCKS_PER_CYCLE = 210000;
const TARGET_BLOCK_TIME_MINS = 10;

// Helper to project future halvings if needed
const getHalvingsRegistry = () => {
    const registry = [...HALVINGS];
    const now = new Date();

    // Project up to 2 cycles ahead just in case
    while (true) {
        const last = registry[registry.length - 1];
        // Approx days per cycle: 210000 * 10 / 60 / 24 = 1458.33
        const nextDate = new Date(last.date.getTime() + (1458.33 * ONE_DAY_MS));

        if (nextDate.getFullYear() > now.getFullYear() + 4) break;

        registry.push({
            cycle: last.cycle + 1,
            block: last.block + BLOCKS_PER_CYCLE,
            date: nextDate,
            price: 0 // Unknown
        });
    }
    return registry;
};


Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        console.log('Starting Bitcoin Cycle Seed on v3 (CryptoCompare)...');

        // 1. Fetch historical data from CryptoCompare
        const fetchCryptoCompare = async (limit: number, toTs?: number) => {
            let url = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&limit=${limit}`;
            if (toTs) url += `&toTs=${toTs}`;

            console.log(`Fetching from ${url}...`);
            const res = await fetch(url);
            if (!res.ok) throw new Error(`CryptoCompare API Error: ${res.status}`);
            const json = await res.json();
            if (json.Response === 'Error') throw new Error(json.Message);
            return json.Data.Data; // Array of { time, close, ... }
        };

        const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

        let allPoints: any[] = [];
        let currentToTs = Math.floor(Date.now() / 1000);
        const earliestTs = Math.floor(new Date('2011-01-01').getTime() / 1000);

        // Fetch backwards until we reach 2011
        while (true) {
            const data = await fetchCryptoCompare(2000, currentToTs);
            if (!data || data.length === 0) break;

            const firstTime = data[0].time;
            const lastTime = data[data.length - 1].time;

            console.log(`Fetched chunk: ${new Date(firstTime * 1000).toISOString()} to ${new Date(lastTime * 1000).toISOString()}`);

            allPoints.push(...data);

            if (firstTime <= earliestTs) break;

            currentToTs = firstTime - 86400; // Go back one day before the start of this chunk
            await sleep(500); // Be nice
        }

        // Sort by time and remove duplicates
        allPoints.sort((a, b) => a.time - b.time);
        const uniqueMap = new Map();
        allPoints.forEach(p => uniqueMap.set(p.time, p.close));

        const prices = Array.from(uniqueMap.entries())
            .filter(([t, p]) => t >= earliestTs)
            .map(([t, p]) => [t * 1000, p]);

        console.log(`Total data points: ${prices.length}`);

        // 2. Process data and map to blocks
        const cycleData: any[] = [];
        const statsMap = new Map<number, number[]>();



        const allHalvings = getHalvingsRegistry();

        const cycleStats: Record<number, {
            start_date: Date,
            top_price: number,
            top_date: Date | null,
            bottom_price: number,
            bottom_date: Date | null,
            halving_date: Date
        }> = {};

        for (let i = 0; i < allHalvings.length; i++) {
            cycleStats[i + 1] = {
                start_date: allHalvings[i].date,
                top_price: 0,
                top_date: null,
                bottom_price: Infinity,
                bottom_date: null,
                halving_date: allHalvings[i].date
            };
        }

        let currentPrice = 0;

        for (const [ts, price] of prices) {
            const date = new Date(ts);
            currentPrice = price;

            let currentHalvingI = -1;
            let cycleNum = 0;

            for (let i = 0; i < allHalvings.length; i++) {
                if (date >= allHalvings[i].date) {
                    currentHalvingI = i;
                }
            }

            if (currentHalvingI === -1) {
                cycleNum = 1;
            } else {
                cycleNum = currentHalvingI + 2;
            }

            if (cycleNum < 2) continue;

            const currentHalving = HALVINGS[currentHalvingI];

            const msDiff = date.getTime() - currentHalving.date.getTime();
            const daysDiff = msDiff / ONE_DAY_MS;
            const blocksDiff = Math.round(daysDiff * 144);
            const normalizedPrice = Math.log(price / currentHalving.price);

            cycleData.push({
                block_height: currentHalving.block + blocksDiff,
                timestamp: date.toISOString(),
                price_usd: price,
                cycle_number: cycleNum,
                blocks_from_halving: blocksDiff,
                normalized_price: normalizedPrice,
            });

            if (cycleNum >= 2 && cycleNum <= 4) {
                const bin = Math.round(blocksDiff / 100) * 100;
                if (!statsMap.has(bin)) statsMap.set(bin, []);
                statsMap.get(bin)!.push(normalizedPrice);
            }
        }

        // Analyze Cycles for Durations
        const durationStats = [];

        for (let c = 2; c <= 4; c++) {
            const cyclePoints = cycleData.filter(d => d.cycle_number === c);
            if (cyclePoints.length === 0) continue;

            const halvingDate = allHalvings[c - 2].date;
            const nextHalvingDate = allHalvings[c - 1].date;

            // Exclude last 9 months (270 days) to avoid pre-halving rallies
            const cutoffDate = new Date(nextHalvingDate.getTime() - (270 * ONE_DAY_MS));

            let topPrice = -1;
            let topDate = null;
            let topIndex = -1;

            for (let i = 0; i < cyclePoints.length; i++) {
                const pDate = new Date(cyclePoints[i].timestamp);
                if (pDate > cutoffDate) continue; // Skip pre-halving rally phase

                if (cyclePoints[i].price_usd > topPrice) {
                    topPrice = cyclePoints[i].price_usd;
                    topDate = pDate;
                    topIndex = i;
                }
            }

            if (!topDate) continue;

            const daysHalvingToTop = (topDate.getTime() - halvingDate.getTime()) / ONE_DAY_MS;

            let bottomPrice = Infinity;
            let bottomDate = null;

            for (let i = topIndex + 1; i < cyclePoints.length; i++) {
                if (cyclePoints[i].price_usd < bottomPrice) {
                    bottomPrice = cyclePoints[i].price_usd;
                    bottomDate = new Date(cyclePoints[i].timestamp);
                }
            }

            const daysTopToBottom = bottomDate
                ? (bottomDate.getTime() - topDate.getTime()) / ONE_DAY_MS
                : 0;

            const daysBottomToNextHalving = bottomDate
                ? (nextHalvingDate.getTime() - bottomDate.getTime()) / ONE_DAY_MS
                : 0;

            console.log(`Cycle ${c}: Top ${daysHalvingToTop.toFixed(0)}d after halving. Bottom ${daysTopToBottom.toFixed(0)}d after top.`);

            durationStats.push({
                cycle: c,
                topDate: topDate.toISOString().split('T')[0],
                bottomDate: bottomDate?.toISOString().split('T')[0],
                daysHalvingToTop,
                daysTopToBottom,
                daysBottomToNextHalving
            });
        }

        // Calculate Averages
        const avgHalvingToTop = durationStats.reduce((sum, s) => sum + s.daysHalvingToTop, 0) / durationStats.length;
        const avgTopToBottom = durationStats.reduce((sum, s) => sum + s.daysTopToBottom, 0) / durationStats.length;

        console.log(`Averages: H->T ${avgHalvingToTop.toFixed(1)}d, T->B ${avgTopToBottom.toFixed(1)}d`);

        const currentCycleStart = allHalvings[3].date;
        const predictedTopDate = new Date(currentCycleStart.getTime() + avgHalvingToTop * ONE_DAY_MS);
        const predictedBottomDate = new Date(predictedTopDate.getTime() + avgTopToBottom * ONE_DAY_MS);

        // Use the dynamically calculated next halving date (Cycle 6 start)
        // allHalvings[4] corresponds to the 2028 halving (Cycle 5 end / Cycle 6 start)
        // If it exists in registry, use it. Else calculate.
        let predictedNextHalving = new Date('2028-04-17');
        if (allHalvings.length > 4) {
            predictedNextHalving = allHalvings[4].date;
        }

        // 3. Insert Raw Data
        console.log(`Inserting ${cycleData.length} rows into bitcoin_cycle_data...`);
        const { error: delError } = await supabase.from('bitcoin_cycle_data').delete().neq('id', 0);
        if (delError) console.error('Error clearing old data:', delError);

        for (let i = 0; i < cycleData.length; i += 2000) {
            const chunk = cycleData.slice(i, i + 2000);
            const { error } = await supabase.from('bitcoin_cycle_data').insert(chunk);
            if (error) console.error('Error inserting chunk:', error);
        }

        // 4. Calculate and Insert Statistics
        console.log('Calculating and inserting statistics...');
        const statsData = [];
        for (const [bin, values] of statsMap.entries()) {
            values.sort((a, b) => a - b);
            const count = values.length;
            const sum = values.reduce((a, b) => a + b, 0);
            const avg = sum / count;
            const p25 = values[Math.floor(count * 0.25)];
            const p75 = values[Math.floor(count * 0.75)];
            const min = values[0];
            const max = values[count - 1];

            const sqDiffs = values.map(v => Math.pow(v - avg, 2));
            const stdDev = Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / count);

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

        await supabase.from('cycle_statistics').delete().neq('id', 0);
        for (let i = 0; i < statsData.length; i += 1000) {
            const chunk = statsData.slice(i, i + 1000);
            const { error } = await supabase.from('cycle_statistics').insert(chunk);
            if (error) console.error('Stats insert error:', error);
        }

        // 5. Populate Current Cycle Position
        console.log('Populating current_cycle_position...');

        const now = new Date();
        const msSinceHalving = now.getTime() - currentCycleStart.getTime();
        const daysSinceHalving = msSinceHalving / ONE_DAY_MS;
        const currentBlocksFromHalving = Math.round(daysSinceHalving * 144);
        const currentBlock = 840000 + currentBlocksFromHalving;

        const cv = allHalvings[3].price;
        const currentNormPrice = Math.log(currentPrice / cv);

        let phase = 'Accumulation';
        if (daysSinceHalving > 365) phase = 'Expansion';
        if (daysSinceHalving > 500) phase = 'Euphoria';

        const currentBin = Math.round(currentBlocksFromHalving / 100) * 100;
        const currentStats = statsData.find(s => s.blocks_from_halving === currentBin);

        let percentile = 0.5;
        if (currentStats) {
            if (currentNormPrice < currentStats.min_price) percentile = 0;
            else if (currentNormPrice > currentStats.max_price) percentile = 1;
            else {
                const range = currentStats.max_price - currentStats.min_price;
                percentile = (currentNormPrice - currentStats.min_price) / range;
            }
        }

        await supabase.from('current_cycle_position').delete().neq('id', 0);
        const { error: posError } = await supabase.from('current_cycle_position').insert({
            current_block: currentBlock,
            current_halving_block: 840000,
            blocks_from_halving: currentBlocksFromHalving,
            cycle_progress: daysSinceHalving / (365 * 4),
            current_price: currentPrice,
            normalized_price: currentNormPrice,
            historical_percentile: percentile,
            phase: phase,
            phase_confidence: 0.85,
            cycle_start_date: currentCycleStart.toISOString(),
            predicted_top_date: predictedTopDate.toISOString(),
            predicted_bottom_date: predictedBottomDate.toISOString(),
            predicted_next_halving_date: predictedNextHalving.toISOString()
        });

        if (posError) console.error('Position insert error:', posError);

        return new Response(JSON.stringify({
            success: true,
            source: 'CryptoCompare',
            predictions: {
                avgHalvingToTop,
                predictedTopDate,
            },
            cycle_breakdown: durationStats
        }), {
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
