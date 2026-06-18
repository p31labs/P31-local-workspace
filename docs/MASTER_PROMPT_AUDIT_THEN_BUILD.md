# Master Prompt: Audit, Zoom Out, Think, Build

**For:** Any agent tasked with exploring a codebase, identifying the highest-leverage gap, and building a new tool to fill it.

**Style:** Direct. No preamble. Action over explanation.

---

## PHASE 1 — SCAN THE CODEBASE

Do **not** jump to building. Spend real effort on exploration first.

### Step 1.1: Topology Map

```
Read the root:
  - README.md, CLAUDE.md, AGENTS.md, CONTRIBUTING.md (any exist)
  - package.json, pnpm-workspace.yaml, turbo.json, justfile
  - docker-compose.yml, Caddyfile
  - .env.example, .gitignore
  - ls -la the root — every top-level entry
```

Answer: What IS this project? Monorepo? What languages? What frameworks? What domain? Who operates it?

### Step 1.2: Directory Census

For every top-level directory that contains code:

```
ls -la <dir>
```

For any that look significant (contain `package.json`, `src/`, `README.md`, `main.py`, `wrangler.toml`, etc.):

```
ls -la <dir>/src
ls -la <dir>/packages
ls -la <dir>/scripts
```

Build a mental map of every single deployable unit, package, worker, site, and script.

Answer: What exists? How many packages? Workers? Sites? Middleware? Daemons?

### Step 1.3: Key File Ingestion

For each significant unit, read its defining files:

- `package.json` — name, dependencies, scripts
- `README.md` — purpose
- Source entry files — actual API surface, exports, classes
- `wrangler.toml` — if Cloudflare worker: routes, KV, D1, crons, environments
- Test files — what's tested, test patterns, test count
- Config files — `.env`, `config.yaml`, `tsconfig.json`

Concentrate on:
- **Runtime state files** — JSON files that store live state (not static code). These are the system's pulse.
- **CI/CD files** — cron expressions, deploy scripts, health checks
- **System prompt files** — `CLAUDE.md`, `AGENTS.md` — these contain the operator's actual priorities and constraints

### Step 1.4: Trace the Data Flow

For each runtime state file:

```
Where is this file written?  (which daemon/worker/script writes it)
Where is this file read?     (which tools consume it)
What format?                 (JSON schema)
What domain?                 (metabolic? cognitive? infrastructure? legal? content?)
```

For each significant worker/API:

```
What does it do?              (read the handler/endpoint code)
What does it depend on?       (KV, D1, R2, external APIs)
What is its output?           (what state does it produce or consume)
```

### Step 1.5: Identify Patterns

While scanning, note:

- **Architectural motifs** — patterns that appear repeatedly (signal-based monitoring, daemon loops, entanglement pairs, spoon-aware scaling, PWA offline-first, CRDT sync, content pipeline)
- **Naming conventions** — how things are named (kebab-case dirs, PascalCase components, PMM_ prefixes, CWP-XXX ids)
- **Style conventions** — how code looks (functional components, strict TypeScript, Python with typed dicts, docstring patterns)
- **Domain vocabulary** — what terms are used (spoons, entanglement, jitterbug, forge, WEAVE, nexus, k4-cage, cognitive-passport, tetrahedron, larmor, phos)

---

## PHASE 2 — STOP

Do not build anything yet.

Re-read your Phase 1 answers. Write down:

```
EXISTING TOOLS:
  - name:       (what's it called)
  - directory:  (where does it live)
  - purpose:    (what does it do)
  - domain:     (metabolic, cognitive, legal, infrastructure, content — or other)
  - input:      (what files/APIs does it read)
  - output:     (what files/APIs does it write)
  - active:     (is it deployed? live? how do you know?)
```

Map every tool into a matrix:

| Tool | Domain | Inputs | Outputs | Active? |
|------|--------|--------|---------|---------|
| ...  |        |        |         |         |

---

## PHASE 3 — ZOOM OUT

### Step 3.1: Map the Domains

Group tools by domain. What domains emerge naturally?

Example domains from P31:
- **Metabolic** — calcium, albumin, creatinine, alertness, medication adherence
- **Cognitive** — spoon level, task initiation, switching cost, peak/trough hours
- **Legal** — court case, hearings, deadlines, judge, opposing counsel
- **Infrastructure** — workers, deployments, CI health, git recency, KV, D1
- **Content** — papers, social media, blog posts, grant drafts, brand materials

Your codebase may have different domains. Identify them.

### Step 3.2: Find the Gaps

For each pair of domains, ask:

```
Does any tool connect Domain A → Domain B?
If not, is there a natural relationship between them that the operator
must currently hold in their head?
```

For each domain, ask:

```
Does a tool exist to monitor this domain's HEALTH?
Does a tool exist to ALERT when this domain degrades?
Does a tool exist to PREDICT the consequences of degradation?
Does a tool exist to RECOMMEND an action?
```

For the operator, ask:

```
What is the operator's limiting factor?
  - Time?   → build automation
  - Energy? → build decision-support (saves cognitive load)
  - Info?   → build a dashboard or alert system
```

### Step 3.3: Identify the Highest-Leverage Gap

The gap that, if filled, would:

1. Reduce the operator's cognitive load the most
2. Connect two or more currently siloed domains
3. Be achievable in a single session (not a multi-week project)
4. Follow existing architectural patterns (not bolt on something alien)
5. Have immediate operational value (not theoretical)

Write down the gap. Justify why it's the highest leverage.

---

## PHASE 4 — THINK

### Step 4.1: Design the Thing

Answer these questions in order:

```
Q1: What does the operator NEED that they don't have?
Q2: What information already exists that could provide it?
Q3: What's the simplest possible version that delivers value?
Q4: What existing patterns should I follow?
Q5: What's the ONE thing this tool should tell the operator?
```

### Step 4.2: Name It

Use existing naming conventions:
- P31 names: `p31-*`, `k4-*`, `*worker`, `*daemon`, `*engine`, `*bridge`
- Verbs: `forge`, `weave`, `jitterbug`, `nexus`
- Keep it short.

### Step 4.3: Scope It

The tool must be:

- **Single file or a small set** (one main script + one config file is ideal)
- **Self-contained** (zero external dependencies beyond what's already used)
- **Composable** (reads from existing state files, writes to a new state file that other tools can consume)
- **Testable** (can run with no network, no API keys, no external services)
- **Documentable in < 2 minutes** (the operator should understand what it does immediately)

### Step 4.4: Plan the Code

Write pseudocode for:

```
1. What does it READ?     (list exact file paths)
2. What does it COMPUTE?  (the core algorithm)
3. What does it WRITE?    (list exact output paths)
4. What does it PRINT?    (the CLI output the operator sees)
```

---

## PHASE 5 — BUILD

### Step 5.1: Create the Files

Write the main script and config. Follow existing code style:
- Same indentation, comment style, naming conventions
- Same imports/libraries used by similar tools in the codebase
- Same error handling patterns
- Same output formatting

Match the existing quality bar exactly. If existing tools use docstring schemes, use them. If they use specific logging patterns, use them.

### Step 5.2: Add Entanglement/Config

If the tool needs configurable rules, put them in a separate JSON file (not hardcoded). Follow existing config schema conventions.

### Step 5.3: Run It

Execute the tool. Fix any bugs. Verify the output is correct. Run it at least twice to ensure idempotency.

### Step 5.4: Verify the Output

Read the generated output files. Are they correct? Complete? Useful?

### Step 5.5: Document at Five Levels

Generate a single response that covers:

1. **Social Media Graphic** (one-sentence pitch + ASCII art)
2. **Executive Brief** (what, why, how)
3. **White Paper** (technical architecture)
4. **Operator Runbook** (how to use it)
5. **Coding Agent Guide** (how to extend it)

Use the jitterbug framing: "Same information. Different scales."

---

## THE OUTPUT FORMAT

Your final response should contain **exactly**:

1. A header with the tool name and a one-line summary
2. Brief "What I built" section (2-3 lines)
3. The five levels of documentation as described in Step 5.5
4. Integration table showing how the new tool fits into the existing suite

Do not add preamble. Do not ask for confirmation. Build it, verify it, present it.

---

## VERIFICATION CHECKLIST

Before presenting the tool, verify:

- [ ] Runs without errors
- [ ] Produces correct output
- [ ] Consistent with existing code style
- [ ] No external dependencies added
- [ ] Reads from existing state files (doesn't duplicate data)
- [ ] Writes output in a format other tools can consume
- [ ] Has a config file for rules (not hardcoded)
- [ ] Is documented at all five levels
- [ ] Would actually save the operator time/energy on day one

---

*P31 Labs | Audit-Think-Build Protocol | v1.0*
