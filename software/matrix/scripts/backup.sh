#!/usr/bin/env bash
# P31 Matrix — encrypted nightly backup to Backblaze B2
# Add to crontab: 0 2 * * * /path/to/matrix/scripts/backup.sh

set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/p31-matrix-backup-${TIMESTAMP}"
ARCHIVE="${BACKUP_DIR}.tar.gz.gpg"

cleanup() { rm -rf "$BACKUP_DIR" "$ARCHIVE" 2>/dev/null; }
trap cleanup EXIT

mkdir -p "$BACKUP_DIR"

# 1. Dump Postgres (consistent snapshot)
echo "[backup] Dumping Postgres..."
docker compose exec -T postgres pg_dump \
  -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "${BACKUP_DIR}/postgres.sql.gz"

# 2. Archive signing key (critical — if lost, federation trust breaks)
echo "[backup] Archiving signing key..."
cp data/synapse/homeserver.signing.key "${BACKUP_DIR}/homeserver.signing.key"

# 3. Archive bridge databases
echo "[backup] Archiving bridge DBs..."
for BRIDGE in gmessages whatsapp signal meta postmoogle; do
  [ -f "bridges/${BRIDGE}/${BRIDGE}.db" ] && \
    cp "bridges/${BRIDGE}/${BRIDGE}.db" "${BACKUP_DIR}/${BRIDGE}.db" || true
done

# 4. Compress + encrypt with GPG symmetric (key from B2_APPLICATION_KEY)
echo "[backup] Encrypting archive..."
tar -czf - -C /tmp "p31-matrix-backup-${TIMESTAMP}" | \
  gpg --symmetric --cipher-algo AES256 --passphrase "${B2_APPLICATION_KEY}" \
      --batch --no-tty > "$ARCHIVE"

# 5. Upload to B2
echo "[backup] Uploading to B2..."
if command -v b2 >/dev/null 2>&1; then
  b2 file upload \
    --application-key-id "$B2_APPLICATION_KEY_ID" \
    --application-key "$B2_APPLICATION_KEY" \
    "$B2_BUCKET" "$ARCHIVE" "matrix-backup-${TIMESTAMP}.tar.gz.gpg"
else
  # Fallback: use rclone if available
  rclone copy "$ARCHIVE" "b2:${B2_BUCKET}/matrix-backup-${TIMESTAMP}.tar.gz.gpg"
fi

echo "[backup] Done — ${TIMESTAMP}"

# Keep last 14 days of backups in B2, delete older
echo "[backup] Pruning B2 backups older than 14 days..."
b2 list-file-names "$B2_BUCKET" --prefix "matrix-backup-" 2>/dev/null | \
  python3 -c "
import sys, json
from datetime import datetime, timedelta
cutoff = (datetime.utcnow() - timedelta(days=14)).timestamp() * 1000
for f in json.load(sys.stdin).get('files', []):
    if f['uploadTimestamp'] < cutoff:
        print(f['fileId'], f['fileName'])
" | while read -r file_id file_name; do
  b2 delete-file-version "$file_name" "$file_id" 2>/dev/null || true
done
