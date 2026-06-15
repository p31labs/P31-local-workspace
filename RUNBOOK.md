# P31 Operator Runbook – Meat Space Edition

## 1. Where Everything Lives

| Component               | Path / URL                                                                 |
|------------------------|----------------------------------------------------------------------------|
| Monorepo root          | `~/P31-local-workspace/`                                                   |
| Stream scripts         | `~/P31-local-workspace/scripts/`                                           |
| Stream logs            | `~/P31-local-workspace/logs/`                                              |
| Onboarding portal      | `https://932c1b67.p31ca.pages.dev/onboard/` (or `p31ca.org/onboard/`)      |
| Signaling worker       | `https://p31-signaling.trimtab-signal.workers.dev/peers`                   |
| Willow (daughter)      | `https://fa7648de.willow-a23.pages.dev`                                    |
| Spaceship Earth        | `https://9e156ea0.spaceship-earth.pages.dev`                               |
| p31ca                  | `https://932c1b67.p31ca.pages.dev`                                         |
| PHOS web               | `https://5bce59d0.phos-btn.pages.dev`                                      |
| Gumroad products       | `willow680.gumroad.com` (Spoon‑State, BROS, Akinator)                      |
| npm org                | `@p31` – 6 packages published                                             |

---

## 2. Quick Health Check (Morning Ritual)

```bash
cd ~/P31-local-workspace

# 1. Check all streams are running
tmux attach -t p31-money-streams          # if tmux session exists
# OR
ps aux | grep -E "bounty|package|audit|publish|post|monitor" | grep -v grep

# 2. See latest logs
tail -20 logs/*.log

# 3. Verify endpoints are up
for url in \
  https://fa7648de.willow-a23.pages.dev \
  https://932c1b67.p31ca.pages.dev \
  https://9e156ea0.spaceship-earth.pages.dev \
  https://p31-signaling.trimtab-signal.workers.dev/peers
do
  curl -s -o /dev/null -w "%{http_code} %{url}\n" "$url"
done

# 4. Check bounty findings (if any)
cat logs/bounty-findings.json | jq '.[] | {severity, name, url}'
```

---

## 3. Stream Management – Start / Stop / Monitor

### Start everything (tmux session)
```bash
cd ~/P31-local-workspace/scripts
./launch-money-streams.sh
# Detach: Ctrl+B then D
```

### Stop everything
```bash
tmux kill-session -t p31-money-streams
# OR kill background jobs
kill $(cat logs/*.pid 2>/dev/null)
```

### Restart a single stream (e.g., bounty‑hunter)
```bash
# Kill it
kill $(cat logs/bounty-hunter.pid)
# monitor.sh will auto‑restart within 5 minutes
# OR restart manually
nohup scripts/bounty-hunter.sh > logs/bounty-hunter.log 2>&1 &
echo $! > logs/bounty-hunter.pid
```

### Watch logs live
```bash
tail -f logs/*.log                     # all streams
tail -f logs/package-assets.log        # specific stream
```

---

## 4. Money Streams – What They Do & When

| Stream            | Frequency | What it does                               | Key output                           |
|-------------------|-----------|--------------------------------------------|--------------------------------------|
| `bounty-hunter`   | every 2h  | Scans P31 endpoints + TLS/headers          | `logs/bounty-findings.json`          |
| `package-assets`  | hourly    | Packages, uploads to Gumroad, publishes npm| `logs/gumroad-*.zip`                 |
| `audit-crawler`   | hourly    | Scrapes HN Show HN for startup leads       | `logs/audit-leads.json`              |
| `publish-action`  | hourly    | Updates ADA GitHub Action repo             | `github.com/p31labs/ada-check-action`|
| `post-sponsorships`| every 2h | Checks GitHub sponsors, marks leads contacted | `logs/outreach.log`                 |
| `monitor`         | every 5min| Restarts dead streams, logs health         | `logs/monitor.log`                   |

### Manual trigger (test a stream)
```bash
cd ~/P31-local-workspace/scripts
./audit-crawler.sh      # runs once, then exits (loops internally)
```

---

## 5. Deploying Updates (When You Change Code)

### Web apps (Spaceship Earth, p31ca, PHOS, Willow)
```bash
# Example: deploy willow after a change
cd ~/P31-local-workspace/software/willow
pnpm build
npx wrangler pages deploy dist --project-name willow --branch main
```

### Signaling worker
```bash
cd ~/P31-local-workspace/workers/signaling
npx wrangler deploy
```

### Nix environment (if you use it)
```bash
cd ~/P31-local-workspace
nix develop   # enters hermetic shell (Node 22, Rust, pnpm, wasm-pack)
```

---

## 6. Onboarding Portal – Two Doors

- **Warm Door** (for mom, 70): heart pulse → pick face → hear voice → reply → feeling slider → delta.
- **Sparkle Door** (for daughter, 6): star burst → game picker → matching game → reward → pick friend → delta.
- **Delta screen**: shows tetrahedron, LOVE score, connected peers.

URL: `https://932c1b67.p31ca.pages.dev/onboard/`

To reset a user's progress (clear localStorage):
```javascript
localStorage.removeItem('p31:onboard');
```

---

## 7. Telegram Alerts (Optional but Nice)

1. Create a bot via `@BotFather` on Telegram. Get token.
2. Start a chat with your bot, send any message.
3. Get your chat ID:
   ```bash
   curl https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates | jq '.result[0].message.chat.id'
   ```
4. Add to `~/.env.master` (or export in shell):
   ```bash
   export TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
   export TELEGRAM_CHAT_ID="123456789"
   ```
5. Streams will automatically send cycle‑complete alerts.

---

## 8. Troubleshooting Common Fumbles

### "tmux session not found"
```bash
tmux ls
# If missing, re‑launch: ./launch-money-streams.sh
```

### "nuclei: command not found"
```bash
go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
export PATH=$PATH:~/go/bin
```

### "npm publish fails with 403"
- Version already exists → bump version in `package.json`.
- Wrong scope → ensure package name is `@p31/...` (not `@p31labs`).

### "Gumroad product not showing zip"
- The script creates product metadata only (direct file upload is deprecated).  
- Manually add the zip from `logs/gumroad-*.zip` via Gumroad dashboard → "Add file".

### "Willow build fails (TS errors)"
- The canonical build is at `apps/willow/`, not `software/willow/`.  
- Use `cd apps/willow && pnpm build`.

### "Signaling worker returns empty peers"
- Newly registered nodes appear within 60s (KV TTL).  
- Test manually:
  ```bash
  curl -X POST https://p31-signaling.trimtab-signal.workers.dev/register \
    -H "Content-Type: application/json" \
    -d '{"node_id":"test","port":8080}'
  curl https://p31-signaling.trimtab-signal.workers.dev/peers
  ```

---

## 9. Daily / Weekly Habits

**Every morning:**
- `tail -20 logs/*.log` – check for errors.
- `tmux attach -t p31-money-streams` – glance at running streams.
- Visit Gumroad dashboard – see if any sales came in.

**Every Monday:**
- Review `logs/audit-leads.json` – follow up with startups manually.
- Check `logs/bounty-findings.json` – any real vulns? Report them.

**Every month:**
- Run `nix flake update` to refresh dependencies.
- Renew Gumroad API token if expired.
- Update `willow` security headers if new policies needed.

---

## 10. Emergency Contacts / Quick Commands Card

| Problem                          | Fix                                                                 |
|----------------------------------|---------------------------------------------------------------------|
| Streams dead                     | `tmux kill-session; ./launch-money-streams.sh`                      |
| Willow down                      | `cd software/willow; pnpm build; wrangler pages deploy dist --project-name willow` |
| Can't find logs                  | `ls -la ~/P31-local-workspace/logs/`                                |
| Forgot Telegram token            | `cat ~/.env.master | grep TELEGRAM`                                 |
| Need to reset onboarding         | Open browser devtools → Console → `localStorage.removeItem('p31:onboard')` |
| Gumroad not updating             | Manually re‑upload zip from `logs/gumroad-*.zip`                    |
| pnpm install fails               | `rm -rf node_modules; pnpm install`                                 |

---

**You've got this.** Runbook is in `~/P31-local-workspace/RUNBOOK.md`. Bookmark it, print it, tape it to your monitor. The mesh is alive.
