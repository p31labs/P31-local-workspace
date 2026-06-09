import type { D1Database, KVNamespace, DurableObjectNamespace } from './types';
import { getCurrentSafetyLevel, createSpoonsUpdateEvent } from '../src/guardrails.js';

/**
 * P31 Cognitive Load API
 *
 * Edge-based API that receives spoon expenditure data from the Buffer,
 * aggregates across sessions, and provides real-time cognitive load dashboards.
 *
 * @version 1.0.0
 * @date March 24, 2026
 */

export interface Env {
  SPOONS_KV: KVNamespace;
  SPOONS_D1: D1Database;
  ORCHESTRATOR_DO?: DurableObjectNamespace; // Optional binding for event publishing
}

export interface SpoonEvent {
  id: string;
  userId: string;
  amount: number; // Negative for expenditure, positive for earning
  trigger: string; // What triggered the expenditure
  context: string; // Current activity
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface DailySpoonSummary {
  userId: string;
  date: string;
  totalSpent: number;
  totalEarned: number;
  netBalance: number;
  events: SpoonEvent[];
  triggers: Record<string, number>;
}

export interface SpoonLogRequest {
  userId: string;
  amount: number;
  trigger: string;
  context?: string;
  metadata?: Record<string, unknown>;
  timestamp?: number;
}

// D1 SQL Schema
/*
CREATE TABLE spoon_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  trigger TEXT,
  context TEXT,
  metadata TEXT,
  timestamp INTEGER NOT NULL
);

CREATE INDEX idx_spoon_events_user ON spoon_events(user_id);
CREATE INDEX idx_spoon_events_timestamp ON spoon_events(timestamp DESC);
*/

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Route: POST /api/spoons/log
    if (pathParts[0] === 'api' && pathParts[1] === 'spoons' && pathParts[2] === 'log') {
      if (request.method === 'POST') {
        return this.handleLog(request, env);
      }
    }

    // Route: GET /api/spoons/summary/{userId}
    if (pathParts[0] === 'api' && pathParts[1] === 'spoons' && pathParts[2] === 'summary') {
      const userId = pathParts[3];
      if (request.method === 'GET') {
        return this.handleSummary(userId, url, env);
      }
    }

    // Route: GET /api/spoons/trends/{userId}
    if (pathParts[0] === 'api' && pathParts[1] === 'spoons' && pathParts[2] === 'trends') {
      const userId = pathParts[3];
      if (request.method === 'GET') {
        return this.handleTrends(userId, env);
      }
    }

    // Route: GET /api/spoons/current/{userId}
    if (pathParts[0] === 'api' && pathParts[1] === 'spoons' && pathParts[2] === 'current') {
      const userId = pathParts[3];
      if (request.method === 'GET') {
        return this.handleCurrent(userId, env);
      }
    }

    // Route: GET /api/spoons/debt/{userId}
    if (pathParts[0] === 'api' && pathParts[1] === 'spoons' && pathParts[2] === 'debt') {
      const userId = pathParts[3];
      if (request.method === 'GET') {
        return this.handleSpoonDebt(userId, env);
      }
    }

    return new Response('Not found', { status: 404 });
  },

  async handleLog(request: Request, env: Env): Promise<Response> {
    const event = await request.json() as SpoonLogRequest;

    if (!event.userId || event.amount === undefined) {
      return new Response('Invalid event', { status: 400 });
    }

    const timestamp = event.timestamp || Date.now();
    const date = new Date(timestamp).toISOString().split('T')[0];
    const key = `spoons:${event.userId}:${date}`;

    // Get existing events from KV
    const existing = await env.SPOONS_KV.get(key);
    const events: SpoonEvent[] = existing ? JSON.parse(existing) : [];

    // Add new event
    const newEvent: SpoonEvent = {
      id: crypto.randomUUID(),
      userId: event.userId,
      amount: event.amount,
      trigger: event.trigger,
      context: event.context || 'unknown',
      timestamp,
      metadata: event.metadata,
    };

    events.push(newEvent);

    // Store back to KV (7-day TTL)
    await env.SPOONS_KV.put(key, JSON.stringify(events), {
      expirationTtl: 86400 * 7,
    });

    // Archive to D1 for long-term storage
    await env.SPOONS_D1.prepare(`
      INSERT INTO spoon_events (id, user_id, amount, trigger, context, metadata, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      newEvent.id,
      newEvent.userId,
      newEvent.amount,
      newEvent.trigger,
      newEvent.context,
      JSON.stringify(newEvent.metadata || {}),
      newEvent.timestamp
    ).run();

    // Publish spoons:update event to orchestrator for guardrail recalculation
    if (env.ORCHESTRATOR_DO) {
      // Compute net spoons balance from all events
      const netChange = events.reduce((sum: number, e: any) => sum + e.amount, 0);
      const currentSpoons = Math.max(0, Math.min(20, 12 + netChange));
      const previousNet = netChange - newEvent.amount;
      const previousSpoons = Math.max(0, Math.min(20, 12 + previousNet));

      const updateEvent = createSpoonsUpdateEvent(
        event.userId,
        currentSpoons,
        previousSpoons
      );

      try {
        const stub = env.ORCHESTRATOR_DO.idFromName('singleton');
        await env.ORCHESTRATOR_DO.get(stub).fetch(
          new Request('http://localhost/api/orchestrator/spoons-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateEvent)
          })
        );
      } catch (err) {
        console.error('Failed to publish spoons update to orchestrator:', err);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      eventId: newEvent.id,
      timestamp: newEvent.timestamp,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async handleSummary(userId: string, url: URL, env: Env): Promise<Response> {
    if (!userId) {
      return new Response('Missing userId', { status: 400 });
    }

    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const key = `spoons:${userId}:${date}`;

    const eventsJson = await env.SPOONS_KV.get(key);

    if (!eventsJson) {
      return new Response(JSON.stringify({
        userId,
        date,
        totalSpent: 0,
        totalEarned: 0,
        netBalance: 0,
        events: [],
        triggers: {},
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const events = JSON.parse(eventsJson) as SpoonEvent[];
    const summary = this.calculateSummary(userId, date, events);

    return new Response(JSON.stringify(summary), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async handleTrends(userId: string, env: Env): Promise<Response> {
    if (!userId) {
      return new Response('Missing userId', { status: 400 });
    }

    // Get last 7 days of data
    const trends: Array<{
      date: string;
      totalSpent: number;
      totalEarned: number;
      netBalance: number;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const key = `spoons:${userId}:${dateStr}`;

      const eventsJson = await env.SPOONS_KV.get(key);
      if (eventsJson) {
        const events = JSON.parse(eventsJson) as SpoonEvent[];
        const summary = this.calculateSummary(userId, dateStr, events);
        trends.push({
          date: dateStr,
          totalSpent: summary.totalSpent,
          totalEarned: summary.totalEarned,
          netBalance: summary.netBalance,
        });
      } else {
        trends.push({
          date: dateStr,
          totalSpent: 0,
          totalEarned: 0,
          netBalance: 0,
        });
      }
    }

    // Calculate averages
    const avgSpent = trends.reduce((sum, d) => sum + d.totalSpent, 0) / 7;
    const avgEarned = trends.reduce((sum, d) => sum + d.totalEarned, 0) / 7;

    return new Response(JSON.stringify({
      userId,
      days: trends.reverse(),
      average: {
        spentPerDay: Math.round(avgSpent * 10) / 10,
        earnedPerDay: Math.round(avgEarned * 10) / 10,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async handleCurrent(userId: string, env: Env): Promise<Response> {
    if (!userId) {
      return new Response('Missing userId', { status: 400 });
    }

    // Use today's spoon balance
    const today = new Date().toISOString().split('T')[0];
    const key = `spoons:${userId}:${today}`;
    const eventsJson = await env.SPOONS_KV.get(key);

    let spoons = 12; // baseline
    if (eventsJson) {
      const events = JSON.parse(eventsJson) as SpoonEvent[];
      const totalSpent = events
        .filter(e => e.amount < 0)
        .reduce((sum, e) => sum + Math.abs(e.amount), 0);
      const totalEarned = events
        .filter(e => e.amount > 0)
        .reduce((sum, e) => sum + e.amount, 0);
      spoons = Math.max(0, Math.min(20, 12 + totalEarned - totalSpent));
    }

    const level = getCurrentSafetyLevel(spoons);

    return new Response(JSON.stringify({
      userId,
      spoons,
      level,
      date: today,
      timestamp: Date.now()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  },

  async handleSpoonDebt(userId: string, env: Env): Promise<Response> {
    if (!userId) {
      return new Response('Missing userId', { status: 400 });
    }

    // Get last 30 days from D1
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    const result = await env.SPOONS_D1.prepare(`
      SELECT SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_spent,
             SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_earned
      FROM spoon_events
      WHERE user_id = ? AND timestamp > ?
    `).bind(userId, thirtyDaysAgo).first<{ total_spent: number; total_earned: number }>();

    const totalSpent = result?.total_spent || 0;
    const totalEarned = result?.total_earned || 0;
    const netDebt = totalSpent - totalEarned;

    // Debt thresholds (these should be user-configurable in production)
    const WARNING_THRESHOLD = 50;
    const CRITICAL_THRESHOLD = 100;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (netDebt >= CRITICAL_THRESHOLD) {
      status = 'critical';
    } else if (netDebt >= WARNING_THRESHOLD) {
      status = 'warning';
    }

    return new Response(JSON.stringify({
      userId,
      period: '30 days',
      totalSpent,
      totalEarned,
      netDebt,
      status,
      thresholds: {
        warning: WARNING_THRESHOLD,
        critical: CRITICAL_THRESHOLD,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  calculateSummary(userId: string, date: string, events: SpoonEvent[]): DailySpoonSummary {
    const totalSpent = events
      .filter(e => e.amount < 0)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    const totalEarned = events
      .filter(e => e.amount > 0)
      .reduce((sum, e) => sum + e.amount, 0);

    // Aggregate by trigger
    const triggers = events.reduce((acc, e) => {
      acc[e.trigger] = (acc[e.trigger] || 0) + Math.abs(e.amount);
      return acc;
    }, {} as Record<string, number>);

    return {
      userId,
      date,
      totalSpent,
      totalEarned,
      netBalance: totalEarned - totalSpent,
      events,
      triggers,
    };
  },
};
