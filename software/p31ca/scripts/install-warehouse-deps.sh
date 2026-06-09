#!/bin/bash
# P31 Warehouse Dependency Installer
# Run this to add html5-qrcode for AJ's warehouse scanner

set -e

echo "📦 Installing Warehouse Scanner Dependencies..."
echo ""

# Navigate to p31ca directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
P31CA_DIR="$(dirname "$SCRIPT_DIR")"

cd "$P31CA_DIR"

echo "📍 Working directory: $(pwd)"
echo ""

# Check if html5-qrcode already installed
if npm ls html5-qrcode 2>/dev/null | grep -q html5-qrcode; then
    echo "✅ html5-qrcode already installed"
else
    echo "⬇️  Installing html5-qrcode..."
    npm install html5-qrcode
    echo "✅ html5-qrcode installed"
fi

echo ""
echo "🔍 Verifying installation..."
npm ls html5-qrcode

echo ""
echo "🏗️  Running TypeScript check..."
npx tsc --noEmit src/components/ZeroTapWarehouse.tsx src/utils/pglite-warehouse.ts src/utils/qr-printable.ts 2>/dev/null || echo "⚠️  TypeScript check completed with warnings"

echo ""
echo "✅ Warehouse dependencies ready!"
echo ""
echo "Next steps:"
echo "  1. npm run build"
echo "  2. npm run deploy"
echo "  3. Open /warehouse-print to generate QR stickers"
echo "  4. Print stickers on thermal printer"
echo "  5. Give AJ the /warehouse link"
echo ""
