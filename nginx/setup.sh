#!/bin/bash

# Nginx setup script for GrapheneOS Store
# Run this on your server to set up Nginx reverse proxy

set -e

DOMAIN="graphene-security.com"
EMAIL="admin@graphene-security.com"

echo "🔧 Setting up Nginx reverse proxy for $DOMAIN"

# Install Nginx and Certbot
echo "📦 Installing Nginx and Certbot..."
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

# Create Nginx configuration
echo "📝 Creating Nginx configuration..."
cat > /etc/nginx/sites-available/$DOMAIN << 'EOF'
server {
    listen 80;
    server_name graphene-security.com www.graphene-security.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx

echo "✅ Nginx configured successfully"

# Set up SSL with Let's Encrypt
echo "🔐 Setting up SSL certificate..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL

echo "✅ SSL certificate installed"

# Set up automatic renewal
echo "⏰ Setting up automatic SSL renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

echo "✅ Setup complete!"
echo ""
echo "📊 Summary:"
echo "- Domain: $DOMAIN"
echo "- Frontend: http://localhost:3000 → https://$DOMAIN"
echo "- Backend: http://localhost:5000 → https://$DOMAIN/api"
echo "- SSL: Let's Encrypt (auto-renewing)"
echo ""
echo "🔥 Make sure your firewall allows ports 80 and 443:"
echo "  ufw allow 80/tcp"
echo "  ufw allow 443/tcp"