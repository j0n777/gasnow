
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// Use Service Role Key for Admin access (bypass RLS)
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials (SERVICE_ROLE_KEY needed) in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const HALVINGS = [
    { cycle: 1, block: 210000, date: new Date('2012-11-28'), price: 12.35 },
    { cycle: 2, block: 420000, date: new Date('2016-07-09'), price: 650.63 },
    { cycle: 3, block: 630000, date: new Date('2020-05-11'), price: 8566.72 },
    { cycle: 4, block: 840000, date: new Date('2024-04-20'), price: 63800.00 },
];

async function seed() {
    console.log('Fetching historical prices from Blockchain.info...');

    const response = await fetch(
        'https://api.blockchain.info/charts/market-price?timespan=all&format=json'
    );

    if (!response.ok) {
        throw new Error(`Blockchain.info API error: ${response.status}`);
    }

    const data = await response.json();
    const values = data.values;

    if (!values || values.length === 0) {
        throw new Error('No price data returned');
    }

    console.log(`Fetched ${values.length} data points. Processing...`);

    const cycleData = [];
    const statsMap = new Map();

    for (const point of values) {
        const ts = point.x * 1000; // seconds to ms
        const price = point.y;

        const date = new Date(ts);
        let currentHalving = HALVINGS[0];
        let cycleNum = 1;

        if (date < HALVINGS[0].date) {
            currentHalving = HALVINGS[0];
            cycleNum = 1;
        } else if (date < HALVINGS[1].date) {
            currentHalving = HALVINGS[0];
            cycleNum = 2;
        } else if (date < HALVINGS[2].date) {
            currentHalving = HALVINGS[1];
            cycleNum = 3;
        } else if (date < HALVINGS[3].date) {
            currentHalving = HALVINGS[2];
            cycleNum = 4;
        } else {
            currentHalving = HALVINGS[3];
            cycleNum = 5;
        }

        const msDiff = date.getTime() - currentHalving.date.getTime();
        const daysDiff = msDiff / (1000 * 60 * 60 * 24);
        const blocksDiff = Math.round(daysDiff * 144);

        if (price <= 0) continue;

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
            statsMap.get(bin).push(normalizedPrice);
        }
    }

    console.log(`Inserting ${cycleData.length} rows...`);

    // Clear old data to avoid conflicts
    console.log('Clearing old data...');
    let { error: delError } = await supabase.from('bitcoin_cycle_data').delete().neq('id', 0);
    if (delError) console.error('Error clearing cycle data:', delError);

    console.log(`Inserting ${cycleData.length} rows...`);

    for (let i = 0; i < cycleData.length; i += 1000) {
        const chunk = cycleData.slice(i, i + 1000);
        // Use standard insert since we cleared table
        const { error } = await supabase.from('bitcoin_cycle_data').insert(chunk);
        if (error) console.error('Error inserting data chunk:', error);
        else process.stdout.write('.');
    }
    console.log('\nData inserted.');

    console.log('Calculating stats...');
    const statsData = [];
    for (const [bin, values] of statsMap.entries()) {
        values.sort((a, b) => a - b);
        const count = values.length;
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / count;
        const sqDiffs = values.map(v => Math.pow(v - avg, 2));
        const stdDev = Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / count);

        statsData.push({
            blocks_from_halving: bin,
            avg_normalized_price: avg,
            std_deviation: stdDev,
            min_price: values[0],
            max_price: values[count - 1],
            percentile_25: values[Math.floor(count * 0.25)],
            percentile_75: values[Math.floor(count * 0.75)],
            sample_count: count,
        });
    }

    console.log(`Inserting ${statsData.length} stats rows...`);
    await supabase.from('cycle_statistics').delete().neq('id', 0); // Clear old stats

    for (let i = 0; i < statsData.length; i += 1000) {
        const chunk = statsData.slice(i, i + 1000);
        const { error } = await supabase.from('cycle_statistics').insert(chunk);
        if (error) console.error('Error inserting stats chunk:', error);
    }

    console.log('Seed complete!');
}

seed().catch(console.error);
