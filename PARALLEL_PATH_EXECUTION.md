# P31 Labs — Parallel Path Execution Prompt
**For:** Local Agent / Claude Code  
**Date:** June 23, 2026  
**Mode:** BUILD — Execute in parallel, do not block on Login.gov

---

## CONTEXT

- **Entity:** P31 Labs, Inc. — Georgia Domestic Nonprofit, EIN 42-1888158
- **Status:** 501(c)(3) pending (Form 1023-EZ not yet filed)
- **Login.gov:** LOCKED due to phone number change. Cannot receive SMS 2FA. SAM.gov has UEI assigned but full registration blocked by Login.gov access.
- **FSD Account:** Exists but also requires Login.gov.
- **Financial:** Open Collective set up. Ko-fi shop live with 4 products. Mercury bank account active. Near-zero liquidity.
- **Strategic Objective:** Unlock institutional validation and capital flow while Login.gov is being resolved. Do NOT wait for Login.gov to execute other workstreams.

---

## WORKSTREAMS — EXECUTE IN PARALLEL

### WORKSTREAM A: Login.gov Recovery (Triage Only — MAX 30 min/day)

**Goal:** Document the lockout and attempt recovery without getting stuck.

Steps:
1. Navigate to https://secure.login.gov
2. Enter known email + password
3. If prompted for 2FA, look for "I don't have access to any of these" option
4. Check local system for backup codes (password manager, .txt files, printed copies)
5. Check for authenticator apps (Google Authenticator, Authy, Aegis)
6. If completely locked out: document that deletion/recreation with SAME email is required
7. Prepare FSD ticket content (see below)
8. Contact FSD at 866-606-8220 or https://fsd.gov

**FSD Ticket Content:**
```
Subject: SAM.gov Account Access — Login.gov 2FA Recovery

I have a SAM.gov entity account with UEI [INSERT UEI IF KNOWN].
My Login.gov account is locked because I changed phone numbers and cannot receive SMS 2FA.
I need to recover access to complete my SAM.gov registration.
My entity email is: [INSERT EMAIL]
Entity: P31 Labs, Inc., Georgia nonprofit, EIN 42-1888158
Please advise on recovery options.
```

**CRITICAL:** If Login.gov must be deleted and recreated, use the EXACT SAME email address tied to SAM.gov. Deleting Login.gov does NOT delete SAM.gov entity record or UEI.

---

### WORKSTREAM B: Georgia C-100 Charitable Registration

**Cost:** $35  
**Link:** https://sos.ga.gov/page/charitable-registration  
**NO Login.gov required**

Steps:
1. Navigate to sos.ga.gov/page/charitable-registration
2. Register P31 Labs, Inc.
3. Required info:
   - EIN: 42-1888158
   - Entity type: Nonprofit corporation
   - Incorporation date: April 3, 2026
   - Registered agent address
   - Principal office address
4. Pay $35 filing fee
5. Save confirmation number and filing receipt

**Deliverable:** Confirmation number or receipt screenshot

---

### WORKSTREAM C: IRS Form 1023-EZ (501(c)(3) Application)

**Cost:** $275  
**Link:** https://www.irs.gov/forms-pubs/form-1023-ez  
**NO Login.gov required**

Steps:
1. Navigate to irs.gov/forms-pubs/form-1023-ez
2. Complete online application
3. Pay.gov fee: $275
4. Required info:
   - EIN: 42-1888158
   - Georgia Articles of Incorporation
   - Mission statement
   - Projected budget (can be $0)
   - Board of directors:
     - Will Johnson (Executive Director)
     - Joseph Tyler Cisco (Director)
     - Brenda O'Dell (Director)
5. Submit and save confirmation

**Deliverable:** Submission receipt/confirmation

---

### WORKSTREAM D: Open Source Collective Fiscal Sponsorship Application

**Cost:** Free (10% fee on donations)  
**Link:** https://opencollective.com/opensource/apply  
**NO Login.gov required**

Steps:
1. Navigate to opencollective.com/opensource/apply
2. Prepare application:
   - Project name: P31 Labs, Inc.
   - GitHub org: https://github.com/p31labs
   - Description: Open-source assistive technology for neurodivergent individuals
   - Mission alignment: Open source, accessibility, neurodiversity
   - Licensing: OIN 2.0 / MIT / GPLv3
3. Accept Terms of Fiscal Sponsorship
4. Submit application

**Deliverable:** Application submitted confirmation

**Why this matters:** OSC will serve as fiscal host for ASAN STEP ($6,250) and other grants. Required because ASAN warns grant money is taxable without fiscal sponsor.

---

### WORKSTREAM E: Awesome Foundation Disability Chapter Grant

**Amount:** $1,000/month, no strings attached  
**Submission window:** 1st through 10th of each month  
**Link:** https://www.awesomefoundation.org/en/submissions/new?chapter=disability  
**NO Login.gov required**

Steps:
1. Navigate to awesomefoundation.org/en/submissions/new?chapter=disability
2. Complete application (500 words max)
3. Frame: P31 Labs as a disability technology project — pick ONE:
   - BONDING: Assistive chemistry game for kids with neurodivergence
   - Cognitive Prosthetic: AI-assisted cognitive support
   - LOVE Ledger: Care economy for neurodivergent families
4. Keep it visual, community-focused, simple
5. Submit before window closes

**Deliverable:** Submission confirmation

---

### WORKSTREAM F: Ko-fi Shop Upload

**Cost:** Free  
**Reference:** andromeda/KOFI_SHOP_UPLOAD_CHECKLIST.md  
**NO Login.gov required**

Products to upload:
1. "The Minimum Enclosing Structure" monograph — $5 PWYW (PDF)
2. "K₄ Convergence Table Print" — $3 (SVG, 2400×2400px)
3. "Floating Neutral Diagram Print" — $3 (SVG, 2400×2400px)
4. "As Above So Below Print" — $3 (SVG, print-ready)

Steps:
1. Log in to ko-fi.com/trimtab69420/shop
2. Click "Add Product" → "Digital Download"
3. Upload each product with title, description, tags, price
4. Verify all products appear in shop
5. Test purchase flow if possible

**Deliverable:** Live shop with all 4 products visible

---

### WORKSTREAM G: Substack Week 1 Publication

**Audience:** ASAN reviewers, open-source developers, disability advocates  
**NO Login.gov required**

Article: "Why I Built BONDING on My Son's Birthday"

Key elements:
- Origin story: built BONDING on son's 10th birthday during supervised visitation restriction (2 hrs/week)
- BONDING as timestamped parental engagement log
- Open-source, zero-dependency, 558 passing tests
- P31 Labs mission: assistive tech for neurodivergent individuals
- Call to action: play the game, support the mission

Distribution:
1. Publish on Substack
2. Post to Substack Notes (discovery engine)
3. Cross-post to Dev.to with tags: TypeScript, React, accessibility, neurodiversity
4. Link to Ko-fi shop and GitHub

**Deliverable:** Published article with at least 2 distribution channels

---

### WORKSTREAM H: Letters of Support (3-5 Requests)

**NO Login.gov required**

Send requests to:
1. Brenda O'Dell (brendaodell54@gmail.com) — mother, ADA support, board director
2. [Academic contact if available]
3. [Open-source maintainer if available]
4. [Disability advocate — local to Jacksonville or national]
5. [DoD colleague if appropriate]

Template:
```
Subject: Letter of Support Request – P31 Labs, Inc.

I am requesting a brief letter of support for P31 Labs, a Georgia nonprofit developing open-source assistive technology for neurodivergent individuals.

Your letter should address:
- The importance of accessible technology for neurodivergent communities
- Your familiarity with my work (if applicable)
- The potential community impact of P31 Labs

A few paragraphs is sufficient. I can provide more details about the project if needed.

Thank you for considering this request.

Warmly,
[Your Full Name]
Executive Director, P31 Labs, Inc.
```

**Deliverable:** 3+ requests sent (screenshot or sent folder confirmation)

---

### WORKSTREAM I: ASAN STEP Grant Eligibility Verification

**NO Login.gov required — but CRITICAL**

Steps:
1. Document: Do you have preexisting connections to communities of color with IDD?
2. If YES: List names, organizations, relationships
3. If NO: Identify potential partners (ASAN affiliates in Jacksonville/Georgia, disability justice groups, BIPOC advocacy orgs)
4. Contact Eli Bouderdaben: ebouderdaben@autisticadvocacy.org
   - Subject: ASAN STEP Grant — Eligibility Question
   - Body: Brief description of project, ask about BIPOC connection requirements
5. Watch ASAN application walkthrough webinar if available

**Deliverable:** Eligibility documented with specific evidence or partner plan

---

### WORKSTREAM J: NLnet Pivot Decision

**NO Login.gov required**

Current status: NGI Zero Commons is CLOSED (June 12, 2026 announcement)

Options:
1. **NGI Taler** (deadline Aug 1, 2026): Frame LOVE Ledger as privacy-preserving payment integration with GNU Taler. LOW fit.
2. **NGI Fediversity** (deadline Aug 1, 2026): Frame PHOS/Andromeda as NixOS-based reproducible cloud hosting stack. MEDIUM fit.
3. **Deprioritize NLnet**: Focus domestic (ASAN, Awesome Foundation, ATS Accelerator) and wait for Open Internet Stack programs (Restack, CodeSupply, ELFA) post-summer 2026.

Steps:
1. Read your existing NLnet draft (Documents/P31/grants/NLnet_NodeZero_v2_ready.docx)
2. Honestly assess: does it fit Taler or Fediversity?
3. If neither fits cleanly, DEPRIORITIZE.
4. Document decision with rationale.

**Deliverable:** One-sentence decision + rationale

---

## PHONE CALLS & HUMAN INTERACTIONS

| Who | Purpose | Number/Contact |
|-----|---------|----------------|
| **Federal Service Desk (FSD)** | Login.gov/SAM.gov recovery | 866-606-8220 or fsd.gov |
| **ASAN Grant Officer** | Verify STEP eligibility | ebouderdaben@autisticadvocacy.org |
| **Georgia SOS** | C-100 filing questions | (404) 656-2817 |

---

## 48-HOUR EXECUTION SCHEDULE

### Day 1 (Today)

| Priority | Workstream | Time Est. |
|----------|-----------|-----------|
| 1 | Georgia C-100 filing | 15 min |
| 2 | IRS Form 1023-EZ | 30 min |
| 3 | Open Source Collective application | 30 min |
| 4 | Awesome Foundation application | 20 min |
| 5 | Ko-fi shop upload | 20 min |
| 6 | Letters of support (3 requests) | 20 min |
| 7 | ASAN eligibility verification | 15 min |
| 8 | NLnet decision | 10 min |

### Day 2 (Tomorrow)

| Priority | Workstream | Time Est. |
|----------|-----------|-----------|
| 9 | Substack Week 1 article | 45 min |
| 10 | Every.org profile setup | 20 min |
| 11 | Call FSD (Login.gov) | 15 min |
| 12 | B2B outreach emails (3 targets) | 30 min |

---

## SUCCESS CRITERIA

- [ ] C-100 filed with confirmation number
- [ ] Form 1023-EZ submitted with confirmation
- [ ] Open Source Collective application submitted
- [ ] Awesome Foundation application submitted
- [ ] All 4 Ko-fi products live
- [ ] 3 letters of support requested
- [ ] ASAN STEP eligibility documented
- [ ] NLnet decision documented
- [ ] Substack Week 1 published
- [ ] Login.gov recovery status documented

---

## EXECUTION RULES

1. **Do NOT wait for Login.gov** to execute any workstream except A.
2. **MAX 30 minutes/day** on Login.gov recovery. Document and delegate to FSD.
3. **Sequential priority:** B → C → D → E → F → G → H → I → J
4. **Every workstream must produce a deliverable** with confirmation number, screenshot, or link.
5. **If blocked,** document the specific blocker and move to next workstream. Do not thrash.

---

## DELIVERABLE FORMAT

Return as status report:
```
## COMPLETED
- [x] Workstream X: [deliverable with confirmation]

## BLOCKED
- [ ] Workstream Y: [specific blocker, next step]

## DECISIONS
- Workstream Z: [decision + rationale]

## LOGIN.GOV STATUS
- Step attempted: [what you tried]
- Outcome: [what happened]
- Next step: [FSD ticket, delete/recreate, etc.]

## NEXT 24-HOUR PRIORITY
1. [Action]
2. [Action]
```

---

*Ca₉(PO₄)₆*
