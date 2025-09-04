#!/bin/bash

# Tor Keys Backup Script
# CRITICAL: Backup your Tor keys to maintain your .onion addresses!

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups/tor}"
DATE=$(date +%Y%m%d-%H%M%S)

echo -e "${YELLOW}🔐 Tor Hidden Service Keys Backup${NC}"
echo "===================================="

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Check if Tor volume exists
if ! docker volume ls | grep -q "graphene-mono_tor_keys"; then
    echo -e "${RED}❌ Tor keys volume not found. Have you started the Tor services?${NC}"
    exit 1
fi

# Backup Tor keys
echo -e "${YELLOW}Backing up Tor hidden service keys...${NC}"

docker run --rm \
    -v graphene-mono_tor_keys:/data \
    -v "$(pwd)/$BACKUP_DIR":/backup \
    alpine tar czf "/backup/tor-keys-${DATE}.tar.gz" -C /data .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup successful!${NC}"
    echo -e "   File: ${BACKUP_DIR}/tor-keys-${DATE}.tar.gz"
    
    # Get file size
    SIZE=$(du -h "${BACKUP_DIR}/tor-keys-${DATE}.tar.gz" | cut -f1)
    echo -e "   Size: ${SIZE}"
    
    # Create backup info file
    cat > "${BACKUP_DIR}/tor-keys-${DATE}.info" << EOF
Tor Hidden Service Keys Backup
==============================
Date: $(date)
File: tor-keys-${DATE}.tar.gz
Size: ${SIZE}

Onion Addresses:
$(docker exec graphene-tor cat /var/lib/tor/hidden_service/graphene_frontend/hostname 2>/dev/null || echo "Frontend: Not available")
$(docker exec graphene-tor cat /var/lib/tor/hidden_service/graphene_backend/hostname 2>/dev/null || echo "Backend: Not available")

To restore these keys:
docker run --rm -v graphene-mono_tor_keys:/data -v $(pwd)/${BACKUP_DIR}:/backup alpine tar xzf /backup/tor-keys-${DATE}.tar.gz -C /data
EOF
    
    echo -e "${GREEN}✅ Backup info saved to: ${BACKUP_DIR}/tor-keys-${DATE}.info${NC}"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi

# Encrypt backup (optional but recommended)
echo -e "\n${YELLOW}Would you like to encrypt the backup? (y/n)${NC}"
read -r ENCRYPT

if [[ "$ENCRYPT" == "y" || "$ENCRYPT" == "Y" ]]; then
    echo "Enter encryption password:"
    read -s PASSWORD
    echo ""
    
    # Encrypt with OpenSSL
    openssl enc -aes-256-cbc -salt -pbkdf2 \
        -in "${BACKUP_DIR}/tor-keys-${DATE}.tar.gz" \
        -out "${BACKUP_DIR}/tor-keys-${DATE}.tar.gz.enc" \
        -pass "pass:${PASSWORD}"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Encrypted backup created!${NC}"
        echo -e "   File: ${BACKUP_DIR}/tor-keys-${DATE}.tar.gz.enc"
        
        # Add decryption instructions
        cat >> "${BACKUP_DIR}/tor-keys-${DATE}.info" << EOF

Encrypted Backup
================
Encrypted file: tor-keys-${DATE}.tar.gz.enc

To decrypt:
openssl enc -aes-256-cbc -d -pbkdf2 -in tor-keys-${DATE}.tar.gz.enc -out tor-keys-${DATE}.tar.gz

Then restore as shown above.
EOF
        
        # Optionally remove unencrypted backup
        echo -e "${YELLOW}Remove unencrypted backup? (y/n)${NC}"
        read -r REMOVE
        if [[ "$REMOVE" == "y" || "$REMOVE" == "Y" ]]; then
            rm "${BACKUP_DIR}/tor-keys-${DATE}.tar.gz"
            echo -e "${GREEN}✅ Unencrypted backup removed${NC}"
        fi
    else
        echo -e "${RED}❌ Encryption failed!${NC}"
    fi
fi

# Cleanup old backups (optional)
echo -e "\n${YELLOW}Remove backups older than 30 days? (y/n)${NC}"
read -r CLEANUP

if [[ "$CLEANUP" == "y" || "$CLEANUP" == "Y" ]]; then
    find "$BACKUP_DIR" -name "tor-keys-*.tar.gz*" -mtime +30 -delete
    find "$BACKUP_DIR" -name "tor-keys-*.info" -mtime +30 -delete
    echo -e "${GREEN}✅ Old backups cleaned up${NC}"
fi

echo -e "\n${GREEN}🎉 Backup complete!${NC}"
echo -e "${RED}⚠️  IMPORTANT:${NC}"
echo "  - Store this backup in a secure location"
echo "  - Loss of keys means loss of .onion addresses"
echo "  - Test restoration procedure regularly"
echo "  - Keep multiple backup copies"