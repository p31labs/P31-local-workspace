import type { AppModel } from '../appModel';
import type { SearchDoc } from '../lib/buildSearchIndex';
import type { HelpTopic } from '../types';
import { helpBlocksToHtml } from '../lib/blocksToHtml';
import { escapeHtml } from '../lib/escape';
import { setHashPath } from '../router';
export function renderHelpList(m: AppModel): string {
  const bySection = new Map<string, HelpTopic[]>();
  for (const t of m.help.topics) {
    const arr = bySection.get(t.section) ?? [];
    arr.push(t);
    bySection.set(t.section, arr);
  }
  const sections = [...bySection.entries()]
    .map(
      ([sec, topics]) =>
        `<section class="help-section" aria-labelledby="sec-${escapeHtml(sec)}">
      <h2 id="sec-${escapeHtml(sec)}" class="h-section">${escapeHtml(sec)}</h2>
      <ul class="help-toc">${topics
        .map(
          (t) =>
            `<li><a href="#/help/${t.id}">${escapeHtml(t.title)}</a> — <span class="muted small">${escapeHtml(
              t.summary
            )}</span></li>`
        )
        .join('')}</ul>
    </section>`
    )
    .join('');
  return `
    <div class="card">
      <h1 class="h-doc">Help center</h1>
      <p class="muted">Published with the app data. Last content update: ${escapeHtml(m.help.updated)}.</p>
      <p><a class="btn primary" href="#/search">Search all content</a></p>
    </div>
    ${sections}
  `;
}

export function renderHelpTopic(m: AppModel, id: string): string {
  const t = m.help.topics.find((x) => x.id === id);
  if (!t) {
    return `<p>Topic not found.</p><p><a href="#/help">Help home</a></p>`;
  }
  const body = helpBlocksToHtml(t.blocks);
  const relW = t.relatedWcd
    .map((w) => `<a href="#/wcd/${escapeHtml(w)}">${escapeHtml(w)}</a>`)
    .join(', ');
  const relR = t.relatedRoleId
    .map((r) => {
      const role = m.rolePackets.roles.find((x) => x.id === r);
      return role
        ? `<a href="#/roles/${escapeHtml(r)}">${escapeHtml(role.title)}</a>`
        : '';
    })
    .filter(Boolean)
    .join(', ');
  return `
    <p class="back muted"><a href="#/help">← Help</a></p>
    <article class="card article" data-printable="1">
      <p class="muted small">Section: ${escapeHtml(t.section)} · Last reviewed ${escapeHtml(
        t.lastReviewed
      )}</p>
      <h1 class="h-doc">${escapeHtml(t.title)}</h1>
      <p class="lead muted">${escapeHtml(t.summary)}</p>
      <div class="article-body">${body}</div>
      ${
        relW || relR
          ? `<footer class="article-foot muted small">
        ${relW ? `<p>Related wcds: ${relW}</p>` : ''}
        ${relR ? `<p>Related roles: ${relR}</p>` : ''}
      </footer>`
          : ''
      }
    </article>
  `;
}

export function renderGlossaryList(m: AppModel): string {
  const rows = m.glossary.entries
    .map(
      (e) => `<tr>
      <td><a href="#/glossary/${e.id}">${escapeHtml(e.term)}</a></td>
      <td class="muted">${escapeHtml(e.definition.slice(0, 120))}${e.definition.length > 120 ? '…' : ''}</td>
    </tr>`
    )
    .join('');
  return `
    <div class="card">
      <h1 class="h-doc">Glossary</h1>
      <p class="muted">Updated ${escapeHtml(m.glossary.updated)}</p>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <caption class="sr-only">Terms and definitions</caption>
        <thead><tr><th scope="col">Term</th><th scope="col">Definition (preview)</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

export function renderGlossaryTerm(m: AppModel, id: string): string {
  const e = m.glossary.entries.find((x) => x.id === id);
  if (!e) return `<p>Not found.</p><a href="#/glossary">Glossary</a>`;
  const see = e.seeAlso
    .map((s) => {
      const o = m.glossary.entries.find((x) => x.id === s);
      return o ? `<a href="#/glossary/${o.id}">${escapeHtml(o.term)}</a>` : '';
    })
    .filter(Boolean)
    .join(', ');
  return `
    <p class="back muted"><a href="#/glossary">← Glossary</a></p>
    <div class="card article">
      <h1 class="h-doc">${escapeHtml(e.term)}</h1>
      <p>${escapeHtml(e.definition)}</p>
      ${see ? `<p class="muted small">See also: ${see}</p>` : ''}
    </div>
  `;
}

export function renderWcdList(m: AppModel): string {
  const rows = Object.entries(m.workSamples.samples)
    .map(([id, s]) => {
      return `<tr>
      <td><a href="#/wcd/${escapeHtml(id)}"><code>${escapeHtml(id)}</code></a></td>
      <td>${escapeHtml(s.title)}</td>
      <td class="muted">${s.timeBoundHours}h</td>
      <td><span class="pill pill-med">${s.rubric.length} dims</span></td>
    </tr>`;
    })
    .join('');
  return `
    <div class="card">
      <h1 class="h-doc">WCD library</h1>
      <p class="muted">Every work sample with time box, deliverables, good / anti patterns, and rubric. Data ${escapeHtml(
        m.workSamples.updated
      )}.</p>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <caption class="sr-only">Work challenge definitions</caption>
        <thead>
          <tr><th scope="col">Id</th><th scope="col">Title</th><th scope="col">Time</th><th scope="col">Rubric</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

export function renderWcdDetail(m: AppModel, id: string): string {
  const s = m.workSamples.samples[id];
  if (!s) return `<p>WCD not found.</p><a href="#/wcd">Library</a>`;
  const roles = m.rolePackets.roles.filter((r) => r.workSample.wcdId === id);
  const rub = s.rubric
    .map(
      (row) =>
        `<li><strong>${escapeHtml(row.label)}</strong> — ${(row.weight * 100).toFixed(0)}%${
          row.anchors
            ? ` <span class="muted small">(${Object.entries(row.anchors)
                .map(([k, v]) => `${k}: ${v}`)
                .join('; ')})</span>`
            : ''
        }</li>`
    )
    .join('');
  const allow = escapeHtml(s.allowResourcesOverride ?? m.workSamples.defaults.allowResources);
  return `
    <p class="back muted"><a href="#/wcd">← WCD library</a></p>
    <div class="card article print-card" data-printable="1">
      <h1 class="h-doc"><code>${escapeHtml(id)}</code></h1>
      <h2 class="h2-card">${escapeHtml(s.title)}</h2>
      <p>${escapeHtml(s.summary)}</p>
      <p class="muted">Time box: <strong>${s.timeBoundHours}h</strong> · ${allow}</p>
      <h3 class="h-small">Deliverables</h3>
      <ul class="compact">${s.deliverables.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul>
      <h3 class="h-small">What good looks like</h3>
      <ul class="compact good-list">${s.goodLookLike.map((g) => `<li>${escapeHtml(g)}</li>`).join('')}</ul>
      <h3 class="h-small">Anti-patterns</h3>
      <ul class="compact anti-list">${s.antiPatterns.map((g) => `<li>${escapeHtml(g)}</li>`).join('')}</ul>
      <h3 class="h-small">Rubric</h3>
      <ul class="compact">${rub}</ul>
    </div>
    <div class="card">
      <h2>Roles using this WCD</h2>
      ${
        roles.length
          ? `<ul class="compact">${roles
              .map(
                (r) =>
                  `<li><a href="#/roles/${r.id}">${escapeHtml(r.title)}</a> (${escapeHtml(
                    r.guild
                  )})</li>`
              )
              .join('')}</ul>`
          : '<p class="muted">None linked in current data.</p>'
      }
    </div>
  `;
}

export function renderChangelog(m: AppModel): string {
  const items = m.changelog.entries
    .map(
      (e) => `<section class="changelog-section">
      <h2 class="h-section">${escapeHtml(e.version)} <span class="muted small">${escapeHtml(e.date)}</span></h2>
      <ul class="compact">${e.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
    </section>`
    )
    .join('');
  return `<div class="card"><h1 class="h-doc">Changelog</h1></div>${items}`;
}

export function renderGovernance(): string {
  return `
    <div class="card article">
      <h1 class="h-doc">Governance, privacy, and labor</h1>
      <p class="muted">This static app runs in your browser. It is <strong>not</strong> a cloud applicant tracking system (ATS) and does not upload your drafts unless you export and send them yourself.</p>
      <h2 class="h2-card">Data location</h2>
      <p>Drafts are stored in <code class="inline-code">localStorage</code> for this origin only. Export JSON for backup. Clearing site data may delete drafts.</p>
      <h2 class="h2-card">Equal opportunity &amp; accommodation</h2>
      <p>P31 aims for async-first, written review. Role packets include accommodation lines. Final requests go through official channels when published.</p>
      <h2 class="h2-card">Labor and tokens</h2>
      <p>L.O.V.E. and equity tiers are narrative and planning constructs in org documentation. They are <strong>not</strong> offers of employment, equity, or compensation. Classification of work (employee, contractor, volunteer) requires a separate legal process.</p>
      <h2 class="h2-card">AI and integrity</h2>
      <p>Disclose tools used in candidate notes. Reviewers evaluate integration and judgment; uncited wholesale model output is a review risk.</p>
    </div>
  `;
}

export function renderReviewers(): string {
  return `
    <div class="card article">
      <h1 class="h-doc">For reviewers</h1>
      <p class="muted">If you received a <code class="inline-code">p31.proofRecord</code> JSON file outside this app:</p>
      <ol class="compact">
        <li>Validate structure (org may provide a CI script; schema lives in <code class="inline-code">schemas/proof-record.schema.json</code> in the package).</li>
        <li>Check consent flags; do not process if policy requires explicit channel and consent is missing.</li>
        <li>Open artifacts in order; prefer exact <code class="inline-code">commitSha</code> when present.</li>
        <li>Score each rubric line using the published WCD; calibrate with other reviewers on small sets.</li>
        <li>Do not rely on self-assessment sliders as authoritative—treat them as the candidate’s own alignment check.</li>
      </ol>
      <p><a class="btn" href="#/help/for-reviewers">Help: full checklist</a></p>
    </div>
  `;
}

export function renderSearch(m: AppModel, q: string, onRun: (query: string) => void): { html: string; wire: () => void } {
  const query = (q || '').trim();
  const results: { item: SearchDoc; refIndex: number }[] = query
    ? m.fuse.search(query).slice(0, 24)
    : [];
  const list = results
    .map((r) => {
      const d = r.item;
      const kind = d.kind === 'help' ? 'Help' : d.kind === 'glossary' ? 'Glossary' : d.kind === 'role' ? 'Role' : 'WCD';
      return `<li class="search-hit"><a href="${escapeHtml(d.href)}"><strong>${escapeHtml(
        d.title
      )}</strong></a> <span class="muted small">${kind}</span><br/><span class="muted small">${escapeHtml(
        d.summary.slice(0, 160)
      )}${d.summary.length > 160 ? '…' : ''}</span></li>`;
    })
    .join('');
  const html = `
    <div class="card">
      <h1 class="h-doc">Search</h1>
      <form id="search-form" class="search-form" role="search">
        <label for="q" class="sr-only">Search query</label>
        <input id="q" name="q" type="search" class="input-styled search-input" value="${escapeHtml(
          query
        )}" placeholder="Roles, wcds, help, glossary…" autocomplete="off" />
        <button type="submit" class="btn primary">Search</button>
      </form>
      ${
        query
          ? `<p class="muted">${results.length} result(s) for <strong>${escapeHtml(query)}</strong></p>
         <ul class="search-results">${list || '<li class="muted">No matches (try shorter terms).</li>'}</ul>`
          : '<p class="muted">Type a term and press Search (roles, WCD ids, help topics, glossary).</p>'
      }
    </div>
  `;
  const wire = () => {
    document.getElementById('search-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = (document.getElementById('q') as HTMLInputElement).value.trim();
      setHashPath(['search'], { q: v });
      onRun(v);
    });
  };
  return { html, wire };
}
