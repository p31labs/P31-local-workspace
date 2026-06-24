# P31 Labs — Next Steps Plan
**Date:** June 23, 2026  
**Status:** Infrastructure live, human actions pending

---

## 🔧 Just Completed (Machine-Executed)

| Action | Result |
|--------|--------|
| Deleted `jitterbug-db` (0 tables, unused) | Freed D1 slot |
| Created `p31-revenue-db` | ✅ ENAM region |
| Applied schema (3 tables, 12 rows written) | ✅ sales, daily_revenue, milestones |
| Deployed `p31-gumroad-webhook` with D1 binding | ✅ `env.DB (p31-revenue-db)` live |
| Worker health check | `{"status":"operational"}` |

**Revenue pipeline is now fully armed:**
```
Gumroad webhook → D1 (p31-revenue-db) + Discord + Queue-ready
```

---

## 🎯 Execution Plan: Next 48 Hours

### Hour 0–1: File Georgia C-100
**Block:** Nothing — just you and a browser.  
**Action:** https://sos.ga.gov/page/charitable-registration  
**Cost:** $35 via Mercury card.  
**Deliverable:** Confirmation number (save to `.p31/c-100-confirmation.txt`).

**Why first:** Unlocks state-level fundraising, strengthens 501(c)(3) narrative, required for OSC fiscal sponsorship docs.

---

### Hour 1–2: Upload Ko-fi Products
**Block:** None — files are in `ko-fi-products/`.  
**Action:** https://ko-fi.com/trimtab69420/shop → Add Product (4× digital download).

| File | Price |
|------|-------|
| `The_Minimum_Enclosing_Structure_P31_Labs_2026.pdf` | $5 PWYW |
| `K4_Convergence_Table_Print.svg` | $3 |
| `Floating_Neutral_Diagram_Print.svg` | $3 |
| `As_Above_So_Below_Print.svg` | $3 |

**Deliverable:** Live shop URLs. Test one purchase (use smallest amount, refund if needed).

**Why second:** Immediate revenue. Every sale = node in Delta mesh + Discord notification + potential cash today.

---

### Hour 2–3: Send Letters of Support + ASAN Email
**Block:** None — email only.  
**Action:**
1. Open `LETTERS_OF_SUPPORT_DRAFTS.md`.
2. Send to Brenda O'Dell (brendaodell54@gmail.com) — personalize the board director template.
3. Send to one academic contact (fill `[Name]` in the academic template).
4. Send to one open-source maintainer (fill `[Name]` in the OSS template).
5. Send ASAN email to `ebouderdaben@autisticadvocacy.org` using `ASAN_ELIGIBILITY_VERIFICATION.md`.

**Deliverable:** Sent folder screenshots or 5 sent emails.

**Why third:** Institutional validation. Letters strengthen OSC application, ASAN eligibility, and future grant narrative. ASAN email prevents disqualification on BIPOC-community technicality.

---

### Hour 3–4: Attempt Login.gov Recovery
**Block:** 30-minute time limit per `LOGIN_GOV_RECOVERY.md`.  
**Action:** https://secure.login.gov → password + 2FA options.  
**If locked:** Delete + recreate with same email.  
**If stuck:** Call FSD **866-606-8220**.

**Deliverable:** Documented outcome in `.p31/login.gov-status.txt`.

**Why fourth:** Unlocks SAM.gov → federal grants (NIDILRR RERC, NSF SBIR, HHS). But do NOT let this consume more than 30 min today.

---

### Hour 4–5: Create Gumroad Account + Configure Webhook
**Block:** Need merchant account (PayPal or Stripe).  
**Action:**
1. Sign up at gumroad.com.
2. Set webhook URL: `https://p31-gumroad-webhook.trimtab-signal.workers.dev`.
3. Set webhook secret (matches `GUMROAD_WEBHOOK_SECRET` you'll put in wrangler).
4. Upload same 4 products from `ko-fi-products/`.
5. Create bundle: all 4 for $12.

**Deliverable:** Live Gumroad store + webhook verified.

**Why fifth:** Parallel passive income channel. Products already built. Gumroad adds marketplace discovery + license key infrastructure.

---

### Hour 5–6: Publish Substack Week 1 Article
**Draft:** "Why I Built BONDING on My Son's Birthday"  
**Distribution:**
1. Publish on Substack (`thegeodesicself.substack.com`).
2. Post to Substack Notes (discovery engine).
3. Cross-post to Dev.to (tags: `TypeScript`, `React`, `accessibility`, `neurodiversity`).
4. Link to Ko-fi shop and GitHub.

**Deliverable:** Published URL + Dev.to cross-post URL.

**Why sixth:** Audience building. Grants and institutional validation require public narrative presence.

---

## 📅 This Week (July 1–10 Window)

| Date | Action | Script/Artifact |
|------|--------|------------------|
| **July 1** | Submit Awesome Foundation Disability grant | `AWESOME_FOUNDATION_APPLICATION.md` |
| **July 1–10** | Watch ASAN STEP interview invites | Contact: `ebouderdaben@autisticadvocacy.org` |
| **July 1–10** | Follow up on OSC fiscal sponsorship | Check email for `opencollective.com/opensource/apply` |
| **July 1–10** | Set up Every.org profile | https://every.org — 0% DAF/stock fees |

---

## 🔮 After Human Actions Complete

I can then execute (automatically, once you report back):

| Trigger | My Action |
|---------|-----------|
| C-100 confirmation # received | Update OSC application, prepare 1023-EZ follow-up docs |
| Login.gov recovered | Start SAM.gov full registration walkthrough |
| Ko-fi products live | Verify webhook → Discord → KV node count flow |
| Gumroad account + webhook set | Send test sale event → verify D1 insert + Discord embed |
| Substack article published | Run `p31-substack-status.sh` to verify RSS diff + fan-out |
| OSC approved | Update config.yaml with profile URL, begin ASAN STEP fiscal setup |

---

## 🧭 Execution Rule

Pick ONE item from Hour 0–1 through Hour 5–6. Complete it. Report back. I handle the downstream automation immediately.

**Recommended start: Georgia C-100** (15 min, highest leverage, no dependencies).

---
*Ca₉(PO₄)₆*
