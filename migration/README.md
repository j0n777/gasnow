# GasNow 2.0 - Migration Guide

This directory contains scripts and documentation for migrating from the old Supabase database to the new one.

## Prerequisites

1. Node.js installed (v18+)
2. Access to both Supabase projects (old and new)
3. `.env` file with all credentials set up

## Migration Steps

### Step 1: Apply Schema to New Database

1. Go to your **new** Supabase project dashboard
2. Navigate to "SQL Editor"
3. Open and run `migration/schema.sql`
4. This creates all necessary tables, indexes, RLS policies, and functions

### Step 2: Export Data from Old Database

```bash
cd /home/docker-sites/gasnow2.0
node migration/export_data.js
```

This will create JSON files in `migration/exported_data/` for each table.

### Step 3: Import Data to New Database

```bash
node migration/import_data.js
```

This will import all exported data to the new database.

### Step 4: Deploy Edge Functions

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your new project
supabase link --project-ref mddqwppgucgzefzddajy

# Deploy functions
supabase functions deploy get-crypto-data
supabase functions deploy update-crypto-data
supabase functions deploy seed-bitcoin-cycle
```

### Step 5: Set Up Cron Jobs

In your new Supabase SQL Editor, set up the cron jobs:

```sql
-- Replace with your new project URL and anon key
SELECT cron.schedule(
  'update-crypto-data',
  '*/5 * * * *',  -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://mddqwppgucgzefzddajy.supabase.co/functions/v1/update-crypto-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY'
    ),
    body := jsonb_build_object('type', 'crypto_prices')
  );
  $$
);
```

### Step 6: Update Application Configuration

Update `.env` to use the new credentials:

```bash
# Change these lines:
VITE_SUPABASE_URL=https://mddqwppgucgzefzddajy.supabase.co
VITE_SUPABASE_ANON_KEY=<your-new-anon-key>
```

Also update `src/lib/supabaseClient.ts` if it uses different variable names.

### Step 7: Test the Application

```bash
npm run dev
```

Visit `http://localhost:5173` and verify:
- All data displays correctly
- New Leverage Index widget shows in sidebar
- All other widgets work properly

## Rollback

If something goes wrong, simply revert the `.env` file to use the old credentials:

```bash
VITE_SUPABASE_URL=https://pqmfzeqczfsidxaabvok.supabase.co
VITE_SUPABASE_ANON_KEY=<old-anon-key>
```

## Files in This Directory

| File | Description |
|------|-------------|
| `schema.sql` | Complete database schema for new Supabase |
| `export_data.js` | Script to export data from old database |
| `import_data.js` | Script to import data to new database |
| `run_migration.sh` | Bash wrapper script for the full migration |
| `exported_data/` | Directory where exported JSON files are stored |

## Notes

- The migration scripts use the **anon** key for export (read-only access via RLS)
- The import uses the **service role** key for writing (bypasses RLS)
- Some tables may have limited data export if RLS policies are restrictive
- Consider running the migration during low-traffic periods
