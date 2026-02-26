
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://mddqwppgucgzefzddajy.supabase.co';
// CRITICAL: Use Service Role Key to bypass RLS policies for Update
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

const HALVINGS = [
    { cycle: 1, block: 210000, date: new Date('2012-11-28'), price: 12.35 },
    { cycle: 2, block: 420000, date: new Date('2016-07-09'), price: 650.63 },
    { cycle: 3, block: 630000, date: new Date('2020-05-11'), price: 8566.72 },
    { cycle: 4, block: 840000, date: new Date('2024-04-20'), price: 63800.00 },
];

async function main() {
    console.log('Starting Smart Cycle Update...');

    // 1. Fetch Cycle 5 Data
    const { data: cycle5Data, error } = await supabase
        .from('bitcoin_cycle_data')
        .select('*')
        .eq('cycle_number', 5)
        .order('timestamp', { ascending: true });

    if (error) {
        console.error('Error fetching Cycle 5 data:', error);
        return;
    }

    console.log(`Fetched ${cycle5Data.length} records for Cycle 5.`);

    // 2. Intelligent Top Detection
    // Check if we have a significant local top that looks like THE top
    let maxPrice = 0;
    let maxDate = null;

    cycle5Data.forEach(Rec => {
        if (Rec.price_usd > maxPrice) {
            maxPrice = Rec.price_usd;
            maxDate = new Date(Rec.timestamp);
        }
    });

    console.log(`Current Cycle High: $${maxPrice} on ${maxDate?.toISOString().split('T')[0]}`);

    // 3. Recalculate Model Predictions (Excluding Cycle 2)
    const cyclesStats = [
        // Cycle 2 (Excluded)
        // { daysHalvingToTop: 371, daysTopToBottom: 79 },
        // Cycle 3
        { daysHalvingToTop: 525, daysTopToBottom: 364 },
        // Cycle 4
        { daysHalvingToTop: 546, daysTopToBottom: 378 }
    ];

    const avgHalvingToTop = (525 + 546) / 2; // 535.5
    const avgTopToBottom = (364 + 378) / 2; // 371

    console.log(`New Average Halving->Top: ${avgHalvingToTop} days (was ~480 w/ Cycle 2)`);

    // 4. Calculate Predicted Dates
    const cycle5Start = HALVINGS[3].date;
    const predictedTopDate = new Date(cycle5Start.getTime() + (avgHalvingToTop * ONE_DAY_MS));
    const predictedBottomDate = new Date(predictedTopDate.getTime() + (avgTopToBottom * ONE_DAY_MS));
    const nextHalvingDate = new Date('2028-04-17'); // Approximate

    console.log(`New Model Top: ${predictedTopDate.toISOString().split('T')[0]}`);
    console.log(`New Model Bottom: ${predictedBottomDate.toISOString().split('T')[0]}`);

    // 5. Update Database
    // We update the 'current_cycle_position' table which powers the widget
    const { error: updateError } = await supabase
        .from('current_cycle_position')
        .update({
            predicted_top_date: predictedTopDate.toISOString(),
            predicted_bottom_date: predictedBottomDate.toISOString(),
            predicted_next_halving_date: nextHalvingDate.toISOString(),
            updated_at: new Date().toISOString()
        })
        .gt('id', 0); // Update all rows (should be 1)

    if (updateError) {
        console.error('Error updating predictions:', updateError);
    } else {
        console.log('Successfully updated database with SMART predictions.');
    }
}

main();
