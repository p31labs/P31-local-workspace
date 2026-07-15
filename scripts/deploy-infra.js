#!/usr/bin/env node
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'ee05f70c889cb6f876b9925257e3a2fa';
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || '3ba5eda28c73c52dc6f0c33a2a607aae';
const DRY = !process.argv.includes('--apply');
const VERIFY = process.argv.includes('--verify');
const BASE = 'https://api.cloudflare.com/client/v4';
const PAGES_PROJECT = 'phos';

if (!TOKEN && !VERIFY) {
  console.error('Missing CLOUDFLARE_API_TOKEN (set it or use --verify)');
  process.exit(1);
}
const H = TOKEN ? { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

let created = 0, updated = 0, deleted = 0, skipped = 0, ok = 0;
const plan = (m) => console.log(DRY ? `[dry-run] ${m}` : `[apply] ${m}`);
const skip = (m) => { skipped++; console.log(`[SKIP] ${m}`); };
const fine = (m) => { ok++; console.log(`[ok] ${m}`); };

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function getList(path) {
  const { status, json } = await api('GET', path);
  if (!json.success) { console.error(`GET ${path} -> ${status} ${JSON.stringify(json.errors)}`); return []; }
  return json.result || [];
}

async function ensureDnsRecord({ name, type, content, proxied = true }) {
  const recs = await getList(`/zones/${ZONE_ID}/dns_records?per_page=100&name=${encodeURIComponent(name)}`);
  const sameType = recs.find((r) => r.name === name && r.type === type);
  if (sameType && sameType.content === content && sameType.proxied === proxied) {
    fine(`DNS ${name} (${type} -> ${content})`);
    return;
  }
  if (sameType) {
    if (DRY) { plan(`UPDATE DNS ${name}: ${sameType.content} -> ${content}`); return; }
    const { status } = await api('PUT', `/zones/${ZONE_ID}/dns_records/${sameType.id}`, { type, name, content, proxied, ttl: 1 });
    if (status < 300) { updated++; console.log(`[updated] DNS ${name} -> ${content}`); }
    else skip(`DNS ${name} update failed (HTTP ${status})`);
    return;
  }
  const other = recs.find((r) => r.name === name && r.type !== type);
  if (other) {
    if (DRY) { plan(`DELETE DNS ${name} (${other.type} ${other.content}) before creating ${type}`); }
    else {
      const { status } = await api('DELETE', `/zones/${ZONE_ID}/dns_records/${other.id}`);
      if (status < 300) { deleted++; console.log(`[deleted] DNS ${name} (${other.type})`); }
      else { skip(`DNS ${name} delete failed (HTTP ${status})`); return; }
    }
  }
  if (DRY) { plan(`CREATE DNS ${name} (${type} -> ${content})`); return; }
  const { status } = await api('POST', `/zones/${ZONE_ID}/dns_records`, { type, name, content, proxied, ttl: 1 });
  if (status < 300) { created++; console.log(`[created] DNS ${name} -> ${content}`); }
  else skip(`DNS ${name} create failed (HTTP ${status})`);
}

async function ensureRoute({ pattern, script }) {
  const routes = await getList(`/zones/${ZONE_ID}/workers/routes?per_page=100`);
  const existing = routes.find((r) => r.pattern === pattern && r.script === script);
  if (existing) { fine(`route ${pattern} -> ${script}`); return; }
  if (DRY) { plan(`CREATE route ${pattern} -> ${script}`); return; }
  const { status } = await api('POST', `/zones/${ZONE_ID}/workers/routes`, { pattern, script, request_limit_fail_open: false });
  if (status < 300) { created++; console.log(`[created] route ${pattern} -> ${script}`); }
  else skip(`route ${pattern} create failed (HTTP ${status})`);
}

async function deleteRouteIf(predicate, reason) {
  const routes = await getList(`/zones/${ZONE_ID}/workers/routes?per_page=100`);
  for (const r of routes.filter(predicate)) {
    if (DRY) { plan(`DELETE route ${r.pattern} -> ${r.script} (${reason})`); continue; }
    const { status } = await api('DELETE', `/zones/${ZONE_ID}/workers/routes/${r.id}`);
    if (status < 300) { deleted++; console.log(`[deleted] route ${r.pattern} -> ${r.script}`); }
    else skip(`route ${r.pattern} delete failed (HTTP ${status})`);
  }
}

async function ensurePagesDomain(name) {
  const domains = await getList(`/accounts/${ACCOUNT_ID}/pages/projects/${PAGES_PROJECT}/domains`);
  const existing = domains.find((d) => d.name === name);
  if (existing && existing.status === 'active') { fine(`pages domain ${name} active`); return; }
  if (existing && existing.status !== 'active') {
    if (DRY) { plan(`POLL pages domain ${name} (status ${existing.status})`); return; }
    for (let i = 0; i < 10; i++) {
      const cur = (await getList(`/accounts/${ACCOUNT_ID}/pages/projects/${PAGES_PROJECT}/domains`)).find((d) => d.name === name);
      if (cur && cur.status === 'active') { ok++; console.log(`[ok] pages domain ${name} active`); return; }
      await new Promise((r) => setTimeout(r, 3000));
    }
    skip(`pages domain ${name} not active after polling`);
    return;
  }
  if (DRY) { plan(`ADD pages domain ${name}`); return; }
  const { status } = await api('POST', `/accounts/${ACCOUNT_ID}/pages/projects/${PAGES_PROJECT}/domains`, { name });
  if (status < 300) { created++; console.log(`[created] pages domain ${name}`); }
  else skip(`pages domain ${name} add failed (HTTP ${status})`);
}

async function ensurePQC() {
  const { status, json } = await api('GET', `/zones/${ZONE_ID}/settings/post_quantum_encryption`);
  if (status === 403 || status === 7003) { skip('PQC TLS: Zone SSL/TLS:Edit perm missing -> enable manually (SSL/TLS -> Edge Certificates -> Post-Quantum)'); return; }
  if (!json.success) { skip(`PQC TLS: GET failed (HTTP ${status})`); return; }
  if (json.result?.value === 'on') { fine('PQC TLS already on'); return; }
  if (DRY) { plan('PATCH PQC TLS -> on'); return; }
  const r = await api('PATCH', `/zones/${ZONE_ID}/settings/post_quantum_encryption`, { value: 'on' });
  if (r.status < 300) { updated++; console.log('[updated] PQC TLS -> on'); }
  else skip(`PQC TLS PATCH failed (HTTP ${r.status})`);
}

const DESIRED_ALERTS = [
  { name: 'Worker Errors >5/min', alert_type: 'workers', filter: { worker_tag: ['all'] } },
  { name: 'D1 Latency >1000ms', alert_type: 'd1', filter: {} },
  { name: 'R2 503 Errors', alert_type: 'r2', filter: {} },
  { name: 'CPU >90%', alert_type: 'cpu', filter: {} },
];

async function ensureAlerts() {
  const existing = await getList(`/accounts/${ACCOUNT_ID}/alerting/v3/policies?per_page=100`);
  for (const a of DESIRED_ALERTS) {
    if (existing.find((e) => e.name === a.name)) { fine(`alert "${a.name}" exists`); continue; }
    if (DRY) { plan(`CREATE alert "${a.name}" (type ${a.alert_type})`); continue; }
    const body = {
      name: a.name, description: a.name, enabled: true, alert_type: a.alert_type,
      filters: a.filter,
      notifications: { enabled: false, alertmatic_connected: false, integrations: [] },
    };
    const { status, json } = await api('POST', `/accounts/${ACCOUNT_ID}/alerting/v3/policies`, body);
    const code = json.errors?.[0]?.code;
    if (status < 300) { created++; console.log(`[created] alert "${a.name}"`); }
    else if (code === 17004) { skip(`alert "${a.name}": type "${a.alert_type}" not entitled on this account via API -> configure manually on dashboard`); }
    else skip(`alert "${a.name}" create failed (HTTP ${status} ${code})`);
  }
}

async function verify() {
  const urls = ['phos.p31ca.org/portal/', 'www.phos.p31ca.org', 'pilot.p31ca.org', 'federation.p31ca.org'];
  console.log('\n=== VERIFY (live HTTP) ===');
  for (const u of urls) {
    try {
      const res = await fetch(`https://${u}`, { redirect: 'manual' });
      console.log(`  https://${u} -> ${res.status}`);
    } catch (e) { console.log(`  https://${u} -> ERR ${e.message}`); }
  }
}

async function main() {
  console.log(`CWP-2026-050 Phase 1 — deploy-infra (${DRY ? 'DRY-RUN' : 'APPLY'})`);
  console.log(`account=${ACCOUNT_ID} zone=${ZONE_ID}`);
  await ensureDnsRecord({ name: 'phos.p31ca.org', type: 'CNAME', content: 'phos-btn.pages.dev' });
  await ensureDnsRecord({ name: 'federation.p31ca.org', type: 'CNAME', content: 'federation-bridge.trimtab-signal.workers.dev' });
  await ensureDnsRecord({ name: 'pilot.p31ca.org', type: 'CNAME', content: 'pilot-dashboard.trimtab-signal.workers.dev' });
  await ensureRoute({ pattern: 'pilot.p31ca.org/*', script: 'pilot-dashboard' });
  await ensureRoute({ pattern: 'federation.p31ca.org/*', script: 'federation-bridge' });
  await deleteRouteIf((r) => r.pattern.startsWith('phos.p31ca.org/'), 'shadow route (Pages owns phos)');
  await ensurePagesDomain('phos.p31ca.org');
  await ensurePagesDomain('www.phos.p31ca.org');
  await ensurePQC();
  await ensureAlerts();
  console.log(`\nsummary: created=${created} updated=${updated} deleted=${deleted} skipped=${skipped} ok=${ok}`);
  if (VERIFY || !DRY) await verify();
}

main().catch((e) => { console.error(e); process.exit(1); });
