#!/bin/bash
# scripts/abdicate.sh
# 🔺 P31 LABS: ABDICATION PROTOCOL & CRYPTOGRAPHIC KENOSIS

set -e

echo "🔺 INITIATING P31 ABDICATION CEREMONY..."
echo "WARNING: THIS ACTION IS IRREVERSIBLE AND ENFORCES FULL AUTOPOIESIS."
sleep 5

# 1. Volatile Initialization: Mount tmpfs RAM disk
echo "[1/5] Mounting volatile tmpfs RAM disk for ephemeral key generation..."
sudo mount -t tmpfs -o size=50M tmpfs /mnt/ramdisk

# Generate ephemeral OpenSSL RSA deployer key 
echo "[2/5] Generating ephemeral cryptographic material..."
openssl ecparam -name secp256k1 -genkey -noout -out /mnt/ramdisk/deployer_key.pem
DEPLOY_PKEY=$(openssl ec -in /mnt/ramdisk/deployer_key.pem -text -noout 2>/dev/null | grep priv -A 3 | tail -n +2 | tr -d '\n[:space:]:' | sed 's/^00//')

# 2. Constitutional Deployment via Forge
echo "[3/5] Compiling and deploying GODConstitution.sol to the network..."
CONTRACT_ADDRESS=$(forge create contracts/GODConstitution.sol:GODConstitution \
    --private-key $DEPLOY_PKEY \
    --json | jq -r .deployedTo)

echo "Constitution deployed to: $CONTRACT_ADDRESS"

# 3. Renunciation of Authority
echo "[4/5] Executing abdicatePower(). Burning executive authority..."
cast send $CONTRACT_ADDRESS "abdicatePower()" \
    --private-key $DEPLOY_PKEY

# 4. Hardware Locking: Burn ESP32-S3 eFuses
echo "[5/5] Burning Node One ESP32-S3 eFuses. Enforcing Secure Boot V2 and disabling JTAG..."
# Requires Node One to be connected via serial
espefuse.py burn_efuse DIS_JTAG 1
espefuse.py burn_efuse DIS_USB_JTAG 1
espefuse.py burn_efuse SECURE_BOOT_EN 1

# 5. Cryptographic Shredding
echo "🔺 Shredding ephemeral keys from RAM disk..."
shred -u -z -n 3 /mnt/ramdisk/deployer_key.pem

echo "Unmounting RAM disk..."
sudo umount /mnt/ramdisk

echo "🟢 KENOSIS COMPLETE. THE ARCHITECT IS ELIMINATED AS A CENTRAL POINT OF FAILURE."
echo "MANUAL POWER CYCLE REQUIRED IMMEDIATELY."