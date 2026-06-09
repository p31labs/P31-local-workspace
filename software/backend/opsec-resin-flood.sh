#!/bin/bash
# P31 OPSEC Hardening Script
# Execute this to seal the GitHub perimeter using the GitHub CLI (gh)

echo "🔺 INITIATING P31 OPSEC RESIN FLOOD..."

# 1. Archive Privacy Lock-Down
# Moves vulnerable public archives to Private to prevent credential scraping
echo "Locking down legacy public archives..."
gh repo edit p31labs/love-ledger --visibility private
gh repo edit p31labs/game-engine --visibility private
gh repo edit p31labs/node-zero --visibility private
gh repo edit p31labs/p31ca --visibility private
gh repo edit p31labs/p31ca.org --visibility private

# 2. Branch Protection Rules for Andromeda
# Requires approvals, enforces linear history, and blocks force pushes
echo "Applying clinical-grade branch protection to Andromeda..."
gh api \
  --method PUT \
  -H "Accept: application/vnd.github.v3+json" \
  /repos/p31labs/andromeda/branches/main/protection \
  -f enforce_admins=true \
  -f required_pull_request_reviews[required_approving_review_count]=1 \
  -f required_pull_request_reviews[dismiss_stale_reviews]=true \
  -f required_pull_request_reviews[require_code_owner_reviews]=true \
  -f required_status_checks[strict]=true \
  -f required_status_checks[contexts][]="Q-Suite Agent RED" \
  -f required_status_checks[contexts][]="Q-Suite Agent BLUE" \
  -f required_linear_history=true \
  -f allow_force_pushes=false \
  -f allow_deletions=false

echo "✅ RESIN DEPLOYED. PERIMETER SEALED."