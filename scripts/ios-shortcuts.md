# P31 iOS Shortcuts — Mobile-First Automation
# Build these in the Shortcuts app on iPhone.
# Each shortcut is a one-tap action from the Home Screen or Lock Screen widget.

---

## SHORTCUT 1: Log Spoon (−1)
**Add to:** Home Screen, Lock Screen widget, Back Tap (Accessibility)

Steps in Shortcuts app:
1. Add action: **Get Contents of URL**
   - URL: `https://api.p31ca.org/qfactor/event`
   - Method: POST
   - Headers: `Authorization: Bearer YOUR_P31_API_SECRET`
   - Body JSON:
     ```json
     {"userId":"will","source":"ios-shortcut","type":"spoon","value":-1}
     ```
2. Add action: **Vibrate Device** (Taptic: notification)
3. Add action: **Show Notification** — "Spoon logged. Sync Q-Factor."

**One-liner URL scheme (paste in Safari to import):**
`shortcuts://create?name=Log+Spoon`

---

## SHORTCUT 2: Check Calcium
**Add to:** Home Screen, Siri ("Hey Siri, check calcium")

Steps:
1. **Get Contents of URL**
   - URL: `https://api.p31ca.org/fhir/status`
   - Method: GET
   - Headers: `Authorization: Bearer YOUR_P31_API_SECRET`
2. **Get Dictionary Value** — key: `latestCalcium`
3. **Get Dictionary Value** — key: `valueMgDl`
4. **If** value < 7.8:
   - **Show Alert**: "⚠️ CALCIUM CRITICAL: [value] mg/dL — take supplement NOW"
   - **Vibrate**: critical
5. **Else**: **Speak Text** — "Calcium is [value] milligrams per deciliter"

---

## SHORTCUT 3: Q-Factor Status
**Add to:** Home Screen widget (Shortcuts widget, 2×2)

Steps:
1. **Get Contents of URL**
   - URL: `https://api.p31ca.org/qfactor/current?userId=will`
   - Method: GET
2. **Get Dictionary Value** — key: `quadrantLabel`
3. **Get Dictionary Value** — key: `qScore`  
4. **Speak Text** — "Q Factor: [qScore], [quadrantLabel]"
5. **Show Notification** — "[quadrantLabel] — Q [qScore]"

---

## SHORTCUT 4: Emergency Mesh Broadcast
**Add to:** Back Tap (triple-tap), Lock Screen

Steps:
1. **Show Alert** — "Send EMERGENCY to P31 mesh?" — OK/Cancel
2. **If** OK:
   - Open URL: `meshtastic:///send?channel=P31_FAMILY&message=EMERGENCY`
   - (Or: **Get Contents of URL** to POST via MQTT if Meshtastic app supports URL scheme)

---

## SHORTCUT 5: FHIR Epic Auth (one-time setup)
**Run once to authorize Epic access**

Steps:
1. **Open URL**: `https://api.p31ca.org/fhir/auth`
2. **(Safari opens Epic OAuth — log in with MyChart credentials)**
3. After redirect: **Show Notification** — "Epic FHIR authorized ✓"

---

## SHORTCUT 6: Court Alert Check
**Run when you hear from PeachCourt**

Steps:
1. Open URL: `https://app.element.io/#/room/#court-alerts:p31ca.org`
   *(Opens Matrix court-alerts room in Element app)*

---

## Lock Screen Widgets (iOS 16+)
Settings → Lock Screen → Customize → Add Widget → Shortcuts
- Add: "Log Spoon" (−1) — one tap from lock screen
- Add: "Q-Factor Status" — shows last Q-score as widget

## Back Tap (Accessibility → Touch → Back Tap)
- Double tap → "Log Spoon"
- Triple tap → "Emergency Mesh Broadcast"

---

## iSH / a-Shell: Run wrangler from iPhone
If you need CLI on iPhone:
```bash
# Install iSH (App Store) → Alpine Linux in a container
apk add nodejs npm git
npm install -g wrangler

# Deploy Q-Factor worker from iPhone
cd /root && git clone https://github.com/p31labs/andromeda
cd andromeda/software/cloudflare-worker/q-factor
wrangler deploy --env production
```

Or use **a-Shell** (App Store) with Pyto for Python scripts.
