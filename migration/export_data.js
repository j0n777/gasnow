/**
 * GasNow 2.0 - Data Export Script
 * Exports all data from the old Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
import 'dotenv/config';

const OLD_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const OLD_SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!OLD_SUPABASE_URL || !OLD_SUPABASE_KEY) {
    console.error('❌ Old Supabase credentials not found in .env');
    process.exit(1);
}

const supabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);

const TABLES_TO_EXPORT = [
    'gas_prices',
    'crypto_prices',
    'market_data',
    'fear_greed_index',
    'altseason_index',
    'crypto_news',
    'trending_tokens',
    'derivatives_data',
    'market_stress_index',
    'stablecoin_supply',
    'bitcoin_cycle_data',
    'cycle_statistics',
    'current_cycle_position'
];

const OUTPUT_DIR = path.join(__dirname, 'exported_data');

async function exportTable(tableName) {
    console.log(`  📤 Exporting ${tableName}...`);

    try {
        // Try to get all data (may be limited by RLS policies)
        const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: true });

        if (error) {
            console.log(`    ⚠️ Could not export ${tableName}: ${error.message}`);
            return { table: tableName, count: 0, success: false, error: error.message };
        }

        const outputPath = path.join(OUTPUT_DIR, `${tableName}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

        console.log(`    ✅ Exported ${data?.length || 0} rows`);
        return { table: tableName, count: data?.length || 0, success: true };

    } catch (err) {
        console.log(`    ❌ Error exporting ${tableName}: ${err.message}`);
        return { table: tableName, count: 0, success: false, error: err.message };
    }
}

async function main() {
    console.log('');
    console.log('🔄 Starting data export from old database...');
    console.log(`   URL: ${OLD_SUPABASE_URL}`);
    console.log('');

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const results = [];

    for (const table of TABLES_TO_EXPORT) {
        const result = await exportTable(table);
        results.push(result);
    }

    console.log('');
    console.log('📊 Export Summary:');
    console.log('─'.repeat(50));

    let totalRows = 0;
    for (const r of results) {
        const status = r.success ? '✅' : '❌';
        console.log(`  ${status} ${r.table}: ${r.count} rows`);
        if (r.success) totalRows += r.count;
    }

    console.log('─'.repeat(50));
    console.log(`  Total rows exported: ${totalRows}`);
    console.log(`  Output directory: ${OUTPUT_DIR}`);
    console.log('');
}

main().catch(console.error);
