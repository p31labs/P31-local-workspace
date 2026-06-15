import type { Env } from './guardian-do';

export interface XpGrant {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  ts: string;
}

export class GuardianEngine {
  private xp: XpGrant[] = [];
  private config: Record<string, unknown>;

  constructor(private env: Env, config?: Record<string, unknown>) {
    this.config = config ?? (env.GUARDIAN_CONFIG as Record<string, unknown>);
  }

  async load(_userId: string): Promise<void> {
    const raw = await this.env.KV_GUARDIAN.get(`xp:all`, 'json');
    this.xp = (raw as XpGrant[]) ?? [];
  }

  async save(_userId: string): Promise<void> {
    await this.env.KV_GUARDIAN.put(`xp:all`, JSON.stringify(this.xp));
  }

  getTotal(userId: string): number {
    return this.xp.filter(t => t.userId === userId).reduce((s, t) => s + t.amount, 0);
  }

  async grant(userId: string, amount: number, reason: string): Promise<XpGrant> {
    const grant: XpGrant = {
      id: `xp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      amount,
      reason,
      ts: new Date().toISOString(),
    };
    this.xp.push(grant);
    await this.save(userId);
    return grant;
  }

  levelFor(total: number): number {
    const lvls = (this.config as { xp?: { levels?: { level: number; threshold: number }[] } }).xp?.levels ?? [];
    let level = 1;
    for (const l of lvls) {
      if (total >= l.threshold) level = l.level;
    }
    return level;
  }
}
