# P31 Ecosystem Connectivity Test Report

**Generated:** 2026-03-23T14:25:34.814Z
**Overall Status:** FAILED
**Issues:** 5
**Warnings:** 2

## Service Status

- 🟢 **Discord Bot**: online
- 🟢 **Middleware**: online
- 🟢 **Gamification**: online
- 🟢 **Analytics**: online
- 🟢 **IPFS Manager**: online

## Connection Status

- ✅ **Discord Bot → Redis**: success
- ✅ **Middleware → GitHub API**: success
- ❌ **IPFS Manager → IPFS Gateway**: failed
- ✅ **Analytics → Data Sources**: success

## External Endpoints

- ❌ **GitHub API**: failed
- ❌ **IPFS Gateway**: failed
- ❌ **Zenodo API**: failed
- ✅ **Upstash Redis**: success
- ❌ **Discord API**: failed

## Dependencies

- ✅ **Node.js Version**: success
- ✅ **NPM Packages**: success
- ⚠️  **Environment Variables**: warning
- ⚠️  **File Permissions**: warning

## Issues

- ❌ IPFS Manager → IPFS Gateway: IPFS gateway returned status 410
- ❌ GitHub API: Endpoint returned status 403
- ❌ IPFS Gateway: Endpoint returned status 301
- ❌ Zenodo API: Endpoint returned status 403
- ❌ Discord API: Endpoint returned status 403

## Warnings

- ⚠️  Environment Variables: Missing env vars: DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, UPSTASH_REDIS_URL
- ⚠️  File Permissions: Permission issues: ecosystem/discord/oracle-bot.js: File not found, ecosystem/middleware/kofi-github-bridge.js: File not found, ecosystem/gamification/dual-ledger-economy.js: File not found

## Recommendations

🚨 **CRITICAL**: Address all issues before proceeding with deployment.
⚠️  **WARNING**: Review and address warnings for optimal performance.
🔐 Set up all required environment variables in .env files.
