# P31 NEXUS Report

**Generated:** 2026-06-17T15:07:04Z
**Spoon Level:** 4 (Focus 🎯)
**Overall Health:** 0.70
**Duration:** 0.07s

## Critical Action

🟠 **[HIGH]** Take calcium immediately. Prioritize only essential legal prep.
  → Cascade triggered: METABOLIC.serum_calcium_mg_dL = 7.8

## Domain Health

| Domain | Health | Status |
|--------|--------|--------|
| Metabolic 🧬 | 0.50 | 🟡 STABLE |
| Cognitive 🧠 | 0.60 | 🟡 STABLE |
| Legal ⚖️ | 0.55 | 🟡 STABLE |
| Infrastructure 🔧 | 0.97 | 💚 FLOURISHING |
| Content 📝 | 0.90 | 💚 FLOURISHING |

## Active Entanglements

- **legal-cognitive-switch**: LEGAL.upcoming_deadlines → COGNITIVE.task_switching_penalty (trigger: 1 gt 0)
  - Each legal deadline adds cognitive switching overhead

## Active Cascading Failures

### 🟠 hypocalcemia-cascade (HIGH)

**Trigger:** METABOLIC.serum_calcium_mg_dL = 7.8

**Chain:**

1. COGNITIVE.spoon_budget → capped at 3
1. LEGAL.hearing_readiness → reduced by 30%
1. INFRASTRUCTURE.operation_complexity → non-critical deploys deferred

**Critical Action:** Take calcium immediately. Prioritize only essential legal prep.

---

### 🟡 peak-hours-cascade (MEDIUM)

**Trigger:** COGNITIVE.is_peak_hours = False

**Chain:**

1. COGNITIVE.task_initiation_weight → reduced by 70%
1. INFRASTRUCTURE.complex_ops_recommended → defer to peak hours

**Critical Action:** Schedule complex tasks for peak window (10:00-14:00). Do low-spoon work now.

---

### 🟠 legal-deadline-cascade (HIGH)

**Trigger:** LEGAL.upcoming_deadlines = 1

**Chain:**

1. COGNITIVE.task_switching_penalty → +0.2 switching cost
1. CONTENT.priority → content deprioritized

**Critical Action:** Focus on legal deadlines first. Defer all non-essential work.

---

## Metric Details

### Metabolic 🧬

Health: 0.50

| Metric | Value |
|--------|-------|
| `albumin_g_dL` | 4.0 |
| `alertness` | 0.5 |
| `calcium_at_risk` | True |
| `calcium_gap` | 0 |
| `creatinine_mg_dL` | 1.2 |
| `in_peak` | False |
| `in_trough` | True |
| `medication_adherence_required` | True |
| `serum_calcium_mg_dL` | 7.8 |
| `serum_calcium_threshold` | 7.8 |

### Cognitive 🧠

Health: 0.60

| Metric | Value |
|--------|-------|
| `asynchronous_communication_required` | True |
| `auto_approve_threshold` | 0.85 |
| `background_noise_threshold_db` | 50 |
| `content_backlog` | 0 |
| `entangled_task_switching_penalty` | True |
| `entropy_multiplier` | 1.2 |
| `fluorescent_lighting_penalty` | 0.6 |
| `in_peak_hours` | False |
| `in_trough_hours` | True |
| `max_concurrent_tasks` | 2 |
| `raw_spoon_level` | 4 |
| `risk_tolerance_codebase` | 0.7 |
| `risk_tolerance_financial` | 0.4 |
| `risk_tolerance_medical` | 0.1 |
| `sequential_processing_preference` | True |
| `spoon_budget` | 4 |
| `spoon_label` | Focus 🎯 |
| `spoon_level` | 4 |
| `task_initiation_penalty` | 0.0 |
| `task_initiation_weight` | 0.8 |
| `task_switching_cost` | 0.7 |
| `task_switching_penalty` | 0.4 |
| `unpredictable_wait_time_penalty` | 0.7 |
| `upcoming_deadlines` | 1 |

### Legal ⚖️

Health: 0.55

| Metric | Value |
|--------|-------|
| `case` | Johnson v. Johnson, 2025CV936 |
| `corp_status` | P31 Labs Inc — Active (GA SoS). EIN: 42-1888158 (assigned Apr 13, 2026). 501(c)(3) not filed. |
| `grants_active` | Awesome Foundation $1K (April deliberation) |
| `grants_pending` | NIDILRR Switzer $80K, FIP $250K/yr (inquiries sent, no response) |
| `hearing_readiness` | 0.5 |
| `judge` | Chief Judge Scarlett |
| `mcghan_deadline` | PASSED (April 17, 2026) |
| `next_hearing` | AWAITING WRITTEN ORDER per O.C.G.A. § 9-11-58(b) |
| `operating_buffer` | $530 (Ko-fi + Stripe) + Mercury bank account ACTIVE (approved 4/20/2026) |
| `status` | Post-hearing — April 16 hearing completed, written order pending |
| `upcoming_deadlines` | 1 |

### Infrastructure 🔧

Health: 0.97

| Metric | Value |
|--------|-------|
| `degraded_workers` | 1 |
| `deployed_workers` | 25 |
| `health_score` | 0.96 |
| `k4_cage_url` | https://k4-cage.trimtab-signal.workers.dev |
| `ollama_url` | http://127.0.0.1:11434 |
| `online_workers` | 27 |
| `operation_complexity` | 0.83 |
| `p31_default_model` | qwen2.5:1.5b |
| `phos_url` | https://phos.p31ca.org |
| `signal_health` | 0.96 |
| `total_workers` | 28 |

### Content 📝

Health: 0.90

| Metric | Value |
|--------|-------|
| `docs_last_updated` | 2026-06-17T15:07:04Z |
| `forge_available` | True |
| `pipeline_backlog` | 0 |
| `production_cap` | 1.0 |
| `signals_count` | 8 |
| `social_cadence_active` | True |
| `weave_available` | True |
| `zenodo_papers_published` | 4 |
| `zenodo_papers_ready` | 13 |
