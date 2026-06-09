import type { AppModel } from '../appModel';
import { escapeHtml } from '../lib/escape';

export function renderHomeBody(m: AppModel): string {
  const { rolePackets: packets } = m;
  return `
  <div class="card print-card" data-printable="1">
    <h2>Proof-of-competence, with provenance</h2>
    <p>Traditional hiring optimizes for proxies. This app publishes <strong>role packets</strong>, <strong>wcds</strong> (bounded work samples with public rubrics), and a <strong>portable <code class="muted">p31.proofRecord</code></strong> you export as JSON. Reviewers are human; the system makes the criteria visible <em>before</em> you invest time.</p>
    <p class="muted">L.O.V.E. labels are a motivation layer in P31’s Delta story. They are <strong>not</strong> payroll, equity promises, or legal classification. <a href="#/governance">Read governance</a>.</p>
    <p class="row-actions" style="margin-top:1rem">
      <a class="btn primary" href="#/roles">Browse open roles</a>
      <a class="btn" href="#/wcd">WCD library</a>
      <a class="btn" href="#/help">Help center</a>
      <a class="btn" href="#/portfolio">My proofs</a>
    </p>
  </div>
  <div class="card">
    <h2>Equity tiers (narrative)</h2>
    <div class="weights">
    ${packets.org.equityTiers
      .map(
        (t) =>
          `<span><strong>${escapeHtml(t.label)}</strong> — ${escapeHtml(
            String(t.tokensRequired)
          )} L.O.V.E. · ${escapeHtml(String(t.equityPercent))}%${
            t.voting ? ' · voting' : ''
          }${t.extra ? ' · ' + escapeHtml(t.extra) : ''}</span>`
      )
      .join('')}
    </div>
  </div>`;
}
