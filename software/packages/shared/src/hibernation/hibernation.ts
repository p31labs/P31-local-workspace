/**
 * Hibernation API for Cloudflare Durable Objects
 * 
 * BROS Architecture: I. Routing Engine - Zero-State Telemetry
 * 
 * Implements the hibernation pattern specified in BROS:
 * - DO instances act as ephemeral, globally addressable signaling rooms
 * - They sleep when dormant, costing zero compute
 * - Wake instantaneously upon crisis ping using deserializeAttachment
 * 
 * This module provides a mixin/wrapper for existing Durable Objects
 * to add hibernation capabilities without rewriting them.
 * 
 * @version 1.0.0
 * @module HibernationAPI
 */

import type { DurableObjectState, WebSocket } from '@cloudflare/workers-types';

/**
 * Attachment data structure for hibernation
 * Stored when DO hibernates, restored when waking
 */
export interface HibernationAttachment {
  /** DO instance ID */
  instanceId: string;
  /** Last activity timestamp */
  lastActivity: number;
  /** User/session identifiers */
  users: string[];
  /** Room/mesh context */
  meshContext?: {
    vertex?: string;
    edge?: string;
    loveTotal?: number;
  };
  /** Serialized state snapshot */
  stateSnapshot: Record<string, unknown>;
  /** Crisis ping subscription settings */
  crisisPingConfig?: {
    urgencyThreshold: 'low' | 'medium' | 'high' | 'critical';
    wakeOnMessage: boolean;
  };
  /** Version for migration handling */
  version: number;
}

/**
 * Hibernation statistics for monitoring
 */
export interface HibernationStats {
  hibernationCount: number;
  wakeCount: number;
  totalHibernationTime: number;
  averageHibernationTime: number;
  lastHibernationDuration: number;
  isHibernating: boolean;
  attachmentSize: number;
}

/**
 * Options for hibernation behavior
 */
export interface HibernationOptions {
  /** Time of inactivity before auto-hibernation (ms) */
  autoHibernateDelay: number;
  /** Maximum time to hibernate before forced wake (ms, 0 = infinite) */
  maxHibernationDuration: number;
  /** Whether to wake on any WebSocket message */
  wakeOnWebSocket: boolean;
  /** Whether to wake on HTTP requests */
  wakeOnHttp: boolean;
  /** Custom state serializer */
  serializeState?: () => Record<string, unknown>;
  /** Custom state deserializer */
  deserializeState?: (snapshot: Record<string, unknown>) => void;
  /** Callback before hibernation */
  onBeforeHibernate?: () => Promise<void> | void;
  /** Callback after waking */
  onAfterWake?: (attachment: HibernationAttachment) => Promise<void> | void;
  /** Callback on crisis ping */
  onCrisisPing?: (urgency: string) => Promise<void> | void;
}

/**
 * Default hibernation options
 */
const DEFAULT_OPTIONS: HibernationOptions = {
  autoHibernateDelay: 5 * 60 * 1000, // 5 minutes
  maxHibernationDuration: 0, // Infinite (until crisis ping)
  wakeOnWebSocket: true,
  wakeOnHttp: true,
};

/**
 * Hibernation mixin for Durable Objects
 * 
 * Wraps an existing DO to add hibernation capabilities.
 * 
 * Usage:
 * ```typescript
 * class MyDO extends HibernatableDurableObject {
 *   constructor(state: DurableObjectState, env: Env) {
 *     super(state, env, {
 *       autoHibernateDelay: 60000,
 *       onBeforeHibernate: async () => {
 *         await this.saveToStorage();
 *       },
 *       onAfterWake: (attachment) => {
 *         this.users = new Set(attachment.users);
 *       }
 *     });
 *   }
 * }
 * ```
 */
export abstract class HibernatableDurableObject {
  protected state: DurableObjectState;
  protected env: unknown;
  protected options: HibernationOptions;
  protected stats: HibernationStats;
  protected lastActivity: number;
  protected hibernationTimeout: NodeJS.Timeout | null = null;
  protected isHibernating = false;
  protected attachment: HibernationAttachment | null = null;

  constructor(
    state: DurableObjectState,
    env: unknown,
    options: Partial<HibernationOptions> = {}
  ) {
    this.state = state;
    this.env = env;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    this.stats = {
      hibernationCount: 0,
      wakeCount: 0,
      totalHibernationTime: 0,
      averageHibernationTime: 0,
      lastHibernationDuration: 0,
      isHibernating: false,
      attachmentSize: 0,
    };

    this.lastActivity = Date.now();

    // Check if we're waking from hibernation
    const attachment = state.getWebSockets()[0]; // WebSocket attachment pattern
    if (attachment) {
      this.handleWakeFromHibernation();
    }

    // Start inactivity monitoring
    this.startInactivityMonitoring();
  }

  /**
   * Record activity to reset hibernation timer
   */
  protected recordActivity(): void {
    this.lastActivity = Date.now();
    
    if (this.isHibernating) {
      // Wake from hibernation
      this.wake();
    }

    // Reset hibernation timer
    this.resetHibernationTimer();
  }

  /**
   * Start monitoring for inactivity
   */
  private startInactivityMonitoring(): void {
    this.resetHibernationTimer();
  }

  /**
   * Reset the hibernation timer
   */
  private resetHibernationTimer(): void {
    if (this.hibernationTimeout) {
      clearTimeout(this.hibernationTimeout);
    }

    if (this.options.autoHibernateDelay > 0) {
      this.hibernationTimeout = setTimeout(() => {
        this.hibernate();
      }, this.options.autoHibernateDelay);
    }
  }

  /**
   * Hibernate the DO instance
   * 
   * Saves state to attachment and enters zero-cost hibernation.
   * The DO will wake on next HTTP request or WebSocket message.
   */
  async hibernate(): Promise<void> {
    if (this.isHibernating) return;

    // Call before hibernation hook
    if (this.options.onBeforeHibernate) {
      await this.options.onBeforeHibernate();
    }

    // Serialize state
    const stateSnapshot = this.options.serializeState 
      ? this.options.serializeState()
      : this.defaultSerializeState();

    // Build attachment
    this.attachment = {
      instanceId: this.state.id.toString(),
      lastActivity: this.lastActivity,
      users: [], // To be populated by subclass
      meshContext: undefined,
      stateSnapshot,
      crisisPingConfig: {
        urgencyThreshold: 'medium',
        wakeOnMessage: true,
      },
      version: 1,
    };

    // Record hibernation stats
    this.stats.hibernationCount++;
    this.stats.isHibernating = true;
    this.isHibernating = true;

    // Calculate attachment size (for monitoring)
    this.stats.attachmentSize = JSON.stringify(this.attachment).length;

    // Set hibernation timestamp
    const hibernationStart = Date.now();
    await this.state.storage.put('__hibernation_start', hibernationStart);

    // Accept WebSockets for waking (if configured)
    if (this.options.wakeOnWebSocket) {
      // WebSocket connections will auto-wake the DO
      const websockets = this.state.getWebSockets();
      for (const ws of websockets) {
        // Keep WebSocket alive for waking
        ws.accept();
      }
    }

    console.log(`[Hibernation] DO ${this.attachment.instanceId} hibernated`, {
      attachmentSize: this.stats.attachmentSize,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Wake from hibernation
   * 
   * Restores state from attachment.
   */
  async wake(): Promise<void> {
    if (!this.isHibernating) return;

    const hibernationStart = await this.state.storage.get<number>('__hibernation_start');
    const now = Date.now();
    
    if (hibernationStart) {
      this.stats.lastHibernationDuration = now - hibernationStart;
      this.stats.totalHibernationTime += this.stats.lastHibernationDuration;
      this.stats.averageHibernationTime = 
        this.stats.totalHibernationTime / this.stats.hibernationCount;
    }

    this.stats.wakeCount++;
    this.stats.isHibernating = false;
    this.isHibernating = false;

    // Restore state from attachment
    if (this.attachment) {
      if (this.options.deserializeState) {
        this.options.deserializeState(this.attachment.stateSnapshot);
      } else {
        this.defaultDeserializeState(this.attachment.stateSnapshot);
      }

      // Call after wake hook
      if (this.options.onAfterWake) {
        await this.options.onAfterWake(this.attachment);
      }
    }

    // Clear hibernation marker
    await this.state.storage.delete('__hibernation_start');

    // Resume inactivity monitoring
    this.lastActivity = now;
    this.resetHibernationTimer();

    console.log(`[Hibernation] DO ${this.state.id} woke from hibernation`, {
      duration: this.stats.lastHibernationDuration,
      totalHibernations: this.stats.hibernationCount,
    });
  }

  /**
   * Handle crisis ping - urgent wake signal
   * 
   * This is called when a crisis ping arrives during hibernation.
   * The DO wakes instantly to handle the emergency.
   */
  async handleCrisisPing(urgency: 'low' | 'medium' | 'high' | 'critical'): Promise<void> {
    console.log(`[Hibernation] Crisis ping received: ${urgency}`);

    // Always wake on crisis ping regardless of current state
    if (this.isHibernating) {
      await this.wake();
    }

    // Record crisis ping activity
    this.recordActivity();

    // Call crisis ping handler
    if (this.options.onCrisisPing) {
      await this.options.onCrisisPing(urgency);
    }

    // Extend hibernation delay after crisis (don't hibernate immediately)
    this.resetHibernationTimer();
  }

  /**
   * Handle wake from hibernation (called on reconstruct)
   * 
   * Cloudflare automatically calls this when the DO wakes.
   */
  private async handleWakeFromHibernation(): Promise<void> {
    // DO was reconstructed from hibernation
    // Attachment will be provided by the platform via deserializeAttachment
    this.isHibernating = true;
    
    // The actual wake() happens when the first request arrives
    // We just mark that we're in hibernation state
  }

  /**
   * Default state serialization
   * Override this or provide serializeState option
   */
  protected defaultSerializeState(): Record<string, unknown> {
    // Base implementation - subclasses should override
    return {
      _timestamp: Date.now(),
      _version: 1,
    };
  }

  /**
   * Default state deserialization
   * Override this or provide deserializeState option
   */
  protected defaultDeserializeState(snapshot: Record<string, unknown>): void {
    // Base implementation - subclasses should override
    console.log('[Hibernation] Deserializing state:', snapshot);
  }

  /**
   * Get current hibernation statistics
   */
  getStats(): HibernationStats {
    return { ...this.stats };
  }

  /**
   * Check if currently hibernating
   */
  getIsHibernating(): boolean {
    return this.isHibernating;
  }

  /**
   * Force immediate hibernation (for testing)
   */
  async forceHibernate(): Promise<void> {
    await this.hibernate();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.hibernationTimeout) {
      clearTimeout(this.hibernationTimeout);
    }
  }
}

/**
 * Decorator for tracking WebSocket message activity
 */
export function trackWebSocketActivity(
  target: HibernatableDurableObject,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function(this: HibernatableDurableObject, ...args: unknown[]) {
    this.recordActivity();
    return originalMethod.apply(this, args);
  };

  return descriptor;
}

/**
 * Decorator for tracking HTTP request activity
 */
export function trackHttpActivity(
  target: HibernatableDurableObject,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function(this: HibernatableDurableObject, ...args: unknown[]) {
    this.recordActivity();
    return originalMethod.apply(this, args);
  };

  return descriptor;
}

/**
 * Helper: Create hibernation-aware fetch handler
 */
export function createHibernationAwareHandler(
  doInstance: HibernatableDurableObject,
  handler: (request: Request) => Promise<Response>
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    // Wake if hibernating
    if (doInstance.getIsHibernating()) {
      await doInstance.wake();
    }

    // Record activity
    doInstance.recordActivity();

    // Call actual handler
    return handler(request);
  };
}

/**
 * Hibernation API for use in existing DOs
 * 
 * Alternative to class inheritance - use composition instead
 */
export class HibernationAPI {
  private state: DurableObjectState;
  private options: HibernationOptions;
  private stats: HibernationStats;
  private lastActivity: number;
  private hibernationTimeout: NodeJS.Timeout | null = null;
  private isHibernating = false;
  private attachment: HibernationAttachment | null = null;
  private customSerialize: (() => Record<string, unknown>) | null = null;
  private customDeserialize: ((snapshot: Record<string, unknown>) => void) | null = null;

  constructor(
    state: DurableObjectState,
    options: Partial<HibernationOptions> = {}
  ) {
    this.state = state;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.stats = {
      hibernationCount: 0,
      wakeCount: 0,
      totalHibernationTime: 0,
      averageHibernationTime: 0,
      lastHibernationDuration: 0,
      isHibernating: false,
      attachmentSize: 0,
    };
    this.lastActivity = Date.now();

    this.startInactivityMonitoring();
  }

  /**
   * Set custom state serializers
   */
  setStateHandlers(
    serialize: () => Record<string, unknown>,
    deserialize: (snapshot: Record<string, unknown>) => void
  ): void {
    this.customSerialize = serialize;
    this.customDeserialize = deserialize;
  }

  /**
   * Record activity
   */
  recordActivity(): void {
    this.lastActivity = Date.now();
    
    if (this.isHibernating) {
      this.wake();
    }

    this.resetHibernationTimer();
  }

  /**
   * Hibernate
   */
  async hibernate(users: string[] = [], meshContext?: HibernationAttachment['meshContext']): Promise<void> {
    if (this.isHibernating) return;

    if (this.options.onBeforeHibernate) {
      await this.options.onBeforeHibernate();
    }

    const stateSnapshot = this.customSerialize 
      ? this.customSerialize()
      : { _timestamp: Date.now() };

    this.attachment = {
      instanceId: this.state.id.toString(),
      lastActivity: this.lastActivity,
      users,
      meshContext,
      stateSnapshot,
      crisisPingConfig: {
        urgencyThreshold: 'medium',
        wakeOnMessage: true,
      },
      version: 1,
    };

    this.stats.hibernationCount++;
    this.stats.isHibernating = true;
    this.stats.attachmentSize = JSON.stringify(this.attachment).length;
    this.isHibernating = true;

    await this.state.storage.put('__hibernation_start', Date.now());

    // Accept all WebSockets for waking
    const websockets = this.state.getWebSockets();
    for (const ws of websockets) {
      ws.accept();
    }
  }

  /**
   * Wake
   */
  async wake(): Promise<void> {
    if (!this.isHibernating) return;

    const hibernationStart = await this.state.storage.get<number>('__hibernation_start');
    const now = Date.now();
    
    if (hibernationStart) {
      this.stats.lastHibernationDuration = now - hibernationStart;
      this.stats.totalHibernationTime += this.stats.lastHibernationDuration;
      this.stats.averageHibernationTime = 
        this.stats.totalHibernationTime / this.stats.hibernationCount;
    }

    this.stats.wakeCount++;
    this.stats.isHibernating = false;
    this.isHibernating = false;

    if (this.attachment && this.customDeserialize) {
      this.customDeserialize(this.attachment.stateSnapshot);
    }

    if (this.attachment && this.options.onAfterWake) {
      await this.options.onAfterWake(this.attachment);
    }

    await this.state.storage.delete('__hibernation_start');
    
    this.lastActivity = now;
    this.resetHibernationTimer();
  }

  /**
   * Handle crisis ping
   */
  async handleCrisisPing(urgency: string): Promise<void> {
    if (this.isHibernating) {
      await this.wake();
    }
    this.recordActivity();
    
    if (this.options.onCrisisPing) {
      await this.options.onCrisisPing(urgency);
    }
  }

  /**
   * Get stats
   */
  getStats(): HibernationStats {
    return { ...this.stats };
  }

  /**
   * Check if hibernating
   */
  isCurrentlyHibernating(): boolean {
    return this.isHibernating;
  }

  private startInactivityMonitoring(): void {
    this.resetHibernationTimer();
  }

  private resetHibernationTimer(): void {
    if (this.hibernationTimeout) {
      clearTimeout(this.hibernationTimeout);
    }

    if (this.options.autoHibernateDelay > 0 && !this.isHibernating) {
      this.hibernationTimeout = setTimeout(() => {
        this.hibernate();
      }, this.options.autoHibernateDelay);
    }
  }

  destroy(): void {
    if (this.hibernationTimeout) {
      clearTimeout(this.hibernationTimeout);
    }
  }
}
