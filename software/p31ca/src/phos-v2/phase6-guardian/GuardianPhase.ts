/**
 * Phase 6: PHOS Guardian
 * Child safety, parental dashboard, and content filtering
 */

import type { PHOSPhase, PHOSEvent, PHOSConfig, PhaseState, ConvergenceData } from '../master';

export class GuardianPhase implements PHOSPhase {
  id = 'guardian';
  version = '0.1.0';
  status: 'alpha' | 'beta' | 'stable' | 'disabled' = 'alpha';

  private config: PHOSConfig | null = null;
  private active = false;
  private errorCount = 0;
  private lastActivity = 0;

  // Guardian-specific
  private safetyRules: Map<string, any> = new Map();
  private activeRestrictions: Set<string> = new Set();
  private parentDashboard: any = null;
  private childProfiles: Map<string, { age: number; restrictions: string[] }> = new Map();
  private alertQueue: Array<{ type: string; message: string; timestamp: number }> = [];

  async initialize(config: PHOSConfig): Promise<void> {
    this.config = config;
    console.log('[GuardianPhase] Initializing guardian system...');
    // TODO: Load safety rules and parent settings
    this.lastActivity = Date.now();
  }

  activate(): void {
    this.active = true;
    this.status = 'alpha';
    console.log('[GuardianPhase] Activated');
  }

  deactivate(): void {
    this.active = false;
    console.log('[GuardianPhase] Deactivated');
  }

  destroy(): void {
    this.safetyRules.clear();
    this.activeRestrictions.clear();
    this.childProfiles.clear();
    this.alertQueue = [];
    console.log('[GuardianPhase] Destroyed');
  }

  onConvergence(week: number, data: ConvergenceData): void {
    data.deliverables = [
      'Safety rule engine',
      'Parental dashboard',
      'Content filtering',
      'Activity reporting'
    ];
    data.dependencies = ['master', 'memory']; // Needs Memory for activity logs
    data.blockers = week < 7 ? ['Waiting for core features'] : [];
    data.confidence = week >= 7 ? 0.6 : 0.1;
  }

  getState(): PhaseState {
    return {
      status: this.active ? 'active' : 'paused',
      lastActivity: this.lastActivity,
      errorCount: this.errorCount,
      metrics: {
        activeRules: this.safetyRules.size,
        restrictedFeatures: this.activeRestrictions.size,
        childProfiles: this.childProfiles.size,
        pendingAlerts: this.alertQueue.length
      }
    };
  }

  emit(event: PHOSEvent): void {
    // Implementation via master registration
  }

  on(event: string, handler: (event: PHOSEvent) => void): void {
    // Implementation via master registration
  }

  // Guardian-specific methods
  registerChildProfile(childId: string, age: number, restrictions: string[]): void {
    this.childProfiles.set(childId, { age, restrictions });
    console.log(`[GuardianPhase] Registered child profile: ${childId}`);
    this.lastActivity = Date.now();
  }

  addSafetyRule(ruleId: string, rule: { type: string; condition: any; action: string }): void {
    this.safetyRules.set(ruleId, rule);
    console.log(`[GuardianPhase] Added safety rule: ${ruleId}`);
  }

  checkContentSafety(content: string, childId: string): { safe: boolean; reason?: string } {
    const profile = this.childProfiles.get(childId);
    if (!profile) {
      return { safe: false, reason: 'Unknown child profile' };
    }
    // TODO: Implement content safety check
    return { safe: true };
  }

  restrictFeature(featureId: string, until?: number): void {
    this.activeRestrictions.add(featureId);
    console.log(`[GuardianPhase] Feature restricted: ${featureId}`);
  }

  allowFeature(featureId: string): void {
    this.activeRestrictions.delete(featureId);
    console.log(`[GuardianPhase] Feature allowed: ${featureId}`);
  }

  isFeatureAllowed(featureId: string): boolean {
    return !this.activeRestrictions.has(featureId);
  }

  async getActivityReport(childId: string, days: number): Promise<any> {
    console.log(`[GuardianPhase] Generating activity report for ${childId}`);
    // TODO: Pull activity data from Memory phase
    return { childId, days, summary: {} };
  }

  sendAlert(type: 'warning' | 'blocked' | 'timeout', message: string): void {
    this.alertQueue.push({ type, message, timestamp: Date.now() });
    console.log(`[GuardianPhase] Alert: [${type}] ${message}`);
  }

  getPendingAlerts(): Array<{ type: string; message: string; timestamp: number }> {
    return [...this.alertQueue];
  }

  clearAlerts(): void {
    this.alertQueue = [];
  }
}
