#!/bin/bash

# Migration script for updating .env files from GloBee to NowPayments.io
# Usage: ./migrate-env.sh

echo "🔄 GrapheneOS Store - Environment Migration Script"
echo "📝 Migrating from GloBee to NowPayments.io"
echo ""

# Function to backup a file
backup_file() {
    local file=$1
    if [ -f "$file" ]; then
        cp "$file" "$file.backup.$(date +%Y%m%d_%H%M%S)"
        echo "✅ Backed up $file"
    fi
}

# Function to migrate an env file
migrate_env_file() {
    local file=$1
    echo "🔧 Processing $file..."
    
    if [ ! -f "$file" ]; then
        echo "⚠️  File $file not found, skipping..."
        return
    fi
    
    # Create backup first
    backup_file "$file"
    
    # Perform replacements
    sed -i.tmp \
        -e 's/GLOBEE_API_KEY=/NOWPAYMENTS_API_KEY=/g' \
        -e 's/GLOBEE_API_SECRET=/NOWPAYMENTS_IPN_SECRET=/g' \
        -e 's/GLOBEE_SECRET=/NOWPAYMENTS_IPN_SECRET=/g' \
        -e 's/GLOBEE_WEBHOOK_SECRET=/NOWPAYMENTS_IPN_SECRET=/g' \
        -e 's/GLOBEE_ENVIRONMENT=/#NOWPAYMENTS_ENVIRONMENT=/g' \
        -e 's|GLOBEE_BASE_URL=.*|NOWPAYMENTS_API_URL=https://api.nowpayments.io/v1|g' \
        -e 's|GLOBEE_API_URL=.*|NOWPAYMENTS_API_URL=https://api.nowpayments.io/v1|g' \
        -e 's/MONERO_API_KEY=/NOWPAYMENTS_API_KEY=/g' \
        -e 's/MONERO_WEBHOOK_SECRET=/NOWPAYMENTS_IPN_SECRET=/g' \
        "$file"
    
    # Remove temporary file
    rm -f "$file.tmp"
    
    echo "✅ Migrated $file"
}

# Main migration process
echo "🚀 Starting migration process..."
echo ""

# Migrate backend .env files
if [ -d "apps/backend" ]; then
    migrate_env_file "apps/backend/.env"
    migrate_env_file "apps/backend/.env.local"
    migrate_env_file "apps/backend/.env.production"
    migrate_env_file "apps/backend/.env.development"
fi

# Migrate root .env files
migrate_env_file ".env"
migrate_env_file ".env.local"
migrate_env_file ".env.production"
migrate_env_file ".env.development"

echo ""
echo "✅ Migration completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Update your NOWPAYMENTS_API_KEY with your actual NowPayments API key"
echo "2. Update your NOWPAYMENTS_IPN_SECRET with your IPN secret from NowPayments dashboard"
echo "3. Verify NOWPAYMENTS_API_URL is correct:"
echo "   - Production: https://api.nowpayments.io/v1"
echo "   - Sandbox: https://api-sandbox.nowpayments.io/v1"
echo "4. Test your integration with a small payment"
echo ""
echo "📖 For detailed migration instructions, see MIGRATION_NOWPAYMENTS.md"
echo ""
echo "🔒 Your original files have been backed up with timestamp suffixes"
echo "📁 You can find them as: filename.backup.YYYYMMDD_HHMMSS"