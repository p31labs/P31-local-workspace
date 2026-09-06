# Youth path + agent hub (D-PA6 check)

**Requirement (parent CWP deliverable D-PA6):** `p31-agent-hub` public chat is not the primary private channel for minors; secrets protect prod orchestrator when configured.

| Check | Result |
|--------|--------|
| `mesh-start.html` links to `p31-agent-hub` or `/api/chat` on hub? | **No** — `mesh-start.html` only talks to k4-personal `BASE` (`agentBase()`). Grep: no `agent-hub` / `p31-agent-hub`. |
| `dev-workbench.html` | Documents `AGENT_HUB_SECRET` and “not this page” when Worker requires secret (`andromeda/software/p31ca/public/dev-workbench.html` ~L49, L142). |
| **PLAN-KIDS** | `docs/PLAN-KIDS-VIBE-CODING.md` — EDE for youth; do not route primary private chat through agent-hub in prod. |

*Closure:* Keep mesh-start and onboard free of “use agent hub as your main chat” copy for under-16 flows; EDE and k4-personal remain the youth-facing private edge.
