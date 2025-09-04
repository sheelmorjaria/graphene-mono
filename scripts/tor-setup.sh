#!/bin/bash

# Tor Hidden Service Setup Script
# Automates initial deployment and configuration

set -e

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧅 GrapheneOS Store - Tor Hidden Service Setup${NC}"
echo "================================================"

# Function to generate secure random strings
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Check prerequisites
check_requirements() {
    echo -e "\n${YELLOW}Checking requirements...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose not found. Please install Docker Compose first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All requirements met!${NC}"
}

# Create environment file
setup_environment() {
    echo -e "\n${YELLOW}Setting up environment...${NC}"
    
    if [ -f .env.tor ]; then
        echo -e "${YELLOW}⚠️  .env.tor already exists. Backing up to .env.tor.backup${NC}"
        cp .env.tor .env.tor.backup-$(date +%Y%m%d-%H%M%S)
    fi
    
    # Generate secrets
    JWT_SECRET=$(generate_secret)
    SESSION_SECRET=$(generate_secret)
    MONGO_PASSWORD=$(generate_secret)
    REDIS_PASSWORD=$(generate_secret)
    BLOCKONOMICS_SECRET=$(generate_secret)
    NOWPAYMENTS_SECRET=$(generate_secret)
    
    cat > .env.tor << EOF
# Tor Hidden Service Configuration
# Generated on: $(date)

# Database
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=${MONGO_PASSWORD}
MONGO_DATABASE=graphene_store

# Redis
REDIS_PASSWORD=${REDIS_PASSWORD}

# Security
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}

# Tor URLs (will be updated after first run)
TOR_FRONTEND_URL=http://pending.onion
TOR_BACKEND_URL=http://pending.onion

# Bitcoin (Blockonomics)
BLOCKONOMICS_API_KEY=YOUR_API_KEY
BLOCKONOMICS_WEBHOOK_SECRET=${BLOCKONOMICS_SECRET}

# Monero (NOWPayments)
NOWPAYMENTS_API_KEY=YOUR_API_KEY
NOWPAYMENTS_IPN_SECRET=${NOWPAYMENTS_SECRET}

# PayPal (Optional for Tor)
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_ENVIRONMENT=production

# Tor Settings
ENABLE_TOR=true
TRUST_PROXY=true
CORS_ALLOW_ONION=true
DISABLE_ANALYTICS=true
DISABLE_EXTERNAL_SCRIPTS=true
ENHANCED_PRIVACY_MODE=true

# Security
MAX_LOGIN_ATTEMPTS=3
SESSION_TIMEOUT=1800
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=50

# Logging
LOG_LEVEL=info
EOF
    
    echo -e "${GREEN}✅ Environment file created${NC}"
}

# Start Tor services
start_services() {
    echo -e "\n${YELLOW}Starting Tor hidden services...${NC}"
    
    # Start services
    docker-compose -f docker-compose.tor.yml up -d
    
    echo -e "${YELLOW}Waiting for Tor to generate onion addresses (this may take 30-60 seconds)...${NC}"
    
    # Wait for Tor to initialize
    sleep 10
    
    # Check if Tor container is running
    if ! docker ps | grep -q graphene-tor; then
        echo -e "${RED}❌ Tor container failed to start. Check logs with: docker logs graphene-tor${NC}"
        exit 1
    fi
    
    # Wait for hidden service directories to be created
    MAX_ATTEMPTS=30
    ATTEMPT=0
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if docker exec graphene-tor test -f /var/lib/tor/hidden_service/graphene_frontend/hostname 2>/dev/null; then
            break
        fi
        echo -n "."
        sleep 2
        ATTEMPT=$((ATTEMPT + 1))
    done
    echo ""
    
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo -e "${RED}❌ Timeout waiting for Tor to generate addresses${NC}"
        echo "Check Tor logs: docker logs graphene-tor"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Services started successfully${NC}"
}

# Get onion addresses
get_onion_addresses() {
    echo -e "\n${YELLOW}Retrieving onion addresses...${NC}"
    
    # Get frontend address
    FRONTEND_ONION=$(docker exec graphene-tor cat /var/lib/tor/hidden_service/graphene_frontend/hostname 2>/dev/null || echo "")
    if [ -z "$FRONTEND_ONION" ]; then
        echo -e "${RED}❌ Could not retrieve frontend onion address${NC}"
        exit 1
    fi
    
    # Get backend address
    BACKEND_ONION=$(docker exec graphene-tor cat /var/lib/tor/hidden_service/graphene_backend/hostname 2>/dev/null || echo "")
    if [ -z "$BACKEND_ONION" ]; then
        echo -e "${RED}❌ Could not retrieve backend onion address${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Onion addresses retrieved:${NC}"
    echo -e "  Frontend: ${YELLOW}http://${FRONTEND_ONION}${NC}"
    echo -e "  Backend:  ${YELLOW}http://${BACKEND_ONION}${NC}"
    
    # Update .env.tor with actual addresses
    sed -i.bak "s|TOR_FRONTEND_URL=.*|TOR_FRONTEND_URL=http://${FRONTEND_ONION}|" .env.tor
    sed -i.bak "s|TOR_BACKEND_URL=.*|TOR_BACKEND_URL=http://${BACKEND_ONION}|" .env.tor
    
    # Save addresses to file
    cat > onion-addresses.txt << EOF
GrapheneOS Store - Tor Hidden Service Addresses
Generated: $(date)
================================================

Frontend URL: http://${FRONTEND_ONION}
Backend API:  http://${BACKEND_ONION}

IMPORTANT: Save these addresses! They are your permanent .onion URLs.
To maintain these addresses, always backup the tor_keys volume.
EOF
    
    echo -e "${GREEN}✅ Addresses saved to onion-addresses.txt${NC}"
}

# Restart services with updated configuration
restart_services() {
    echo -e "\n${YELLOW}Restarting services with updated configuration...${NC}"
    
    docker-compose -f docker-compose.tor.yml restart backend frontend
    
    echo -e "${GREEN}✅ Services restarted${NC}"
}

# Setup admin user
setup_admin() {
    echo -e "\n${YELLOW}Would you like to create an admin user? (y/n)${NC}"
    read -r CREATE_ADMIN
    
    if [[ "$CREATE_ADMIN" == "y" || "$CREATE_ADMIN" == "Y" ]]; then
        echo "Enter admin email:"
        read -r ADMIN_EMAIL
        
        echo "Enter admin password (min 8 characters):"
        read -s ADMIN_PASSWORD
        echo ""
        
        # Wait for backend to be ready
        echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
        sleep 10
        
        # Create admin user
        docker exec graphene-backend node -e "
            const bcrypt = require('bcryptjs');
            const mongoose = require('mongoose');
            
            mongoose.connect(process.env.MONGODB_URI).then(async () => {
                const User = require('./src/models/User');
                const hashedPassword = await bcrypt.hash('${ADMIN_PASSWORD}', 10);
                
                const admin = await User.create({
                    email: '${ADMIN_EMAIL}',
                    password: hashedPassword,
                    role: 'admin',
                    isEmailVerified: true
                });
                
                console.log('Admin user created:', admin.email);
                process.exit(0);
            }).catch(err => {
                console.error('Error:', err);
                process.exit(1);
            });
        " 2>/dev/null || echo -e "${YELLOW}⚠️  Could not create admin user. You can do this manually later.${NC}"
    fi
}

# Display final instructions
show_instructions() {
    echo -e "\n${GREEN}🎉 Tor Hidden Service Setup Complete!${NC}"
    echo "======================================="
    echo ""
    echo -e "${YELLOW}Your Onion Addresses:${NC}"
    echo -e "  Frontend: ${GREEN}http://${FRONTEND_ONION}${NC}"
    echo -e "  Backend:  ${GREEN}http://${BACKEND_ONION}${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Update payment provider webhooks with onion URLs"
    echo "2. Test access using Tor Browser"
    echo "3. Configure your payment credentials in .env.tor"
    echo "4. Backup your Tor keys: ./scripts/backup-tor-keys.sh"
    echo ""
    echo -e "${YELLOW}Useful Commands:${NC}"
    echo "  View logs:        docker-compose -f docker-compose.tor.yml logs -f"
    echo "  Stop services:    docker-compose -f docker-compose.tor.yml down"
    echo "  Restart services: docker-compose -f docker-compose.tor.yml restart"
    echo "  Backup keys:      docker run --rm -v graphene-mono_tor_keys:/data -v \$(pwd):/backup alpine tar czf /backup/tor-keys.tar.gz -C /data ."
    echo ""
    echo -e "${RED}⚠️  IMPORTANT:${NC}"
    echo "  - Keep your onion addresses private"
    echo "  - Backup tor_keys volume to maintain addresses"
    echo "  - Never expose your real server IP"
    echo "  - Monitor logs for suspicious activity"
    echo ""
    echo -e "${GREEN}Happy anonymous selling! 🧅${NC}"
}

# Main execution
main() {
    check_requirements
    setup_environment
    start_services
    get_onion_addresses
    restart_services
    setup_admin
    show_instructions
}

# Run main function
main