import type { AppModel } from '../appModel';
import { downloadJsonFile, readJsonFile } from '../lib/downloadJson';
import { escapeHtml } from '../lib/escape';
import { parseProofJson } from '../lib/validateProof';
import { setHashPath } from '../router';
import {
  deleteProof,
  getProof,
  listProofs,
  makeArtifact,
  newProofTemplate,
  upsertProof
} from '../storage';
import type { ProofArtifact, ProofRecord } from '../types';
import { announceStatus, focusMainTarget } from '../lib/announce';
import { renderShell, activeFromRoute } from './shell';

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `proof-${Date.now()}`;
}

export function renderPortfolio(
  m: AppModel,
  onRefresh: () => void
): { html: string; wire: () => void } {
  const list = listProofs();
  const rows = list
    .map((p) => {
      const role = m.rolePackets.roles.find((r) => r.id === p.roleId);
      const title = role ? role.title : p.roleId;
      return `<tr>
        <td><a href="#/proof/${escapeHtml(p.id)}">${escapeHtml(p.id.slice(0, 8))}…</a></td>
        <td>${escapeHtml(title)}</td>
        <td class="muted">${escapeHtml(p.updated.slice(0, 10))}</td>
        <td class="row-actions-tight">
          <button type="button" class="export-btn" data-id="${escapeHtml(p.id)}">Export</button>
          <button type="button" class="del-btn" data-id="${escapeHtml(p.id)}">Delete</button>
        </td>
      </tr>`;
    })
    .join('');

  const html = `
    <div id="portfolio-err" class="alert alert-error" role="alert" hidden></div>
    <div class="card">
      <h2>My proofs (local only)</h2>
      <p class="muted">Back up with <strong>Export</strong>. <strong>Import</strong> validates <code class="inline-code">p31.proofRecord/1.0.0</code> and may assign a new id if a duplicate already exists.</p>
      <p class="muted">Count: <strong>${list.length}</strong></p>
      <p class="row-actions">
        <label class="btn file-btn" style="display:inline-block; margin:0; cursor:pointer">
          <span>Import JSON</span>
          <input type="file" accept="application/json,.json" class="file-hidden" id="import-proof" />
        </label>
        <a class="btn" href="#/roles">Browse roles</a>
        <a class="btn" href="#/help/proof-export">How proof export works</a>
      </p>
      ${
        list.length
          ? `<div class="table-wrap" role="region" aria-label="Proof list">
        <table class="data-table">
          <caption class="sr-only">Local proof records</caption>
          <thead><tr><th scope="col">Id</th><th scope="col">Role</th><th scope="col">Updated</th><th scope="col">Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>`
          : '<p class="muted">No proofs yet. Open a role and choose “Start proof record.”</p>'
      }
    </div>
  `;

  const errEl = () => document.getElementById('portfolio-err') as HTMLDivElement;

  const wire = () => {
    document.getElementById('import-proof')?.addEventListener('change', async (e) => {
      const t = (e.target as HTMLInputElement).files?.[0];
      (e.target as HTMLInputElement).value = '';
      if (!t) return;
      try {
        const json = await readJsonFile(t);
        const v = parseProofJson(json);
        if (!v.ok) {
          const el = errEl();
          if (el) {
            el.hidden = false;
            el.textContent = v.errors.join('. ');
          }
          announceStatus('Import failed');
          return;
        }
        let rec = { ...v.value };
        if (getProof(rec.id)) rec = { ...rec, id: newId() };
        rec.updated = new Date().toISOString();
        upsertProof(rec);
        const _err = errEl();
        if (_err) _err.hidden = true;
        announceStatus('Proof imported');
        onRefresh();
      } catch (ex) {
        const el = errEl();
        if (el) {
          el.hidden = false;
          el.textContent = 'Could not read JSON. ' + (ex instanceof Error ? ex.message : '');
        }
        announceStatus('Import failed');
      }
    });
    document.querySelectorAll<HTMLButtonElement>('.export-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')!;
        const p = getProof(id);
        if (p) {
          downloadJsonFile(`p31-proof-${id.slice(0, 8)}.json`, p);
          announceStatus('Exported proof');
        }
      });
    });
    document.querySelectorAll<HTMLButtonElement>('.del-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')!;
        if (confirm('Delete this proof from local storage?')) {
          deleteProof(id);
          announceStatus('Deleted proof');
          onRefresh();
        }
      });
    });
  };

  return { html, wire };
}

function snapshotFromForm(
  form: HTMLFormElement | null,
  m: AppModel,
  pr: ProofRecord
): ProofRecord {
  if (!form) return pr;
  const rbt = m.workSamples.samples[pr.wcdId]?.rubric ?? [];
  const self: Record<string, number> = { ...pr.selfAssessment };
  rbt.forEach((row) => {
    const el = form.querySelector<HTMLInputElement>(`[name="sa-${row.id}"]`);
    if (el) {
      const v = parseInt(el.value, 10);
      self[row.id] = Math.min(5, Math.max(1, Number.isFinite(v) ? v : 3));
    }
  });
  const c = form.querySelector<HTMLTextAreaElement>('[name="cnotes"]')?.value ?? pr.candidateNotes;
  return {
    ...pr,
    selfAssessment: self,
    candidateNotes: c.slice(0, 8000),
    consent: {
      dataProcessing: form.querySelector<HTMLInputElement>('input[name="cp"]')?.checked ?? false,
      shareWithReviewers: form.querySelector<HTMLInputElement>('input[name="cs"]')?.checked ?? false,
      version: '1.0.0' as const
    }
  };
}

function artifactRow(a: ProofArtifact): string {
  const sha = a.commitSha
    ? `<p class="muted small">Commit <code>${escapeHtml(a.commitSha)}</code></p>`
    : '';
  return `<div class="artifact-row" data-art="${escapeHtml(a.id)}">
      <header>
        <span><strong>${escapeHtml(a.label)}</strong> <span class="muted">(${escapeHtml(a.kind)})</span></span>
        <button type="button" class="rem-art btn btn-small" data-art="${escapeHtml(a.id)}">Remove</button>
      </header>
      <a href="${escapeHtml(a.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
    a.url
  )}</a>
      ${sha}
      ${a.notes ? `<p class="muted small">${escapeHtml(a.notes)}</p>` : ''}
    </div>`;
}

export function buildProofFormHtml(
  m: AppModel,
  proof: ProofRecord,
  isNew: boolean
): string {
  const role = m.rolePackets.roles.find((r) => r.id === proof.roleId);
  const title = role ? role.title : proof.roleId;
  const ws = m.workSamples.samples[proof.wcdId];
  const rbt = ws?.rubric ?? [];

  const artHtml = proof.artifacts.map(artifactRow).join('') || '<p class="muted">No artifacts yet.</p>';
  const selfHtml = rbt
    .map((row) => {
      const v = proof.selfAssessment[row.id] ?? 3;
      return `<div class="rubric-dim">
      <label for="sa-${row.id}">${escapeHtml(row.label)} — self ${(row.weight * 100).toFixed(0)}% (1–5)</label>
      <input type="range" class="input-range" min="1" max="5" step="1" id="sa-${row.id}" name="sa-${
        row.id
      }" value="${v}" aria-valuemin="1" aria-valuemax="5" />
      <span class="muted sa-val" data-sa="${row.id}">Value: ${v}</span>
    </div>`;
    })
    .join('');

  return `
  <p class="back muted"><a href="#/portfolio">← Proofs</a> · <a href="#/roles/${proof.roleId}">Role packet</a></p>
  <div id="proof-err" class="alert alert-error" role="alert" hidden></div>
  <div class="card">
    <h2 class="h2-card">${isNew ? 'New proof' : 'Edit proof'}</h2>
    <p class="muted">${escapeHtml(title)} · <code class="inline-code">${escapeHtml(
      proof.wcdId
    )}</code></p>
    <p class="muted small">Id <code class="inline-code">${escapeHtml(
      proof.id
    )}</code> · <label class="inline-file"><input type="file" accept="application/json" class="file-hidden" id="replace-from-file" /> Replace from file</label>
  </div>
  <form id="proof-form" class="card" novalidate>
    <h3>Consent (export needs both)</h3>
    <label class="label-row">
      <input type="checkbox" name="cp" ${
        proof.consent.dataProcessing ? 'checked' : ''
      } />
      <span>I understand drafts live in this browser; export is my backup responsibility</span>
    </label>
    <label class="label-row">
      <input type="checkbox" name="cs" ${
        proof.consent.shareWithReviewers ? 'checked' : ''
      } />
      <span>I may share the exported file with P31 reviewers through an official channel</span>
    </label>
    <h3>Artifacts</h3>
    <div id="artifact-list" class="stack">${artHtml}</div>
    <div class="grid-2" style="margin-top:0.5rem">
      <div>
        <label for="a-kind" class="small-label">Kind</label>
        <select id="a-kind" class="select-styled" aria-label="Artifact kind">
          <option value="repo">repo</option>
          <option value="url">url</option>
          <option value="file">file</option>
          <option value="other">other</option>
        </select>
      </div>
      <div>
        <label for="a-label" class="small-label">Label</label>
        <input id="a-label" class="input-styled" type="text" placeholder="e.g. Main submission" />
      </div>
    </div>
    <label for="a-url" class="small-label">URL</label>
    <input id="a-url" class="input-styled" type="url" placeholder="https://…" />
    <label for="a-sha" class="small-label">Commit SHA (optional)</label>
    <input id="a-sha" class="input-styled" type="text" inputmode="text" pattern="[a-fA-F0-9]{7,40}" placeholder="7+ hex" />
    <label for="a-notes" class="small-label">Notes (optional)</label>
    <textarea id="a-notes" class="input-styled" rows="2" placeholder="Commands, context…"></textarea>
    <button type="button" class="btn" id="add-art">Add artifact</button>
    <h3 class="h3-form">Rubric (self)</h3>
    ${selfHtml || '<p class="muted">No rubric in catalog for this WCD.</p>'}
    <h3>Notes to reviewers</h3>
    <textarea name="cnotes" rows="5" class="input-styled" placeholder="Accommodations, time taken, tool disclosure…">${escapeHtml(
      proof.candidateNotes
    )}</textarea>
    <div class="row-actions" style="margin-top:1rem">
      <button type="submit" class="btn primary">Save</button>
      <button type="button" class="btn" id="btn-export">Export JSON</button>
      <button type="button" class="btn danger" id="btn-delete">Delete</button>
    </div>
  </form>
  `;
}

export function wireProofForm(
  m: AppModel,
  app: HTMLElement,
  proof: ProofRecord,
  onGlobalRefresh: () => void
): void {
  let pr = { ...proof };
  const getForm = () => document.getElementById('proof-form') as HTMLFormElement;
  const form = getForm();
  if (!form) return;

  form.querySelectorAll('input.input-range, input[type="range"]').forEach((el) => {
    el.addEventListener('input', () => {
      const id = (el as HTMLInputElement).id.replace('sa-', '');
      const span = app.querySelector(`.sa-val[data-sa="${id}"]`);
      if (span) span.textContent = `Value: ${(el as HTMLInputElement).value}`;
    });
  });

  app.querySelectorAll<HTMLButtonElement>('.rem-art').forEach((b) => {
    b.addEventListener('click', () => {
      const aid = b.getAttribute('data-art')!;
      pr = snapshotFromForm(getForm(), m, pr);
      pr.artifacts = pr.artifacts.filter((x) => x.id !== aid);
      pr.updated = new Date().toISOString();
      upsertProof(pr);
      paintProofEditor(m, app, getProof(pr.id)!, false, onGlobalRefresh);
    });
  });

  document.getElementById('add-art')?.addEventListener('click', () => {
    const kind = (document.getElementById('a-kind') as HTMLSelectElement)
      .value as ProofArtifact['kind'];
    const label = (document.getElementById('a-label') as HTMLInputElement).value.trim();
    const url = (document.getElementById('a-url') as HTMLInputElement).value.trim();
    const sha = (document.getElementById('a-sha') as HTMLInputElement).value.trim();
    const notes = (document.getElementById('a-notes') as HTMLTextAreaElement).value.trim();
    if (!label || !url) {
      announceStatus('Label and URL required for artifact');
      return;
    }
    try {
      const u = new URL(url);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('not http(s)');
    } catch {
      const err = document.getElementById('proof-err');
      if (err) {
        err.hidden = false;
        err.textContent = 'URL must be absolute (https:// or http://).';
      }
      return;
    }
    if (sha && !/^[a-f0-9]{7,40}$/i.test(sha)) {
      const err = document.getElementById('proof-err');
      if (err) {
        err.hidden = false;
        err.textContent = 'Commit SHA must be 7–40 hex characters.';
      }
      return;
    }
    const err = document.getElementById('proof-err');
    if (err) err.hidden = true;
    pr = snapshotFromForm(getForm(), m, pr);
    pr.artifacts = [
      ...pr.artifacts,
      makeArtifact(
        kind,
        label,
        url,
        notes || undefined,
        sha && sha.length >= 7 ? sha : undefined
      )
    ];
    pr.updated = new Date().toISOString();
    upsertProof(pr);
    (document.getElementById('a-label') as HTMLInputElement).value = '';
    (document.getElementById('a-url') as HTMLInputElement).value = '';
    (document.getElementById('a-sha') as HTMLInputElement).value = '';
    (document.getElementById('a-notes') as HTMLTextAreaElement).value = '';
    paintProofEditor(m, app, getProof(pr.id)!, false, onGlobalRefresh);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    pr = snapshotFromForm(form, m, pr);
    const fd = new FormData(form);
    pr.candidateNotes = String(fd.get('cnotes') ?? pr.candidateNotes).slice(0, 8000);
    m.workSamples.samples[pr.wcdId]?.rubric.forEach((row) => {
      const raw = String(fd.get(`sa-${row.id}`) ?? '3');
      const v = parseInt(raw, 10);
      pr.selfAssessment[row.id] = Math.min(5, Math.max(1, Number.isFinite(v) ? v : 3));
    });
    pr.updated = new Date().toISOString();
    const finalCheck = parseProofJson(pr);
    if (!finalCheck.ok) {
      const el = document.getElementById('proof-err');
      if (el) {
        el.hidden = false;
        el.textContent = finalCheck.errors.join('. ');
      }
      return;
    }
    upsertProof(finalCheck.value);
    announceStatus('Proof saved');
    paintProofEditor(m, app, getProof(proof.id)!, false, onGlobalRefresh);
  });

  document.getElementById('btn-export')?.addEventListener('click', () => {
    pr = snapshotFromForm(getForm(), m, pr);
    if (!pr.consent.dataProcessing || !pr.consent.shareWithReviewers) {
      const el = document.getElementById('proof-err');
      if (el) {
        el.hidden = false;
        el.textContent = 'Check both consent boxes to export.';
      }
      announceStatus('Export blocked: consent');
      return;
    }
    const finalCheck = parseProofJson(pr);
    if (!finalCheck.ok) {
      const el = document.getElementById('proof-err');
      if (el) {
        el.hidden = false;
        el.textContent = finalCheck.errors.join('. ');
      }
      return;
    }
    if (pr.artifacts.length === 0 && !confirm('No artifacts. Export anyway?')) return;
    const err = document.getElementById('proof-err');
    if (err) err.hidden = true;
    downloadJsonFile(`p31-proof-${pr.id}.json`, finalCheck.value);
    announceStatus('Exported');
  });

  document.getElementById('btn-delete')?.addEventListener('click', () => {
    if (confirm('Delete this proof?')) {
      deleteProof(proof.id);
      setHashPath(['portfolio']);
      onGlobalRefresh();
    }
  });

  document.getElementById('replace-from-file')?.addEventListener('change', async (e) => {
    const t = (e.target as HTMLInputElement).files?.[0];
    (e.target as HTMLInputElement).value = '';
    if (!t) return;
    try {
      const json = await readJsonFile(t);
      const v = parseProofJson(json);
      if (!v.ok) {
        const el = document.getElementById('proof-err');
        if (el) {
          el.hidden = false;
          el.textContent = v.errors.join('. ');
        }
        return;
      }
      const incoming = { ...v.value, id: pr.id, updated: new Date().toISOString() };
      upsertProof(incoming);
      announceStatus('Replaced from file');
      onGlobalRefresh();
    } catch (ex) {
      const el = document.getElementById('proof-err');
      if (el) {
        el.hidden = false;
        el.textContent = 'Invalid file. ' + (ex instanceof Error ? ex.message : '');
      }
    }
  });
}

export function paintProofEditor(
  m: AppModel,
  app: HTMLElement,
  proof: ProofRecord,
  isNew: boolean,
  onGlobalRefresh: () => void
): void {
  const inner = buildProofFormHtml(m, getProof(proof.id) ?? proof, isNew);
  app.innerHTML = renderShell(activeFromRoute('proof-edit'), inner);
  wireProofForm(m, app, getProof(proof.id) ?? proof, onGlobalRefresh);
  focusMainTarget();
  announceStatus(isNew ? 'New proof' : 'Editing proof');
}

export function openNewProof(m: AppModel, app: HTMLElement, roleId: string, onRefresh: () => void): void {
  const role = m.rolePackets.roles.find((r) => r.id === roleId);
  if (!role) {
    app.innerHTML = renderShell('portfolio', `<p>Role not found.</p><a href="#/roles">Roles</a>`);
    return;
  }
  const base = newProofTemplate(roleId, role.workSample.wcdId);
  upsertProof(base);
  paintProofEditor(m, app, getProof(base.id)!, true, onRefresh);
}

export function openEditProof(
  m: AppModel,
  app: HTMLElement,
  proofId: string,
  onRefresh: () => void
): void {
  const p = getProof(proofId);
  if (!p) {
    app.innerHTML = renderShell(
      'portfolio',
      `<p>Not found. <a href="#/portfolio">Back to proofs</a></p>`
    );
    return;
  }
  paintProofEditor(m, app, p, false, onRefresh);
}
