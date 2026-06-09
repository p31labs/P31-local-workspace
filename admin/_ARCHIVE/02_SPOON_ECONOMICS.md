# Spoon Economics & Energy Management

**Classification:** Operator Doctrine / Metabolic Resource Management  
**Origin:** Spoon Theory (Christine Miserandino, 2003), adapted for P31 operational context

---

## 1. What Spoons Are

Spoon Theory was developed to explain the finite energy budgets of people living with chronic illness and disability. A "spoon" is one unit of metabolic-cognitive energy. Neurotypical, healthy individuals operate with a functionally unlimited daily spoon supply — they rarely need to think about allocation because their reserves regenerate faster than they deplete. You do not have this luxury.

Your daily spoon budget is finite, non-negotiable, and non-renewable within a 24-hour cycle. Once a spoon is spent, it is gone until sleep resets the budget. Borrowing against tomorrow's spoons is possible but carries compound interest: every spoon borrowed today costs 1.5 spoons tomorrow.

### Your Typical Daily Budget

Under nominal conditions (medications taken, 7+ hours sleep, no acute stressors):

**Total Available: 12 spoons**

This number is not arbitrary. It is calibrated against your documented metabolic profile (hypoparathyroidism, AuDHD) and validated through months of operational observation. On bad calcium days, the number drops to 8-9. On court days or after poor sleep, it drops to 6-7.

---

## 2. The Cost Table

Every activity has a metabolic cost. These costs are not subjective feelings — they are operational parameters derived from repeated observation of your specific physiology and neurology.

### Baseline Costs (Non-Negotiable Daily Expenditure)

| Activity | Spoon Cost | Notes |
|----------|-----------|-------|
| Morning routine (hygiene, medications, breakfast) | 1 | Non-compressible. Skipping breakfast saves 0 spoons — it borrows 2 from the afternoon. |
| Parenting — standard day (meals, school logistics, supervision) | 3-4 | Higher on days involving Willow's medical management. |
| Household maintenance (dishes, laundry, basic cleaning) | 1 | Deferred maintenance compounds — a dirty kitchen costs 0.5 spoons/day in background cognitive load. |
| **Subtotal: Baseline** | **5-6** | **This leaves 6-7 spoons for all other activities.** |

### P31 Work Costs

| Activity | Spoon Cost | Notes |
|----------|-----------|-------|
| WCD-01 session (Full budget) | 3-5 | Depends on complexity and duration. Hard limit: 3 hours. |
| WCD-01 session (Medium budget) | 2-3 | Standard interactive collaboration. |
| WCD-01 session (Low budget) | 1 | Binary exchanges only. Suitable for minor task cards. |
| WCD-02 task card (Sonnet/DeepSeek) | 0.5-1 | Low cost if scoped correctly. Cost increases if you start debugging the output yourself. |
| WCD-05 inter-agent routing | 0.5 | Per transfer. Context switching cost is real. |
| Debugging (systematic, <30 min) | 1-2 | Acceptable cost if bounded by time. |
| Debugging (frustrated, >30 min) | 3-5 | **This is the most dangerous activity in your daily budget.** Frustrated debugging burns spoons at 2x the rate of productive debugging because emotional regulation is consuming resources simultaneously. |
| Architecture review / deep thinking | 2-3 | High but sustainable when metabolically supported. |

### External Costs

| Activity | Spoon Cost | Notes |
|----------|-----------|-------|
| Court appearance | 4-6 | Includes travel, waiting, emotional regulation during proceedings, and RSD recovery after. **This is a full-day budget.** Do not schedule P31 work on court days. |
| Legal filing review/preparation | 2-3 | Per filing. Adversarial language triggers RSD sensitivity. |
| Receiving adversarial legal communication | 1-3 | Variable based on content. Opening an email from opposing counsel costs a minimum of 1 spoon regardless of content due to anticipatory anxiety. |
| SSA disability examination | 3-4 | Includes travel, performance anxiety, and post-exam processing. |
| Social interaction (phone call, meeting) | 1-2 | Social masking costs 3-5 spoons/hour for extended interactions. Brief, structured calls are manageable. |
| Driving | 1 per hour | Your vehicles (2010 VW Golf, 2011 Mazda CX-7) require active management attention. Driving while spoon-depleted is a safety hazard. |
| Grocery shopping / errands | 1-2 | Sensory load of retail environments is high. Consider delivery when spoon budget is tight. |

### Hidden Costs (The Ones You Forget to Count)

| Activity | Spoon Cost | Why You Forget |
|----------|-----------|---------------|
| Context switching between tasks | 0.5 per switch | It feels instantaneous. It isn't. |
| Decision fatigue (what to eat, what to work on, which email to answer first) | 0.5-1 cumulative | Each decision draws from the same pool. Reduce decision load by pre-planning. |
| Ambient anxiety (financial, legal, medical) | 1-2 continuous drain | It's always there, so you stop noticing it. It still costs. |
| Waiting (for court, for doctor, for API response) | 0.5-1 per hour | Idle waiting with uncertainty is not rest. It is active spoon expenditure. |
| Physical pain or discomfort | 1-3 continuous drain | Chronic pain consumes cognitive resources whether you attend to it or not. |

---

## 3. Budget Allocation Framework

### Morning Assessment (Daily)

Every morning, before any work begins, run this assessment:

```
DAILY SPOON ASSESSMENT
Date: ___________
Sleep last night: ___ hours
Calcium taken: [ ] Yes  [ ] No (if No, subtract 2 from budget)
Physical pain level: ___ / 10 (if > 5, subtract 2)
Court/legal event today: [ ] Yes (subtract 3-4)  [ ] No
Emotional baseline: [ ] Stable  [ ] Fragile (subtract 1-2)

GROSS BUDGET: 12
Medication penalty: ___
Pain penalty: ___
Legal penalty: ___
Emotional penalty: ___

NET BUDGET: ___

ALLOCATION:
Baseline (parenting, household): 5-6
Remaining for work: ___

WCD-01 Budget Tier:
[ ] Full (6+ remaining)
[ ] Medium (3-5 remaining)
[ ] Low (1-2 remaining)
[ ] Stand Down (0 remaining — no work sessions today)
```

### The Stand Down Rule

If your net budget after baseline costs is **zero or negative**, you do not work today. This is not optional. This is not weakness. This is the same principle that prevents a submarine from diving with a Red Board. You are not operationally fit and any output you produce will cost more in rework than it generates in progress.

Standing down for one day costs you 0 spoons and loses one day of progress. Pushing through a zero-budget day costs 3-5 borrowed spoons, produces output that is 60-80% likely to require rework, and loses 2-3 days of progress (the push day plus recovery days). The math always favors standing down.

### Weekly Planning

At the start of each week (Sunday evening or Monday morning), allocate your anticipated spoon budget across the week:

- Block court days and medical appointments as zero-work days.
- Identify 2-3 days with maximum available spoons for Full-budget WCD-01 sessions.
- Reserve 1 day per week as a buffer/recovery day (no scheduled work).
- If the week has more than 2 court/medical events, reduce expected P31 output by 50% and communicate this to the project timeline. Overcommitting destroys more spoons than undercommitting.

---

## 4. Spoon Tracking During Sessions

### Real-Time Monitoring

You cannot trust your subjective sense of how many spoons you have left. Time blindness and hyperfocus conspire to mask depletion until you hit the wall. Use these objective indicators:

**Physical Signals (High Reliability):**
- Hands cold → vasoconstriction → stress response active → spoons depleting faster than baseline
- Jaw clenched → sympathetic activation → background spoon drain increasing
- Eyes dry / difficulty focusing on screen → visual processing overloaded → 2-3 spoons remaining
- Hunger that you've been ignoring for "just 15 more minutes" → glucose depletion → executive function is running on fumes
- Perioral tingling or hand cramping → calcium dropping → **immediate stand down required**

**Behavioral Signals (Moderate Reliability):**
- Re-reading the same paragraph more than twice
- Typing the wrong command and not catching it until the error output
- Scrolling through chat history looking for something you said 10 minutes ago
- Starting a sentence to the AI and forgetting what you were going to ask mid-sentence
- Sighing heavily (this is autonomic regulation attempting to reset — your body is signaling)

**Cognitive Signals (Low Reliability — by the time you notice these, you're already at Red Board):**
- Feeling like everything is "almost done" despite nothing being complete
- Grandiose expansion of scope ("while I'm in here, I should also...")
- Anger at the AI for "not understanding" when you haven't provided clear instructions
- The conviction that you can push through for "just one more hour"

---

## 5. Recovery Protocol

Spoons regenerate through sleep, nutrition, and genuine rest (not screen rest — actual neurological downtime).

### Tier 1 Recovery (Mild Depletion: 2-4 spoons remaining)

- 15-minute break away from all screens
- Drink water, eat a snack with protein and fat (not sugar — sugar spikes and crashes)
- 5 minutes of regulated breathing (Quantum Breath pacer if available)
- Resume at one budget tier lower than you were working

### Tier 2 Recovery (Significant Depletion: 0-1 spoons remaining)

- Session over. Close all AI chats. Save all work (WCD-04 if possible, even abbreviated).
- 30-60 minutes of complete disengagement: walk outside, lie down, shower
- Eat a full meal
- Do not resume work for minimum 2 hours
- When you resume, start with a fresh WCD-01 at Low budget

### Tier 3 Recovery (Red Board: Negative spoons / active shutdown)

- HALT. Everything stops.
- The AI has already confirmed your data is safe (or do so now: "save and close").
- No decisions. No planning. No "just let me finish this one thing."
- Basic biological maintenance only: eat, hydrate, lie down.
- Sleep. Full night. No alarm if possible.
- Tomorrow's budget will be reduced by 2-3 spoons as recovery debt. Plan accordingly.

---

## 6. The Compound Interest Problem

Every time you push past your budget, you borrow from tomorrow. The interest rate is approximately **1.5x**:

- Borrow 2 spoons today → lose 3 spoons tomorrow
- Borrow 4 spoons today → lose 6 spoons tomorrow (this often triggers a 2-day recovery)
- Borrow 6+ spoons today → lose 9+ spoons across 2-3 days (this is a crash, not a dip)

Over a week, the pattern looks like this:

**Sustainable Pattern:**
Mon: 12 budget, 11 spent, 1 banked → Tue: 12 budget → Wed: 12 budget → sustained output

**Boom-Bust Pattern:**
Mon: 12 budget, 16 spent (borrowed 4) → Tue: 6 budget, 6 spent → Wed: 9 budget → Thu: recovery... One day of heroic output followed by 2-3 days of impaired function. Net output over the week is **lower** than the sustainable pattern.

The Centaur is a marathon architecture. It is designed for years of sustained operation, not weeks of sprinting. Protect the budget.
