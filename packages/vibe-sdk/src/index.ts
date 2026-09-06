/**
 * @p31/vibe-sdk — P31 Vibe Coding SDK
 * Programmatic access to the P31 Vibe Coding Engine.
 *
 * Usage:
 *   import { P31Client } from '@p31/vibe-sdk';
 *   const p31 = new P31Client({ baseUrl: 'https://phos.p31ca.org' });
 *   const result = await p31.generate({ prompt: 'Build a game', vibeTags: ['playful'], ageGroup: 'child' });
 *   const deployed = await p31.deploy({ name: 'My Game', ...result });
 */

export type SizeClass = 'compact' | 'regular' | 'medium' | 'expanded';

const COLUMNS_BY_CLASS: Record<SizeClass, number> = { compact: 1, regular: 1, medium: 2, expanded: 3 };

/**
 * Stamp a generated HTML document with the P31 size-class token layer so the
 * design-core CSS reflows responsively (CWP-2026-071). Injects
 * `data-size-class` + inline `--p31-columns` onto the first root element
 * (prefers <html>, falls back to <body> or wraps in a <div>).
 */
export function stampSizeClass(html: string, sizeClass: SizeClass): string {
  const attr = ` data-size-class="${sizeClass}" style="--p31-columns:${COLUMNS_BY_CLASS[sizeClass]}"`;
  const rootRe = /<html([^>]*)>/i;
  if (rootRe.test(html)) {
    return html.replace(rootRe, (_m, attrs) => `<html${attrs}${attr}>`);
  }
  const bodyRe = /<body([^>]*)>/i;
  if (bodyRe.test(html)) {
    return html.replace(bodyRe, (_m, attrs) => `<body${attrs}${attr}>`);
  }
  return html.replace(/(<body>|<body\/>)/i, `<body${attr}>`);
}


export interface VibeGenerateParams {
  prompt: string;
  vibeTags?: string[];
  ageGroup?: 'child' | 'youth' | 'adult';
  did?: string;
}

export interface VibeGenerateResult {
  html: string;
  css: string;
  js: string;
  auditScore: number;
  iterations: number;
  loveCost: number;
}

export interface VibeDeployParams {
  name: string;
  html: string;
  css: string;
  js: string;
  creator?: string;
  familyId?: string;
}

export interface VibeDeployResult {
  ok: boolean;
  id: string;
  family_id: string;
  url: string;
}

export interface VibeListResult {
  id: string;
  name: string;
  creator: string;
  family_id: string;
  created_at: string;
  deploy_count: number;
}

export interface DeployToRobloxParams {
  code: string;
  worldName?: string;
}

export interface DeployToRobloxResult {
  ok: boolean;
  generated_luau: string;
  world_name: string;
  roblox_url?: string;
  note?: string;
}

export interface P31ClientConfig {
  baseUrl?: string;
  apiKey?: string;
  familyId?: string;
  robloxBridgeUrl?: string;
}

export class P31Client {
  private baseUrl: string;
  private apiKey?: string;
  private familyId: string;
  private robloxBridgeUrl: string;

  constructor(config: P31ClientConfig = {}) {
    this.baseUrl = (config.baseUrl || 'https://phos.p31ca.org').replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.familyId = config.familyId || 'p31:default';
    this.robloxBridgeUrl = config.robloxBridgeUrl || 'https://roblox-bridge.trimtab-signal.workers.dev';
  }

  private async fetch(path: string, options: RequestInit = {}): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Family-DID': this.familyId,
      ...(options.headers as Record<string, string> || {}),
    };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    const res = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
    if (!res.ok) throw new Error(`P31 API error: ${res.status}`);
    return res.json();
  }

  /** Generate code from a natural language prompt */
  async generate(params: VibeGenerateParams): Promise<VibeGenerateResult> {
    const res = await this.fetch('https://vibe-generate.trimtab-signal.workers.dev/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt: params.prompt,
        formFactor: params.vibeTags?.[0],
        spoons: params.ageGroup === 'child' ? 2 : params.ageGroup === 'youth' ? 3 : 4,
      }),
    });
    return {
      html: res.html || '',
      css: res.css || '',
      js: res.js || '',
      auditScore: res.qualityScore ?? 0,
      iterations: 1,
      loveCost: 0,
    };
  }

  /** Deploy generated code to the P31 mesh */
  async deploy(params: VibeDeployParams): Promise<VibeDeployResult> {
    return this.fetch('https://app-supervisor.trimtab-signal.workers.dev/apps/create', {
      method: 'POST',
      body: JSON.stringify({
        name: params.name,
        html: params.html,
        css: params.css || '',
        js: params.js || '',
        creator: params.creator || this.familyId,
      }),
      headers: { 'X-Family-DID': params.familyId || this.familyId },
    });
  }

  /** List deployed apps */
  async list(): Promise<VibeListResult[]> {
    return this.fetch('https://app-supervisor.trimtab-signal.workers.dev/apps', {
      headers: { 'X-Family-DID': this.familyId },
    });
  }

  /** Delete a deployed app */
  async delete(appId: string): Promise<{ ok: boolean }> {
    return this.fetch(`https://app-supervisor.trimtab-signal.workers.dev/apps/${appId}`, {
      method: 'DELETE',
      headers: { 'X-Family-DID': this.familyId },
    });
  }

  /** Run MARGE audit on code */
  async audit(html: string, css: string, js: string, ageGroup = 'adult') {
    return this.fetch('/api/vibe/audit', {
      method: 'POST',
      body: JSON.stringify({ html, css, js, ageGroup }),
    });
  }

  /** Get health status */
  async health() {
    return this.fetch('https://app-supervisor.trimtab-signal.workers.dev/health');
  }

  /**
   * Deploy to a temporary Cloudflare Dynamic Worker (60-minute TTL).
   * Falls back to app-supervisor if the Dynamic Workers API is unavailable.
   */
  async deployTemporary(params: VibeDeployParams): Promise<{ ok: boolean; url: string; expiresIn: number; temporary: boolean }> {
    const tempUrl = 'https://api.cloudflare.com/client/v4/accounts/p31-workers/workers/dynamic';
    try {
      const res = await fetch(tempUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Key': this.apiKey || '' },
        body: JSON.stringify({
          name: params.name,
          code: params.html,
          compatibility_date: '2026-07-18',
          ttl: 3600,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return { ok: true, url: data.result?.url || `https://${params.name}.tmp.workers.dev`, expiresIn: 3600, temporary: true };
      }
    } catch { /* fall through to permanent deploy */ }

    const deployed = await this.deploy(params);
    return { ok: deployed.ok, url: deployed.url, expiresIn: 0, temporary: false };
  }

  /** Deploy generated Luau code to a Roblox world via the roblox-bridge Worker */
  async deployToRoblox(params: DeployToRobloxParams): Promise<DeployToRobloxResult> {
    const res = await fetch(`${this.robloxBridgeUrl}/deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Family-DID': this.familyId },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Roblox deploy error: ${res.status}`);
    return res.json();
  }

  /** List available Roblox bridge tools */
  async robloxTools() {
    const res = await fetch(`${this.robloxBridgeUrl}/tools/list`);
    if (!res.ok) throw new Error(`Roblox tools error: ${res.status}`);
    return res.json();
  }

  /** Create a new Roblox world via the bridge */
  async createWorld(name: string, description?: string, creatorDid?: string): Promise<any> {
    const res = await fetch(`${this.robloxBridgeUrl}/worlds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Family-DID': this.familyId },
      body: JSON.stringify({ name, description, creator_did: creatorDid || this.familyId }),
    });
    if (!res.ok) throw new Error(`World create error: ${res.status}`);
    return res.json();
  }

  /** List available Roblox worlds */
  async listWorlds(): Promise<any[]> {
    const res = await fetch(`${this.robloxBridgeUrl}/worlds`);
    if (!res.ok) throw new Error(`World list error: ${res.status}`);
    return res.json();
  }

  /** Call a Roblox bridge tool directly */
  async robloxCall(tool: string, params: Record<string, unknown> = {}) {
    const res = await fetch(`${this.robloxBridgeUrl}/tools/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Family-DID': this.familyId },
      body: JSON.stringify({ tool, params }),
    });
    if (!res.ok) throw new Error(`Roblox call error: ${res.status}`);
    return res.json();
  }
}

export default P31Client;
