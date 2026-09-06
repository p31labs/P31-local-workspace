import { DurableObject } from 'cloudflare:workers';

interface SessionData {
  userId: string;
  playerName: string;
  joined: number;
  actions: number;
  loveEarned: number;
  chatMessages: number;
  structuresBuilt: number;
  lastMilestone: string;
  milestonesHit: number;
  status: 'active' | 'completed';
  rateBucket: number;
  rateLastReset: number;
}

interface PlayerData {
  playerName: string;
  totalLove: number;
  totalActions: number;
  totalSessions: number;
  totalChatMessages: number;
  sessionStreak: number;
  lastSessionDate: string;
  lastSeen: number;
}

type PendingLoveRecord = Record<string, Array<{ reason: string; amount: number; timestamp: string }>>;

export class GameSessionDO extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') return this.cors();

    try {
      switch (path) {
        case '/session/create': return method === 'POST' ? this.createSession(await request.json()) : this.err(405);
        case '/session/action': return method === 'POST' ? this.recordAction(await request.json()) : this.err(405);
        case '/session/end':    return method === 'POST' ? this.endSession(await request.json()) : this.err(405);
        case '/session/state':  return method === 'GET'  ? this.getSession(url.searchParams.get('id') || '') : this.err(405);
        case '/stats':          return method === 'GET'  ? this.getStats() : this.err(405);
        case '/do/health':      return this.health();
        case '/game/queue-love': return method === 'POST' ? this.queueLove(await request.json()) : this.err(405);
        case '/game/pending-love': return this.pendingLove(request);
        case '/game/mint-status': return this.mintStatus(request);
        default: return this.err(404);
      }
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  async createSession(body: { userId: string; playerName: string; sessionId: string }) {
    const { userId, playerName, sessionId } = body;
    if (!userId || !sessionId) return Response.json({ error: 'userId and sessionId required' }, { status: 400 });

    const now = Date.now();
    const today = new Date().toISOString().slice(0, 10);

    const session = await this.getSessionKV(sessionId);
    if (session && session.status === 'active') return Response.json({ ok: true, sessionId });

    await this.putSessionKV(sessionId, {
      userId, playerName: playerName || `Player_${userId}`, joined: now,
      actions: 0, loveEarned: 0, chatMessages: 0, structuresBuilt: 0,
      lastMilestone: '', milestonesHit: 0, status: 'active',
      rateBucket: 0, rateLastReset: 0,
    });

    const player = await this.getPlayerKV(userId);
    if (!player) {
      await this.putPlayerKV(userId, {
        playerName: playerName || `Player_${userId}`,
        totalLove: 0, totalActions: 0, totalSessions: 1, totalChatMessages: 0,
        sessionStreak: 1, lastSessionDate: today, lastSeen: now,
      });
    } else {
      const streak = this.computeStreak(player.lastSessionDate, today);
      await this.putPlayerKV(userId, {
        playerName: playerName || player.playerName,
        totalLove: player.totalLove, totalActions: player.totalActions,
        totalSessions: player.totalSessions + 1, totalChatMessages: player.totalChatMessages,
        sessionStreak: streak, lastSessionDate: today, lastSeen: now,
      });
    }

    return Response.json({ ok: true, sessionId, streak: player ? player.sessionStreak + 1 : 1 });
  }

  async recordAction(body: { userId: string; sessionId: string; actionType: string; value?: any }) {
    const { userId, sessionId, actionType } = body;
    if (!userId || !sessionId || !actionType) return Response.json({ error: 'userId, sessionId, and actionType required' }, { status: 400 });

    const session = await this.getSessionKV(sessionId);
    if (!session || session.status !== 'active') return Response.json({ error: 'Session not found or inactive' }, { status: 404 });

    // Rate limit
    const rateCheck = this.checkRateLimit(session);
    if (rateCheck.exceeded) return Response.json({ error: 'Rate limit exceeded', retryAfter: rateCheck.retryAfter }, { status: 429 });

    const newActions = session.actions + 1;
    const newChats = session.chatMessages + (actionType === 'chat_message' ? 1 : 0);
    const newStructures = session.structuresBuilt + (actionType === 'structure_complete' ? 1 : 0);

    let loveAmount = 0;
    let milestoneName = '';

    const milestone = this.detectMilestone(actionType, newActions, newChats, newStructures);
    if (milestone) {
      loveAmount = milestone.love;
      milestoneName = milestone.name;
    }

    await this.putSessionKV(sessionId, {
      ...session,
      actions: newActions,
      chatMessages: newChats,
      structuresBuilt: newStructures,
      loveEarned: session.loveEarned + loveAmount,
      lastMilestone: milestoneName || session.lastMilestone,
      milestonesHit: session.milestonesHit + (milestone ? 1 : 0),
      rateBucket: session.rateBucket + 1,
      rateLastReset: rateCheck.rateLastReset,
    });

    const player = await this.getPlayerKV(userId);
    if (player) {
      await this.putPlayerKV(userId, {
        ...player,
        totalActions: player.totalActions + 1,
        totalLove: player.totalLove + loveAmount,
        totalChatMessages: player.totalChatMessages + (actionType === 'chat_message' ? 1 : 0),
        lastSeen: Date.now(),
      });
    }

    const resp: Record<string, unknown> = { ok: true, actions: newActions, chatMessages: newChats, structuresBuilt: newStructures, sessionLove: session.loveEarned + loveAmount };
    if (milestone) resp.milestone = milestoneName;
    if (loveAmount > 0) resp.loveEarned = loveAmount;

    return Response.json(resp);
  }

  async endSession(body: { userId: string; sessionId: string; loveEarned: number; minutesPlayed: number }) {
    const { userId, sessionId, minutesPlayed } = body;
    if (!userId || !sessionId) return Response.json({ error: 'userId and sessionId required' }, { status: 400 });

    const session = await this.getSessionKV(sessionId);
    if (!session) return Response.json({ error: 'Session not found' }, { status: 404 });

    await this.putSessionKV(sessionId, { ...session, status: 'completed' });

    let sessionBonus = 0;
    const min = minutesPlayed || 0;
    if (min >= 30) sessionBonus = 10;
    else if (min >= 10) sessionBonus = 5;

    const chatMsgs = session.chatMessages;
    if (chatMsgs >= 100) sessionBonus += 100;
    else if (chatMsgs >= 50) sessionBonus += 50;
    else if (chatMsgs >= 10) sessionBonus += 10;

    if (sessionBonus > 0) {
      const player = await this.getPlayerKV(userId);
      if (player) {
        await this.putPlayerKV(userId, { ...player, totalLove: player.totalLove + sessionBonus, lastSeen: Date.now() });
      }
    }

    const total = (body.loveEarned || 0) + sessionBonus;
    return Response.json({ ok: true, loveEarned: body.loveEarned || 0, sessionBonus, total, message: `Thanks for playing! +${total} LOVE earned` });
  }

  async getSession(sessionId: string) {
    const s = await this.getSessionKV(sessionId);
    if (!s) return Response.json({ error: 'Session not found' }, { status: 404 });
    return Response.json(s);
  }

  async getStats() {
    const existing = (await this.ctx.storage.get<Record<string, SessionData>>('sessions')) || {};
    const players = (await this.ctx.storage.get<Record<string, PlayerData>>('players')) || {};

    const activeSessions = Object.values(existing).filter(s => s.status === 'active').length;
    const totalLove = Object.values(players).reduce((s, p) => s + p.totalLove, 0);
    const leaderboard = Object.entries(players)
      .filter(([, p]) => p.totalLove > 0)
      .sort(([, a], [, b]) => b.totalLove - a.totalLove)
      .slice(0, 20)
      .map(([userId, p]) => ({ userId, playerName: p.playerName, totalLove: p.totalLove, totalActions: p.totalActions, totalSessions: p.totalSessions, sessionStreak: p.sessionStreak, lastSeen: p.lastSeen }));

    return Response.json({ activeSessions, totalPlayers: Object.keys(players).length, totalLove, leaderboard, timestamp: new Date().toISOString() });
  }

  health() {
    return Response.json({ ok: true, service: 'shadow-bridge-do', version: '2.0.0', storage: 'kv', durable: true });
  }

  // ─── Pending LOVE for shell sync ─────────────────────────────────────

  async queueLove(body: { userId: string; amount: number; reason: string }): Promise<Response> {
    const { userId, amount, reason } = body;
    const pending = (await this.ctx.storage.get<PendingLoveRecord>('pendingLove')) || {};
    const key = `user:${userId}`;
    pending[key] = pending[key] || [];
    pending[key].push({ reason, amount, timestamp: new Date().toISOString() });
    await this.ctx.storage.put('pendingLove', pending);
    return new Response('OK', { status: 200 });
  }

  async pendingLove(request: Request): Promise<Response> {
    const method = request.method;
    if (method === 'OPTIONS') return this.cors();
    if (method === 'POST') {
      const body = await request.json() as { userId: string };
      const pending = (await this.ctx.storage.get<PendingLoveRecord>('pendingLove')) || {};
      const key = `user:${body.userId}`;
      const events = pending[key] || [];
      if (events.length > 0) {
        delete pending[key];
        await this.ctx.storage.put('pendingLove', pending);
      }
      return Response.json({ events });
    }
    return this.err(405);
  }

  async mintStatus(request: Request): Promise<Response> {
    const method = request.method;
    if (method === 'OPTIONS') return this.cors();
    if (method === 'GET') {
      const url = new URL(request.url);
      const userId = url.searchParams.get('userId') || '';
      const sessionId = url.searchParams.get('sessionId') || '';

      const pending = (await this.ctx.storage.get<PendingLoveRecord>('pendingLove')) || {};
      const events = (pending[`user:${userId}`] || []).slice();

      const session = sessionId ? await this.getSessionKV(sessionId) : null;
      const player = userId ? await this.getPlayerKV(userId) : null;

      return Response.json({
        ok: true,
        userId,
        sessionId: sessionId || null,
        queued: events,
        pendingCount: events.length,
        session: session ? {
          actions: session.actions,
          loveEarned: session.loveEarned,
          chatMessages: session.chatMessages,
          structuresBuilt: session.structuresBuilt,
          milestonesHit: session.milestonesHit,
          lastMilestone: session.lastMilestone,
          status: session.status,
        } : null,
        player: player ? {
          playerName: player.playerName,
          totalLove: player.totalLove,
          totalActions: player.totalActions,
          totalSessions: player.totalSessions,
          sessionStreak: player.sessionStreak,
        } : null,
        timestamp: new Date().toISOString(),
      });
    }
    return this.err(405);
  }

  // ─── KV Storage helpers ────────────────────────────────────────────────

  private async getSessionKV(id: string): Promise<SessionData | null> {
    const sessions = await this.ctx.storage.get<Record<string, SessionData>>('sessions');
    return sessions?.[id] || null;
  }

  private async putSessionKV(id: string, data: SessionData): Promise<void> {
    const sessions = (await this.ctx.storage.get<Record<string, SessionData>>('sessions')) || {};
    sessions[id] = data;
    await this.ctx.storage.put('sessions', sessions);
  }

  private async getPlayerKV(userId: string): Promise<PlayerData | null> {
    const players = await this.ctx.storage.get<Record<string, PlayerData>>('players');
    return players?.[userId] || null;
  }

  private async putPlayerKV(userId: string, data: PlayerData): Promise<void> {
    const players = (await this.ctx.storage.get<Record<string, PlayerData>>('players')) || {};
    players[userId] = data;
    await this.ctx.storage.put('players', players);
  }

  // ─── Logic ──────────────────────────────────────────────────────────────

  private detectMilestone(actionType: string, actions: number, chats: number, structures: number): { name: string; love: number } | null {
    if (actionType === 'block_100') return { name: 'block_100', love: 50 };
    if (actionType === 'block_50') return { name: 'block_50', love: 25 };
    if (actionType === 'block_25') return { name: 'block_25', love: 10 };
    if (actionType === 'block_10') return { name: 'block_10', love: 5 };
    if (actionType === 'structure_complete') return { name: 'structure_complete', love: 100 };
    if (actions > 0 && actions % 100 === 0) return { name: 'actions_100', love: 25 };
    if (chats > 0 && chats % 10 === 0) return { name: 'chat_10_engaged', love: 5 };
    if (structures > 0 && structures % 5 === 0) return { name: 'structure_5', love: 15 };
    return null;
  }

  private computeStreak(lastDate: string, today: string): number {
    if (!lastDate || lastDate === today) return 1;
    const last = new Date(lastDate);
    const now = new Date(today);
    const diffDays = Math.floor((now.getTime() - last.getTime()) / 86400000);
    return diffDays === 1 ? 1 : 0;
  }

  private checkRateLimit(session: SessionData): { exceeded: boolean; retryAfter?: number; rateLastReset: number } {
    const now = Math.floor(Date.now() / 1000);
    const windowSecs = 60;
    const maxPerWindow = 400; // well under Roblox's 500 req/min

    if (now - session.rateLastReset >= windowSecs) return { exceeded: false, rateLastReset: now };
    if (session.rateBucket >= maxPerWindow) return { exceeded: true, retryAfter: windowSecs - (now - session.rateLastReset), rateLastReset: session.rateLastReset };
    return { exceeded: false, rateLastReset: session.rateLastReset };
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

  private err(status: number) {
    return Response.json({ error: status === 404 ? 'Not found' : 'Method not allowed' }, { status });
  }
}
