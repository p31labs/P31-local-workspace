# Parallel Money Streams for P31 Labs

Five automated, low-ATP income streams that run in terminal/tmux.

## Streams Overview

1. **Bounty Hunter** (`bounty-hunter.sh`)
   - Scans Web3/infra protocols for vulnerabilities
   - Uses Nuclei + custom fuzzers
   - Targets: Uniswap, Chainlink, Aave, etc.
   - Potential: $500-$50k per bug

2. **Asset Packager** (`package-assets.sh`)
   - Packages spoon-state UI kit, BROS worker template, Akinator engine
   - Uploads to Gumroad (if API key set)
   - Publishes to npm (if token set)
   - Products: $29-$99 digital assets

3. **Audit Crawler** (`audit-crawler.sh`)
   - Finds startups needing ADA compliance help
   - Scrapes Hacker News Show HN posts
   - Sends personalized email pitches
   - Service: $1k-$10k accessibility audits

4. **Action Publisher** (`publish-action.sh`)
   - Creates and publishes ADA compliance GitHub Action
   - To GitHub Marketplace
   - Revenue: Usage-based or sponsorship

5. **Outreach Automation** (`post-sponsorships.sh`)
   - Posts to Indie Hackers "Who is hiring?"
   - Updates GitHub Sponsors tiers
   - Sends follow-up emails to leads
   - Updates social media

## Prerequisites

- tmux (for parallel execution)
- bash
- Standard Unix tools (curl, jq, etc.)
- Optional API keys for full automation:
  - GUMROAD_API_KEY (for digital product sales)
  - NPM_TOKEN (for publishing to npm)
  - GH_TOKEN (for GitHub API access)
  - Optional: Twitter API, LinkedIn API, Resend/SendGrid for emails

## Quick Start

```bash
# Make scripts executable (run once)
chmod +x /home/p31/P31-local-workspace/scripts/*.sh

# Launch all streams in tmux
/home/p31/P31-local-workspace/scripts/launch-money-streams.sh

# To detach (leave running): Ctrl+B then D
# To reattach later: tmux attach-session -t p31-money-streams
# To kill all: tmux kill-session -t p31-money-streams
```

## Individual Stream Control

Run any stream directly:
```bash
/home/p31/P31-local-workspace/scripts/bounty-hunter.sh
# (Ctrl+C to stop, or let it run - it loops)
```

## Logs and Output

All streams log to:
- `/home/p31/P31-local-workspace/logs/`

Key log files:
- bounty-hunter.log
- package-assets.log  
- audit-crawler.log
- publish-action.log
- post-sponsorships.log
- bounty-findings.json (potential vulnerabilities)
- audit-leads.json (startup leads)
- outreach.log (all outreach attempts)

## Environment Variables

Set these in your shell profile (`~/.bashrc` or `~/.zshrc`) for full automation:

```bash
# Digital sales
export GUMROAD_API_KEY="your_gumroad_key_here"
export NPM_TOKEN="your_npm_token_here"

# GitHub/Marketplace
export GH_TOKEN="your_github_token_here"

# Email (if using direct SMTP)
# export SMTP_USER="your_smtp_user"
# export SMTP_PASS="your_smtp_pass"
```

## Safety Notes

- All scripts include rate limiting to avoid abuse
- Email sending is logged-only by default (safe for testing)
- No destructive actions - only creates, reads, and communicates
- Money streams are designed to be low-maintenance once started
- Run in tmux or screen to survive session disconnects

## Expected Outcomes (Morning After)

- Bug bounty findings in `bounty-findings.json`
- Digital products live on Gumroad/npm (if keys set)
- 10-100 startup leads in `audit-leads.json`
- GitHub Action published to Marketplace (if GH token set)
- Outreach logs showing hundreds of contacts made

## Customization

Edit any script to adjust:
- Target protocols (bounty hunter)
- Product pricing and descriptions (asset packager)
- Email templates (audit crawler and outreach)
- GitHub Action features (action publisher)

## Troubleshooting

- "command not found": Install missing dependencies (npm, go, etc.)
- Permission errors: Check script executable status (`chmod +x`)
- API errors: Verify tokens/keys are valid and not expired
- tmux issues: Ensure tmux is installed (`which tmux`)

---
*Generated for P31 Labs - Terminal-first income generation*