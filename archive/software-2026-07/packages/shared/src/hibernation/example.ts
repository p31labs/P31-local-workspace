/**
 * Hibernation API Example - PushSubscriptionDO
 * 
 * Demonstrates how to add hibernation to an existing Durable Object
 * without complete rewrite.
 */

import { HibernationAPI, HibernationAttachment } from './hibernation';
import type { DurableObjectState } from '@cloudflare/workers-types';

interface PushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userId: string;
  deviceId: string;
  createdAt: number;
  lastUsed: number;
}

/**
 * Example: Adding hibernation to an existing DO
 * 
 * Before (no hibernation):
 * ```typescript
 * export class PushSubscriptionDO {
 *   private subscriptions = new Map();
 *   
 *   constructor(private state: DurableObjectState) {
 *     // Always running, always billing
 *   }
 * }
 * ```
 * 
 * After (with hibernation):
 */
export class HibernatablePushSubscriptionDO {
  private state: DurableObjectState;
  private subscriptions: Map<string, PushSubscription> = new Map();
  private hibernation: HibernationAPI;

  constructor(state: DurableObjectState, env: unknown) {
    this.state = state;

    // Initialize hibernation API
    this.hibernation = new HibernationAPI(state, {
      // Hibernate after 5 minutes of inactivity
      autoHibernateDelay: 5 * 60 * 1000,
      
      // Wake on any request
      wakeOnHttp: true,
      wakeOnWebSocket: false,
      
      // Before hibernation: save state to storage
      onBeforeHibernate: async () => {
        console.log('[PushSubscriptionDO] Preparing for hibernation...');
        await this.state.storage.put('subscriptions', 
          Array.from(this.subscriptions.entries())
        );
      },
      
      // After waking: restore state from attachment
      onAfterWake: async (attachment: HibernationAttachment) => {
        console.log(`[PushSubscriptionDO] Woke from hibernation, ` +
          `was asleep for ${attachment.stateSnapshot._hibernationDuration}ms`);
        
        // Restore subscriptions from storage
        const stored = await this.state.storage.get<[string, PushSubscription][]>(
          'subscriptions'
        );
        if (stored) {
          this.subscriptions = new Map(stored);
        }
      },
      
      // On crisis ping: urgent wake
      onCrisisPing: async (urgency) => {
        console.log(`[PushSubscriptionDO] Crisis ping! Urgency: ${urgency}`);
        
        // Handle crisis notification
        // This is called immediately upon wake
        await this.handleCrisisNotification(urgency);
      },
    });

    // Set up state serialization
    this.hibernation.setStateHandlers(
      () => this.serializeState(),
      (snapshot) => this.deserializeState(snapshot)
    );

    // Load initial state
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<[string, PushSubscription][]>('subscriptions');
      if (stored) {
        this.subscriptions = new Map(stored);
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    // Record activity (resets hibernation timer)
    this.hibernation.recordActivity();

    const url = new URL(request.url);
    const path = url.pathname;

    // Handle hibernation control endpoints
    if (path === '/hibernate' && request.method === 'POST') {
      await this.hibernation.hibernate(
        Array.from(this.subscriptions.values()).map(s => s.userId)
      );
      return new Response(JSON.stringify({ hibernated: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (path === '/stats' && request.method === 'GET') {
      const stats = this.hibernation.getStats();
      return new Response(JSON.stringify(stats), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (path === '/crisis-ping' && request.method === 'POST') {
      const { urgency } = await request.json() as { urgency: string };
      await this.hibernation.handleCrisisPing(urgency);
      return new Response(JSON.stringify({ woke: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Regular endpoints
    if (path === '/subscribe' && request.method === 'POST') {
      return this.handleSubscribe(request);
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleSubscribe(request: Request): Promise<Response> {
    const data = await request.json() as PushSubscription;
    this.subscriptions.set(data.deviceId, data);
    
    // Persist immediately (in case of hibernation)
    await this.state.storage.put('subscriptions', 
      Array.from(this.subscriptions.entries())
    );

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleCrisisNotification(urgency: string): Promise<void> {
    // Send push notifications to all subscriptions
    // This runs immediately after crisis ping wake
    console.log(`[PushSubscriptionDO] Sending crisis notifications to ` +
      `${this.subscriptions.size} devices`);
    
    // Actual push sending logic here...
  }

  private serializeState(): Record<string, unknown> {
    return {
      subscriptionCount: this.subscriptions.size,
      userIds: Array.from(this.subscriptions.values()).map(s => s.userId),
      _timestamp: Date.now(),
    };
  }

  private deserializeState(snapshot: Record<string, unknown>): void {
    console.log('[PushSubscriptionDO] Restored state:', snapshot);
  }
}

/**
 * Alternative: Using class inheritance
 */
import { HibernatableDurableObject } from './hibernation';

export class InheritedPushSubscriptionDO extends HibernatableDurableObject {
  private subscriptions: Map<string, PushSubscription> = new Map();

  constructor(state: DurableObjectState, env: unknown) {
    super(state, env, {
      autoHibernateDelay: 5 * 60 * 1000,
      
      onBeforeHibernate: async () => {
        await this.state.storage.put('subscriptions', 
          Array.from(this.subscriptions.entries())
        );
      },
      
      onAfterWake: async (attachment) => {
        const stored = await this.state.storage.get<[string, PushSubscription][]>(
          'subscriptions'
        );
        if (stored) {
          this.subscriptions = new Map(stored);
        }
      },
    });

    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<[string, PushSubscription][]>(
        'subscriptions'
      );
      if (stored) {
        this.subscriptions = new Map(stored);
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    // Parent class handles activity tracking
    this.recordActivity();

    const url = new URL(request.url);
    
    if (url.pathname === '/subscribe') {
      const data = await request.json() as PushSubscription;
      this.subscriptions.set(data.deviceId, data);
      await this.state.storage.put('subscriptions', 
        Array.from(this.subscriptions.entries())
      );

      return new Response(JSON.stringify({ 
        success: true,
        hibernating: this.getIsHibernating(),
        stats: this.getStats(),
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  }
}

/**
 * Usage in wrangler.toml:
 * 
 * [[durable_objects.bindings]]
 * name = "PUSH_SUBSCRIPTION"
 * class_name = "HibernatablePushSubscriptionDO"
 * 
 * [[migrations]]
 * tag = "v1-hibernation"
 * new_classes = ["HibernatablePushSubscriptionDO"]
 */
