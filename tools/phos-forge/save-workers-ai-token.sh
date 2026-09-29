#!/usr/bin/env bash
# save-workers-ai-token.sh — store the Workers AI API token securely.
# Usage: ./save-workers-ai-token.sh "<paste-your-cfut-token>"
set -euo pipefail

TOKEN="${1:?usage: ./save-workers-ai-token.sh '<cfut_...token>'}"
if [[ "${TOKEN}" != cfut_* ]]; then
  echo "ERROR: expected a token starting with cfut_ (Workers AI API token). Got: ${TOKEN:0:6}..."
  exit 1
fi

mkdir -p "${HOME}/.p31"
umask 077
printf '%s\n' "${TOKEN}" > "${HOME}/.p31/workers-ai-token"
chmod 600 "${HOME}/.p31/workers-ai-token"

echo "✅ saved to ~/.p31/workers-ai-token (mode 600, not committed)"
echo ""
echo "Export for this session:"
echo "  export CLOUDFLARE_ACCOUNT_ID=\"ee05f70c889cb6f876b9925257e3a2fa\""
echo "  export CF_API_TOKEN=\"\$(cat ~/.p31/workers-ai-token)\""
echo ""
echo "Persist across sessions (add to ~/.bashrc):"
echo "  echo 'export CF_API_TOKEN=\"\$(cat ~/.p31/workers-ai-token)\"' >> ~/.bashrc"
echo "  echo 'export CLOUDFLARE_ACCOUNT_ID=\"ee05f70c889cb6f876b9925257e3a2fa\"' >> ~/.bashrc"