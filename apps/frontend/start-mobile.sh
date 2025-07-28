#!/bin/bash

# Script to start the frontend for mobile testing

echo "Starting frontend for mobile testing..."
echo ""

# Try to get the local IP address
IP=$(ip addr show | grep -E "inet.*wlan|inet.*wlo|inet.*eth|inet.*en" | grep -v 127.0.0.1 | head -1 | awk '{print $2}' | cut -d/ -f1)

if [ -z "$IP" ]; then
    echo "Could not automatically detect your IP address."
    echo "Please enter your computer's local IP address (e.g., 192.168.1.100):"
    read -r IP
fi

echo "Using IP address: $IP"
echo ""

# Create temporary .env file for mobile testing
cat > .env.temp << EOF
# API Configuration for Mobile Testing
VITE_API_BASE_URL=http://$IP:5000/api

# Stripe Configuration (frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
EOF

# Backup existing .env if it exists
if [ -f .env ]; then
    mv .env .env.backup
fi

# Use the temporary env file
mv .env.temp .env

echo "Frontend will be accessible at:"
echo "  - Desktop: http://localhost:5173"
echo "  - Mobile:  http://$IP:5173"
echo ""
echo "Make sure your mobile device is on the same network!"
echo ""
echo "Starting the development server..."

# Start the dev server with host flag to allow external connections
npm run dev -- --host

# Restore original .env on exit
if [ -f .env.backup ]; then
    mv .env.backup .env
fi