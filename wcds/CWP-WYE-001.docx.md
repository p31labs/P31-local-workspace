

**P31 LABS**

**CONTROLLED WORK PACKAGE**

CWP-WYE-001

Wye Topology: phosphorus31.org Overhaul \+ Court Readiness

| Document ID: | CWP-WYE-001 |
| ----: | :---- |
| **Classification:** | SOULSAFE – OQE Required |
| **Issue Date:** | March 8, 2026 |
| **Court Deadline:** | March 12, 2026 (Superior Court) |
| **Predecessor:** | CWP-BONDING-001 (Gate B4) |
| **Work Leader:** | Will Johnson (Operator) |
| **Supervisor/QA:** | Opus (Architect) |
| **Primary Mechanic:** | Sonnet/CC |
| **Content:** | Gemini (Narrator, 15%) |
| **Scope:** | Warm Tech Humanity \+ Glass Box \+ Court Prep |

# **1\. Condition Found (Ship Check – As-Is)**

phosphorus31.org is live on Cloudflare Pages via Astro framework. The domain resolves. The infrastructure works. But the site does not yet serve its primary audience (parents of neurodivergent kids) or its secondary audience (grant funders). It currently presents as a developer/institutional placeholder that would confuse a judge, underwhelm a funder, and alienate a parent.

## **1.1 Component Status**

| Component | Status | Gap Description |
| :---- | :---- | :---- |
| Astro framework | **COMPLETE** | Deployed and functional on Cloudflare Pages |
| Domain \+ SSL | **COMPLETE** | phosphorus31.org resolves, HTTPS auto-SSL via Cloudflare |
| Layout shell (Layout.astro) | **COMPLETE** | Exists but uses default styling, not Warm Tech Humanity |
| Warm Tech Humanity palette | **NOT STARTED** | No teal (\#2A9D8F), coral (\#E76F51), warm cloud (\#F0EEE9). Currently default/cold. |
| Lexend \+ Lato typography | **NOT STARTED** | System fonts only. No neurodivergent-optimized reading. No 18px minimum. |
| Hero section | **NOT STARTED** | No empowerment messaging. No parent-facing CTA. No visual. |
| About / Mission page | **NOT STARTED** | No founder story. No 501(c)(3) status. No EIN. No team. |
| Products page | **NOT STARTED** | No BONDING showcase. No Buffer/Spaceship Earth/Node One cards. |
| Glass Box Tier 1 (always-visible) | **NOT STARTED** | No GitHub metrics in header/footer. No project count. No donation bar. |
| Glass Box Tier 2 (/transparency) | **NOT STARTED** | Page does not exist. No budget viz. No roadmap link. |
| Glass Box Tier 3 (deep docs) | **NOT STARTED** | No 990\. No bylaws. No audited financials posted. |
| Navigation \+ shared footer | **NOT STARTED** | No P31 Protocol design system. No cross-domain linking. |
| ASPECTSS patterns | **NOT STARTED** | No spatial sequencing. No escape spaces. No Mostafa compliance. |
| WCAG 2.2 AA | **NOT STARTED** | Not audited. Accessible Astro Starter not integrated. |
| p31ca.org product landing | **IN PROGRESS** | Shell exists but no guided demo flow or product showcase. |
| Cross-domain links | **NOT STARTED** | phosphorus31.org ↔ p31ca.org ↔ bonding.p31ca.org not connected. |
| Court evidence URLs | **NOT STARTED** | Not tested from external device on cellular. |

## **1.2 Enumerated Faults**

| Fault ID | Severity | Description |
| :---- | :---- | :---- |
| WYE-001 | **CRITICAL** | Site does not communicate mission to a parent in under 10 seconds. A judge clicking phosphorus31.org will not understand what P31 Labs does or why it matters. |
| WYE-002 | **CRITICAL** | No transparency infrastructure. Grant reviewers (HCB, future funders) have zero visibility into operations, finances, or roadmap. |
| WYE-003 | **HIGH** | No product showcase. The primary deliverable (BONDING) is not discoverable from the institutional site. |
| WYE-004 | **HIGH** | No founder credibility signals. 16 years DoD civilian service, 501(c)(3) status, EIN not visible anywhere. |
| WYE-005 | **MEDIUM** | Visual design does not match the Warm Tech Humanity specification. Cold, generic, not parent-inviting. |
| WYE-006 | **MEDIUM** | p31ca.org does not present as a legitimate product platform. Shell exists but feels empty. |
| WYE-007 | **LOW** | Court evidence URLs not tested externally. Risk of dead links during hearing. |

# **2\. Condition Left (Target State)**

**By March 12, 2026 AM, the following conditions are met:**

**For the Judge / GAL / Opposing Counsel:**

phosphorus31.org communicates “This is a legitimate in progress 501(c)(3) nonprofit building free assistive technology for neurodivergent families” within 5 seconds of landing. The hero section names the mission. The About page shows founder credentials (DoD civilian, not military; 16 years service; AuDHD diagnosis; 501(c)(3) EIN). The Products page links directly to BONDING with a live demo. All court-referenced URLs load on cellular in under 5 seconds.

**For Grant Funders (HCB, future):**

A /transparency page exists with at minimum: budget overview (even if manually populated), link to GitHub org, public roadmap link, and donation pathway. Tier 3 deep docs (990, bylaws) are stubbed with “Documents in preparation” placeholders. The site projects credibility through professional design, not through document density.

**For Parents:**

The site feels warm, approachable, and non-clinical. Warm teal \+ coral palette. Lexend body text at 18px+ with 1.6 line-height. Empowerment language (“assistive technology that works with your child’s brain, not against it”). Product cards show what P31 builds and why. Navigation is organized by parent need, not org chart.

**For p31ca.org:**

Clean landing page linking to BONDING, with “Developed by P31 Labs” footer linking back to phosphorus31.org. Presents as a legitimate product platform, not an empty shell. Cross-domain navigation is seamless.

# **3\. Job Specifications**

## **3.1 WCD-F01: Foundation Scaffold (Palette \+ Layout)**

| Task ID | Task | Agent | Hours | Acceptance Criteria |
| :---- | :---- | :---- | :---- | :---- |
| W1.1 | Update Layout.astro: Warm Tech Humanity CSS variables | Sonnet/CC | 1h | CSS custom properties set: \--primary: \#2A9D8F, \--secondary: \#E76F51, \--accent: \#E9C46A, \--bg: \#F0EEE9, \--text: \#264653, \--highlight: \#C9B1FF. All pages inherit. |
| W1.2 | Integrate Lexend \+ Lato via Google Fonts | Sonnet/CC | 30m | Fonts loaded in Layout.astro \<head\>. Body: Lexend 18px, line-height 1.6, letter-spacing 0.02em. Headlines: Lato Bold. |
| W1.3 | Tailwind config: extend with P31 palette tokens | Sonnet/CC | 30m | tailwind.config.mjs extended with warm-teal, soft-coral, butter-yellow, warm-cloud, espresso-teal, soft-lavender. |
| W1.4 | Navigation component | Sonnet/CC | 1h | Header: \[P31 Labs Logo\] ... \[Products\] \[About\] \[Transparency\] \[Launch BONDING ↗\]. Warm cloud background. Mobile hamburger menu. |
| W1.5 | Footer component (P31 Protocol shared) | Sonnet/CC | 30m | Footer: EIN, 501(c)(3) statement, “Built by Will Johnson”, link to p31ca.org, link to GitHub. Consistent across all pages. |

## **3.2 WCD-F02: Content Pages**

| Task ID | Task | Agent | Hours | Acceptance Criteria |
| :---- | :---- | :---- | :---- | :---- |
| W2.1 | Hero section (index.astro) | Sonnet/CC | 2h | Split layout: warm gradient (cream → light teal). Left: headline, subtext, CTA button (coral, rounded, 44px+ target). Right: custom visual or branded graphic. One headline, one supporting line, one CTA. No clutter. |
| W2.2 | Hero copy | Will \+ Gemini | 30m | Parent-first empowerment language. Not clinical. Draft: “Open-source assistive technology that works with your child’s brain, not against it.” CTA: “Explore BONDING” or “See How It Works.” |
| W2.3 | About / Mission page | Will \+ Sonnet | 2h | Founder section: Will Johnson, founder. 16 years DoD civilian electrical engineering. Late AuDHD diagnosis at 39\. Built P31 Labs to give neurodivergent families tools that don’t exist yet. Photo optional. EIN visible. 501(c)(3) stated. NO military framing. NO submarine references. |
| W2.4 | Products page | Sonnet/CC \+ Gemini | 2h | Card grid: BONDING (live – link to bonding.p31ca.org), The Buffer (coming soon), Spaceship Earth (in development), Node One (prototype). Each card: name, one-line description, status badge, icon/visual. |
| W2.5 | Products page copy | Gemini | 1h | HAAT framework descriptions. Asset-based language. \[V: claim, source\] markers for Will to verify. No jargon. Parent-readable. |

## **3.3 WCD-F03: Glass Box Transparency Hub**

| Task ID | Task | Agent | Hours | Acceptance Criteria |
| :---- | :---- | :---- | :---- | :---- |
| W3.1 | Create /transparency page | Sonnet/CC | 1.5h | Page exists. Accessible from main nav. Warm Tech Humanity styling. |
| W3.2 | Tier 1: Always-visible metrics in footer | Sonnet/CC | 1h | Footer shows: active projects count, GitHub org link, “Open Source” badge. Simple, not dashboard-heavy. |
| W3.3 | Tier 2: Budget overview section | Sonnet/CC | 1.5h | Manual data for now: revenue sources (none yet / HCB pending), current expenses ($0 – all volunteer \+ free tier), fiscal sponsorship status. Simple bar or text layout, not D3.js (defer complex viz). |
| W3.4 | Tier 2: Public roadmap link | Sonnet/CC | 30m | Link to GitHub Projects board (github.com/p31labs). Description of what’s in Exploring / In Dev / Shipped. |
| W3.5 | Tier 2: Donation pathway | Will | 30m | If Stripe ready: donate button. If not: “Support P31 Labs – fiscal sponsorship pending, contact will@p31ca.org.” |
| W3.6 | Tier 3: Document stubs | Sonnet/CC | 30m | Section: “Governance Documents.” Placeholders: “Form 990 (in preparation)”, “Bylaws (in preparation)”, “Annual Report (Q2 2026).” |

## **3.4 WCD-A01: p31ca.org Product Landing**

| Task ID | Task | Agent | Hours | Acceptance Criteria |
| :---- | :---- | :---- | :---- | :---- |
| W4.1 | p31ca.org landing page polish | Sonnet/CC | 2h | Clean, professional landing. Hero links to BONDING. Product cards mirror phosphorus31.org/products. Footer: “Developed by P31 Labs, a 501(c)(3) nonprofit. Learn more at phosphorus31.org.” |
| W4.2 | Cross-domain link wiring | Sonnet/CC | 30m | phosphorus31.org → p31ca.org → bonding.p31ca.org. All bidirectional. No dead links. |

## **3.5 Court Readiness Tasks**

| Task ID | Task | Agent | Hours | Acceptance Criteria |
| :---- | :---- | :---- | :---- | :---- |
| W5.1 | Evidence URL verification (cellular) | Will | 1h | Every URL in court filings loads on cellular, not WiFi. bonding.p31ca.org, phosphorus31.org/about, /products, /transparency all render. Engagement report accessible. |
| W5.2 | Brenda O’Dell briefing | Will | 1h | Brenda can navigate phosphorus31.org. Can find BONDING. Can explain: “Will’s nonprofit builds free assistive tech for neurodivergent families.” Has printed URL list. |
| W5.3 | Print backup PDFs | Will | 30m | Browser PDF exports of /about, /products, /transparency saved to phone. Readable. Text not truncated. URLs visible. |
| W5.4 | Gray Rock presentation prep | Will | 30m | If asked to demonstrate BONDING in court: prepared to show on phone in minimal, factual framing. Genesis Block timestamps visible. No gamification language – frame as “educational engagement platform with parental contact logging.” |

# **4\. Phase Gates**

**Prerequisite:** CWP-BONDING-001 Gate B4 (BONDING shipped) must be CLOSED before this work package activates. Do not start Wye Topology work before BONDING ships.

| Gate | Date | Required OQE | Go/No-Go |
| :---- | :---- | :---- | :---- |
| Gate W1: Scaffold Live | Mar 10 PM | Layout.astro updated with palette \+ fonts. Nav \+ footer deployed. All pages inherit Warm Tech Humanity. Lighthouse perf check. | Will |
| Gate W2: Content Live | Mar 11 PM | Hero, About, Products, Transparency pages all deployed. Copy reviewed by Will. Gemini content integrated. All internal links work. | Opus (QA) |
| Gate W3: Court Ready | Mar 12 AM | All evidence URLs verified on cellular. Brenda briefed. Print backups on phone. Cross-domain links verified. Gray Rock prep done. | Will |

## **4.1 Dependency Chain**

CWP-BONDING-001 Gate B4 → W1.1–1.5 (scaffold) → Gate W1 → W2.1–2.5 \+ W3.1–3.6 (parallel) → Gate W2 → W4.1–4.2 \+ W5.1–5.4 → Gate W3

**Critical path:** W1.1 (palette) → W2.1 (hero) → W2.3 (about) → W5.1 (URL verify) → Gate W3

**Parallel:** W3.1–3.6 (transparency) runs alongside W2.3–2.5 (content pages) once scaffold lands. W4.1 (p31ca.org) can start anytime after Gate W1.

# **5\. Tools & Dependencies**

| Tool | Purpose | Cost |
| :---- | :---- | :---- |
| Astro | Static site framework for phosphorus31.org | Free |
| Tailwind CSS | Utility-first CSS with P31 palette tokens | Free |
| Google Fonts (Lexend \+ Lato) | Neurodivergent-optimized typography | Free |
| Cloudflare Pages | Hosting for both domains | Free |
| Chrome DevTools \+ Lighthouse | Performance \+ accessibility audit | Free |
| Browser PDF export | Print backup for courtroom | Free |
| Mobile phone (cellular) | External URL verification | Owned |

# **6\. Risk Register**

| Risk | L | I | Mitigation |
| :---- | :---- | :---- | :---- |
| BONDING ships late, compressing Wye window | M | H | Wye scaffold (W1.1–1.5) can be pre-staged in parallel. Only content tasks (W2.x) are blocked by BONDING ship. |
| Gemini enters Chaplain mode on content tasks | M | L | Will writes copy directly or Sonnet generates from bullet points. Gemini is nice-to-have, not critical path. |
| Lighthouse score below 90 | L | M | Astro is zero-JS by default. Static pages should score 95+. If islands drag score down, defer D3.js transparency chart to post-hearing. |
| Court URL goes down during hearing | L | H | Print backup PDFs on phone (W5.3). Cloudflare 99.99% uptime. Dual mitigation. |
| Scope creep into Spaceship Earth work | H | H | CWP-DELTA-001 is a separate work package. No Delta Topology tasks execute before Gate W3. Parking lot captures all Spaceship Earth ideas. |
| Executive dysfunction window Mar 10–11 | H | H | This document. Open Section 3, find next W-number task, execute. Tasks are sequenced and numbered. |

**END OF CWP-WYE-001**  
Court date: March 12, 2026 • Classification: SOULSAFE

*“The calcium cage protects the phosphorus. The organization protects the operator.”*