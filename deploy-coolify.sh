#!/bin/bash

# Coolify Deployment Helper Script
# This script helps prepare your environment for Coolify deployment

set -e

echo "🚀 GrapheneOS Store - Coolify Deployment Helper"
echo "=============================================="

# Function to generate secure random strings
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Check if .env exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists. Backing up to .env.backup"
    cp .env .env.backup
fi

# Generate secure secrets
echo "🔐 Generating secure secrets..."
JWT_SECRET=$(generate_secret)
SESSION_SECRET=$(generate_secret)
MONGO_PASSWORD=$(generate_secret)
REDIS_PASSWORD=$(generate_secret)
BLOCKONOMICS_WEBHOOK_SECRET=$(generate_secret)

# Create .env file from template
echo "📝 Creating .env file..."
cat > .env << EOF
# Auto-generated Coolify deployment configuration
# Generated on: $(date)

# Database Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=${MONGO_PASSWORD}
MONGO_DATABASE=graphene_store

# Redis Configuration
REDIS_PASSWORD=${REDIS_PASSWORD}

# JWT & Session Secrets
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}

# URLs - UPDATE THESE WITH YOUR ACTUAL DOMAINS
FRONTEND_URL=https://store.example.com
BACKEND_URL=https://api.store.example.com

# PayPal Configuration - ADD YOUR CREDENTIALS
PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_PAYPAL_CLIENT_SECRET
PAYPAL_ENVIRONMENT=production
PAYPAL_WEBHOOK_ID=YOUR_PAYPAL_WEBHOOK_ID

# Bitcoin Configuration (Blockonomics) - ADD YOUR CREDENTIALS
BLOCKONOMICS_API_KEY=YOUR_BLOCKONOMICS_API_KEY
BLOCKONOMICS_WEBHOOK_SECRET=${BLOCKONOMICS_WEBHOOK_SECRET}

# Monero Configuration (NOWPayments) - ADD YOUR CREDENTIALS
NOWPAYMENTS_API_KEY=YOUR_NOWPAYMENTS_API_KEY
NOWPAYMENTS_IPN_SECRET=YOUR_NOWPAYMENTS_IPN_SECRET

# AWS Configuration - OPTIONAL
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=eu-west-2
AWS_S3_BUCKET=
AWS_SES_FROM_EMAIL=

# Monitoring - OPTIONAL
SENTRY_DSN=
NEW_RELIC_LICENSE_KEY=

# Logging
LOG_LEVEL=info
EOF

echo "✅ .env file created successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env and update the following:"
echo "   - FRONTEND_URL and BACKEND_URL with your actual domains"
echo "   - PayPal credentials (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, etc.)"
echo "   - Blockonomics API key"
echo "   - NOWPayments credentials"
echo "   - AWS credentials (optional)"
echo ""
echo "2. Commit this repository to your Git provider"
echo ""
echo "3. In Coolify:"
echo "   - Create new Docker Compose project"
echo "   - Connect your Git repository"
echo "   - Select docker-compose.coolify.yml"
echo "   - Copy the environment variables from .env"
echo "   - Configure your domains"
echo "   - Deploy!"
echo ""
echo "🔒 Security Notes:"
echo "- Never commit .env file to Git (it's in .gitignore)"
echo "- Keep .env.backup file secure"
echo "- Rotate secrets regularly"
echo ""
echo "📚 For detailed instructions, see COOLIFY_DEPLOYMENT_GUIDE.md"

# Test Docker Compose syntax
echo "🔍 Validating docker-compose.coolify.yml..."
if docker-compose -f docker-compose.coolify.yml config > /dev/null 2>&1; then
    echo "✅ Docker Compose configuration is valid!"
else
    echo "⚠️  Warning: Could not validate Docker Compose file. Make sure Docker is installed."
fi

echo ""
echo "🎉 Preparation complete! Your project is ready for Coolify deployment."