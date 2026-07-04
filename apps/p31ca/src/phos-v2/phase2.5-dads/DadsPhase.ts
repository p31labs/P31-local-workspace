import type { PHOSPhase, PHOSEvent, PHOSConfig, PhaseState, ConvergenceData } from '../master';
import { TaskDispatcher } from './dispatch/router';
import type { TaskType, IntentType, Task } from './tasks/types';
import { createTask } from './tasks/types';

export class DadsPhase implements PHOSPhase {
  id = 'dads';
  version = '0.1.0';
  status: 'alpha' | 'beta' | 'stable' | 'disabled' = 'alpha';

  private config: PHOSConfig | null = null;
  private active = false;
  private errorCount = 0;
  private lastActivity = 0;
  private dispatcher: TaskDispatcher = new TaskDispatcher();

  // DADS-specific metrics
  private dispatchCount = 0;
  private actorCount = 0;

  async initialize(config: PHOSConfig): Promise<void> {
    this.config = config;
    this.lastActivity = Date.now();
  }

  activate(): void {
    this.active = true;
    this.status = 'alpha';
    this.actorCount = this.dispatcher.getActorCount();
  }

  injectTrustScores(scores: Map<string, number> | Record<string, number>): void {
    this.dispatcher.updateTrustScores(scores);
  }

  deactivate(): void {
    this.active = false;
  }

  destroy(): void {
    this.active = false;
  }

  registerActorFromCogPass(profile: {
    id: string;
    displayName: string;
    relationshipType: string;
    trustScore?: number;
    communicationPreferences?: Record<string, unknown>;
    schedule?: Record<string, unknown>;
  }): void {
    this.dispatcher.registerActor({
      id: profile.id,
      displayName: profile.displayName,
      relationshipType: profile.relationshipType,
      trustScore: profile.trustScore,
      communicationPreferences: profile.communicationPreferences as any,
      schedule: profile.schedule as any,
    });
    this.actorCount = this.dispatcher.getActorCount();
  }

  dispatchTask(params: {
    type: TaskType;
    intent: IntentType;
    title: string;
    description?: string;
    fromActor: string;
    toActor: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }): Task {
    const task = createTask(params);
    this.dispatcher.dispatch(task);
    this.dispatchCount++;
    this.lastActivity = Date.now();

    // Push K₄ entry for tasks dimension
    try {
      const { K4Bridge } = await import('../../../../../phos/src/lib/K4Bridge');
      K4Bridge.pushEntry({
        level: 1,
        feature: 'tasks',
        vertex: 'AGGREGATE→VERIFY',
        edge: 'E23',
        value: 1,
        source: `dads:${params.intent}:${params.type}`,
        node_id: params.toActor,
      });
    } catch { /* K4Bridge not available */ }

    return task;
  }

  getAvailableActors() {
    return this.dispatcher.getAvailableActors();
  }

  getActor(id: string) {
    return this.dispatcher.getActor(id);
  }

  onConvergence(week: number, data: ConvergenceData): void {
    data.deliverables = [
      'Task dispatch engine',
      'Actor registry from CogPass',
      'Intent-to-actor matching',
      'Engagement logging',
    ];
    data.dependencies = ['bros', 'router'];
    data.blockers = [];
    data.confidence = week >= 4 ? 0.85 : 0.3;
  }

  getState(): PhaseState {
    return {
      status: this.active ? 'active' : 'paused',
      lastActivity: this.lastActivity,
      errorCount: this.errorCount,
      metrics: {
        dispatchCount: this.dispatchCount,
        actorCount: this.actorCount,
      },
    };
  }

  emit(_event: PHOSEvent): void {}
  on(_event: string, _handler: (event: PHOSEvent) => void): void {}
}
