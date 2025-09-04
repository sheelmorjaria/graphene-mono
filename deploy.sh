#!/bin/bash

# Deployment script for GrapheneOS Store
# Usage: ./deploy.sh [web|tor]

set -e

DEPLOYMENT_TYPE=${1:-web}

if [ "$DEPLOYMENT_TYPE" == "web" ]; then
    echo "🌐 Deploying Web version with PayPal enabled..."
    cp .env.web .env
    docker-compose -f docker-compose.yml up -d
    echo "✅ Web deployment complete"
    
elif [ "$DEPLOYMENT_TYPE" == "tor" ]; then
    echo "🧅 Deploying Tor version (crypto-only payments)..."
    cp .env.tor .env
    docker-compose -f docker-compose.tor.yml up -d
    echo "✅ Tor deployment complete"
    echo "📝 Check tor_keys volume for your .onion addresses"
    
else
    echo "❌ Invalid deployment type. Use 'web' or 'tor'"
    exit 1
fi

echo ""
echo "📊 Deployment Summary:"
echo "- Type: $DEPLOYMENT_TYPE"
echo "- PayPal: $([ "$DEPLOYMENT_TYPE" == "web" ] && echo "Enabled ✓" || echo "Disabled ✗")"
echo "- Bitcoin: Enabled ✓"
echo "- Monero: Enabled ✓"