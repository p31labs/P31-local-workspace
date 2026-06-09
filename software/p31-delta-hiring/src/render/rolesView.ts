import type { AppModel } from '../appModel';
import { escapeHtml } from '../lib/escape';
import { setHashPath } from '../router';
import { priorityClass, uniqueGuilds } from './helpers';
import type { RolePacket } from '../types';

const FILTER_KEY = 'p31.deltaHiring.roleFilters';

type Filters = { guild: string; priority: string };

function readFilters(): Filters {
  try {
    const s = sessionStorage.getItem(FILTER_KEY);
    if (s) return { guild: '', priority: '', ...JSON.parse(s) } as Filters;
  } catch {
    /* ignore */
  }
  return { guild: '', priority: '' };
}

function writeFilters(f: Filters): void {
  sessionStorage.setItem(FILTER_KEY, JSON.stringify(f));
}

function filterRoles(roles: RolePacket[], f: Filters): RolePacket[] {
  return roles.filter((r) => {
    if (f.guild && r.guild !== f.guild) return false;
    if (f.priority && r.priority !== f.priority) return false;
    return true;
  });
}

export function renderRoleList(
  m: AppModel,
  onRefresh: () => void
): { html: string; wire: () => void } {
  const f = readFilters();
  const list = filterRoles(m.rolePackets.roles, f);
  const guilds = uniqueGuilds(m.rolePackets.roles);

  const optionsGuild = [
    '<option value="">All guilds</option>',
    ...guilds.map((g) => `<option value="${escapeHtml(g)}"${f.guild === g ? ' selected' : ''}>${escapeHtml(g)}</option>`)
  ];

  const pr = (['', 'low', 'medium', 'high'] as const).map((p) => {
    if (p === '') return '<option value="">All priorities</option>';
    return `<option value="${p}"${f.priority === p ? ' selected' : ''}>${p}</option>`;
  });

  const cards = list
    .map((r) => {
      return `
    <div class="card job-card" role="link" tabindex="0" data-role="${escapeHtml(r.id)}">
      <div class="row-title">
        <div>
          <h2 class="h-role">${escapeHtml(r.title)}</h2>
          <p class="muted small">${escapeHtml(r.guild)} · ${escapeHtml(r.location)}</p>
        </div>
        <span class="${priorityClass(r.priority)}">${escapeHtml(r.priority).toUpperCase()}</span>
      </div>
      <p class="p-summary muted">${escapeHtml(r.summary)}</p>
      <div class="tag-row">${r.tags
        .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
        .join('')}</div>
    </div>`;
    })
    .join('');

  const html = `
    <p class="muted" style="margin:0 0 1rem">
      <strong>${list.length}</strong> of ${m.rolePackets.roles.length} roles ·
      data ${escapeHtml(m.rolePackets.updated)}
    </p>
    <div class="card card-filters" role="search" aria-label="Filter open roles">
      <div class="grid-2">
        <div>
          <label for="filter-guild" class="small-label">Guild</label>
          <select id="filter-guild" class="select-styled">${optionsGuild.join('')}</select>
        </div>
        <div>
          <label for="filter-priority" class="small-label">Priority</label>
          <select id="filter-priority" class="select-styled">${pr.join('')}</select>
        </div>
      </div>
    </div>
    <div class="card-list" id="role-cards">${list.length ? cards : '<p class="muted">No roles match. Clear filters.</p>'}</div>
  `;

  const wire = () => {
    const g = document.getElementById('filter-guild') as HTMLSelectElement;
    const p = document.getElementById('filter-priority') as HTMLSelectElement;
    const apply = () => {
      writeFilters({ guild: g.value, priority: p.value });
      onRefresh();
    };
    g?.addEventListener('change', apply);
    p?.addEventListener('change', apply);
    document.querySelectorAll<HTMLDivElement>('.job-card').forEach((el) => {
      const go = () => {
        const id = el.getAttribute('data-role');
        if (id) setHashPath(['roles', id]);
      };
      el.addEventListener('click', go);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          go();
        }
      });
    });
  };

  return { html, wire };
}

export function renderRoleDetail(m: AppModel, id: string): string {
  const r = m.rolePackets.roles.find((x) => x.id === id);
  if (!r) {
    return `<p>Role not found.</p><p><a href="#/roles">All roles</a></p>`;
  }
  const ws = m.workSamples.samples[r.workSample.wcdId];
  const weights = Object.entries(r.evaluationWeights)
    .map(([k, v]) => `${escapeHtml(k)}: ${(v * 100).toFixed(0)}%`)
    .join(' · ');

  const rubric = ws
    ? ws.rubric
        .map(
          (row) =>
            `<li><strong>${escapeHtml(row.label)}</strong> (${(row.weight * 100).toFixed(0)}%)</li>`
        )
        .join('')
    : '';
  const good = ws
    ? `<h3 class="h-small muted">What good looks like</h3>
       <ul class="compact good-list">${ws.goodLookLike
         .map((i) => `<li>${escapeHtml(i)}</li>`)
         .join('')}</ul>
       <h3 class="h-small muted">Anti-patterns</h3>
       <ul class="compact anti-list">${ws.antiPatterns
         .map((i) => `<li>${escapeHtml(i)}</li>`)
         .join('')}</ul>`
    : '';
  const allowRes = escapeHtml(
    ws?.allowResourcesOverride ?? m.workSamples.defaults.allowResources
  );

  return `
    <p class="back muted"><a href="#/roles">← All roles</a></p>
    <div class="card print-card" data-printable="1">
      <div class="row-title no-print">
        <h1 class="h-doc">${escapeHtml(r.title)}</h1>
        <span class="${priorityClass(r.priority)}">${escapeHtml(r.priority).toUpperCase()}</span>
      </div>
      <h1 class="h-doc only-print">${escapeHtml(r.title)}</h1>
      <p>${escapeHtml(r.summary)}</p>
      <div class="tag-row">${r.tags
        .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
        .join('')}</div>
    </div>
    <div class="card print-card" data-printable="1">
      <h2>Outcomes (by window)</h2>
      ${r.monthOutcomes
        .map(
          (mo) => `<p class="muted window-label"><strong>${escapeHtml(mo.window)}</strong></p>
        <ul class="compact">${mo.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`
        )
        .join('')}
    </div>
    <div class="card print-card" data-printable="1">
      <h2>Constraints</h2>
      <ul class="compact">
      ${Object.entries(r.constraints)
        .map(
          ([k, v]) =>
            `<li><strong>${escapeHtml(k)}</strong>: ${escapeHtml(
              Array.isArray(v) ? v.join(', ') : String(v)
            )}</li>`
        )
        .join('')}
      </ul>
    </div>
    <div class="card print-card" data-printable="1">
      <h2>Evaluation weights</h2>
      <p class="muted">${weights}</p>
      <h3 class="h-small muted">Accommodation &amp; review</h3>
      <p class="muted">${escapeHtml(r.accommodation)}</p>
    </div>
    <div class="card work-sample card-print-break print-card" data-printable="1">
      <h2>Work sample (WCD)</h2>
      <p class="muted">WCD <code>${escapeHtml(r.workSample.wcdId)}</code> · +${r.workSample.loveReward} L.O.V.E. ·
      difficulty ${r.workSample.difficulty}/5</p>
      ${
        ws
          ? `<p>${escapeHtml(ws.summary)}</p>
         <p class="muted">Time box: <strong>${ws.timeBoundHours}h</strong> · ${allowRes}</p>
         <h3 class="h-small muted">Deliverables</h3>
         <ul class="compact">${ws.deliverables
           .map((d) => `<li>${escapeHtml(d)}</li>`)
           .join('')}</ul>
         ${good}
         <h3 class="h-small muted">Rubric (review plane)</h3>
         <ul class="compact">${rubric}</ul>`
          : '<p class="muted">No extended WCD in catalog.</p>'
      }
      <p class="row-actions no-print" style="margin-top:1rem">
        <a class="btn primary" href="#/proof/new/${r.id}">Start proof record</a>
        <a class="btn" href="#/wcd/${r.workSample.wcdId}">Open WCD page</a>
        <button type="button" class="btn btn-print" data-print-target="1">Print packet</button>
      </p>
    </div>
  `;
}

export function roleDetailWire(_m: AppModel): void {
  document.querySelectorAll<HTMLButtonElement>('.btn-print').forEach((btn) => {
    btn.addEventListener('click', () => window.print());
  });
}
