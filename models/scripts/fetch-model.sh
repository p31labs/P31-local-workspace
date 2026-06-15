#!/usr/bin/env bash
set -euo pipefail
# fetch-model.sh — P31 JIT AI provisioning
# Usage: ./fetch-model.sh <model-id> [output-dir]
# Example: ./fetch-model.sh qwen2.5:1.5b-q4_k_m ~/.local/share/p31.ai/models

MODEL_ID="${1:?Usage: $0 <model-id> [output-dir]}"
OUT_DIR="${2:-$HOME/.local/share/p31.ai/models/downloaded}"
TMP_DIR="${OUT_DIR}/../in-progress"
MANIFEST_PATH="${OUT_DIR}/../manifests/model-manifest.json"
R2_BUCKET="p31-ai-models"
R2_ENDPOINT="https://p31-ai-models.r2.cloudflarestorage.com"
MAX_RETRIES=3
RETRY_DELAY=2

mkdir -p "$OUT_DIR" "$TMP_DIR"

# --- Locate model in manifest ---
model_r2_key="$(jq -r --arg id "$MODEL_ID" '.models[] | select(.id == $id) | .r2_key' "$MANIFEST_PATH")"
model_sha256="$(jq -r --arg id "$MODEL_ID" '.models[] | select(.id == $id) | .sha256' "$MANIFEST_PATH")"
model_size_mb="$(jq -r --arg id "$MODEL_ID" '.models[] | select(.id == $id) | .size_mb' "$MANIFEST_PATH")"

if [[ -z "$model_r2_key" || "$model_r2_key" == "null" ]]; then
  echo "ERROR: Model '$MODEL_ID' not found in manifest." >&2
  exit 1
fi

filename="${model_r2_key##*/}"
final_path="${OUT_DIR}/${filename}"
tmp_path="${TMP_DIR}/${filename}.tmp.$$"
sidecar_path="${OUT_DIR}/.${filename}.sha256"

# --- Skip if already cached and verified ---
if [[ -f "$final_path" && -f "$sidecar_path" ]]; then
  existing_sha="$(cut -d' ' -f1 "$sidecar_path")"
  if [[ "$existing_sha" == "$model_sha256" ]]; then
    echo "SKIP: $MODEL_ID already cached and verified at $final_path"
    exit 0
  else
    echo "WARN: Cached checksum mismatch for $MODEL_ID — re-downloading."
    rm -f "$final_path" "$sidecar_path"
  fi
fi

# --- Request pre-signed URL (Worker endpoint) ---
printf "Requesting download URL for %s (%s MB)...\n" "$MODEL_ID" "$model_size_mb"
download_url="$(
  curl -s --max-time 10 \
    "https://your-worker.workers.dev/api/presign?key=${model_r2_key}&bucket=${R2_BUCKET}" \
  | jq -r '.url'
)"

if [[ -z "$download_url" || "$download_url" == "null" ]]; then
  echo "ERROR: Failed to obtain pre-signed URL. Falling back to direct R2." >&2
  download_url="${R2_ENDPOINT}/${model_r2_key}"
fi

# --- Download with retries ---
attempt=0
until [[ $attempt -ge $MAX_RETRIES ]]; do
  attempt=$((attempt + 1))
  echo "Downloading (attempt $attempt/$MAX_RETRIES)..."

  if curl -L --retry 2 --retry-delay "$RETRY_DELAY" \
       --connect-timeout 15 --max-time 600 \
       -H "Accept: application/octet-stream" \
       "$download_url" \
       -o "$tmp_path" \
       --progress-bar; then
    break
  fi

  echo "Download attempt $attempt failed. Retrying in ${RETRY_DELAY}s..." >&2
  sleep "$RETRY_DELAY"
  rm -f "$tmp_path"
done

if [[ ! -f "$tmp_path" ]]; then
  echo "ERROR: Download failed after $MAX_RETRIES attempts." >&2
  exit 1
fi

# --- Verify SHA-256 checksum ---
echo "Verifying SHA-256 checksum..."
computed_sha="$(sha256sum "$tmp_path" | cut -d' ' -f1)"

if [[ "$computed_sha" != "$model_sha256" ]]; then
  echo "ERROR: Checksum mismatch!" >&2
  echo "  Expected: $model_sha256" >&2
  echo "  Got:      $computed_sha" >&2
  rm -f "$tmp_path"
  exit 1
fi

# --- Atomic rename to final path ---
mv "$tmp_path" "$final_path"
echo "${model_sha256}  ${filename}" > "$sidecar_path"
echo "VERIFIED: $MODEL_ID written to $final_path ($model_size_mb MB)"

# --- Register with Ollama ---
if command -v ollama &>/dev/null; then
  echo "Registering with Ollama: ollama create $MODEL_ID --from-file $final_path"
  ollama create "$MODEL_ID" --from-file "$final_path"
  echo "Ollama registration complete."
else
  echo "WARN: ollama binary not found on PATH. Model downloaded but not registered." >&2
  echo "      Install Ollama from https://ollama.com and run:" >&2
  echo "      ollama create $MODEL_ID --from-file $final_path" >&2
fi
