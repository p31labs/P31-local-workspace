/**
 * Enhanced State Management Communication Patterns for P31 Labs
 * 
 * Provides improved communication patterns between state stores,
 * better synchronization mechanisms, and more robust state persistence.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import React from 'react';

export interface StateSyncOptions {
  /** Enable state synchronization between stores */
  enableSync?: boolean;
  /** Enable state persistence */
  enablePersistence?: boolean;
  /** Storage key prefix */
  storagePrefix?: string;
  /** Sync delay in milliseconds */
  syncDelay?: number;
  /** Enable conflict resolution */
  enableConflictResolution?: boolean;
}

export interface StateSyncEvent {
  /** Store name */
  store: string;
  /** Action type */
  action: string;
  /** Payload */
  payload: any;
  /** Timestamp */
  timestamp: number;
  /** Source store */
  source: string;
}

/**
 * State synchronization manager
 */
export class StateSyncManager {
  private stores: Map<string, any> = new Map();
  private syncCallbacks: Map<string, Array<(event: StateSyncEvent) => void>> = new Map();
  private persistenceCallbacks: Map<string, Array<(state: any) => void>> = new Map();
  private options: Required<StateSyncOptions>;

  constructor(options: StateSyncOptions = {}) {
    this.options = {
      enableSync: true,
      enablePersistence: true,
      storagePrefix: 'p31-state-',
      syncDelay: 100,
      enableConflictResolution: true,
      ...options
    };
  }

  /**
   * Register a store for synchronization
   */
  registerStore(name: string, store: any): void {
    this.stores.set(name, store);
    
    // Subscribe to store changes
    store.subscribe((state: any, prevState: any) => {
      if (this.options.enableSync) {
        this.handleStateChange(name, state, prevState);
      }
      
      if (this.options.enablePersistence) {
        this.persistState(name, state);
      }
    });
  }

  /**
   * Handle state changes and trigger synchronization
   */
  private handleStateChange(storeName: string, newState: any, prevState: any): void {
    const event: StateSyncEvent = {
      store: storeName,
      action: 'state_change',
      payload: { newState, prevState },
      timestamp: Date.now(),
      source: storeName
    };

    // Trigger sync callbacks
    const callbacks = this.syncCallbacks.get(storeName) || [];
    callbacks.forEach(callback => callback(event));

    // Sync with other stores
    this.syncWithOtherStores(storeName, event);
  }

  /**
   * Sync state with other stores
   */
  private syncWithOtherStores(sourceStore: string, event: StateSyncEvent): void {
    this.stores.forEach((store, storeName) => {
      if (storeName !== sourceStore) {
        this.attemptSync(store, storeName, event);
      }
    });
  }

  /**
   * Attempt to sync state with another store
   */
  private attemptSync(targetStore: any, targetStoreName: string, event: StateSyncEvent): void {
    try {
      // Check if target store has a sync handler
      if (targetStore.syncWith) {
        targetStore.syncWith(event);
      }
    } catch (error) {
      console.warn(`Failed to sync state with ${targetStoreName}:`, error);
    }
  }

  /**
   * Persist state to storage
   */
  private persistState(storeName: string, state: any): void {
    try {
      const key = `${this.options.storagePrefix}${storeName}`;
      localStorage.setItem(key, JSON.stringify(state));
      
      // Trigger persistence callbacks
      const callbacks = this.persistenceCallbacks.get(storeName) || [];
      callbacks.forEach(callback => callback(state));
    } catch (error) {
      console.warn(`Failed to persist state for ${storeName}:`, error);
    }
  }

  /**
   * Load persisted state
   */
  loadPersistedState(storeName: string): any {
    try {
      const key = `${this.options.storagePrefix}${storeName}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn(`Failed to load persisted state for ${storeName}:`, error);
      return null;
    }
  }

  /**
   * Add sync callback for a store
   */
  addSyncCallback(storeName: string, callback: (event: StateSyncEvent) => void): void {
    if (!this.syncCallbacks.has(storeName)) {
      this.syncCallbacks.set(storeName, []);
    }
    this.syncCallbacks.get(storeName)!.push(callback);
  }

  /**
   * Add persistence callback for a store
   */
  addPersistenceCallback(storeName: string, callback: (state: any) => void): void {
    if (!this.persistenceCallbacks.has(storeName)) {
      this.persistenceCallbacks.set(storeName, []);
    }
    this.persistenceCallbacks.get(storeName)!.push(callback);
  }

  /**
   * Remove sync callback
   */
  removeSyncCallback(storeName: string, callback: (event: StateSyncEvent) => void): void {
    const callbacks = this.syncCallbacks.get(storeName);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Remove persistence callback
   */
  removePersistenceCallback(storeName: string, callback: (state: any) => void): void {
    const callbacks = this.persistenceCallbacks.get(storeName);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Clear all persisted state
   */
  clearAllPersistedState(): void {
    this.stores.forEach((_, storeName) => {
      const key = `${this.options.storagePrefix}${storeName}`;
      localStorage.removeItem(key);
    });
  }

  /**
   * Get all registered stores
   */
  getStores(): string[] {
    return Array.from(this.stores.keys());
  }
}

/**
 * Enhanced Zustand store with synchronization and persistence
 */
export function createEnhancedStore<T extends Record<string, any>>(
  storeName: string,
  createState: (set: any, get: any, api: any) => T,
  options: StateSyncOptions = {}
) {
  const syncManager = new StateSyncManager(options);
  
  // Create the store with middleware
  const useStore = create<T>()(
    devtools(
      subscribeWithSelector(
        immer((set, get, api) => {
          // Load persisted state
          const persistedState = syncManager.loadPersistedState(storeName);
          if (persistedState) {
            set(persistedState, false, 'persisted');
          }

          // Create the store
          const store = createState(set, get, api);
          
          // Register with sync manager
          syncManager.registerStore(storeName, useStore);
          
          return store;
        })
      ),
      {
        name: storeName
      }
    )
  );

  // Add sync methods to the store
  (useStore as any).syncWith = (event: StateSyncEvent) => {
    // Handle incoming sync events
    if (event.store !== storeName) {
      // Implement conflict resolution if enabled
      if (options.enableConflictResolution) {
        // Simple last-write-wins strategy
        if (event.timestamp > Date.now() - 1000) {
          // Only sync if event is recent
          // This would be enhanced with more sophisticated conflict resolution
        }
      }
    }
  };

  (useStore as any).getSyncManager = () => syncManager;

  return useStore;
}

/**
 * Message broker for inter-store communication
 */
export class MessageBroker {
  private subscribers: Map<string, Array<(message: any) => void>> = new Map();
  private messageHistory: Map<string, any[]> = new Map();

  /**
   * Subscribe to a message type
   */
  subscribe(messageType: string, callback: (message: any) => void): () => void {
    if (!this.subscribers.has(messageType)) {
      this.subscribers.set(messageType, []);
    }
    
    this.subscribers.get(messageType)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(messageType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Publish a message
   */
  publish(messageType: string, message: any): void {
    // Add to message history
    if (!this.messageHistory.has(messageType)) {
      this.messageHistory.set(messageType, []);
    }
    this.messageHistory.get(messageType)!.push({
      ...message,
      timestamp: Date.now()
    });

    // Notify subscribers
    const callbacks = this.subscribers.get(messageType) || [];
    callbacks.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.warn(`Error in message subscriber for ${messageType}:`, error);
      }
    });
  }

  /**
   * Get message history
   */
  getMessageHistory(messageType: string): any[] {
    return this.messageHistory.get(messageType) || [];
  }

  /**
   * Clear message history
   */
  clearMessageHistory(messageType?: string): void {
    if (messageType) {
      this.messageHistory.delete(messageType);
    } else {
      this.messageHistory.clear();
    }
  }
}

/**
 * P31 Labs default message broker
 */
export const p31MessageBroker = new MessageBroker();

/**
 * Create a message publisher hook
 */
export function useMessagePublisher() {
  return {
    publish: (messageType: string, message: any) => {
      p31MessageBroker.publish(messageType, message);
    }
  };
}

/**
 * Create a message subscriber hook
 */
export function useMessageSubscriber<T = any>(
  messageType: string,
  callback: (message: T) => void
) {
  React.useEffect(() => {
    return p31MessageBroker.subscribe(messageType, callback);
  }, [messageType, callback]);
}

/**
 * State validation utilities
 */
export class StateValidator {
  private validators: Map<string, (state: any) => boolean | string> = new Map();

  /**
   * Add a state validator
   */
  addValidator(storeName: string, validator: (state: any) => boolean | string): void {
    this.validators.set(storeName, validator);
  }

  /**
   * Validate state
   */
  validateState(storeName: string, state: any): { isValid: boolean; errors: string[] } {
    const validator = this.validators.get(storeName);
    if (!validator) {
      return { isValid: true, errors: [] };
    }

    const result = validator(state);
    if (result === true) {
      return { isValid: true, errors: [] };
    } else if (typeof result === 'string') {
      return { isValid: false, errors: [result] };
    } else {
      return { isValid: false, errors: [] };
    }
  }

  /**
   * Remove validator
   */
  removeValidator(storeName: string): void {
    this.validators.delete(storeName);
  }
}

/**
 * P31 Labs default state validator
 */
export const p31StateValidator = new StateValidator();

export default StateSyncManager;