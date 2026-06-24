# Login.gov / SAM.gov Recovery — Actions & Templates
**Date:** June 23, 2026  
**Status:** Blocked — requires human intervention

---

## CURRENT SITUATION

Login.gov account is LOCKED due to phone number change. Cannot receive SMS 2FA. SAM.gov full registration is blocked by Login.gov access.

**Entity:** P31 Labs, Inc.  
**EIN:** 42-1888158  
**UEI:** [INSERT UEI HERE once located]  
**SAM.gov profile exists** but registration is incomplete (needs Login.gov to proceed)

---

## WORKSTREAM A: Login.gov Recovery (Triage Only — MAX 30 min/day)

### Step 1: Attempt Login
- URL: https://secure.login.gov
- Enter known email + password
- If prompted for 2FA, look for "I don't have access to any of these" option

### Step 2: Check Backup Methods
- Check password manager for backup codes
- Check cloud notes, .txt files, printed copies
- Check for authenticator app (Google Authenticator, Authy, Aegis)

### Step 3: If Completely Locked Out
- **Document that deletion/recreation with SAME email is required**
- Deleting Login.gov does NOT delete SAM.gov entity record or UEI
- UEI and entity are tied to EMAIL, not Login.gov account

### Step 4: Contact FSD
- Phone: 866-606-8220 (toll-free)
- Web: https://fsd.gov
- Have ready: entity email, EIN, UEI (if known)

---

## FSD TICKET CONTENT (Copy-Paste)

```
Subject: SAM.gov Account Access — Login.gov 2FA Recovery

I have a SAM.gov entity account for P31 Labs, Inc. (Georgia nonprofit, EIN 42-1888158).
My Login.gov account is locked because I changed phone numbers and cannot receive SMS 2FA.
My entity email is: [INSERT EMAIL]
I need to recover Login.gov access to complete my SAM.gov full registration.
Please advise on recovery options.

Thank you.
```

---

## CALL SCRIPT (FSD)

```
"Hi, I need help recovering access to my SAM.gov account. My Login.gov is locked
because I changed my phone number. My entity is P31 Labs, Inc., EIN 42-1888158.
Can you help me reset or escalate this?"
```

---

## WHAT LOGIN.GOV RECOVERY UNLOCKS

| Dependency | Unlocks |
|------------|---------|
| Login.gov recovery | SAM.gov full registration (~10 business days) |
| SAM.gov full registration | Federal grants (NIDILRR RERC, NSF SBIR, HHS) |
| 501(c)(3) + SAM.gov | Small Business Innovation Research (SBIR) eligibility |
| SAM.gov entity active | SBA certification, GSA schedules |

---

## CRITICAL RULE

**Do NOT spend more than 30 minutes/day on Login.gov recovery.** Document the attempt, file the FSD ticket, and move on. The rest of the workstreams (C-100, 1023-EZ, OSC, grants) do NOT require Login.gov and should run in parallel.

---

## LOGIN.GOV ACCOUNT DELETION NOTE

Login.gov policy: operators cannot unlock accounts or modify 2FA. If no backup
methods exist, the account must be deleted and recreated.

**When recreating:** Use the EXACT SAME email address tied to SAM.gov.
- SAM.gov entity record is NOT deleted
- UEI is preserved
- Only the Login.gov credential is reset
