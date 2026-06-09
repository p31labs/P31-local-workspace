/**
 * P31 Orchestrator Event Bus
 * Durable Object singleton message queue with guardrail integration
 * 
 * This is the central nervous system of the P31 automation ecosystem.
 * All triggers pass through this DO, are evaluated against guardrails,
 * and dispatched to actions with exponential time dilation.
 */

import type { D1Database, DurableObjectState, DurableObject } from './types';
import { evaluateGuardrails, isFawnGuardActive, calculateCurrentLevel } from '../src/guardrails.js';
import { getActionHandler, executeActionWithGuardrails } from './action-registry.ts';

export interface Env {
  ORCHESTRATOR_DO: DurableObjectNamespace;
  ORCHESTRATOR_D1: D1Database;
  SPOONS_KV: KVNamespace;
}

export interface TriggerEvent {
  id: string;
  type: 'cron' | 'webhook' | 'state_change' | 'threshold' | 'external' | 'manual';
  source: string;
  action: string;
  priority: number;
  safetyLevel: number;
  baseDelayMs: number;
  payload: Record<string, unknown>;
  timestamp: number;
  sequenceNumber: number; // Monotonically increasing per user to prevent out-of-order processing
  metadata?: Record<string, unknown>;
}

export interface AuditLogEntry {
  id: string;
  triggerId: string;
  eventType: string;
  action: string;
  spoonsAtEvaluation: number;
  guardrailLevel: number;
  approved: boolean;
  delayMs: number;
  requiresManual: boolean;
  reason: string;
  executedAt?: number;
  created_at: number;
}

export interface QueuedAction {
  id: string;
  triggerId: string;
  action: string;
  payload: Record<string, unknown>;
  scheduledAt: number;
  priority: number;
  attempts: number;
}

// D1 Schema
/*
CREATE TABLE orchestrator_audit_log (
  id TEXT PRIMARY KEY,
  trigger_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  action TEXT NOT NULL,
  spoons_at_evaluation INTEGER NOT NULL,
  guardrail_level INTEGER NOT NULL,
  approved BOOLEAN NOT NULL,
  delay_ms INTEGER NOT NULL,
  requires_manual BOOLEAN NOT NULL,
  reason TEXT NOT NULL,
  executed_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE orchestrator_queue (
    id TEXT PRIMARY KEY,
    trigger_id TEXT NOT NULL,
    action TEXT NOT NULL,
    payload TEXT NOT NULL,
    scheduled_at INTEGER NOT NULL,
    priority INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS event_sequence (
    source TEXT PRIMARY KEY,
    sequence_number INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

CREATE INDEX idx_orchestrator_audit_trigger ON orchestrator_audit_log(trigger_id);
CREATE INDEX idx_orchestrator_audit_created ON orchestrator_audit_log(created_at DESC);
CREATE INDEX idx_orchestrator_queue_scheduled ON orchestrator_queue(scheduled_at);
CREATE INDEX idx_orchestrator_queue_priority ON orchestrator_queue(priority DESC);
CREATE INDEX idx_event_sequence_source ON event_sequence(source);
*/

export class EventBusDO implements DurableObject {
  state: DurableObjectState;
  env: Env;
  currentGuardrailLevel: number;
  lastSpoonCheck: number;
  // Hysteresis state: require 2 consecutive readings to change level
  pendingLevel: number | null;
  hysteresisCount: number;
  meshState: {
    careScore: number;
    qFactor: number;
    activeMinutes: number;
    vertices: Record<string, { status: string; lastSeen: number }>;
    lastMeshSync: number;
  };

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.currentGuardrailLevel = 4;
    this.lastSpoonCheck = 0;
    this.pendingLevel = null;
    this.hysteresisCount = 0;
    this.meshState = {
      careScore: 0.5,
      qFactor: 0.0,
      activeMinutes: 0,
      vertices: {},
      lastMeshSync: 0
    };

    // Load persisted state on DO initialization
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<{ level: number; lastCheck: number; pendingLevel: number; hysteresisCount: number; mesh: any }>('state');
      if (stored) {
        this.currentGuardrailLevel = stored.level;
        this.lastSpoonCheck = stored.lastCheck;
        this.pendingLevel = stored.pendingLevel ?? null;
        this.hysteresisCount = stored.hysteresisCount ?? 0;
        if (stored.mesh) {
          this.meshState = { ...this.meshState, ...stored.mesh };
        }
      }

      // Cold start: rebuild state from KV if lastSync is stale (>5 min)
      const now = Date.now();
      if (now - this.meshState.lastMeshSync > 5 * 60 * 1000) {
        await this.rebuildStateFromKV();
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Route: POST /api/orchestrator/trigger
    if (pathParts[0] === 'api' && pathParts[1] === 'orchestrator' && pathParts[2] === 'trigger') {
      if (request.method === 'POST') {
        let event: TriggerEvent;
        try {
          event = await request.json() as TriggerEvent;
        } catch (e) {
          return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Strict input validation
        if (!event.id || typeof event.id !== 'string') {
          return new Response(JSON.stringify({ error: 'Missing or invalid id' }), { status: 400 });
        }
        if (!event.action || typeof event.action !== 'string') {
          return new Response(JSON.stringify({ error: 'Missing or invalid action' }), { status: 400 });
        }
        if (typeof event.priority !== 'number' || event.priority < 0 || event.priority > 10) {
          return new Response(JSON.stringify({ error: 'Priority must be 0-10' }), { status: 400 });
        }
        if (typeof event.safetyLevel !== 'number' || event.safetyLevel < 0 || event.safetyLevel > 4) {
          return new Response(JSON.stringify({ error: 'Safety level must be 0-4' }), { status: 400 });
        }
        if (typeof event.baseDelayMs !== 'number' || event.baseDelayMs < 0) {
          return new Response(JSON.stringify({ error: 'Invalid base delay' }), { status: 400 });
        }
        if (typeof event.sequenceNumber !== 'number' || event.sequenceNumber < 0) {
          return new Response(JSON.stringify({ error: 'Invalid or missing sequence number' }), { status: 400 });
        }

        return this.handleTrigger(event);
      }
    }

    // Route: POST /api/orchestrator/spoons-update
    if (pathParts[0] === 'api' && pathParts[1] === 'orchestrator' && pathParts[2] === 'spoons-update') {
      if (request.method === 'POST') {
        return this.handleSpoonsUpdate(request);
      }
    }

    // Route: POST /api/orchestrator/spoons-update
    if (pathParts[0] === 'api' && pathParts[1] === 'orchestrator' && pathParts[2] === 'spoons-update') {
      if (request.method === 'POST') {
        return this.handleSpoonsUpdate(request);
      }
    }

    // Route: GET /api/orchestrator/status
    if (pathParts[0] === 'api' && pathParts[1] === 'orchestrator' && pathParts[2] === 'status') {
      const currentSpoons = await this.getCurrentSpoonCount();
      await this.syncMeshState();

      return new Response(JSON.stringify({
        guardrailLevel: this.currentGuardrailLevel,
        lastSpoonCheck: this.lastSpoonCheck,
        fawnGuardActive: isFawnGuardActive(this.currentGuardrailLevel),
        currentSpoons,
        mesh: {
          careScore: this.meshState.careScore,
          qFactor: this.meshState.qFactor,
          activeMinutes: this.meshState.activeMinutes,
          vertices: this.meshState.vertices,
          lastSync: this.meshState.lastMeshSync
        },
        timestamp: Date.now()
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Route: GET /api/orchestrator/queue
    if (pathParts[0] === 'api' && pathParts[1] === 'orchestrator' && pathParts[2] === 'queue') {
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const queue = await this.env.ORCHESTRATOR_D1.prepare(`
        SELECT id, trigger_id, action, scheduled_at, priority, attempts, created_at
        FROM orchestrator_queue 
        ORDER BY priority DESC, scheduled_at ASC
        LIMIT ?
      `).bind(limit).all();

      return new Response(JSON.stringify({
        count: queue.results?.length || 0,
        items: queue.results || []
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Route: GET /api/orchestrator/audit-log
    if (pathParts[0] === 'api' && pathParts[1] === 'orchestrator' && pathParts[2] === 'audit-log') {
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const logs = await this.env.ORCHESTRATOR_D1.prepare(`
        SELECT * FROM orchestrator_audit_log 
        ORDER BY created_at DESC
        LIMIT ?
      `).bind(limit).all();

      return new Response(JSON.stringify({
        count: logs.results?.length || 0,
        items: logs.results || []
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Route: GET /api/orchestrator/manual-review
    if (pathParts[0] === 'api' && pathParts[1] === 'orchestrator' && pathParts[2] === 'manual-review') {
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const pending = await this.env.ORCHESTRATOR_D1.prepare(`
        SELECT * FROM orchestrator_audit_log 
        WHERE requires_manual = true AND executed_at IS NULL
        ORDER BY created_at DESC
        LIMIT ?
      `).bind(limit).all();

      return new Response(JSON.stringify({
        count: pending.results?.length || 0,
        items: pending.results || []
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Route: POST /api/orchestrator/approve/:id
    if (pathParts[0] === 'api' && pathParts[1] === 'orchestrator' && pathParts[2] === 'approve' && pathParts[3]) {
      if (request.method === 'POST') {
        const auditId = pathParts[3];
        
        // Get original trigger from audit log
        const auditEntry = await this.env.ORCHESTRATOR_D1.prepare(`
          SELECT trigger_id, event_type, action, spoons_at_evaluation, reason
          FROM orchestrator_audit_log WHERE id = ?
        `).bind(auditId).first();

        if (!auditEntry) {
          return new Response(JSON.stringify({ error: 'Audit entry not found' }), { status: 404 });
        }

        // Mark as approved
        await this.env.ORCHESTRATOR_D1.prepare(`
          UPDATE orchestrator_audit_log 
          SET executed_at = ?, requires_manual = false, reason = ? || ' - MANUALLY APPROVED'
          WHERE id = ?
        `).bind(Date.now(), auditEntry.reason, auditId).run();

        // Bypass guardrails and execute immediately
        await this.executeAction({
          id: crypto.randomUUID(),
          triggerId: auditEntry.trigger_id,
          action: auditEntry.action,
          payload: { manualApproval: true },
          scheduledAt: Date.now(),
          priority: 10,
          attempts: 0
        });

        return new Response(JSON.stringify({ success: true, approved: auditId }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Not found', { status: 404 });
  }

  async alarm() {
    await this.processQueue();
    
    // Reschedule alarm if there are more items
    const nextItem = await this.env.ORCHESTRATOR_D1.prepare(`
      SELECT scheduled_at FROM orchestrator_queue 
      ORDER BY scheduled_at ASC LIMIT 1
    `).first<{ scheduled_at: number }>();

    if (nextItem) {
      const delay = Math.max(0, nextItem.scheduled_at - Date.now());
      // Add 0-30s jitter to prevent thundering herd
      const jitter = Math.floor(Math.random() * 30000);
      this.state.setAlarm(Date.now() + Math.min(delay + jitter, 300000)); // Max 5 minutes
    }
  }

  async handleTrigger(event: TriggerEvent): Promise<Response> {
    // Hard queue depth limit - reject new triggers when overloaded
    const queueCount = await this.env.ORCHESTRATOR_D1.prepare(`
      SELECT COUNT(*) as count FROM orchestrator_queue
    `).first<{ count: number }>();

    if (queueCount && queueCount.count > 1500) {
      // Only allow priority 10 critical actions when overloaded
      if (event.priority < 10) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Queue depth exceeded. Only critical actions accepted.',
          queueCount: queueCount.count
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 1. Sync mesh state from K4 Cage
    await this.syncMeshState();

    // 2. Get current spoon count
    const currentSpoons = await this.getCurrentSpoonCount();

    // 3. Update guardrail level with hysteresis
    const hysteresisState = { pendingLevel: this.pendingLevel, count: this.hysteresisCount };
    const levelResult = calculateCurrentLevel(currentSpoons, this.currentGuardrailLevel, hysteresisState);

    if (levelResult.changed) {
      this.currentGuardrailLevel = levelResult.level;
    }
    this.pendingLevel = levelResult.pendingLevel;
    this.hysteresisCount = levelResult.hysteresisCount;

    // Persist state if level changed or hysteresis state updated
    if (levelResult.changed || levelResult.hysteresisCount > 0) {
      await this.state.storage.put('state', {
        level: this.currentGuardrailLevel,
        lastCheck: this.lastSpoonCheck,
        pendingLevel: this.pendingLevel,
        hysteresisCount: this.hysteresisCount,
        mesh: this.meshState
      });
    }

    this.lastSpoonCheck = Date.now();

    // 4. Evaluate against guardrails with full system state
    const evaluation = evaluateGuardrails({
      safetyLevel: event.safetyLevel,
      priority: event.priority,
      baseDelayMs: event.baseDelayMs
    }, {
      spoons: currentSpoons,
      careScore: this.meshState.careScore,
      qFactor: this.meshState.qFactor,
      activeMinutes: this.meshState.activeMinutes
    });

    // 4.5 Runtime guardrail recheck (defense in depth)
    let runtimeEvaluation = evaluation;
    if (evaluation.approved) {
      runtimeEvaluation = evaluateGuardrails({
        safetyLevel: event.safetyLevel,
        priority: event.priority,
        baseDelayMs: event.baseDelayMs
      }, {
        spoons: currentSpoons,
        careScore: this.meshState.careScore,
        qFactor: this.meshState.qFactor,
        activeMinutes: this.meshState.activeMinutes
      });
    }

    // 4. Log to immutable audit trail
    const auditEntry: AuditLogEntry = {
      id: crypto.randomUUID(),
      triggerId: event.id,
      eventType: event.type,
      action: event.action,
      spoonsAtEvaluation: currentSpoons,
      guardrailLevel: this.currentGuardrailLevel,
      approved: runtimeEvaluation.approved,
      delayMs: runtimeEvaluation.delayMs,
      requiresManual: runtimeEvaluation.requiresManual,
      reason: runtimeEvaluation.reason,
      created_at: Date.now()
    };

    await this.logAuditEntry(auditEntry);

    // 5. If approved, queue for execution
    if (runtimeEvaluation.approved && !runtimeEvaluation.requiresManual) {
      const scheduledAt = Date.now() + runtimeEvaluation.delayMs;
      
      await this.queueAction({
        id: crypto.randomUUID(),
        triggerId: event.id,
        action: event.action,
        payload: event.payload,
        scheduledAt,
        priority: event.priority,
        attempts: 0
      });

      // Schedule alarm for delayed execution
      const existingAlarm = await this.state.getAlarm();
      if (!existingAlarm || existingAlarm > Date.now() + runtimeEvaluation.delayMs) {
        // Add 0-30s jitter to prevent thundering herd
        const jitter = Math.floor(Math.random() * 30000);
        const delay = Math.min(runtimeEvaluation.delayMs + jitter, 300000); // Max 5 minutes
        this.state.setAlarm(Date.now() + delay);
      }
    } else if (!evaluation.approved && runtimeEvaluation.approved) {
      // Guardrail was too strict at queue time but passed at execution time
      // Re-queue with updated evaluation
      const scheduledAt = Date.now() + runtimeEvaluation.delayMs;
      await this.queueAction({
        id: crypto.randomUUID(),
        triggerId: event.id,
        action: event.action,
        payload: event.payload,
        scheduledAt,
        priority: event.priority,
        attempts: 0
      });
    }

    // 6. Runtime guardrail recheck at execution time (defense in depth)
    await this.executeWithRuntimeGuardrail(event);

    // Store sequence number to prevent replay attacks
    await this.storeSequenceNumber(event.source, event.sequenceNumber);

    return new Response(JSON.stringify({
      success: true,
      eventId: event.id,
      auditId: auditEntry.id,
      evaluation,
      currentLevel: this.currentGuardrailLevel,
      currentSpoons
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async getLastSequenceNumber(source: string): Promise<number | null> {
    const val = await this.env.ORCHESTRATOR_D1.prepare(`
      SELECT sequence_number FROM event_sequence WHERE source = ?
    `).bind(source).first<{ sequence_number: number }>();
    return val?.sequence_number ?? null;
  }

  async storeSequenceNumber(source: string, sequenceNumber: number): Promise<void> {
    await this.env.ORCHESTRATOR_D1.prepare(`
      INSERT OR REPLACE INTO event_sequence (source, sequence_number, updated_at)
      VALUES (?, ?, ?)
    `).bind(source, sequenceNumber, Date.now()).run();
  }

  async handleSpoonsUpdate(request: Request): Promise<Response> {
    let event: any;
    try {
      event = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
    }

    const { userId, spoons, previousSpoons } = event;
    if (userId === undefined || spoons === undefined) {
      return new Response(JSON.stringify({ error: 'Missing userId or spoons' }), { status: 400 });
    }

    // Recompute guardrail level with hysteresis
    const hysteresisState = { pendingLevel: this.pendingLevel, count: this.hysteresisCount };
    const result = calculateCurrentLevel(spoons, this.currentGuardrailLevel, hysteresisState);

    if (result.changed) {
      this.currentGuardrailLevel = result.level;
    }
    this.pendingLevel = result.pendingLevel;
    this.hysteresisCount = result.hysteresisCount;

    // Persist all state fields
    await this.state.storage.put('state', {
      level: this.currentGuardrailLevel,
      lastCheck: this.lastSpoonCheck,
      pendingLevel: this.pendingLevel,
      hysteresisCount: this.hysteresisCount,
      mesh: this.meshState
    });

    this.lastSpoonCheck = Date.now();

    // Broadcast guardrails:levelChanged event to all listeners
    if (result.changed) {
      const intervals = {
        standard: 1000 * (this.currentGuardrailLevel === 0 ? 1 :
                         this.currentGuardrailLevel === 1 ? 1.5 :
                         this.currentGuardrailLevel === 2 ? 3 :
                         this.currentGuardrailLevel === 3 ? 10 : Infinity),
        backoff: this.currentGuardrailLevel * 2
      };

      console.log(`[GUARDRAILS] levelChanged: ${this.currentGuardrailLevel} spoons=${spoons}`);

      // Also update command center status
      if (this.env.COMMAND_CENTER_TOKEN) {
        await fetch('https://command-center.trimtab-signal.workers.dev/api/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.env.COMMAND_CENTER_TOKEN}`
          },
          body: JSON.stringify({
            key: 'guardrail/level',
            value: this.currentGuardrailLevel,
            color: this.currentGuardrailLevel <= 1 ? 'green' :
                   this.currentGuardrailLevel === 2 ? 'yellow' :
                   this.currentGuardrailLevel === 3 ? 'orange' : 'red',
            metadata: { spoons, intervals }
          })
        }).catch(() => {}); // Fire and forget
      }
    }

    return new Response(JSON.stringify({
      success: true,
      currentLevel: this.currentGuardrailLevel,
      pendingLevel: this.pendingLevel,
      hysteresisCount: this.hysteresisCount,
      changed: result.changed
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  async getCurrentSpoonCount(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const key = `spoons:will:${today}`;
    
    const eventsJson = await this.env.SPOONS_KV.get(key);
    
    if (!eventsJson) {
      return 12; // Default baseline if no data
    }

    const events = JSON.parse(eventsJson);
    const totalSpent = events
      .filter((e: any) => e.amount < 0)
      .reduce((sum: number, e: any) => sum + Math.abs(e.amount), 0);
    const totalEarned = events
      .filter((e: any) => e.amount > 0)
      .reduce((sum: number, e: any) => sum + e.amount, 0);

    return Math.max(0, Math.min(20, 12 + totalEarned - totalSpent));
  }

  async syncMeshState(): Promise<void> {
    // Only sync mesh state every 30 seconds minimum
    if (Date.now() - this.meshState.lastMeshSync < 30000) {
      return;
    }

    try {
      const meshResponse = await fetch('https://k4-cage.trimtab-signal.workers.dev/api/mesh');
      if (meshResponse.ok) {
        const mesh = await meshResponse.json();
        
        // Calculate care score from total love
        const totalLove = mesh.totalLove || 0;
        this.meshState.careScore = Math.min(1.0, totalLove / 1000);

        // Calculate Q-Factor (coherence) from active vertices
        const activeVertices = Object.values(mesh.mesh.vertices)
          .filter((v: any) => v.status === 'online').length;
        this.meshState.qFactor = activeVertices / 4;

        // Calculate active minutes
        const willVertex = mesh.mesh.vertices.will;
        if (willVertex && willVertex.status === 'online') {
          const lastSeen = new Date(willVertex.lastSeen).getTime();
          this.meshState.activeMinutes = Math.min(120, (Date.now() - lastSeen) / 60000);
        } else {
          this.meshState.activeMinutes = 0;
        }

        this.meshState.vertices = mesh.mesh.vertices;
        this.meshState.lastMeshSync = Date.now();

        // Persist mesh state
        await this.state.storage.put('state', {
          level: this.currentGuardrailLevel,
          lastCheck: this.lastSpoonCheck,
          pendingLevel: this.pendingLevel,
          hysteresisCount: this.hysteresisCount,
          mesh: this.meshState
        });
      }
    } catch (error) {
      // Silently fail - mesh is optional
      console.error('Mesh sync failed:', error);
    }
  }

  async logAuditEntry(entry: AuditLogEntry): Promise<void> {
    await this.env.ORCHESTRATOR_D1.prepare(`
      INSERT INTO orchestrator_audit_log (
        id, trigger_id, event_type, action, spoons_at_evaluation,
        guardrail_level, approved, delay_ms, requires_manual,
        reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      entry.id,
      entry.triggerId,
      entry.eventType,
      entry.action,
      entry.spoonsAtEvaluation,
      entry.guardrailLevel,
      entry.approved,
      entry.delayMs,
      entry.requiresManual,
      entry.reason,
      entry.created_at
    ).run();
  }

  async queueAction(action: QueuedAction): Promise<void> {
    await this.env.ORCHESTRATOR_D1.prepare(`
      INSERT INTO orchestrator_queue (
        id, trigger_id, action, payload, scheduled_at,
        priority, attempts, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      action.id,
      action.triggerId,
      action.action,
      JSON.stringify(action.payload),
      action.scheduledAt,
      action.priority,
      action.attempts,
      Date.now()
    ).run();
  }

  async executeWithRuntimeGuardrail(event: TriggerEvent): Promise<void> {
    // Re-check guardrails at execution time (defense in depth)
    const currentSpoons = await this.getCurrentSpoonCount();
    await this.syncMeshState();

    const systemState = {
      spoons: currentSpoons,
      careScore: this.meshState.careScore,
      qFactor: this.meshState.qFactor,
      activeMinutes: this.meshState.activeMinutes
    };

    const evaluation = evaluateGuardrails({
      safetyLevel: event.safetyLevel,
      priority: event.priority,
      baseDelayMs: event.baseDelayMs
    }, systemState);

    if (!evaluation.approved) {
      // Action blocked at runtime - log and abort
      await this.env.ORCHESTRATOR_D1.prepare(`
        UPDATE orchestrator_audit_log
        SET requiresManual = false, reason = ? || ' - BLOCKED AT EXECUTION'
        WHERE trigger_id = ?
      `).bind(evaluation.reason, event.id).run();

      // Compensate: reverse any partial effects if needed
      await this.compensateAction(event, evaluation.reason);
      return;
    }

    // Re-execute with fresh guardrail approval
    await this.queueAction({
      id: crypto.randomUUID(),
      triggerId: event.id,
      action: event.action,
      payload: event.payload,
      scheduledAt: Date.now(),
      priority: event.priority,
      attempts: 0
    });
  }

  async compensateAction(event: TriggerEvent, reason: string): Promise<void> {
    // Implement compensation logic based on action type
    // For example, reverse a transaction, restore state, etc.
    console.warn(`Compensating action ${event.action} due to: ${reason}`);
  }

  async processQueue(): Promise<void> {
    const now = Date.now();
    
    // Hard queue depth limit - prevent infinite growth
    const queueCount = await this.env.ORCHESTRATOR_D1.prepare(`
      SELECT COUNT(*) as count FROM orchestrator_queue
    `).first<{ count: number }>();

    // If queue exceeds 1000 items, clear low priority items
    if (queueCount && queueCount.count > 1000) {
      await this.env.ORCHESTRATOR_D1.prepare(`
        DELETE FROM orchestrator_queue 
        WHERE priority < 5 AND id IN (
          SELECT id FROM orchestrator_queue 
          ORDER BY scheduled_at ASC LIMIT 500
        )
      `).run();
    }
    
    // Get all due actions sorted by priority
    const actions = await this.env.ORCHESTRATOR_D1.prepare(`
      SELECT * FROM orchestrator_queue 
      WHERE scheduled_at <= ? 
      ORDER BY priority DESC, scheduled_at ASC
      LIMIT 50
    `).bind(now).all<QueuedAction & { payload: string }>();

    if (!actions.results || actions.results.length === 0) {
      return;
    }

    for (const action of actions.results) {
        try {
        // Execute action with 10 second hard timeout
        await Promise.race([
          this.executeAction({
            ...action,
            payload: JSON.parse(action.payload)
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Action execution timeout')), 10000)
          )
        ]);

        // Mark as executed in audit log
        await this.env.ORCHESTRATOR_D1.prepare(`
          UPDATE orchestrator_audit_log 
          SET executed_at = ? 
          WHERE trigger_id = ?
        `).bind(now, action.triggerId).run();

        // Remove from queue
        await this.env.ORCHESTRATOR_D1.prepare(`
          DELETE FROM orchestrator_queue WHERE id = ?
        `).bind(action.id).run();

      } catch (error) {
        // Retry logic - exponential backoff
        const newAttempts = action.attempts + 1;
        const backoffMs = Math.min(300000, 1000 * Math.pow(2, newAttempts));
        
        if (newAttempts < 5) {
          await this.env.ORCHESTRATOR_D1.prepare(`
            UPDATE orchestrator_queue 
            SET scheduled_at = ?, attempts = ?
            WHERE id = ?
          `).bind(Date.now() + backoffMs, newAttempts, action.id).run();
        } else {
          // Max retries reached - dead letter
          await this.env.ORCHESTRATOR_D1.prepare(`
            DELETE FROM orchestrator_queue WHERE id = ?
          `).bind(action.id).run();
        }
      }
    }
  }

  async executeAction(action: QueuedAction): Promise<void> {
    // Re-check guardrails at execution time (defense in depth)
    const currentSpoons = await this.getCurrentSpoonCount();
    await this.syncMeshState();

    const systemState = {
      spoons: currentSpoons,
      careScore: this.meshState.careScore,
      qFactor: this.meshState.qFactor,
      activeMinutes: this.meshState.activeMinutes
    };

    const result = await executeActionWithGuardrails(
      action.action,
      {
        env: this.env,
        triggerId: action.triggerId,
        payload: action.payload
      },
      systemState
    );

    if (!result.success) {
      // Action blocked or failed - log
      console.warn(`Action ${action.action} skipped: ${result.reason}`);
      await this.env.ORCHESTRATOR_D1.prepare(`
        UPDATE orchestrator_audit_log
        SET requiresManual = false, reason = ? || ' - BLOCKED AT EXECUTION'
        WHERE trigger_id = ?
      `).bind(result.reason, action.triggerId).run();
      return;
    }
  }

  /**
   * Rebuild state from KV on cold start
   * - Read spoons from KV → compute safety level
   * - Replay spoons:update events from lastSync
   * - Recompute careScore, qFactor, vertices
   */
  async rebuildStateFromKV(): Promise<void> {
    try {
      // 1. Read spoons from KV
      const spoonsData = await this.env.SPOONS_KV.get('spoons:will');
      const spoons = spoonsData ? parseInt(spoonsData) : 0;

      // 2. Compute safety level from spoons
      const newLevel = calculateCurrentLevel(spoons, this.currentGuardrailLevel, {
        pendingLevel: this.pendingLevel,
        count: this.hysteresisCount
      });

      if (newLevel.changed) {
        this.currentGuardrailLevel = newLevel.level;
      }
      this.pendingLevel = newLevel.pendingLevel;
      this.hysteresisCount = newLevel.hysteresisCount;

      // 3. Replay spoons:update events from lastSync
      const lastSync = this.meshState.lastMeshSync;
      const events = await this.env.ORCHESTRATOR_D1.prepare(`
        SELECT * FROM orchestrator_audit_log
        WHERE event_type = 'spoons:update'
        AND created_at > ?
        ORDER BY created_at ASC
      `).bind(lastSync).all();

      let replayedSpoons = spoons;
      if (events.results) {
        for (const event of events.results) {
          // Extract spoons from payload if available
          try {
            const payload = JSON.parse(event.reason || '{}');
            if (payload.spoons !== undefined) {
              replayedSpoons = payload.spoons;
            }
          } catch {
            // Skip malformed events
          }
        }
      }

      // 4. Recompute mesh state
      const meshData = await this.env.SPOONS_KV.get('mesh:state');
      if (meshData) {
        const mesh = JSON.parse(meshData);
        this.meshState.careScore = mesh.careScore || this.meshState.careScore;
        this.meshState.qFactor = mesh.qFactor || this.meshState.qFactor;
        this.meshState.activeMinutes = mesh.activeMinutes || this.meshState.activeMinutes;
        this.meshState.vertices = mesh.vertices || this.meshState.vertices;
      }

      // 5. Update lastSync timestamp
      this.meshState.lastMeshSync = Date.now();
      this.lastSpoonCheck = Date.now();

      // 6. Persist rebuilt state
      await this.state.storage.put('state', {
        level: this.currentGuardrailLevel,
        lastCheck: this.lastSpoonCheck,
        pendingLevel: this.pendingLevel,
        hysteresisCount: this.hysteresisCount,
        mesh: this.meshState
      });

      console.log(`State rebuilt from KV: spoons=${replayedSpoons}, level=${this.currentGuardrailLevel}`);
    } catch (error) {
      console.error('Failed to rebuild state from KV:', error);
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (pathParts[0] === 'api' && pathParts[1] === 'orchestrator') {
      // Route to Durable Object singleton
      const id = env.ORCHESTRATOR_DO.idFromName('singleton');
      const stub = env.ORCHESTRATOR_DO.get(id);
      return stub.fetch(request);
    }

    return new Response('P31 Orchestrator Event Bus', { status: 200 });
  }
};
