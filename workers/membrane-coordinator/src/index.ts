import { DurableObject } from 'cloudflare:workers';

interface Env {
  MEMBRANE: DurableObjectNamespace;
  GENESIS_GATE_URL: string;
  LOVE_BRIDGE_URL: string;
}

export interface CheckResult {
  id: string;
  name: string;
  category: 'http' | 'browser' | 'asset' | 'security' | 'performance';
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
  durationMs: number;
  timestamp: number;
}

export interface DeployRecord {
  id: string;
  familyId: string;
  site: string;
  version: string;
  preview: boolean;
  startedAt: number;
  completedAt: number;
  checks: CheckResult[];
  passedCount: number;
  totalCount: number;
  xpEarned: number;
  loveEarned: number;
  status: 'running' | 'passed' | 'failed' | 'partial';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlockedAt?: number;
}

export interface MembraneState {
  familyId: string;
  deployHistory: DeployRecord[];
  xp: number;
  love: number;
  level: number;
  streak: number;
  achievements: Achievement[];
  lastDeployAt: number;
  totalChecksPassed: number;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_clean', name: 'First Clean Deploy', description: 'All checks passed', tier: 'bronze' },
  { id: 'streak_5', name: 'Deploy Streak', description: '5 consecutive clean deploys', tier: 'silver' },
  { id: 'streak_30', name: 'Deploy Legend', description: '30 consecutive clean deploys', tier: 'gold' },
  { id: 'streak_10', name: 'Membrane Master', description: '10 clean deploys in a row', tier: 'gold' },
  { id: 'bug_hunter', name: 'Bug Hunter', description: 'Caught a console error', tier: 'silver' },
  { id: 'font_detective', name: 'Font Detective', description: 'Detected a font loading issue', tier: 'bronze' },
  { id: 'csp_enforcer', name: 'Policy Enforcer', description: 'Blocked a deploy with CSP violations', tier: 'gold' },
  { id: 'pixel_perfect', name: 'Pixel Perfect', description: 'Caught a visual regression', tier: 'silver' },
  { id: 'deploy_guardian', name: 'Deploy Guardian', description: '100 total checks passed', tier: 'platinum' },
];

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export class MembraneCoordinator extends DurableObject<Env> {
  private async getState(): Promise<MembraneState> {
    const stored = await this.ctx.storage.get<MembraneState>('state');
    return stored || {
      familyId: 'default',
      deployHistory: [],
      xp: 0, love: 0, level: 1, streak: 0,
      achievements: [],
      lastDeployAt: 0,
      totalChecksPassed: 0,
    };
  }

  private async saveState(state: MembraneState) {
    await this.ctx.storage.put('state', state);
  }

  private async emitToGenesisGate(type: string, payload: Record<string, unknown>) {
    try {
      await fetch(`${this.env.GENESIS_GATE_URL}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'membrane', type, payload,
          timestamp: new Date().toISOString(),
          session_id: 'membrane',
        }),
      });
    } catch {}
  }

  private async unlockAchievement(state: MembraneState, id: string) {
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (!achievement || state.achievements.find(a => a.id === id)) return;
    state.achievements.push({ ...achievement, unlockedAt: Date.now() });
    await this.emitToGenesisGate('achievement_unlocked', {
      achievementId: id, name: achievement.name, tier: achievement.tier,
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    try {
      const state = await this.getState();

      if (path === '/health') {
        return json({ ok: true, service: 'membrane', version: '1.0.0', familyId: state.familyId });
      }

      if (path === '/deploy/start' && method === 'POST') {
        const body = await request.json() as any;
        const record: DeployRecord = {
          id: `deploy_${Date.now()}`,
          familyId: body.familyId || state.familyId,
          site: body.site || 'unknown',
          version: body.version || 'unknown',
          preview: body.preview || false,
          startedAt: Date.now(), completedAt: 0,
          checks: [], passedCount: 0, totalCount: 0,
          xpEarned: 0, loveEarned: 0, status: 'running',
        };
        state.deployHistory.unshift(record);
        if (state.deployHistory.length > 100) state.deployHistory.pop();
        await this.emitToGenesisGate('deploy_started', { deployId: record.id, site: record.site, version: record.version, preview: record.preview });
        await this.saveState(state);
        return json({ ok: true, deployId: record.id });
      }

      if (path === '/deploy/check' && method === 'POST') {
        const body = await request.json() as any;
        const record = state.deployHistory.find(d => d.id === body.deployId);
        if (!record) return json({ error: 'Deploy not found' }, 404);

        const check = body.check as CheckResult;
        record.checks.push(check);
        record.totalCount++;
        if (check.passed) { record.passedCount++; state.totalChecksPassed++; }

        const eventType = check.passed ? 'check_passed' : 'check_failed';
        await this.emitToGenesisGate(eventType, { deployId: record.id, checkName: check.name, category: check.category, message: check.message, site: record.site });

        let xp = check.passed ? 10 : 7;
        let love = check.passed ? 2 : 1;
        if (!check.passed) { xp += 3; love += 1; }
        if (check.category === 'security' && !check.passed) xp += 10;
        if (check.category === 'browser' && !check.passed) xp += 5;

        record.xpEarned += xp;
        record.loveEarned += love;
        state.xp += xp;
        state.love += love;

        const newLevel = Math.floor(Math.sqrt(state.xp / 50)) + 1;
        if (newLevel > state.level) {
          state.level = newLevel;
          await this.emitToGenesisGate('level_up', { level: state.level, xp: state.xp });
        }

        if (!check.passed && check.category === 'browser') await this.unlockAchievement(state, 'bug_hunter');
        if (!check.passed && check.category === 'security') await this.unlockAchievement(state, 'csp_enforcer');
        if (!check.passed && check.name === 'Font Loading') await this.unlockAchievement(state, 'font_detective');
        if (!check.passed && check.name === 'Visual Regression') await this.unlockAchievement(state, 'pixel_perfect');

        await this.saveState(state);
        return json({ ok: true, xp, love });
      }

      if (path === '/deploy/complete' && method === 'POST') {
        const body = await request.json() as any;
        const record = state.deployHistory.find(d => d.id === body.deployId);
        if (!record) return json({ error: 'Deploy not found' }, 404);

        record.completedAt = Date.now();
        record.status = record.passedCount === record.totalCount ? 'passed' : record.passedCount === 0 ? 'failed' : 'partial';

        if (record.status === 'passed') {
          state.streak += 1;
          const bonusXp = 50 + state.streak * 5;
          const bonusLove = 10 + Math.floor(state.streak / 5);
          record.xpEarned += bonusXp;
          record.loveEarned += bonusLove;
          state.xp += bonusXp;
          state.love += bonusLove;
          if (state.streak === 5) await this.unlockAchievement(state, 'streak_5');
          if (state.streak === 10) await this.unlockAchievement(state, 'streak_10');
          if (state.streak === 30) await this.unlockAchievement(state, 'streak_30');
          if (state.deployHistory.filter(d => d.status === 'passed').length === 1) await this.unlockAchievement(state, 'first_clean');
        } else {
          state.streak = 0;
        }

        if (state.totalChecksPassed >= 100) await this.unlockAchievement(state, 'deploy_guardian');

        await this.emitToGenesisGate('deploy_verified', {
          deployId: record.id, status: record.status,
          passedCount: record.passedCount, totalCount: record.totalCount,
          xpEarned: record.xpEarned, loveEarned: record.loveEarned,
          streak: state.streak,
        });

        state.lastDeployAt = Date.now();
        await this.saveState(state);
        return json({ ok: true, status: record.status, streak: state.streak, xpEarned: record.xpEarned, loveEarned: record.loveEarned });
      }

      if (path === '/state' && method === 'GET') {
        return json({
          xp: state.xp, love: state.love, level: state.level, streak: state.streak,
          achievements: state.achievements,
          deployCount: state.deployHistory.length,
          cleanDeployCount: state.deployHistory.filter(d => d.status === 'passed').length,
        });
      }

      if (path === '/history' && method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '20');
        return json({ history: state.deployHistory.slice(0, limit) });
      }

      if (path === '/latest' && method === 'GET') {
        if (state.deployHistory.length === 0) return json({ error: 'No deploys yet' }, 404);
        return json(state.deployHistory[0]);
      }

      return json({ error: 'Not found' }, 404);
    } catch (e: any) {
      return json({ error: e.message }, 500);
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const familyId = url.searchParams.get('familyId') || 'default';
    const doId = env.MEMBRANE.idFromName(familyId);
    const stub = env.MEMBRANE.get(doId);
    return stub.fetch(request);
  },
};
