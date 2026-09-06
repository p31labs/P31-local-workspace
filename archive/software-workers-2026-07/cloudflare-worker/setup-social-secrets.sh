#!/bin/bash
# P31 Social Worker — Secret Setup Script
# Configures wrangler secrets for the unified social worker + Ko-fi webhook
#
# Run from: software/cloudflare-worker/

set -e

echo "=================================================="
echo " P31 SOCIAL WORKER — SECRET SETUP"
echo "=================================================="
echo ""

echo "Which worker are you configuring?"
echo "  1) p31-social-worker (social.p31ca.org) [default]"
echo "  2) p31-kofi-webhook (kofi.p31ca.org)"
echo ""
read -p "Choice [1]: " WORKER_CHOICE
WORKER_CHOICE=${WORKER_CHOICE:-1}

case $WORKER_CHOICE in
    1)
        WORKER_DIR="social-drop-automation"
        CONFIG_FLAG=""
        ;;
    2)
        WORKER_DIR="."
        CONFIG_FLAG="--config wrangler-kofi.toml"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "Configuring: $WORKER_DIR"
echo ""

# ── Discord Webhook ──
read -p "Set Discord webhook? (y/n) [y]: " SET_DISCORD
SET_DISCORD=${SET_DISCORD:-y}
if [ "$SET_DISCORD" = "y" ]; then
    echo "Paste your Discord webhook URL:"
    npx wrangler secret put DISCORD_WEBHOOK_URL $CONFIG_FLAG
    echo "OK Discord configured"
fi

if [ "$WORKER_CHOICE" = "1" ]; then
    # ── Twitter/X ──
    echo ""
    read -p "Set Twitter API keys? (y/n) [n]: " SET_TWITTER
    if [ "$SET_TWITTER" = "y" ]; then
        echo "Paste API Key:"
        npx wrangler secret put TWITTER_API_KEY $CONFIG_FLAG
        echo "Paste API Secret:"
        npx wrangler secret put TWITTER_API_SECRET $CONFIG_FLAG
        echo "Paste Access Token:"
        npx wrangler secret put TWITTER_ACCESS_TOKEN $CONFIG_FLAG
        echo "Paste Access Token Secret:"
        npx wrangler secret put TWITTER_ACCESS_TOKEN_SECRET $CONFIG_FLAG
        echo "OK Twitter configured"
    fi

    # ── Reddit ──
    echo ""
    read -p "Set Reddit API keys? (y/n) [n]: " SET_REDDIT
    if [ "$SET_REDDIT" = "y" ]; then
        echo "Paste Client ID:"
        npx wrangler secret put REDDIT_CLIENT_ID $CONFIG_FLAG
        echo "Paste Client Secret:"
        npx wrangler secret put REDDIT_CLIENT_SECRET $CONFIG_FLAG
        echo "Enter Reddit username:"
        npx wrangler secret put REDDIT_USERNAME $CONFIG_FLAG
        echo "Enter Reddit password:"
        npx wrangler secret put REDDIT_PASSWORD $CONFIG_FLAG
        echo "OK Reddit configured"
    fi

    # ── Bluesky ──
    echo ""
    read -p "Set Bluesky keys? (y/n) [n]: " SET_BLUESKY
    if [ "$SET_BLUESKY" = "y" ]; then
        echo "Enter handle (e.g., p31labs.bsky.social):"
        npx wrangler secret put BLUESKY_HANDLE $CONFIG_FLAG
        echo "Paste App Password:"
        npx wrangler secret put BLUESKY_APP_PASSWORD $CONFIG_FLAG
        echo "OK Bluesky configured"
    fi

    # ── Mastodon ──
    echo ""
    read -p "Set Mastodon keys? (y/n) [n]: " SET_MASTODON
    if [ "$SET_MASTODON" = "y" ]; then
        echo "Enter instance URL (e.g., https://mastodon.social):"
        npx wrangler secret put MASTODON_INSTANCE $CONFIG_FLAG
        echo "Paste Access Token:"
        npx wrangler secret put MASTODON_ACCESS_TOKEN $CONFIG_FLAG
        echo "OK Mastodon configured"
    fi

    # ── Nostr ──
    echo ""
    read -p "Set Nostr keys? (y/n) [n]: " SET_NOSTR
    if [ "$SET_NOSTR" = "y" ]; then
        echo "Paste private key (hex):"
        npx wrangler secret put NOSTR_PRIVATE_KEY $CONFIG_FLAG
        echo "OK Nostr configured"
    fi

    # ── Substack ──
    echo ""
    read -p "Set Substack API key? (y/n) [n]: " SET_SUBSTACK
    if [ "$SET_SUBSTACK" = "y" ]; then
        echo "Paste Substack API key:"
        npx wrangler secret put SUBSTACK_API_KEY $CONFIG_FLAG
        echo "OK Substack configured"
    fi
fi

if [ "$WORKER_CHOICE" = "2" ]; then
    # ── Ko-fi secret ──
    echo ""
    read -p "Set Ko-fi webhook secret? (y/n) [y]: " SET_KOFI
    SET_KOFI=${SET_KOFI:-y}
    if [ "$SET_KOFI" = "y" ]; then
        echo "Paste Ko-fi webhook secret:"
        npx wrangler secret put KOFI_SECRET $CONFIG_FLAG
        echo "OK Ko-fi configured"
    fi
fi

echo ""
echo "=================================================="
echo " SETUP COMPLETE"
echo "=================================================="
echo ""
echo "Verify secrets:"
echo "  npx wrangler secret list $CONFIG_FLAG"
echo ""
echo "Deploy:"
if [ "$WORKER_CHOICE" = "1" ]; then
    echo "  cd social-drop-automation && npx wrangler deploy"
else
    echo "  npx wrangler deploy --config wrangler-kofi.toml"
fi
echo ""
