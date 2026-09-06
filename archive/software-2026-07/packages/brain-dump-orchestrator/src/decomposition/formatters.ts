import type { Axis, Deliverable, ConvergenceGateCheck } from '../types/index.js';

export function formatAxesAsMarkdown(axes: Axis[]): string {
  let md = '# 🗂️ Parallel Axes\n\n';
  md += '| Axis | Focus Area | Agent / Owner | Deliverable | Convergence Gate |\n';
  md += '|------|------------|---------------|-------------|------------------|\n';
  for (const axis of axes) {
    const deliverable = axis.deliverable.map((d: Deliverable) => d.description).join(', ');
    const gate = axis.convergenceGate.checks.map((c: ConvergenceGateCheck) => c.description).join('; ');
    md += `| ${axis.letter} | ${axis.focusArea} | ${axis.agentRole} | ${deliverable} | ${gate} |\n`;
  }
  return md;
}

export function formatAxesAsJson(axes: Axis[]): string {
  return JSON.stringify(axes, null, 2);
}

export function formatAxesDetail(axes: Axis[]): string {
  let md = '';
  for (const axis of axes) {
    md += `## 🤖 Axis ${axis.letter} – ${axis.name}\n\n`;
    md += `**ROLE:** ${axis.agentRole}\n\n`;
    md += `**MISSION:** ${axis.focusArea}\n\n`;
    md += `**DELIVERABLES:**\n`;
    for (const d of axis.deliverable) {
      md += `- \`${d.filePath}\` — ${d.description}\n`;
    }
    md += `\n**CONVERGENCE GATE:**\n`;
    for (const c of axis.convergenceGate.checks) {
      md += `- [ ] ${c.description}\n`;
    }
    md += '\n';
  }
  return md;
}
