# P31 Phase 2 — Fine-tune Needle-rs on P31 Tools (Local Agent Runbook)

**Status:** Ready to execute. No GitHub fork required.
**Owner:** local coding agent (runs off this file + `generate_p31_dataset.py` + `p31-train.jsonl`).
**Upstream:** [cactus-compute/needle](https://github.com/cactus-compute/needle) (MIT) — the model architecture, training code, dataset, and weights are their work. `needle-rs` is only the Rust/WASM deployment layer.

---

## 0. What this buys us

`intent-resolver` already serves `POST /classify` backed by the **base** Needle
26M model (`needle-v1.safetensors`, 22 MB INT4, in R2 `p31-needle-weights`).
Fine-tuning on P31's 9 tools reduces the fallback-to-GLM rate and sharpens
routing accuracy for P31-specific vocabulary (`phos_deploy`, `oasis_execute`, …).
The model stays the same size (22 MB INT4) — no Worker memory impact.

Deliverable: a new `needle-v2.safetensors` in R2, swapped in via the
`NEEDLE_MODEL_KEY` worker variable (no source edit / code redeploy).

---

## 1. Corrections to the earlier (wrong) research synthesis

The prior research draft had format errors. The **authoritative** format
(verified against `cactus-compute/needle` README + `needle-rs/tools/gen_e2e_vectors.py`)
is below. The dataset generator in this folder already emits the correct shape.

| Item | Wrong (prior draft) | Correct (upstream) |
|------|---------------------|--------------------|
| Fields | `query`, `tools`, `expected` | `query`, `tools`, `answers` |
| `tools` / `answers` | raw object / single object | **JSON-encoded strings** (escaped) |
| `answers` shape | `{"name":..,"arguments":..}` | `[{"name":..,"arguments":..}]` (array) |
| `parameters` | JSON-Schema `properties` | **flat** `{param:{type,description,required}}` |
| Volume | 900+100 | **≥120 per tool** (we generate 120×9 = 1080) |
| Training repo | needle-rs | **cactus-compute/needle** (Python) |
| Fine-tune cmd | custom python | `needle finetune data.jsonl` |

The flat `parameters` format (NOT JSON-Schema `properties`) is mandatory:
needle-rs's Python constrained decoder has a known bug where `properties` leaks
as an argument key (`needle-rs/tools/gen_e2e_vectors.py` §2 note). The Rust
engine handles flat params correctly.

---

## 2. Dataset (already generated — re-run if needed)

```
python3 generate_p31_dataset.py
# → p31-train.jsonl       (1080 examples: 120 x 9 P31 tools, each with distractors)
# → p31-negative.jsonl    (100 OOD — OPTIONAL, see caveat §6)
# → p31-train.sample.jsonl (5 lines for inspection)
```

Format of each `p31-train.jsonl` line:

```json
{"query":"deploy the phos surface settings","tools":"[{\"name\":\"phos_deploy\",\"description\":\"Deploy a PHOS surface to production\",\"parameters\":{\"surface\":{\"type\":\"string\",\"description\":\"PHOS surface to deploy (dashboard, analytics, chat, monitor)\",\"required\":true},\"config\":{\"type\":\"string\",\"description\":\"Environment: prod, staging, dev, canary\",\"required\":false}}}, …]","answers":"[{\"name\":\"phos_deploy\",\"arguments\":{\"surface\":\"settings\"}}]"}
```

- `tools` = compact JSON string of the **target tool + 2–4 random distractor**
  P31 tools (so the model learns disambiguation, as in production where the
  gateway sends all 9 tools).
- `answers` = JSON string of a one-element array `[{name, arguments}]`.
- Arguments are filled from the query slots (e.g. `surface:"settings"`).

---

## 3. Environment (one-time)

Need **both** repos: `cactus-compute/needle` (training) and `needle-rs` (export to
the runtime's safetensors format).

```bash
# 3a. Training code (MIT). Provides the `needle` CLI + auto-downloads base weights.
git clone https://github.com/cactus-compute/needle.git
cd needle && source ./setup        # creates venv, installs deps, downloads needle.pkl

# 3b. needle-rs (already on this machine at /tmp/opencode/needle-rs) — used ONLY
#     for tools/export.py (pickle .pkl → INT4 safetensors the Worker loads).
ls /tmp/opencode/needle-rs/tools/export.py   # must exist
```

**Hardware:** fine-tune runs on CPU or GPU. 26M params is tiny.
- Colab T4 (free/Pro): ~2–3 h.
- RunPod A100: <1 h, ~$2.50. (No GitHub fork needed — weights download via `./setup`.)

**Prereqs:** Python 3.10+, ~8 GB RAM, `git`, network access for weight download.

---

## 4. Fine-tune

```bash
cd needle
cp /path/to/p31-train.jsonl .        # the file from §2

# Optional: validate data parses before spending GPU time
needle tokenize p31-train.jsonl

# Train. Auto-downloads base weights if not local. Saves best checkpoint to
# checkpoints/needle_finetuned_<id>_best.pkl
needle finetune p31-train.jsonl
```

The web UI alternative (`needle playground`, http://127.0.0.1:7860) can also
train, but prefer the CLI with our dataset for reproducibility. The playground's
built-in data synthesis uses Gemini — do NOT use it; our dataset is controlled.

---

## 5. Export → R2 → deploy

### 5a. Convert the fine-tuned checkpoint to INT4 safetensors

`needle finetune` outputs a `.pkl`. The Worker needs the runtime's safetensors
format (tensor naming matches `needle-infer/src/engine.rs`). Use the
`needle-rs` export tool:

```bash
cd /tmp/opencode/needle-rs
PYTHONPATH=needle python3 tools/export.py \
  --checkpoint /path/to/needle/checkpoints/needle_finetuned_<id>_best.pkl \
  --output-dir /tmp/needle-p31
# → /tmp/needle-p31/needle.safetensors  (22 MB INT4) + vocab.txt
```

Vocab is unchanged by fine-tuning (same tokenizer), so keep R2's existing
`vocab.txt`. Only the weights differ.

```bash
mv /tmp/needle-p31/needle.safetensors /tmp/needle-p31/needle-v2.safetensors
```

### 5b. Upload to R2

```bash
wrangler r2 object put p31-needle-weights/needle-v2.safetensors \
  --file /tmp/needle-p31/needle-v2.safetensors --remote
```

### 5c. Point the Worker at the new model

`needle-engine.ts` now reads the model key from `env.NEEDLE_MODEL_KEY`, which
defaults to `needle-v1.safetensors`. **No source edit or code redeploy is needed
to swap the model** — push the variable and the next request picks it up:

```bash
cd software/workers/intent-resolver
wrangler variable put NEEDLE_MODEL_KEY needle-v2.safetensors
# (optional canary) keep a 10% shadow of v2 alongside v1:
# wrangler variable put NEEDLE_MODEL_KEY 'needle-v2.safetensors'
```

The `[vars] NEEDLE_MODEL_KEY = "needle-v1.safetensors"` in `wrangler.toml` is
only the compile-time default; a `wrangler variable put` runtime binding
overrides it with no deploy. To revert, `wrangler variable put NEEDLE_MODEL_KEY
needle-v1.safetensors` (v1 weights stay in R2 — no data loss).

**Canary alternative (code-only, before the var swap):** set the default key to
split traffic in `needle-engine.ts`,
e.g. `const DEFAULT_MODEL_KEY = Math.random() < 0.1 ? 'needle-v2.safetensors' : 'needle-v1.safetensors';`
and watch `/health` + `/classify` accuracy before flipping to 100%.

> **Known base-model fragility (target for the fine-tune):** the v1 model
> frequently emits malformed JSON (observed: `Expected ':' after property name
> in JSON at position 63`), so `JSON.parse` in `classifyIntent` throws and the
> call falls back. The fine-tune MUST teach the model to emit strict,
> single-object JSON ending in `}` — exactly the `{"name": <tool>,
> "arguments": {...}}` shape in `p31-train.jsonl`. Validate the checkpoint's
> raw output parses before the R2 upload (see §6a).

---

## 6. Validate

```bash
# 6a. Local quick check (before deploy) — confirms the fine-tuned .pkl loads + routes
cd needle
needle run --checkpoint checkpoints/needle_finetuned_<id>_best.pkl \
  --query "deploy the analytics surface to production" \
  --tools '[{"name":"phos_deploy","description":"Deploy a PHOS surface to production","parameters":{"surface":{"type":"string","required":true}}},{"name":"phos_watch","description":"Watch a PHOS surface","parameters":{"surface":{"type":"string","required":true}}}]'
# expect: [{"name":"phos_deploy","arguments":{"surface":"analytics"}}]

# 6b. Live smoke (after deploy) — through the service binding
curl -X POST https://intent-resolver.trimtab-signal.workers.dev/classify \
  -H "Content-Type: application/json" \
  -d '{"prompt":"deploy the analytics surface to production","tools":[<9 P31 tools>]}'
# expect: {"needle_used":true,"tool":"phos_deploy", ...}

# 6c. Regression sweep across all 9 tools (compare v1 vs v2 fallback rate)
```

Success metrics: correct tool on ≥95% of the 9 P31 prompts; fallback rate
(`needle_used:false`) lower than v1 baseline; no new cold-start regression
(model size unchanged at 22 MB).

---

## 7. Negative examples — caveat (read before using `p31-negative.jsonl`)

Needle is a **single-shot tool-caller with a constrained decoder that always
emits a tool name from the supplied list**. A genuine "no tool" answer is not
part of its native training distribution. `p31-negative.jsonl` therefore uses
`answers:"[]"` as a **hypothesis only**.

Before including negatives in training:
1. Run `needle run` on an out-of-domain query (e.g. "what is the capital of
   France?") with the full P31 tool list and observe the actual output.
2. If the model still emits a (wrong) tool name, `answers:"[]"` may break
   training — **drop `p31-negative.jsonl`** and rely on the 1080 positives.
3. If the model genuinely emits `[]` / abstains, negatives are safe to include
   (append to `p31-train.jsonl`).

The 1080 positives alone satisfy upstream's ≥120-per-tool guidance and are
sufficient to ship v2.

---

## 8. Rollback

If v2 regresses, revert with `wrangler variable put NEEDLE_MODEL_KEY
needle-v1.safetensors` (no redeploy). The v1 weights remain in R2. No data loss.

---

## 9. References

- Training + data format: https://github.com/cactus-compute/needle (README §Finetuning, §Data format)
- Weights (MIT): https://huggingface.co/Cactus-Compute/needle
- Runtime + INT4 export: `/tmp/opencode/needle-rs` (`tools/export.py`), `docs/hf-model-card.md`
- Deployed worker: `software/workers/intent-resolver` (`src/needle-engine.ts`
  reads `env.NEEDLE_MODEL_KEY`, defaults to `needle-v1.safetensors`)
- Phase 1/3/4 runbook: `../P31-FORTUNE1-RUNBOOK.md`
