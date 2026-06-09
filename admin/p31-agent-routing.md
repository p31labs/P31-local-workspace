# P31 AGENT ROUTING & DEV ENVIRONMENT SETUP
## Research Synthesis — February 27, 2026

---

## 1. THE PROBLEM (In Your Words)

Agents work best when they do exactly what they were trained to do. Forcing them into roles (Mechanic, Narrator, Architect) costs cognitive spoons — yours AND the model's. The solution isn't role-playing. It's **routing the right task to the right model with the right context, automatically.**

---

## 2. THE AGENT PICKER — What to Use When

### Tier 1: Heavy Lift (Use Sparingly, High Value)

| Agent | Access | Cost | Best For |
|-------|--------|------|----------|
| **Claude Opus 4.6** | claude.ai Pro, API | $$$  | Architecture decisions, QA review, complex debugging, legal document drafting, cognitive passport updates |
| **Claude Sonnet 4.6** | claude.ai, API, VSCode (Copilot/Claude Code) | $$ | Primary coding agent for complex React/TS, multi-file refactors |

### Tier 2: Workhorse (Daily Driver)

| Agent | Access | Cost | Best For |
|-------|--------|------|----------|
| **Gemini 3 Flash** | Gemini Code Assist (Workspace), Gemini CLI, OpenRouter | Free w/ Workspace | Fast coding, agentic loops, 1M context window, long codebase comprehension |
| **Gemini Code Assist** | VSCode extension (free w/ Google Workspace) | Free | Inline completions, agent mode in IDE, `/deploy` to Cloud Run |
| **Gemini CLI** | Terminal (`npx @google/gemini-cli`) | Free (1000 req/day) | Terminal-first tasks, batch operations, CI/CD automation |

### Tier 3: Free Muscle (Via OpenRouter + Cline/Roo)

| Agent | Access | Cost | Best For |
|-------|--------|------|----------|
| **Qwen3 Coder 480B** | OpenRouter `:free` | Free | Strongest free coding model, 262K context |
| **DeepSeek R1** | OpenRouter `:free` | Free | Reasoning-heavy tasks, algorithm design |
| **Llama 4 Maverick** | OpenRouter `:free` | Free | General coding, lightweight tasks |
| **Mistral Small 3.1** | OpenRouter `:free` | Free | Quick edits, code review |

> ⚠️ **DeepSeek privacy warning:** Servers in China, prompts can train models, no opt-out. Fine for open-source P31 code. Do NOT use for legal documents, personal info, or FERS forms.

### Tier 4: Cheap Paid (When Free Rate-Limits Hit)

| Agent | Cost/1M tokens | Notes |
|-------|---------------|-------|
| **DeepSeek V3.2** | ~$0.53 | 90% of frontier quality at 1/50th the cost |
| **Gemini Flash-Lite** | ~$0.50 | Fast, reliable, good for simple tasks |

### Decision Matrix

```
Is it architecture, legal, or cognitive passport?  → Claude Opus (here, claude.ai)
Is it complex multi-file React/TS coding?          → Claude Sonnet (VSCode) or Gemini Code Assist
Is it a long codebase scan or comprehension task?   → Gemini (1M context)
Is it routine coding, tests, or styling?            → Free models via Cline/Roo (Qwen3 Coder, Llama)
Is it a grant narrative or written document?         → Gemini (Workspace) for drafting
Is it firmware/ESP32?                                → DeepSeek R1 for reasoning + Claude for review
Is it sensitive (legal, medical, personal)?          → Claude ONLY. Never DeepSeek.
```

---

## 3. THE DEV ENVIRONMENT — How to Wire It

### VSCode as Mission Control

VSCode now natively supports **multi-agent sessions** (since v1.109, Feb 2026). You can run Claude, Copilot, Gemini, and Codex side by side in the same Agent Sessions view. This is your cockpit.

**Extensions to install:**

| Extension | Purpose |
|-----------|---------|
| **Cline** | Autonomous agent, BYOK, supports OpenRouter for free models |
| **Roo Code** | Multi-mode agent with sticky models (different model per mode) |
| **Gemini Code Assist** | Google Workspace integration, free agent mode |
| **Claude Code** | Anthropic's official agent (when budget allows) |
| **GitHub Copilot** | Background completions + agent orchestration |

### Roo Code: The Agent Router

Roo Code is your best bet for the **agent picker** pattern. Here's why:

1. **Custom Modes** = task-specific configurations with different models auto-assigned
2. **Sticky Models** = each mode remembers its last-used model, auto-switches
3. **Orchestrator Mode** = can delegate subtasks to other modes
4. **OpenRouter integration** = access all free + paid models through one API

**Recommended Roo Modes for P31:**

```yaml
# .roomodes (project root)
customModes:
  - slug: "p31-build"
    name: "P31 Build"
    roleDefinition: "You are a React/TypeScript developer working on the P31 Labs ecosystem. Read CLAUDE.md for project context."
    groups: ["read", "edit", "command", "browser"]
    # Sticky model: Gemini 3 Flash (free, fast)

  - slug: "p31-review"  
    name: "P31 Review"
    roleDefinition: "You are a code reviewer. Check for bugs, security issues, and architectural consistency with the P31 ecosystem."
    groups: ["read"]
    # Sticky model: Claude Sonnet (when quality matters)

  - slug: "p31-docs"
    name: "P31 Docs"
    roleDefinition: "You are a technical writer. Write clear documentation, grant narratives, and HAAT framework descriptions for P31 Labs."
    groups: ["read", "edit"]
    # Sticky model: Gemini (Workspace, free)

  - slug: "p31-debug"
    name: "P31 Debug"
    roleDefinition: "You are a debugger. Diagnose issues, read error logs, suggest fixes."
    groups: ["read", "edit", "command"]
    # Sticky model: Qwen3 Coder (free via OpenRouter)
```

---

## 4. THE CONTEXT FILE SYSTEM — Making Every Agent Smart

This is the critical infrastructure. **Every agent in every tool needs to read the same context.**

### File Hierarchy

```
p31labs/                          # repo root
├── CLAUDE.md                     # Claude Code reads this automatically
├── AGENTS.md                     # VSCode Copilot/Roo reads this automatically  
├── .github/
│   └── copilot-instructions.md   # Copilot reads this automatically
├── .roo/
│   └── rules/
│       └── 01-p31-context.md     # Roo Code reads this automatically
├── .gemini/
│   └── settings.json             # Gemini CLI config
├── context.md                    # THE COGNITIVE PASSPORT (canonical source)
├── pwa/                          
├── apps/web/
└── ...
```

### The Key Insight: One Source, Many Symlinks

The **Cognitive Passport** (`context.md`) is the canonical source of truth. All other context files should reference or include it:

**CLAUDE.md:**
```markdown
# P31 Labs — Project Context
Read context.md in the project root for full operator context.
[include relevant sections or just reference]
```

**AGENTS.md:**
```markdown
# P31 Labs Agent Instructions
Read context.md for full project and operator context.
[include relevant sections]
```

**.roo/rules/01-p31-context.md:**
```markdown
# P31 Labs Context
Read context.md in the project root before any task.
```

**.github/copilot-instructions.md:**
```markdown
# P31 Labs
Read context.md for project context. Key rules:
- Never use military/naval metaphors
- Action over explanation
- Direct communication style
```

### What Goes In Each File

| File | Contains | Why |
|------|----------|-----|
| `context.md` | Full Cognitive Passport | Canonical source, human-readable |
| `CLAUDE.md` | Tech stack, coding standards, active tasks | Claude Code-specific instructions |
| `AGENTS.md` | Coding conventions, PR standards | VSCode multi-agent compatible |
| `.roo/rules/` | Mode-specific instructions | Per-mode customization |
| `.github/copilot-instructions.md` | General coding style | Copilot baseline |

---

## 5. THE MORNING WORKFLOW — Physical to Digital to Genius

```
7:00  iPad 6 + Paperlike + Apple Pencil
      ↓ handwrite brain dump
      ↓ music: Einaudi, Daniel Jang, French Fuse
      
8:30  Nebo (handwriting → text OCR)
      ↓ export as text/markdown
      
8:45  Paste into Claude (claude.ai) with Cognitive Passport
      ↓ "Process this brain dump into today's action items"
      ↓ Claude extracts: tasks, insights, updates to context.md
      
9:00  Update context.md with any new state
      ↓ git commit + push (propagates to all agents)
      
9:15  Open VSCode → Roo Code → P31 Build mode
      ↓ context.md is already loaded
      ↓ agent knows everything from the morning brain dump
      ↓ BUILD
```

### Evening Review (8:00-9:00 PM)

```
Review what shipped today
↓ Update context.md Section 4 (Active Workstreams)
↓ Update deadlines, blockers, progress
↓ git commit: "daily: context update YYYY-MM-DD"
↓ Tomorrow morning, every agent starts pre-loaded
```

---

## 6. DEVICE MATRIX

| Device | Primary Use | Agent Access |
|--------|------------|--------------|
| **iPad 6 + Paperlike** | Morning brain dump (handwriting) | Nebo → export |
| **Acer Spin 713** | Primary dev machine (VSCode) | All agents via extensions |
| **Pixel 9 Pro Fold** | Mobile capture, quick prompts | claude.ai app, Gemini app |
| **PC** | Heavy dev sessions | Full VSCode stack |
| **Node Zero (future)** | Edge compute | Local models via Ollama |

All devices connect to the same repos. `context.md` is always current via git.

---

## 7. COST OPTIMIZATION

**Monthly budget target: As close to $0 as possible**

| Task Volume | Agent | Monthly Cost |
|-------------|-------|-------------|
| 80% of coding | Gemini (Workspace) + OpenRouter free | $0 |
| 15% complex coding | Claude Sonnet (Copilot or API) | ~$20 (Pro sub) |
| 4% architecture/legal | Claude Opus (claude.ai) | Included in Pro |
| 1% firmware reasoning | DeepSeek R1 (free) | $0 |

**Total: ~$20/month** (Claude Pro subscription covers the premium needs)

---

## 8. IMMEDIATE NEXT STEPS

1. **TODAY:** Download the Cognitive Passport v1. Proof it. Correct it.
2. **TODAY:** Create `CLAUDE.md` and `AGENTS.md` in the P31 repo from the passport.
3. **TODAY:** Install Roo Code in VSCode. Set up the 4 P31 modes with model routing.
4. **TODAY:** Set up OpenRouter account (free) → get API key → configure in Cline/Roo.
5. **TOMORROW MORNING:** First real handwrite → process → build cycle targeting BONDING.
6. **MARCH 3:** BONDING ships. Bash places his first atom on his birthday.

---

*The system doesn't make the operator smarter. The operator is already smart. The system makes the operator's intelligence legible to the world.*
