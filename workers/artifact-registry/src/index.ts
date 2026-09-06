import { DurableObject } from 'cloudflare:workers';

interface ArtifactRecord {
  serial: string;
  did: string;
  achievementId: string;
  tier: string;
  timestamp: number;
  status: 'minted' | 'sliced' | 'printed' | 'shipped' | 'delivered';
  redeemCount: number;
  maxRedeems: number;
  verificationUrl: string;
  gcodeSha256?: string;
  printJobId?: string;
}

export class ArtifactRegistryDO extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') return this.cors();

    try {
      // Register a new artifact mint
      if (path === '/mint' && method === 'POST') return this.handleMint(await request.json());
      // Verify artifact authenticity
      if (path === '/verify' && method === 'POST') return this.handleVerify(await request.json());
      // Get artifact by serial
      if (path === '/get' && method === 'GET') return this.handleGet(url.searchParams.get('serial') || '');
      // List user's artifacts
      if (path === '/list' && method === 'GET') return this.handleList(url.searchParams.get('did') || '');
      // Record print status
      if (path === '/status' && method === 'POST') return this.handleStatus(await request.json());
      // Health
      if (path === '/health') return this.health();

      return Response.json({ error: 'Not found' }, { status: 404 });
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  async handleMint(body: { serial: string; did: string; achievementId: string; tier: string; maxRedeems: number }) {
    const { serial, did, achievementId, tier, maxRedeems } = body;
    if (!serial || !did || !achievementId) return Response.json({ error: 'serial, did, and achievementId required' }, { status: 400 });

    const existing = await this.getArtifact(serial);
    if (existing) return Response.json({ error: 'Serial already minted' }, { status: 409 });

    // Check redeem limits
    const userArtifacts = await this.getUserArtifacts(did);
    const sameAchievement = Object.values(userArtifacts).filter(a => a.achievementId === achievementId);
    if (sameAchievement.length >= maxRedeems) return Response.json({ error: `Max redeems (${maxRedeems}) reached for this achievement` }, { status: 429 });

    const record: ArtifactRecord = {
      serial, did, achievementId, tier, timestamp: Date.now(),
      status: 'minted', redeemCount: sameAchievement.length + 1, maxRedeems,
      verificationUrl: `https://phos.p31ca.org/verify/${serial}`,
    };

    await this.putArtifact(serial, record);
    return Response.json({ ok: true, serial, ...record });
  }

  async handleVerify(body: { serial: string }) {
    const record = await this.getArtifact(body.serial);
    if (!record) return Response.json({ valid: false, error: 'Serial not found' }, { status: 404 });
    return Response.json({
      valid: true,
      serial: record.serial,
      tier: record.tier,
      achievementId: record.achievementId,
      status: record.status,
      verifiedAt: new Date().toISOString(),
    });
  }

  async handleGet(serial: string) {
    const record = await this.getArtifact(serial);
    if (!record) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(record);
  }

  async handleList(did: string) {
    if (!did) return Response.json({ error: 'did parameter required' }, { status: 400 });
    const artifacts = await this.getUserArtifacts(did);
    return Response.json(Object.values(artifacts));
  }

  async handleStatus(body: { serial: string; status: ArtifactRecord['status']; gcodeSha256?: string; printJobId?: string }) {
    const record = await this.getArtifact(body.serial);
    if (!record) return Response.json({ error: 'Serial not found' }, { status: 404 });

    record.status = body.status;
    if (body.gcodeSha256) record.gcodeSha256 = body.gcodeSha256;
    if (body.printJobId) record.printJobId = body.printJobId;

    await this.putArtifact(body.serial, record);
    return Response.json({ ok: true, serial: body.serial, status: body.status });
  }

  health() {
    return Response.json({ ok: true, service: 'artifact-registry', version: '1.0.0' });
  }

  // ─── KV Storage helpers ──────────────────────────────────────────

  private async getArtifact(serial: string): Promise<ArtifactRecord | null> {
    const artifacts = await this.ctx.storage.get<Record<string, ArtifactRecord>>('artifacts');
    return artifacts?.[serial] || null;
  }

  private async putArtifact(serial: string, record: ArtifactRecord): Promise<void> {
    const artifacts = (await this.ctx.storage.get<Record<string, ArtifactRecord>>('artifacts')) || {};
    artifacts[serial] = record;
    await this.ctx.storage.put('artifacts', artifacts);
  }

  private async getUserArtifacts(did: string): Promise<Record<string, ArtifactRecord>> {
    const all = (await this.ctx.storage.get<Record<string, ArtifactRecord>>('artifacts')) || {};
    const filtered: Record<string, ArtifactRecord> = {};
    for (const [key, value] of Object.entries(all)) {
      if (value.did === did) filtered[key] = value;
    }
    return filtered;
  }

  private cors() {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const doId = env.ARTIFACT_REGISTRY.idFromName('global');
    const stub = env.ARTIFACT_REGISTRY.get(doId);
    return stub.fetch(request);
  },
};
