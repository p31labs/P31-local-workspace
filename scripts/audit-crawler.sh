#!/usr/bin/env bash
# audit-crawler.sh — Scrape HN/Reddit for P31 Labs mentions
# Part of the P31 Money Stream mesh.
set -euo pipefail

LOG_FILE="logs/audit-leads.json"
DRY_RUN=false
QUERY="P31 Labs"
PLATFORMS="hn,reddit"

usage() {
    echo "Usage: $0 [--query <text>] [--platforms hn,reddit] [--dry-run]"
    exit 1
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --query) QUERY="$2"; shift 2 ;;
        --platforms) PLATFORMS="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        *) usage ;;
    esac
done

mkdir -p "$(dirname "$LOG_FILE")"

if [ "${SPOON_LEVEL:-0}" -lt 2 ]; then
    echo "{\"status\":\"skipped\",\"reason\":\"SPOON_LEVEL < 2\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$LOG_FILE"
    exit 0
fi

if [ "$DRY_RUN" = true ]; then
    echo "{\"status\":\"dry_run\",\"query\":\"$QUERY\",\"platforms\":\"$PLATFORMS\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$LOG_FILE"
    exit 0
fi

RESULTS=()

if [[ "$PLATFORMS" == *"hn"* ]]; then
    HN_RESP=$(curl -s "https://hn.algolia.com/api/v1/search?query=${QUERY// /%20}&tags=story&hitsPerPage=20")
    echo "$HN_RESP" | jq -c '.hits[] | {platform:"hn",title:.title,url:.url,points:.points,objectID:.objectID}' 2>/dev/null | while read -r hit; do
        RESULTS+=("$hit")
    done
fi

if [[ "$PLATFORMS" == *"reddit"* ]]; then
    REDDIT_RESP=$(curl -s -H "User-Agent: P31Labs/1.0" "https://www.reddit.com/search.json?q=${QUERY// /%20}&limit=10&sort=new")
    echo "$REDDIT_RESP" | jq -c '.data.children[] | {platform:"reddit",title:.data.title,url:.data.url,score:.data.score,subreddit:.data.subreddit}' 2>/dev/null | while read -r hit; do
        RESULTS+=("$hit")
    done
fi

printf '%s\n' "${RESULTS[@]}" | jq -s '{status:"success",results:.,count:(length),timestamp:"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' > "$LOG_FILE"
exit 0