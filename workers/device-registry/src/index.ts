import { DurableObject } from 'cloudflare:workers';
import { mergeCRDT, seedFromDelta, type SyncDelta, type DeviceState } from './schema';

interface DeviceRecord {
  deviceId: string;
  familyId: string;
  type: 'esp32' | 'phone' | 'tablet' | 'desktop' | 'chromebook' | 'other';
  name: string;
  status: 'online' | 'offline' | 'sleeping';
  lastSeen: number;
  lastHeartbeat: number;
  registered: number;
  ip: string;
  os: string;
  capabilities: string[];
  sensorTypes: string[];
  firmwareVersion: string;
  meshIp?: string;
  batteryLevel?: number;
}

export class DeviceRegistryDO extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') return this.cors();

    try {
      if (path === '/register' && method === 'POST') return this.register(await request.json());
      if (path === '/heartbeat' && method === 'POST') return this.heartbeat(await request.json());
      if (path === '/status' && method === 'POST') return this.updateStatus(await request.json());
      if (path === '/get' && method === 'GET') return this.get(url.searchParams.get('deviceId') || '');
      if (path === '/list' && method === 'GET') return this.list(url.searchParams.get('familyId') || '');
      if (path === '/online' && method === 'GET') return this.getOnline(url.searchParams.get('familyId') || '');
      if (path === '/sync' && method === 'POST') return this.sync(await request.json());
      if (path === '/health') return this.health();
      return Response.json({ error: 'Not found' }, { status: 404 });
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  async register(body: Partial<DeviceRecord>) {
    const { deviceId, familyId, type, name } = body;
    if (!deviceId || !familyId || !type) return Response.json({ error: 'deviceId, familyId, type required' }, { status: 400 });

    const existing = await this.getDevice(deviceId);
    const record: DeviceRecord = {
      deviceId,
      familyId,
      type: type as DeviceRecord['type'],
      name: name || `${type}_${deviceId.slice(0, 8)}`,
      status: 'online',
      lastSeen: Date.now(),
      lastHeartbeat: Date.now(),
      registered: existing?.registered || Date.now(),
      ip: body.ip || 'unknown',
      os: body.os || 'unknown',
      capabilities: body.capabilities || [],
      sensorTypes: body.sensorTypes || [],
      firmwareVersion: body.firmwareVersion || '0.0.0',
      meshIp: body.meshIp,
      batteryLevel: body.batteryLevel,
    };

    await this.putDevice(deviceId, record);
    return Response.json({ ok: true, deviceId, ...record });
  }

  async heartbeat(body: { deviceId: string; batteryLevel?: number; uptime?: number }) {
    if (!body.deviceId) return Response.json({ error: 'deviceId required' }, { status: 400 });

    const device = await this.getDevice(body.deviceId);
    if (!device) return Response.json({ error: 'Device not found. Register first.' }, { status: 404 });

    device.status = 'online';
    device.lastHeartbeat = Date.now();
    device.lastSeen = Date.now();
    if (body.batteryLevel !== undefined) device.batteryLevel = body.batteryLevel;

    await this.putDevice(body.deviceId, device);
    return Response.json({ ok: true, lastSeen: device.lastSeen });
  }

  async updateStatus(body: { deviceId: string; status: string; batteryLevel?: number }) {
    if (!body.deviceId) return Response.json({ error: 'deviceId required' }, { status: 400 });

    const device = await this.getDevice(body.deviceId);
    if (!device) return Response.json({ error: 'Device not found' }, { status: 404 });

    device.status = body.status as DeviceRecord['status'];
    device.lastSeen = Date.now();
    if (body.batteryLevel !== undefined) device.batteryLevel = body.batteryLevel;

    await this.putDevice(body.deviceId, device);
    return Response.json({ ok: true });
  }

  async get(deviceId: string) {
    const device = await this.getDevice(deviceId);
    if (!device) return Response.json({ error: 'Device not found' }, { status: 404 });
    return Response.json(device);
  }

  async list(familyId: string) {
    if (!familyId) return Response.json({ error: 'familyId required' }, { status: 400 });
    const all = await this.getAllDevices();
    const familyDevices = Object.values(all).filter(d => d.familyId === familyId);
    return Response.json({ devices: familyDevices, total: familyDevices.length });
  }

  async getOnline(familyId?: string) {
    const all = await this.getAllDevices();
    let devices = Object.values(all).filter(d => d.status === 'online' && Date.now() - d.lastHeartbeat < 60000);
    if (familyId) devices = devices.filter(d => d.familyId === familyId);
    return Response.json({ devices, online: devices.length });
  }

  health() {
    return Response.json({ ok: true, service: 'device-registry', version: '1.0.0' });
  }

  /** CRDT first-sync / delta-sync for a device (CWP-2026-071, Track F). */
  async sync(body: SyncDelta) {
    if (!body?.deviceId || !body?.actor || body?.lamport == null || !body?.paths) {
      return Response.json({ error: 'deviceId, actor, lamport, paths required' }, { status: 400 });
    }
    // Stale-offline guard: an ESP32 reconnecting after days may carry a low
    // Lamport clock. Reject and force a full RESYNC instead of merging stale
    // fields that would otherwise overwrite recent server state.
    const STALE_MS = 24 * 60 * 60 * 1000;
    if (body.timestamp != null && Date.now() - body.timestamp > STALE_MS) {
      return Response.json({ ok: false, action: 'RESYNC', reason: 'stale-delta' }, { status: 409 });
    }
    const prev = await this.getState(body.deviceId);
    const state = prev ? mergeCRDT(prev, body) : seedFromDelta(body);
    await this.putState(body.deviceId, state);
    // Materialize device heartbeat so the registry stays consistent.
    const online = state.fields['status']?.v;
    if (typeof online === 'string') {
      const device = await this.getDevice(body.deviceId);
      if (device) {
        device.status = online as DeviceRecord['status'];
        device.lastSeen = Date.now();
        device.lastHeartbeat = Date.now();
        await this.putDevice(body.deviceId, device);
      }
    }
    return Response.json({ ok: true, lamport: state.lamport, version: state.version });
  }

  private async getState(deviceId: string): Promise<DeviceState | null> {
    return this.ctx.storage.get<DeviceState>(`state:${deviceId}`) || null;
  }

  private async putState(deviceId: string, state: DeviceState): Promise<void> {
    await this.ctx.storage.put(`state:${deviceId}`, state);
  }

  // Storage helpers
  private async getDevice(id: string): Promise<DeviceRecord | null> {
    const all = await this.ctx.storage.get<Record<string, DeviceRecord>>('devices');
    return all?.[id] || null;
  }

  private async putDevice(id: string, data: DeviceRecord): Promise<void> {
    const all = (await this.ctx.storage.get<Record<string, DeviceRecord>>('devices')) || {};
    all[id] = data;
    await this.ctx.storage.put('devices', all);
  }

  private async getAllDevices(): Promise<Record<string, DeviceRecord>> {
    return (await this.ctx.storage.get<Record<string, DeviceRecord>>('devices')) || {};
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
    const doId = env.DEVICE_REGISTRY.idFromName('global');
    const stub = env.DEVICE_REGISTRY.get(doId);
    return stub.fetch(request);
  },
};
