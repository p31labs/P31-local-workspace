#!/usr/bin/env bash
# post-sponsorships.sh — GitHub sponsors check + outreach lead log
# Part of the P31 Money Stream mesh.
set -euo pipefail

LOG_FILE="logs/outreach.log"
DRY_RUN=false
ORG="P31Labs"

usage() {
    echo "Usage: $0 [--org <org>] [--dry-run]"
    exit 1
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --org) ORG="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        *) usage ;;
    esac
done

mkdir -p "$(dirname "$LOG_FILE")"

if [ "$DRY_RUN" = true ]; then
    echo "{\"status\":\"dry_run\",\"org\":\"$ORG\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$LOG_FILE"
    exit 0
fi

if ! command -v gh &>/dev/null; then
    echo "{\"status\":\"error\",\"message\":\"gh CLI not installed\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$LOG_FILE"
    exit 2
fi

QUERY='query($org:String!){organization(login:$org){sponsorshipsAsMaintainer(first:100){nodes{sponsorEntity{...on User{login name}...on Organization{login name}}tier{name monthlyPriceInDollars}}}}}'
gh api graphql -f query="$QUERY" -F org="$ORG" --jq '.data.organization.sponsorshipsAsMaintainer.nodes[] | {sponsor:.sponsorEntity.login,tier:.tier.name,amount:.tier.monthlyPriceInDollars}' 2>/dev/null | jq -s '{status:"success",sponsors:.,count:(length),org:"'"$ORG"'",timestamp:"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' > "$LOG_FILE"

# If no sponsors, still write valid JSON
if [ ! -s "$LOG_FILE" ]; then
    echo "{\"status\":\"success\",\"sponsors\":[],\"count\":0,\"org\":\"$ORG\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$LOG_FILE"
fi
exit 0