#!/bin/bash
# GasNow 2.0 - Database Migration Script
# Migrates data from old Supabase to new Supabase
#
# Usage: bash migration/run_migration.sh
#
# Requirements:
# - Node.js installed
# - Supabase CLI installed (optional)
# - .env file with credentials

set -e

echo "================================================"
echo "  GasNow 2.0 - Database Migration"
echo "================================================"
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ .env file not found!"
    exit 1
fi

echo "📋 Migration Plan:"
echo "  FROM: ${VITE_SUPABASE_URL}"
echo "  TO:   ${VITE_SUPABASE_URL_NEW}"
echo ""

# Check if we have the new database details
if [ -z "$VITE_SUPABASE_URL_NEW" ] || [ -z "$VITE_SUPABASE_ANON_SECRET_KEY_NEW" ]; then
    echo "❌ New database credentials not found in .env"
    exit 1
fi

echo "📦 Step 1: Apply schema migrations to new database..."
echo "  (Run the SQL files in supabase/migrations/ on the new database)"
echo ""

echo "📤 Step 2: Export data from old database..."
node migration/export_data.js

echo ""
echo "📥 Step 3: Import data to new database..."
node migration/import_data.js

echo ""
echo "✅ Migration completed!"
echo ""
echo "📋 Next steps:"
echo "  1. Deploy edge functions to new project: supabase functions deploy"
echo "  2. Update .env to use new credentials"
echo "  3. Test the application"
