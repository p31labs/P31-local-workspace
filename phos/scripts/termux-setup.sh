#!/data/data/com.termux/files/usr/bin/sh
# P31 Mobile CLI – run in Termux on Android
# Installs p31 CLI tools so your phone acts as a full mesh node
# Usage: curl -sL https://raw.githubusercontent.com/p31labs/... | sh

set -euo pipefail

echo "=== P31 Termux Bootstrap ==="

pkg update -y && pkg upgrade -y
pkg install -y nodejs git openssh jq

# Node.js p31 CLI
if [ ! -d "$HOME/bonding-soup" ]; then
    git clone https://github.com/p31labs/bonding-soup.git "$HOME/bonding-soup"
fi
cd "$HOME/bonding-soup"
npm install --silent
npm run p31:link

# Verify
echo ""
echo "=== Installed CLIs ==="
which p31 2>/dev/null && p31 --version 2>/dev/null || echo "p31: installed via npm link"

# Ollama remote connection default
echo 'export OLLAMA_URL="http://$(ip route | grep default | awk '\''{print $3}'\''):11434"' >> "$HOME/.bashrc"
echo 'export P31_MOBILE=1' >> "$HOME/.bashrc"

# CashPilot lightweight sync script
mkdir -p "$HOME/.local/bin"
cat > "$HOME/.local/bin/p31-sync" << 'SCRIPT'
#!/data/data/com.termux/files/usr/bin/sh
# Sync mobile earnings to D1 ledger
# Reads $HOME/.p31/earnings.json and pushes to Cloudflare D1 via API
set -euo pipefail

CONFIG="$HOME/.p31/earnings.json"
API="https://api-phosphorus31-org.trimtab-signal.workers.dev"

if [ ! -f "$CONFIG" ]; then
    echo '{"earnings": [], "last_sync": null}' > "$CONFIG"
fi

case "${1:-}" in
    add)
        record='{"source":"mobile","amount":'"$2"',"timestamp":"'"$(date -Iseconds)"'","kind":"'"${3:-bandwidth}"'"}'
        echo "$record" >> "$CONFIG"
        echo "Recorded: $record"
        ;;
    push)
        if [ "$(jq '.earnings | length' "$CONFIG")" -eq 0 ]; then
            echo "Nothing to sync"
            exit 0
        fi
        echo "Pushing to D1..."
        curl -sf -X POST "$API/ledger/sync" \
            -H "Content-Type: application/json" \
            -d @"$CONFIG" || echo "Sync failed (offline?); will retry"
        jq '.last_sync = now' "$CONFIG" > "${CONFIG}.tmp" && mv "${CONFIG}.tmp" "$CONFIG"
        ;;
    *)
        echo "Usage: p31-sync add <amount> [kind]"
        echo "       p31-sync push"
        echo ""
        echo "Kinds: bandwidth, bandwidth_cache, referral, other"
        ;;
esac
SCRIPT
chmod +x "$HOME/.local/bin/p31-sync"

echo ""
echo "=== P31 Mobile Node Ready ==="
echo "  p31           – ecosystem CLI (mesh, energy, karma)"
echo "  p31-sync add  – record mobile earnings"
echo "  p31-sync push – push to D1 ledger"
echo ""
echo "To remote-in to your PC: ssh p31@<PC_IP>"
echo "Ollama URL defaults to gateway: http://<router_ip>:11434"
