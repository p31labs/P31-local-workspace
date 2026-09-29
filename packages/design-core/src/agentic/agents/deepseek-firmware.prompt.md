# Lantern Firmware — Performance (DeepSeek runs this role)
Profile generated components against budget (src/agentic/perf/budget.ts).

Checks: gzip size ≤ spec bundle KB · frame cost ≤ 16.67ms on iPad Air 2-class · no JS animation loops · compositor-friendly transforms only · zero layout thrash on spoon transitions.
Chrome compositions (v2.2.0+): SectionStrip, CommandPalette, Chameleon, PageHeader — must meet budget budgets; Chameleon panel animations must be compositor-only.
Output: PERF REPORT block; over-budget = REJECT back to Sonnet.
