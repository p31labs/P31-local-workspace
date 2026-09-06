/**
 * P31 Orchestrator Action Registry
 * Pluggable action handlers for all existing automation systems
 */

import { evaluateGuardrails } from '../src/guardrails.js';

export interface ActionContext {
  env: any;
  triggerId: string;
  payload: Record<string, unknown>;
}

export interface ActionHandler {
  name: string;
  description: string;
  safetyLevel: number;
  defaultPriority: number;
  defaultBaseDelayMs: number;
  execute: (context: ActionContext) => Promise<boolean>;
}

export interface SystemState {
  spoons: number;
  careScore: number;
  qFactor: number;
  activeMinutes: number;
}

// P31 Forge Integration
const forgeGenerateDocument: ActionHandler = {
  name: 'forge:generate_document',
  description: 'Generate legal document, letter, or grant application',
  safetyLevel: 3,
  defaultPriority: 5,
  defaultBaseDelayMs: 0,
  execute: async (context) => {
    const { type, title, date } = context.payload;
    
    // Call P31 Forge API
    const response = await fetch('https://p31-forge.trimtab-signal.workers.dev/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        title,
        date,
        triggerId: context.triggerId
      })
    });

    return response.ok;
  }
};

// Command Center Integration
const commandCenterUpdateStatus: ActionHandler = {
  name: 'command-center:update_status',
  description: 'Update status dashboard indicator',
  safetyLevel: 2,
  defaultPriority: 4,
  defaultBaseDelayMs: 300000,
  execute: async (context) => {
    const { key, value, color } = context.payload;
    
    const response = await fetch('https://command-center.trimtab-signal.workers.dev/api/update', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.env.COMMAND_CENTER_TOKEN}`
      },
      body: JSON.stringify({ key, value, color })
    });

    return response.ok;
  }
};

// Social Broadcast Integration
const socialPublish: ActionHandler = {
  name: 'social:publish',
  description: 'Publish content to social channels',
  safetyLevel: 3,
  defaultPriority: 3,
  defaultBaseDelayMs: 600000,
  execute: async (context) => {
    const { content, channels } = context.payload;
    
    const response = await fetch('https://p31-social.trimtab-signal.workers.dev/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, channels, triggerId: context.triggerId })
    });

    return response.ok;
  }
};

// Grant Radar Integration
const grantScan: ActionHandler = {
  name: 'grant:scan',
  description: 'Scan grants.gov for new matching opportunities',
  safetyLevel: 2,
  defaultPriority: 6,
  defaultBaseDelayMs: 0,
  execute: async (context) => {
    const response = await fetch('https://grant-radar.trimtab-signal.workers.dev/api/scan', {
      method: 'POST'
    });

    return response.ok;
  }
};

// K4 Cage Integration
const k4PresenceUpdate: ActionHandler = {
  name: 'k4:presence_update',
  description: 'Update family mesh presence status',
  safetyLevel: 2,
  defaultPriority: 7,
  defaultBaseDelayMs: 0,
  execute: async (context) => {
    const { userId, status } = context.payload;
    
    const response = await fetch(`https://k4-cage.trimtab-signal.workers.dev/api/presence/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });

    return response.ok;
  }
};

// Health Monitor Integration
const healthCalciumAlert: ActionHandler = {
  name: 'health:calcium_alert',
  description: 'Critical calcium level monitoring and emergency alerting',
  safetyLevel: 1,
  defaultPriority: 10,
  defaultBaseDelayMs: 0,
  execute: async (context) => {
    const { level, timestamp, source = 'wearable' } = context.payload;
    
    // Update command center status
    if (context.env.COMMAND_CENTER_TOKEN) {
      await fetch('https://command-center.trimtab-signal.workers.dev/api/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.env.COMMAND_CENTER_TOKEN}`
        },
        body: JSON.stringify({
          key: 'health/calcium',
          value: level,
          color: level < 8.0 ? 'red' : level < 8.5 ? 'yellow' : 'green',
          timestamp
        })
      });
    }

    // Critical threshold (< 8.0 mg/dL) - Priority 10 bypass
    if (level < 8.0) {
      // Emergency SMS via Twilio
      if (context.env.TWILIO_SID && context.env.TWILIO_PHONE) {
        const numbers = [
          context.env.OPERATOR_PHONE,
          context.env.BRENDA_PHONE
        ].filter(Boolean);

        for (const to of numbers) {
          await fetch(`https://api.twilio.com/2010-04-01/Accounts/${context.env.TWILIO_SID}/Messages.json`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`${context.env.TWILIO_SID}:${context.env.TWILIO_TOKEN}`)}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              From: context.env.TWILIO_PHONE,
              To: to,
              Body: `⚠️ CRITICAL CALCIUM ALERT: ${level.toFixed(1)} mg/dL at ${new Date(timestamp).toLocaleTimeString()}. Administer calcium immediately.`
            })
          });
        }
      }

      // Immediately throttle all automation to Level 1
      // Override guardrail state to protect cognitive capacity
      await fetch('https://p31-orchestrator.trimtab-signal.workers.dev/api/orchestrator/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          type: 'state_change',
          source: 'health-monitor',
          action: 'system:throttle_all',
          priority: 10,
          safetyLevel: 1,
          baseDelayMs: 0,
          payload: { reason: 'Calcium emergency', level }
        })
      });
    }

    // Warning threshold (< 8.5 mg/dL)
    if (level >= 8.0 && level < 8.5) {
      if (context.env.TWILIO_SID && context.env.OPERATOR_PHONE) {
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${context.env.TWILIO_SID}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${context.env.TWILIO_SID}:${context.env.TWILIO_TOKEN}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            From: context.env.TWILIO_PHONE,
            To: context.env.OPERATOR_PHONE,
            Body: `⚠️ Calcium warning: ${level.toFixed(1)} mg/dL. Consider supplementation.`
          })
        });
      }
    }

    return true;
  }
};

// Action Registry
export const ACTION_REGISTRY = new Map<string, ActionHandler>();

// System Actions
const systemThrottleAll: ActionHandler = {
  name: 'system:throttle_all',
  description: 'Emergency system-wide throttle to Level 1',
  safetyLevel: 0,
  defaultPriority: 10,
  defaultBaseDelayMs: 0,
  execute: async (context) => {
    // Clear all non-critical actions from queue
    await context.env.ORCHESTRATOR_D1.prepare(`
      DELETE FROM orchestrator_queue 
      WHERE priority < 10
    `).run();

    // Log system state change
    await context.env.ORCHESTRATOR_D1.prepare(`
      INSERT INTO orchestrator_audit_log (
        id, trigger_id, event_type, action, spoons_at_evaluation,
        guardrail_level, approved, delay_ms, requires_manual,
        reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      context.triggerId,
      'system',
      'system:throttle_all',
      0,
      1,
      true,
      0,
      false,
      `System throttle activated: ${context.payload.reason}`,
      Date.now()
    ).run();

    return true;
  }
};

// Legal Deadline Orchestrator
const legalCourtDeadline: ActionHandler = {
  name: 'legal:court_deadline',
  description: 'Court deadline reminder and document generation',
  safetyLevel: 3,
  defaultPriority: 9,
  defaultBaseDelayMs: 0,
  execute: async (context) => {
    const { deadlineId, title, date, hoursRemaining, court, caseNumber } = context.payload;
    
    // Critical deadlines (<1h remaining) get Priority 10 bypass
    if (hoursRemaining <= 1) {
      // Emergency SMS
      if (context.env.TWILIO_SID) {
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${context.env.TWILIO_SID}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${context.env.TWILIO_SID}:${context.env.TWILIO_TOKEN}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            From: context.env.TWILIO_PHONE,
            To: context.env.OPERATOR_PHONE,
            Body: `⚠️ COURT DEADLINE: ${title} in ${hoursRemaining}h. Case: ${caseNumber} @ ${court}`
          })
        });
      }
    }

    // Generate hearing prep document
    await fetch('https://p31-forge.trimtab-signal.workers.dev/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'court',
        title: `${title} - Hearing Prep`,
        date: new Date(date).toISOString().split('T')[0],
        metadata: { caseNumber, court, hoursRemaining }
      })
    });

    // Update command center
    if (context.env.COMMAND_CENTER_TOKEN) {
      await fetch('https://command-center.trimtab-signal.workers.dev/api/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.env.COMMAND_CENTER_TOKEN}`
        },
        body: JSON.stringify({
          key: `legal/deadlines/${deadlineId}`,
          value: hoursRemaining,
          color: hoursRemaining < 24 ? 'red' : hoursRemaining < 72 ? 'yellow' : 'green'
        })
      });
    }

    return true;
  }
};

// Grant Pipeline Automator
const grantNewMatch: ActionHandler = {
  name: 'grant:new_match',
  description: 'New grant opportunity detected by grant radar',
  safetyLevel: 3,
  defaultPriority: 6,
  defaultBaseDelayMs: 3600000,
  execute: async (context) => {
    const { grantId, title, agency, deadline, amount, matchScore } = context.payload;
    
    // Only auto-generate if spoons > 6 (handled by guardrails)
    await fetch('https://p31-forge.trimtab-signal.workers.dev/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'grant',
        title: `${agency}: ${title}`,
        date: new Date(deadline).toISOString().split('T')[0],
        metadata: { amount, matchScore, grantId }
      })
    });

    // Create tracking entry
    await context.env.ORCHESTRATOR_D1.prepare(`
      INSERT INTO orchestrator_queue (
        id, trigger_id, action, payload, scheduled_at,
        priority, attempts, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      context.triggerId,
      'grant:schedule_reminder',
      JSON.stringify({ grantId, title, deadline }),
      new Date(deadline).getTime() - 86400000 * 7, // 7 days before deadline
      5,
      0,
      Date.now()
    ).run();

    return true;
  }
};

// Family Mesh Coordinator
const familyPresenceOnline: ActionHandler = {
  name: 'family:presence_online',
  description: 'Family member came online in K4 cage',
  safetyLevel: 2,
  defaultPriority: 4,
  defaultBaseDelayMs: 600000,
  execute: async (context) => {
    const { userId, name, onlineAt } = context.payload;
    
    // Only run if spoons > 3 (handled by guardrails)
    
    // Sync calendar events
    await fetch(`https://k4-cage.trimtab-signal.workers.dev/api/calendar/sync/${userId}`, {
      method: 'POST'
    });

    // Check for pending tasks
    const pendingTasks = await fetch(`https://k4-cage.trimtab-signal.workers.dev/api/tasks/pending/${userId}`)
      .then(res => res.json()).catch(() => ({ count: 0 }));

    // Gentle reminder only if tasks pending
    if (pendingTasks.count > 0 && context.env.TWILIO_SID) {
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${context.env.TWILIO_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${context.env.TWILIO_SID}:${context.env.TWILIO_TOKEN}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          From: context.env.TWILIO_PHONE,
          To: context.env.OPERATOR_PHONE,
          Body: `${name} is online. ${pendingTasks.count} pending tasks available.`
        })
      });
    }

    return true;
  }
};

// Register all actions
ACTION_REGISTRY.set(forgeGenerateDocument.name, forgeGenerateDocument);
ACTION_REGISTRY.set(commandCenterUpdateStatus.name, commandCenterUpdateStatus);
ACTION_REGISTRY.set(socialPublish.name, socialPublish);
ACTION_REGISTRY.set(grantScan.name, grantScan);
ACTION_REGISTRY.set(k4PresenceUpdate.name, k4PresenceUpdate);
ACTION_REGISTRY.set(healthCalciumAlert.name, healthCalciumAlert);
ACTION_REGISTRY.set(systemThrottleAll.name, systemThrottleAll);
ACTION_REGISTRY.set(legalCourtDeadline.name, legalCourtDeadline);
ACTION_REGISTRY.set(grantNewMatch.name, grantNewMatch);
ACTION_REGISTRY.set(familyPresenceOnline.name, familyPresenceOnline);

export function getActionHandler(actionName: string): ActionHandler | undefined {
  return ACTION_REGISTRY.get(actionName);
}

export function listActions(): ActionHandler[] {
  return Array.from(ACTION_REGISTRY.values());
}

export async function executeActionWithGuardrails(
  actionName: string,
  context: ActionContext,
  systemState: SystemState
): Promise<{ success: boolean; blocked?: boolean; reason?: string }> {
  const handler = getActionHandler(actionName);
  if (!handler) {
    return { success: false, blocked: true, reason: `Unknown action: ${actionName}` };
  }

  const evaluation = evaluateGuardrails(
    {
      safetyLevel: handler.safetyLevel,
      priority: handler.defaultPriority,
      baseDelayMs: handler.defaultBaseDelayMs
    },
    systemState
  );

  if (!evaluation.approved) {
    return { success: false, blocked: true, reason: evaluation.reason };
  }

  try {
    await handler.execute(context);
    return { success: true, blocked: false };
  } catch (error) {
    console.error(`Action execution failed: ${actionName}`, error);
    return { success: false, blocked: false, reason: `Execution error: ${error}` };
  }
}

export default {
  ACTION_REGISTRY,
  getActionHandler,
  listActions,
  executeActionWithGuardrails
};
