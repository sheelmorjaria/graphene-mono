#!/bin/bash

# Deployment script for GrapheneOS Store
# Usage: ./deploy.sh [web|tor] [--generate-secrets] [--verbose]

set -e

DEPLOYMENT_TYPE=${1:-web}
GENERATE_SECRETS=${2:-""}
VERBOSE=${3:-""}

# Check for verbose flag in any position
for arg in "$@"; do
  if [[ "$arg" == "--verbose" || "$arg" == "-v" ]]; then
    VERBOSE="--verbose"
    set -x  # Enable bash debug mode
    break
  fi
done

echo "🚀 GrapheneOS Store - Deployment Script"
echo "======================================"

# Function to generate secure random strings
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Function to backup existing file if it exists
backup_file() {
    local file=$1
    if [ -f "$file" ]; then
        echo "⚠️  $file already exists. Backing up to $file.backup"
        cp "$file" "$file.backup"
    fi
}

# Function to generate environment file
generate_env_file() {
    local env_type=$1
    local env_file=".env.$env_type"
    
    echo "🔐 Generating secure secrets for $env_type environment..."
    
    # Generate secure secrets
    JWT_SECRET=$(generate_secret)
    SESSION_SECRET=$(generate_secret)
    MONGO_PASSWORD=$(generate_secret)
    REDIS_PASSWORD=$(generate_secret)
    BLOCKONOMICS_WEBHOOK_SECRET=$(generate_secret)
    
    # Backup existing file
    backup_file "$env_file"
    
    # Set PayPal configuration based on environment type
    if [ "$env_type" == "web" ]; then
        PAYPAL_ENABLED="true"
        FRONTEND_URL="https://graphene-security.com"
        BACKEND_URL="https://api.graphene-security.com"
        COMPOSE_FILE="docker-compose.yml"
    else
        PAYPAL_ENABLED="false"
        FRONTEND_URL="http://your-onion-address.onion"
        BACKEND_URL="http://your-api-onion-address.onion"
        COMPOSE_FILE="docker-compose.tor.yml"
    fi
    
    # Create environment file
    echo "📝 Creating $env_file..."
    cat > "$env_file" << EOF
# Auto-generated $env_type deployment configuration
# Generated on: $(date)

# Deployment Configuration
DEPLOYMENT_TYPE=$env_type
NODE_ENV=production

# Database Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=${MONGO_PASSWORD}
MONGO_DATABASE=graphene_store
MONGODB_URI=mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/graphene_store?authSource=admin

# Redis Configuration
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

# JWT & Session Secrets
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}

# URLs - UPDATE WITH YOUR ACTUAL DOMAINS
FRONTEND_URL=${FRONTEND_URL}
BACKEND_URL=${BACKEND_URL}
API_BASE_URL=${BACKEND_URL}/api

# PayPal Configuration
VITE_ENABLE_PAYPAL_PAYMENTS=${PAYPAL_ENABLED}
PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_PAYPAL_CLIENT_SECRET
PAYPAL_ENVIRONMENT=production
PAYPAL_WEBHOOK_ID=YOUR_PAYPAL_WEBHOOK_ID

# Bitcoin Configuration (Blockonomics)
BLOCKONOMICS_API_KEY=YOUR_BLOCKONOMICS_API_KEY
BLOCKONOMICS_WEBHOOK_SECRET=${BLOCKONOMICS_WEBHOOK_SECRET}

# Monero Configuration (NOWPayments)
NOWPAYMENTS_API_KEY=YOUR_NOWPAYMENTS_API_KEY
NOWPAYMENTS_IPN_SECRET=YOUR_NOWPAYMENTS_IPN_SECRET

# Email Service Configuration
EMAIL_SERVICE=aws-ses
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_REGION=eu-west-2
AWS_SES_FROM_EMAIL=noreply@graphene-security.com

# File Storage (Optional)
AWS_S3_BUCKET=graphene-store-uploads

# Monitoring & Logging (Optional)
SENTRY_DSN=
NEW_RELIC_LICENSE_KEY=
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=${FRONTEND_URL}

# Security Headers
SECURITY_HEADERS_ENABLED=true

EOF

    echo "✅ $env_file created successfully!"
}

# Generate secrets if requested or if env files don't exist
if [ "$GENERATE_SECRETS" == "--generate-secrets" ] || [ ! -f ".env.web" ] || [ ! -f ".env.tor" ]; then
    echo "🔐 Generating environment files with secure secrets..."
    generate_env_file "web"
    generate_env_file "tor"
    
    echo ""
    echo "📋 Environment Files Created:"
    echo "- .env.web (PayPal enabled)"
    echo "- .env.tor (crypto-only payments)"
    echo ""
    echo "⚠️  Important: Update the following in your environment files:"
    echo "   - PayPal credentials (CLIENT_ID, CLIENT_SECRET, WEBHOOK_ID)"
    echo "   - Blockonomics API key"
    echo "   - NOWPayments credentials"
    echo "   - AWS credentials for email service"
    echo "   - Update URLs with your actual domains"
    echo ""
fi

# Deploy based on type
if [ "$DEPLOYMENT_TYPE" == "web" ]; then
    echo "🌐 Deploying Web version with PayPal enabled..."
    
    if [ ! -f ".env.web" ]; then
        echo "❌ .env.web not found. Run with --generate-secrets first."
        exit 1
    fi
    
    cp .env.web .env
    
    # Validate Docker Compose file
    echo "🔍 Validating docker-compose.yml..."
    # Try docker compose v2 first, then fall back to docker-compose v1
    if docker compose -f docker-compose.yml config > /dev/null 2>&1; then
        echo "✅ Docker Compose configuration is valid!"
        
        if [[ "$VERBOSE" == "--verbose" ]]; then
            echo "🐳 Starting containers with verbose output..."
            docker compose -f docker-compose.yml up -d --build
            echo "📊 Container status after startup:"
            docker compose -f docker-compose.yml ps
            echo "📋 Backend container logs (last 20 lines):"
            docker compose -f docker-compose.yml logs --tail=20 backend
        else
            docker compose -f docker-compose.yml up -d
        fi
        echo "✅ Web deployment complete"
    elif docker-compose -f docker-compose.yml config > /dev/null 2>&1; then
        echo "✅ Docker Compose configuration is valid!"
        
        if [[ "$VERBOSE" == "--verbose" ]]; then
            echo "🐳 Starting containers with verbose output..."
            docker-compose -f docker-compose.yml up -d --build
            echo "📊 Container status after startup:"
            docker-compose -f docker-compose.yml ps
            echo "📋 Backend container logs (last 20 lines):"
            docker-compose -f docker-compose.yml logs --tail=20 backend
        else
            docker-compose -f docker-compose.yml up -d
        fi
        echo "✅ Web deployment complete"
    else
        echo "❌ Docker Compose configuration is invalid!"
        exit 1
    fi
    
elif [ "$DEPLOYMENT_TYPE" == "tor" ]; then
    echo "🧅 Deploying Tor version (crypto-only payments)..."
    
    if [ ! -f ".env.tor" ]; then
        echo "❌ .env.tor not found. Run with --generate-secrets first."
        exit 1
    fi
    
    cp .env.tor .env
    
    # Validate Docker Compose file
    echo "🔍 Validating docker-compose.tor.yml..."
    # Try docker compose v2 first, then fall back to docker-compose v1
    if docker compose -f docker-compose.tor.yml config > /dev/null 2>&1; then
        echo "✅ Docker Compose configuration is valid!"
        
        if [[ "$VERBOSE" == "--verbose" ]]; then
            echo "🐳 Starting Tor containers with verbose output..."
            docker compose -f docker-compose.tor.yml up -d --build
            echo "⏳ Waiting 10 seconds for containers to initialize..."
            sleep 10
            echo "📊 Container status after startup:"
            docker compose -f docker-compose.tor.yml ps
            echo "📋 Backend container logs (last 30 lines):"
            docker compose -f docker-compose.tor.yml logs --tail=30 backend
            echo "📋 MongoDB container logs (last 10 lines):"
            docker compose -f docker-compose.tor.yml logs --tail=10 mongodb
            echo "🩺 Backend health check test:"
            docker compose -f docker-compose.tor.yml exec -T backend curl -f http://localhost:5000/health/simple || echo "❌ Health check failed"
        else
            docker compose -f docker-compose.tor.yml up -d
        fi
        echo "✅ Tor deployment complete"
        echo "📝 Check tor_keys volume for your .onion addresses"
    elif docker-compose -f docker-compose.tor.yml config > /dev/null 2>&1; then
        echo "✅ Docker Compose configuration is valid!"
        
        if [[ "$VERBOSE" == "--verbose" ]]; then
            echo "🐳 Starting Tor containers with verbose output..."
            docker-compose -f docker-compose.tor.yml up -d --build
            echo "⏳ Waiting 10 seconds for containers to initialize..."
            sleep 10
            echo "📊 Container status after startup:"
            docker-compose -f docker-compose.tor.yml ps
            echo "📋 Backend container logs (last 30 lines):"
            docker-compose -f docker-compose.tor.yml logs --tail=30 backend
            echo "📋 MongoDB container logs (last 10 lines):"
            docker-compose -f docker-compose.tor.yml logs --tail=10 mongodb
            echo "🩺 Backend health check test:"
            docker-compose -f docker-compose.tor.yml exec -T backend curl -f http://localhost:5000/health/simple || echo "❌ Health check failed"
        else
            docker-compose -f docker-compose.tor.yml up -d
        fi
        echo "✅ Tor deployment complete"
        echo "📝 Check tor_keys volume for your .onion addresses"
    else
        echo "❌ Docker Compose configuration is invalid!"
        exit 1
    fi
    
else
    echo "❌ Invalid deployment type. Use 'web' or 'tor'"
    echo "Usage: ./deploy.sh [web|tor] [--generate-secrets] [--verbose|-v]"
    echo ""
    echo "Options:"
    echo "  web|tor           - Deployment type"
    echo "  --generate-secrets - Generate new environment files with secure secrets"
    echo "  --verbose, -v     - Show detailed output including container logs and status"
    exit 1
fi

echo ""
echo "📊 Deployment Summary:"
echo "- Type: $DEPLOYMENT_TYPE"
echo "- PayPal: $([ "$DEPLOYMENT_TYPE" == "web" ] && echo "Enabled ✓" || echo "Disabled ✗")"
echo "- Bitcoin: Enabled ✓"
echo "- Monero: Enabled ✓"
echo "- Environment: $([ -f ".env" ] && echo "Configured ✓" || echo "Missing ❌")"

echo ""
echo "🔒 Security Reminders:"
echo "- Never commit .env files to Git"
echo "- Update placeholder credentials in environment files"
echo "- Rotate secrets regularly"
echo "- Monitor logs for security events"

echo ""
echo "🎉 Deployment complete! Your GrapheneOS Store is running."