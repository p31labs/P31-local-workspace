import type { Actor, Task, TaskDispatch, TaskType, TaskPriority, IntentType, EngagementLogEntry } from '../tasks/types';
import { createTaskDispatch } from '../tasks/types';

export interface CogPassActorProfile {
  id: string;
  displayName: string;
  relationshipType: string;
  neurotype?: string;
  sensoryProfile?: Record<string, number>;
  communicationPreferences?: {
    modality_order?: string[];
    bandwidth_spoons?: number;
    response_time_preference?: string;
  };
  schedule?: {
    availability?: Record<string, { start: string; end: string }[]>;
    timezone?: string;
  };
  trustScore?: number;
}

export interface DispatchOptions {
  preferredChannel?: 'voice' | 'notification' | 'app' | 'sms';
  priority?: TaskPriority;
  timeout?: number;
}

export class TaskDispatcher {
  private actors: Map<string, Actor> = new Map();
  private dispatchLog: EngagementLogEntry[] = [];
  private maxLogSize = 1000;

  registerActor(profile: CogPassActorProfile): void {
    const actor: Actor = {
      id: profile.id,
      displayName: profile.displayName,
      relationshipType: profile.relationshipType,
      trustScore: profile.trustScore ?? 0.5,
      availability: { status: 'available', nextAvailable: null, timeWindow: null },
      consentFlags: [],
    };

    if (profile.schedule?.availability) {
      const now = Date.now();
      actor.availability.timeWindow = {
        start: now,
        end: now + 24 * 60 * 60 * 1000,
      };
    }

    this.actors.set(profile.id, actor);
  }

  getActor(id: string): Actor | undefined {
    return this.actors.get(id);
  }

  getActorsByRelationship(type: string): Actor[] {
    return Array.from(this.actors.values()).filter(a => a.relationshipType === type);
  }

  getAvailableActors(): Actor[] {
    const now = Date.now();
    return Array.from(this.actors.values()).filter(a => {
      if (a.availability.status !== 'available') return false;
      if (a.availability.timeWindow) {
        return now >= a.availability.timeWindow.start && now <= a.availability.timeWindow.end;
      }
      return true;
    });
  }

  matchIntentToActor(intent: IntentType, context?: { excludeActor?: string }): Actor[] {
    const candidates = this.getAvailableActors()
      .filter(a => a.id !== context?.excludeActor);

    switch (intent) {
      case 'connect':
        return candidates.filter(a => a.trustScore > 0.3);
      case 'delegate':
        return candidates.filter(a => a.trustScore > 0.6);
      case 'play':
        return candidates.filter(a => a.relationshipType === 'child' || a.relationshipType === 'sibling');
      case 'checkin':
        return candidates.filter(a => a.trustScore > 0.4);
      case 'support':
        return candidates.filter(a => a.trustScore > 0.5);
      case 'schedule':
        return candidates.filter(a => a.availability.timeWindow !== null);
      default:
        return candidates;
    }
  }

  dispatch(task: Task, opts: DispatchOptions = {}): TaskDispatch {
    const channel = opts.preferredChannel ?? this.inferChannel(task);
    const dispatch = createTaskDispatch(task, channel);

    // Read from K₄ ledger for trust-weighted routing when available
    const storedTrust = this.getK4TrustScore(task.toActor);
    if (storedTrust !== null) {
      const actor = this.actors.get(task.toActor);
      if (actor) actor.trustScore = storedTrust;
    }

    this.log({
      taskId: task.id,
      event: 'dispatched',
      actor: task.toActor,
      timestamp: Date.now(),
      evidenceHash: this.computeEvidenceHash(dispatch),
      metadata: { channel, priority: task.priority },
    });

    return dispatch;
  }

  private inferChannel(task: Task): 'voice' | 'notification' | 'app' {
    if (task.priority === 'urgent' || task.priority === 'high') {
      return task.type === 'call' ? 'voice' : 'notification';
    }
    if (task.type === 'game') return 'voice';
    if (task.type === 'reminder') return 'notification';
    return 'app';
  }

  private log(entry: EngagementLogEntry): void {
    this.dispatchLog.push(entry);
    if (this.dispatchLog.length > this.maxLogSize) {
      this.dispatchLog.shift();
    }
  }

  private computeEvidenceHash(dispatch: TaskDispatch): string {
    const str = `${dispatch.taskId}:${dispatch.toActor}:${dispatch.dispatchedAt}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16).padStart(8, '0');
  }

  getDispatchLog(limit?: number): EngagementLogEntry[] {
    const log = [...this.dispatchLog].reverse();
    return limit ? log.slice(0, limit) : log;
  }

  getActorCount(): number {
    return this.actors.size;
  }

  private async getK4TrustScore(actorId: string): Promise<number | null> {
    try {
      const { K4Bridge } = await import('../../../../../apps/phos/src/lib/K4Bridge');
      const features = await K4Bridge.fetchFeatures();
      if (features?.trust) {
        return features.trust.L0 || null;
      }
      return null;
    } catch { return null; }
  }

  updateTrustScores(scores: Map<string, number> | Record<string, number>): void {
    for (const [id, actor] of this.actors.entries()) {
      const newScore = scores instanceof Map ? scores.get(id) : scores[id];
      if (newScore !== undefined) {
        actor.trustScore = newScore;
      }
    }
  }
}
