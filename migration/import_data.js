/**
 * GasNow 2.0 - Data Import Script
 * Imports all data to the new Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
import 'dotenv/config';

const NEW_SUPABASE_URL = process.env.VITE_SUPABASE_URL_NEW;
const NEW_SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_ANON_SECRET_KEY_NEW;

if (!NEW_SUPABASE_URL || !NEW_SUPABASE_SERVICE_KEY) {
    console.error('❌ New Supabase credentials not found in .env');
    process.exit(1);
}

const supabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_SERVICE_KEY);

const TABLES_TO_IMPORT = [
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

const INPUT_DIR = path.join(__dirname, 'exported_data');
const BATCH_SIZE = 500; // Insert in batches to avoid timeout

async function importTable(tableName) {
    console.log(`  📥 Importing ${tableName}...`);

    const inputPath = path.join(INPUT_DIR, `${tableName}.json`);

    if (!fs.existsSync(inputPath)) {
        console.log(`    ⚠️ No data file found for ${tableName}`);
        return { table: tableName, count: 0, success: false, error: 'No data file' };
    }

    try {
        const rawData = fs.readFileSync(inputPath, 'utf-8');
        const data = JSON.parse(rawData);

        if (!data || data.length === 0) {
            console.log(`    ⚠️ No data to import for ${tableName}`);
            return { table: tableName, count: 0, success: true };
        }

        // Remove 'id' column as it will be auto-generated
        const cleanedData = data.map(row => {
            const { id, ...rest } = row;
            return rest;
        });

        let totalInserted = 0;

        // Insert in batches
        for (let i = 0; i < cleanedData.length; i += BATCH_SIZE) {
            const batch = cleanedData.slice(i, i + BATCH_SIZE);

            const { error } = await supabase
                .from(tableName)
                .insert(batch);

            if (error) {
                console.log(`    ⚠️ Batch error in ${tableName}: ${error.message}`);
                // Continue with next batch
            } else {
                totalInserted += batch.length;
            }
        }

        console.log(`    ✅ Imported ${totalInserted} rows`);
        return { table: tableName, count: totalInserted, success: true };

    } catch (err) {
        console.log(`    ❌ Error importing ${tableName}: ${err.message}`);
        return { table: tableName, count: 0, success: false, error: err.message };
    }
}

async function main() {
    console.log('');
    console.log('🔄 Starting data import to new database...');
    console.log(`   URL: ${NEW_SUPABASE_URL}`);
    console.log('');

    if (!fs.existsSync(INPUT_DIR)) {
        console.error('❌ Export directory not found. Run export_data.js first.');
        process.exit(1);
    }

    const results = [];

    for (const table of TABLES_TO_IMPORT) {
        const result = await importTable(table);
        results.push(result);
    }

    console.log('');
    console.log('📊 Import Summary:');
    console.log('─'.repeat(50));

    let totalRows = 0;
    for (const r of results) {
        const status = r.success ? '✅' : '❌';
        console.log(`  ${status} ${r.table}: ${r.count} rows`);
        if (r.success) totalRows += r.count;
    }

    console.log('─'.repeat(50));
    console.log(`  Total rows imported: ${totalRows}`);
    console.log('');
}

main().catch(console.error);
