/**
 * useParentControls - Custom hook for parent supervision controls
 * Handles time limits, schedules, family management, and real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  Child,
  BONDINGActivity,
  ChildTimeSettings,
  WebhookEvent,
  FamilySettings,
  TimeLimit,
  TimeSchedule,
  ActivityFilter,
} from '../types/parent';

const STORAGE_KEY = 'p31_parent_controls';
const DEFAULT_TIME_LIMIT: TimeLimit = 30;

// Generate a unique family code
function generateFamilyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get today's date string
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

// Default time settings for a child
function createDefaultTimeSettings(): ChildTimeSettings {
  return {
    dailyLimit: DEFAULT_TIME_LIMIT,
    usedToday: 0,
    lastResetDate: getTodayDate(),
    isPaused: false,
    schedule: {
      enabled: false,
      allowedStart: '15:00',
      allowedEnd: '20:00',
    },
  };
}

// Default family settings
function createDefaultFamily(): FamilySettings {
  return {
    familyCode: generateFamilyCode(),
    children: [],
    webhookUrl: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Load from localStorage
function loadFromStorage(): Partial<{
  family: FamilySettings;
  childSettings: Record<string, ChildTimeSettings>;
  activities: BONDINGActivity[];
  webhookEvents: WebhookEvent[];
}> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load parent controls from storage:', e);
  }
  return {};
}

// Save to localStorage
function saveToStorage(data: {
  family: FamilySettings;
  childSettings: Record<string, ChildTimeSettings>;
  activities: BONDINGActivity[];
  webhookEvents: WebhookEvent[];
}) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save parent controls to storage:', e);
  }
}

export interface UseParentControlsReturn {
  // Family management
  family: FamilySettings;
  addChild: (name: string, avatar?: string) => Child;
  removeChild: (childId: string) => void;
  updateChild: (child: Child) => void;
  regenerateFamilyCode: () => void;
  setWebhookUrl: (url: string) => void;

  // Time controls
  childSettings: Record<string, ChildTimeSettings>;
  getChildSettings: (childId: string) => ChildTimeSettings;
  setTimeLimit: (childId: string, limit: TimeLimit) => void;
  pauseAccess: (childId: string) => void;
  resumeAccess: (childId: string) => void;
  setSchedule: (childId: string, schedule: TimeSchedule) => void;
  incrementUsage: (childId: string, minutes: number) => void;
  canAccess: (childId: string) => { allowed: boolean; reason?: string };

  // Activity feed
  activities: BONDINGActivity[];
  filteredActivities: (filter?: ActivityFilter) => BONDINGActivity[];
  addActivity: (activity: Omit<BONDINGActivity, 'id'>) => void;
  clearOldActivities: (days: number) => void;

  // Webhook events
  webhookEvents: WebhookEvent[];
  addWebhookEvent: (event: Omit<WebhookEvent, 'id' | 'timestamp' | 'read'>) => void;
  markEventRead: (eventId: string) => void;
  clearEvents: () => void;

  // Selection
  selectedChildId: string | null;
  setSelectedChildId: (id: string | null) => void;

  // WebSocket connection for real-time updates
  isConnected: boolean;
  lastActivity: BONDINGActivity | null;
}

export default function useParentControls(): UseParentControlsReturn {
  // Initialize state from localStorage or defaults
  const stored = loadFromStorage();
  
  const [family, setFamily] = useState<FamilySettings>(
    stored.family || createDefaultFamily()
  );
  const [childSettings, setChildSettings] = useState<Record<string, ChildTimeSettings>>(
    stored.childSettings || {}
  );
  const [activities, setActivities] = useState<BONDINGActivity[]>(
    stored.activities || []
  );
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>(
    stored.webhookEvents || []
  );
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastActivity, setLastActivity] = useState<BONDINGActivity | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist state changes
  useEffect(() => {
    saveToStorage({ family, childSettings, activities, webhookEvents });
  }, [family, childSettings, activities, webhookEvents]);

  // Reset daily usage if date changed
  useEffect(() => {
    const today = getTodayDate();
    setChildSettings(prev => {
      const updated = { ...prev };
      let changed = false;
      Object.keys(updated).forEach(childId => {
        const s = updated[childId];
        if (s && s.lastResetDate !== today) {
          updated[childId] = {
            ...s,
            usedToday: 0,
            lastResetDate: today,
          };
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, []);

  // WebSocket connection for real-time BONDING activity
  useEffect(() => {
    // Use the same WebSocket URL pattern as useWebSocket.js
    const wsUrl = `ws://${window.location.hostname}:8031/ws`;
    
    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          console.log('[ParentControls] WebSocket connected');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // Handle BONDING activity updates
            if (data.type === 'bonding_activity') {
              const activity: BONDINGActivity = {
                ...data.payload,
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
              };
              setLastActivity(activity);
              setActivities(prev => [activity, ...prev].slice(0, 500)); // Keep last 500
            }
            // Handle webhook events
            else if (data.type === 'webhook_event') {
              const webhookEvent: WebhookEvent = {
                ...data.payload,
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
                read: false,
              };
              setWebhookEvents(prev => [webhookEvent, ...prev].slice(0, 100)); // Keep last 100
            }
          } catch (e) {
            console.error('[ParentControls] Failed to parse WebSocket message:', e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Reconnect after delay
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        };

        ws.onerror = (error) => {
          console.error('[ParentControls] WebSocket error:', error);
        };
      } catch (e) {
        console.error('[ParentControls] Failed to create WebSocket:', e);
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // ─────────────────────────────────────────────
  // Family Management
  // ─────────────────────────────────────────────

  const addChild = useCallback((name: string, avatar?: string): Child => {
    const newChild: Child = {
      id: `child-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      avatar,
      createdAt: Date.now(),
      difficultyMode: 'seed',
    };

    setFamily(prev => ({
      ...prev,
      children: [...prev.children, newChild],
      updatedAt: Date.now(),
    }));

    // Create default time settings for the new child
    setChildSettings(prev => ({
      ...prev,
      [newChild.id]: createDefaultTimeSettings(),
    }));

    return newChild;
  }, []);

  const removeChild = useCallback((childId: string) => {
    setFamily(prev => ({
      ...prev,
      children: prev.children.filter(c => c.id !== childId),
      updatedAt: Date.now(),
    }));
    setChildSettings(prev => {
      const updated = { ...prev };
      delete updated[childId];
      return updated;
    });
  }, []);

  const updateChild = useCallback((child: Child) => {
    setFamily(prev => ({
      ...prev,
      children: prev.children.map(c => c.id === child.id ? child : c),
      updatedAt: Date.now(),
    }));
  }, []);

  const regenerateFamilyCode = useCallback(() => {
    setFamily(prev => ({
      ...prev,
      familyCode: generateFamilyCode(),
      updatedAt: Date.now(),
    }));
  }, []);

  const setWebhookUrl = useCallback((url: string) => {
    setFamily(prev => ({
      ...prev,
      webhookUrl: url,
      updatedAt: Date.now(),
    }));
  }, []);

  // ─────────────────────────────────────────────
  // Time Controls
  // ─────────────────────────────────────────────

  const getChildSettings = useCallback((childId: string): ChildTimeSettings => {
    return childSettings[childId] || createDefaultTimeSettings();
  }, [childSettings]);

  const setTimeLimit = useCallback((childId: string, limit: TimeLimit) => {
    setChildSettings(prev => ({
      ...prev,
      [childId]: {
        ...(prev[childId] || createDefaultTimeSettings()),
        dailyLimit: limit,
      },
    }));
  }, []);

  const pauseAccess = useCallback((childId: string) => {
    setChildSettings(prev => ({
      ...prev,
      [childId]: {
        ...(prev[childId] || createDefaultTimeSettings()),
        isPaused: true,
      },
    }));
  }, []);

  const resumeAccess = useCallback((childId: string) => {
    setChildSettings(prev => ({
      ...prev,
      [childId]: {
        ...(prev[childId] || createDefaultTimeSettings()),
        isPaused: false,
      },
    }));
  }, []);

  const setSchedule = useCallback((childId: string, schedule: TimeSchedule) => {
    setChildSettings(prev => ({
      ...prev,
      [childId]: {
        ...(prev[childId] || createDefaultTimeSettings()),
        schedule,
      },
    }));
  }, []);

  const incrementUsage = useCallback((childId: string, minutes: number) => {
    setChildSettings(prev => ({
      ...prev,
      [childId]: {
        ...(prev[childId] || createDefaultTimeSettings()),
        usedToday: (prev[childId]?.usedToday || 0) + minutes,
      },
    }));
  }, []);

  const canAccess = useCallback((childId: string): { allowed: boolean; reason?: string } => {
    const settings = childSettings[childId] || createDefaultTimeSettings();
    
    // Check if paused
    if (settings.isPaused) {
      return { allowed: false, reason: 'Access is currently paused' };
    }
    
    // Check daily limit
    if (settings.usedToday >= settings.dailyLimit) {
      return { allowed: false, reason: 'Daily time limit reached' };
    }
    
    // Check schedule if enabled
    if (settings.schedule.enabled) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startH = 0, startM = 0] = settings.schedule.allowedStart.split(':').map(Number);
      const [endH = 0, endM = 0] = settings.schedule.allowedEnd.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
        return { 
          allowed: false, 
          reason: `Allowed only between ${settings.schedule.allowedStart} and ${settings.schedule.allowedEnd}` 
        };
      }
    }
    
    return { allowed: true };
  }, [childSettings]);

  // ─────────────────────────────────────────────
  // Activity Feed
  // ─────────────────────────────────────────────

  const filteredActivities = useCallback((filter?: ActivityFilter): BONDINGActivity[] => {
    let result = activities;
    
    if (filter?.childId) {
      result = result.filter(a => a.childId === filter.childId);
    }
    
    if (filter?.startDate) {
      result = result.filter(a => a.timestamp >= filter.startDate!);
    }
    
    if (filter?.endDate) {
      result = result.filter(a => a.timestamp <= filter.endDate!);
    }
    
    if (filter?.actionTypes?.length) {
      result = result.filter(a => filter.actionTypes!.includes(a.actionType));
    }
    
    return result;
  }, [activities]);

  const addActivity = useCallback((activity: Omit<BONDINGActivity, 'id'>) => {
    const newActivity: BONDINGActivity = {
      ...activity,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 500));
    setLastActivity(newActivity);
  }, []);

  const clearOldActivities = useCallback((days: number) => {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    setActivities(prev => prev.filter(a => a.timestamp > cutoff));
  }, []);

  // ─────────────────────────────────────────────
  // Webhook Events
  // ─────────────────────────────────────────────

  const addWebhookEvent = useCallback((event: Omit<WebhookEvent, 'id' | 'timestamp' | 'read'>) => {
    const newEvent: WebhookEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
    };
    setWebhookEvents(prev => [newEvent, ...prev].slice(0, 100));
  }, []);

  const markEventRead = useCallback((eventId: string) => {
    setWebhookEvents(prev =>
      prev.map(e => e.id === eventId ? { ...e, read: true } : e)
    );
  }, []);

  const clearEvents = useCallback(() => {
    setWebhookEvents([]);
  }, []);

  return {
    // Family management
    family,
    addChild,
    removeChild,
    updateChild,
    regenerateFamilyCode,
    setWebhookUrl,

    // Time controls
    childSettings,
    getChildSettings,
    setTimeLimit,
    pauseAccess,
    resumeAccess,
    setSchedule,
    incrementUsage,
    canAccess,

    // Activity feed
    activities,
    filteredActivities,
    addActivity,
    clearOldActivities,

    // Webhook events
    webhookEvents,
    addWebhookEvent,
    markEventRead,
    clearEvents,

    // Selection
    selectedChildId,
    setSelectedChildId,

    // Connection status
    isConnected,
    lastActivity,
  };
}