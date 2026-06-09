/**
 * ParentDashboard - Parent Supervision Dashboard
 * Real-time monitoring of children's BONDING activity with time controls,
 * webhook integration, and family management.
 * 
 * Design: 16px min font, 48px touch targets, dark theme with Phosphor Green (#00FF88) accents
 * Accessibility: WCAG AA compliant, grandparent-friendly (ages 6-80)
 */

import React, { useState, useMemo } from 'react';
import useParentControls from '../hooks/useParentControls';
import { ProgressiveDisclosure } from './ProgressiveDisclosure';
import type { 
  BONDINGActivity, 
  WebhookEvent, 
  TimeLimit, 
  TimeSchedule,
  Child 
} from '../types/parent';

// Use the same color constants as the main app (adjusted for #00FF88 phosphor)
const COLORS = {
  phosphorus: '#00FF88',
  phosphorusDim: '#00FF8899',
  void: '#050510',
  background: '#0a0f1a',
  panelBg: 'rgba(10, 15, 26, 0.9)',
  panelBorder: 'rgba(0, 255, 136, 0.15)',
  text: '#e0e6ed',
  textDim: '#e0e6ed99',
  coral: '#ff6b6b',
  teal: '#4ecdc4',
  gold: '#ffe66d',
  purple: '#a29bfe',
};

// ─────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return 'now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getActivityIcon(actionType: BONDINGActivity['actionType']): string {
  switch (actionType) {
    case 'element_place': return '⬡';
    case 'bond_create': return '⟷';
    case 'molecule_complete': return '⬢';
    case 'quest_progress': return '◆';
    case 'achievement_unlock': return '★';
    case 'element_unlock': return '🔓';
    default: return '•';
  }
}

function getEventIcon(type: WebhookEvent['type']): string {
  switch (type) {
    case 'bonding-match': return '⟷';
    case 'kofi-purchase': return '☕';
    case 'node-one-status': return '⚡';
    case 'family-event': return '👨‍👩‍👧';
    case 'system-alert': return '⚠';
    default: return '•';
  }
}

// ─────────────────────────────────────────────
// Sub-Components
// ─────────────────────────────────────────────

interface ActivityItemProps {
  activity: BONDINGActivity;
  childName: string;
}

function ActivityItem({ activity, childName }: ActivityItemProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      borderBottom: '1px solid rgba(0, 255, 136, 0.08)',
      minHeight: '48px',
    }}>
      <span style={{ 
        fontSize: '18px', 
        color: COLORS.phosphorus,
        width: '24px',
        textAlign: 'center',
      }}>
        {getActivityIcon(activity.actionType)}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: COLORS.text,
          fontSize: '15px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {activity.element && <strong>{activity.element}</strong>}
          {' '}
          {activity.actionType === 'bond_create' && `created ${activity.bondsCreated} bond${activity.bondsCreated !== 1 ? 's' : ''}`}
          {activity.actionType === 'molecule_complete' && `completed ${activity.moleculeName}`}
          {activity.actionType === 'quest_progress' && `progress: ${activity.questId}`}
          {activity.actionType === 'achievement_unlock' && `unlocked: ${activity.achievementId}`}
          {activity.actionType === 'element_unlock' && `unlocked new element`}
        </div>
        <ProgressiveDisclosure priority={2}>
          <div style={{
            color: COLORS.textDim,
            fontSize: '13px',
            marginTop: '2px',
          }}>
            {childName} • {formatTimeAgo(activity.timestamp)}
          </div>
        </ProgressiveDisclosure>
      </div>
    </div>
  );
}

interface TimeControlCardProps {
  child: Child;
  settings: ReturnType<typeof useParentControls>['childSettings'][string];
  onSetLimit: (limit: TimeLimit) => void;
  onPause: () => void;
  onResume: () => void;
  onSetSchedule: (schedule: TimeSchedule) => void;
}

function TimeControlCard({ 
  child, 
  settings, 
  onSetLimit, 
  onPause, 
  onResume,
  onSetSchedule,
}: TimeControlCardProps) {
  const [_showSchedule, setShowSchedule] = useState(false);
  const [scheduleStart, setScheduleStart] = useState(settings.schedule.allowedStart);
  const [scheduleEnd, setScheduleEnd] = useState(settings.schedule.allowedEnd);
  
  const usagePercent = Math.min((settings.usedToday / settings.dailyLimit) * 100, 100);
  const isOverLimit = settings.usedToday >= settings.dailyLimit;
  
  const timeLimits: TimeLimit[] = [15, 30, 60, 120];
  
  const handleScheduleSave = () => {
    onSetSchedule({
      enabled: settings.schedule.enabled,
      allowedStart: scheduleStart,
      allowedEnd: scheduleEnd,
    });
    setShowSchedule(false);
  };

  return (
    <div style={{
      background: COLORS.panelBg,
      border: `1px solid ${COLORS.panelBorder}`,
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '16px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <h3 style={{ 
          color: COLORS.text, 
          fontSize: '18px', 
          margin: 0,
          fontWeight: 600,
        }}>
          {child.name}
        </h3>
        <span style={{
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '13px',
          background: settings.isPaused 
            ? COLORS.coral + '33' 
            : COLORS.phosphorus + '22',
          color: settings.isPaused ? COLORS.coral : COLORS.phosphorus,
        }}>
          {settings.isPaused ? '⏸ Paused' : '✓ Active'}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: '14px',
        }}>
          <span style={{ color: COLORS.textDim }}>
            Used today: {formatMinutes(settings.usedToday)} / {formatMinutes(settings.dailyLimit)}
          </span>
          <span style={{ 
            color: isOverLimit ? COLORS.coral : COLORS.textDim 
          }}>
            {Math.round(usagePercent)}%
          </span>
        </div>
        <div style={{
          height: '8px',
          background: COLORS.void,
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${usagePercent}%`,
            background: isOverLimit 
              ? COLORS.coral 
              : COLORS.phosphorus,
            borderRadius: '4px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Time limit selector */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          color: COLORS.textDim,
          fontSize: '14px',
          marginBottom: '8px',
        }}>
          Daily time limit
        </label>
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}>
          {timeLimits.map(limit => (
            <button
              key={limit}
              onClick={() => onSetLimit(limit)}
              style={{
                minWidth: '64px',
                minHeight: '48px',
                padding: '10px 16px',
                background: settings.dailyLimit === limit 
                  ? COLORS.phosphorus + '33' 
                  : COLORS.void,
                border: `1px solid ${settings.dailyLimit === limit ? COLORS.phosphorus : COLORS.panelBorder}`,
                borderRadius: '8px',
                color: settings.dailyLimit === limit ? COLORS.phosphorus : COLORS.text,
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {formatMinutes(limit)}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule toggle */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          minHeight: '48px',
        }}>
          <input
            type="checkbox"
            checked={settings.schedule.enabled}
            onChange={(e) => onSetSchedule({
              ...settings.schedule,
              enabled: e.target.checked,
            })}
            style={{
              width: '20px',
              height: '20px',
              accentColor: COLORS.phosphorus,
            }}
          />
          <span style={{ color: COLORS.text, fontSize: '15px' }}>
            Enable schedule
          </span>
        </label>
        
        {settings.schedule.enabled && (
          <div style={{
            marginTop: '12px',
            marginLeft: '32px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}>
            <input
              type="time"
              value={scheduleStart}
              onChange={(e) => setScheduleStart(e.target.value)}
              style={{
                padding: '10px 14px',
                background: COLORS.void,
                border: `1px solid ${COLORS.panelBorder}`,
                borderRadius: '8px',
                color: COLORS.text,
                fontSize: '15px',
                minHeight: '48px',
              }}
            />
            <span style={{ color: COLORS.textDim }}>to</span>
            <input
              type="time"
              value={scheduleEnd}
              onChange={(e) => setScheduleEnd(e.target.value)}
              style={{
                padding: '10px 14px',
                background: COLORS.void,
                border: `1px solid ${COLORS.panelBorder}`,
                borderRadius: '8px',
                color: COLORS.text,
                fontSize: '15px',
                minHeight: '48px',
              }}
            />
            <button
              onClick={handleScheduleSave}
              style={{
                padding: '10px 16px',
                background: COLORS.phosphorus + '22',
                border: `1px solid ${COLORS.phosphorus}`,
                borderRadius: '8px',
                color: COLORS.phosphorus,
                fontSize: '14px',
                cursor: 'pointer',
                minHeight: '48px',
              }}
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* Pause/Resume button */}
      <button
        onClick={settings.isPaused ? onResume : onPause}
        style={{
          width: '100%',
          minHeight: '48px',
          padding: '14px',
          background: settings.isPaused 
            ? COLORS.phosphorus + '22' 
            : COLORS.coral + '22',
          border: `1px solid ${settings.isPaused ? COLORS.phosphorus : COLORS.coral}`,
          borderRadius: '8px',
          color: settings.isPaused ? COLORS.phosphorus : COLORS.coral,
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {settings.isPaused ? '▶ Resume Access' : '⏸ Pause Access'}
      </button>
    </div>
  );
}

interface WebhookEventItemProps {
  event: WebhookEvent;
  onMarkRead: () => void;
}

function WebhookEventItem({ event, onMarkRead }: WebhookEventItemProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      background: event.read ? 'transparent' : COLORS.phosphorus + '08',
      borderBottom: `1px solid ${COLORS.panelBorder}`,
      cursor: 'pointer',
      minHeight: '48px',
    }}
    onClick={onMarkRead}
    >
      <span style={{ 
        fontSize: '18px', 
        color: COLORS.gold,
        width: '24px',
        textAlign: 'center',
      }}>
        {getEventIcon(event.type)}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: COLORS.text,
          fontSize: '15px',
          textTransform: 'capitalize',
        }}>
          {event.type.replace(/-/g, ' ')}
        </div>
        {event.data.message && (
          <ProgressiveDisclosure priority={2}>
            <div style={{
              color: COLORS.textDim,
              fontSize: '13px',
              marginTop: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {event.data.message}
            </div>
          </ProgressiveDisclosure>
        )}
        <div style={{
          color: COLORS.textDim,
          fontSize: '12px',
          marginTop: '2px',
        }}>
          {formatTimeAgo(event.timestamp)}
        </div>
      </div>
      {!event.read && (
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: COLORS.phosphorus,
        }} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

interface ParentDashboardProps {
  onClose?: () => void;
}

export default function ParentDashboard({ onClose }: ParentDashboardProps) {
  const {
    family,
    childSettings,
    addChild,
    removeChild,
    regenerateFamilyCode,
    setTimeLimit,
    pauseAccess,
    resumeAccess,
    setSchedule,
    activities: _activities,
    filteredActivities,
    webhookEvents,
    markEventRead,
    selectedChildId,
    setSelectedChildId,
    isConnected,
  } = useParentControls();

  const [activeTab, setActiveTab] = useState<'activity' | 'time' | 'webhooks' | 'family'>('activity');
  const [newChildName, setNewChildName] = useState('');
  const [showAddChild, setShowAddChild] = useState(false);

  // Filter activities for display (last 30 days)
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const displayActivities = useMemo(() => {
    const filtered = filteredActivities({
      childId: selectedChildId || undefined,
      startDate: thirtyDaysAgo,
    });
    return filtered.slice(0, 50); // Show max 50 items
  }, [filteredActivities, selectedChildId, thirtyDaysAgo]);

  // Get child name by ID
  const getChildName = (childId: string): string => {
    const child = family.children.find((c: Child) => c.id === childId);
    return child?.name || 'Unknown';
  };

  // Add child handler
  const handleAddChild = () => {
    if (newChildName.trim()) {
      addChild(newChildName.trim());
      setNewChildName('');
      setShowAddChild(false);
    }
  };

  // Unread webhook events count
  const unreadEvents = webhookEvents.filter((e: WebhookEvent) => !e.read).length;

  const tabs = [
    { id: 'activity', label: 'Activity', icon: '📡', count: 0 },
    { id: 'time', label: 'Time', icon: '⏱️', count: 0 },
    { id: 'webhooks', label: 'Events', icon: '🔔', count: unreadEvents },
    { id: 'family', label: 'Family', icon: '👨‍👩‍👧', count: family.children.length },
  ] as const;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 60,
      background: COLORS.background,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: `1px solid ${COLORS.panelBorder}`,
        background: COLORS.void,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{
            color: COLORS.phosphorus,
            fontSize: '22px',
            fontWeight: 700,
            margin: 0,
            letterSpacing: '2px',
          }}>
            PARENT DASHBOARD
          </h1>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: isConnected ? COLORS.phosphorus : COLORS.coral,
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isConnected ? COLORS.phosphorus : COLORS.coral,
            }} />
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              minWidth: '48px',
              minHeight: '48px',
              padding: '12px',
              background: 'transparent',
              border: `1px solid ${COLORS.panelBorder}`,
              borderRadius: '8px',
              color: COLORS.text,
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close dashboard"
          >
            ×
          </button>
        )}
      </header>

      {/* Tab Navigation */}
      <nav style={{
        display: 'flex',
        gap: '8px',
        padding: '16px 24px',
        borderBottom: `1px solid ${COLORS.panelBorder}`,
        background: COLORS.void,
        overflowX: 'auto',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              minWidth: '100px',
              minHeight: '48px',
              padding: '12px 20px',
              background: activeTab === tab.id ? COLORS.phosphorus + '22' : 'transparent',
              border: `1px solid ${activeTab === tab.id ? COLORS.phosphorus : COLORS.panelBorder}`,
              borderRadius: '8px',
              color: activeTab === tab.id ? COLORS.phosphorus : COLORS.textDim,
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span style={{
                background: COLORS.phosphorus,
                color: COLORS.void,
                borderRadius: '10px',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: 700,
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Content Area */}
      <main style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px',
      }}>
        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}>
              <h2 style={{
                color: COLORS.text,
                fontSize: '18px',
                margin: 0,
              }}>
                Activity Feed
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={selectedChildId || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedChildId(e.target.value || null)}
                  style={{
                    minHeight: '48px',
                    padding: '10px 14px',
                    background: COLORS.void,
                    border: `1px solid ${COLORS.panelBorder}`,
                    borderRadius: '8px',
                    color: COLORS.text,
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">All Children</option>
                  {family.children.map((child: Child) => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {displayActivities.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: COLORS.textDim,
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📡</div>
                <p style={{ fontSize: '16px' }}>No activity yet</p>
                <p style={{ fontSize: '14px' }}>
                  Activity will appear here when children use BONDING
                </p>
              </div>
            ) : (
              <div style={{
                background: COLORS.panelBg,
                border: `1px solid ${COLORS.panelBorder}`,
                borderRadius: '12px',
                overflow: 'hidden',
              }}>
                {displayActivities.map((activity: BONDINGActivity) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    childName={getChildName(activity.childId)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Time Controls Tab */}
        {activeTab === 'time' && (
          <div>
            <h2 style={{
              color: COLORS.text,
              fontSize: '18px',
              margin: '0 0 20px 0',
            }}>
              Time Controls
            </h2>

            {family.children.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: COLORS.textDim,
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏱️</div>
                <p style={{ fontSize: '16px' }}>No children added yet</p>
                <p style={{ fontSize: '14px' }}>
                  Add children in the Family tab to manage their time
                </p>
              </div>
            ) : (
              family.children.map(child => (
                <TimeControlCard
                  key={child.id}
                  child={child}
                  settings={childSettings[child.id] || {
                    dailyLimit: 30,
                    usedToday: 0,
                    lastResetDate: new Date().toISOString().split('T')[0] ?? '',
                    isPaused: false,
                    schedule: { enabled: false, allowedStart: '15:00', allowedEnd: '20:00' },
                  }}
                  onSetLimit={(limit) => setTimeLimit(child.id, limit)}
                  onPause={() => pauseAccess(child.id)}
                  onResume={() => resumeAccess(child.id)}
                  onSetSchedule={(schedule) => setSchedule(child.id, schedule)}
                />
              ))
            )}
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}>
              <h2 style={{
                color: COLORS.text,
                fontSize: '18px',
                margin: 0,
              }}>
                Webhook Events
              </h2>
              {webhookEvents.length > 0 && (
                <button
                  onClick={() => webhookEvents.forEach((e: WebhookEvent) => markEventRead(e.id))}
                  style={{
                    minHeight: '48px',
                    padding: '10px 16px',
                    background: 'transparent',
                    border: `1px solid ${COLORS.panelBorder}`,
                    borderRadius: '8px',
                    color: COLORS.textDim,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {webhookEvents.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: COLORS.textDim,
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
                <p style={{ fontSize: '16px' }}>No events yet</p>
                <p style={{ fontSize: '14px' }}>
                  Discord webhook events will appear here
                </p>
              </div>
            ) : (
              <div style={{
                background: COLORS.panelBg,
                border: `1px solid ${COLORS.panelBorder}`,
                borderRadius: '12px',
                overflow: 'hidden',
              }}>
                {webhookEvents.map((event: WebhookEvent) => (
                  <WebhookEventItem
                    key={event.id}
                    event={event}
                    onMarkRead={() => markEventRead(event.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Family Tab */}
        {activeTab === 'family' && (
          <div>
            <h2 style={{
              color: COLORS.text,
              fontSize: '18px',
              margin: '0 0 20px 0',
            }}>
              Family Management
            </h2>

            {/* Family Code Card */}
            <div style={{
              background: COLORS.panelBg,
              border: `1px solid ${COLORS.panelBorder}`,
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
            }}>
              <h3 style={{
                color: COLORS.textDim,
                fontSize: '14px',
                margin: '0 0 12px 0',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                Family Code
              </h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
              }}>
                <span style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: COLORS.phosphorus,
                  letterSpacing: '4px',
                  fontFamily: 'monospace',
                }}>
                  {family.familyCode}
                </span>
                <button
                  onClick={regenerateFamilyCode}
                  style={{
                    minHeight: '48px',
                    padding: '12px 20px',
                    background: COLORS.phosphorus + '22',
                    border: `1px solid ${COLORS.phosphorus}`,
                    borderRadius: '8px',
                    color: COLORS.phosphorus,
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                >
                  🔄 Regenerate
                </button>
              </div>
              <ProgressiveDisclosure priority={2}>
                <p style={{
                  color: COLORS.textDim,
                  fontSize: '13px',
                  marginTop: '12px',
                }}>
                  Share this code with children's devices to pair
                </p>
              </ProgressiveDisclosure>
            </div>

            {/* Children List */}
            <div style={{
              marginBottom: '24px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}>
                <h3 style={{
                  color: COLORS.text,
                  fontSize: '16px',
                  margin: 0,
                }}>
                  Children ({family.children.length})
                </h3>
                <button
                  onClick={() => setShowAddChild(true)}
                  style={{
                    minHeight: '48px',
                    padding: '12px 20px',
                    background: COLORS.phosphorus + '22',
                    border: `1px solid ${COLORS.phosphorus}`,
                    borderRadius: '8px',
                    color: COLORS.phosphorus,
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                >
                  + Add Child
                </button>
              </div>

              {/* Add Child Form */}
              {showAddChild && (
                <div style={{
                  background: COLORS.panelBg,
                  border: `1px solid ${COLORS.phosphorus}`,
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '16px',
                }}>
                  <input
                    type="text"
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    placeholder="Child's name"
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAddChild()}
                    autoFocus
                    aria-label="Child's name"
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      padding: '12px 16px',
                      background: COLORS.void,
                      border: `1px solid ${COLORS.panelBorder}`,
                      borderRadius: '8px',
                      color: COLORS.text,
                      fontSize: '16px',
                      marginBottom: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={handleAddChild}
                      style={{
                        flex: 1,
                        minHeight: '48px',
                        background: COLORS.phosphorus,
                        border: 'none',
                        borderRadius: '8px',
                        color: COLORS.void,
                        fontSize: '15px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddChild(false);
                        setNewChildName('');
                      }}
                      style={{
                        flex: 1,
                        minHeight: '48px',
                        background: 'transparent',
                        border: `1px solid ${COLORS.panelBorder}`,
                        borderRadius: '8px',
                        color: COLORS.textDim,
                        fontSize: '15px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Children Cards */}
              {family.children.map((child: Child) => (
                <div
                  key={child.id}
                  style={{
                    background: COLORS.panelBg,
                    border: `1px solid ${COLORS.panelBorder}`,
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{
                      color: COLORS.text,
                      fontSize: '17px',
                      fontWeight: 600,
                    }}>
                      {child.name}
                    </div>
                    <ProgressiveDisclosure priority={2}>
                      <div style={{
                        color: COLORS.textDim,
                        fontSize: '13px',
                        marginTop: '4px',
                      }}>
                        Added {new Date(child.createdAt).toLocaleDateString()}
                      </div>
                      <div style={{
                        color: COLORS.phosphorusDim,
                        fontSize: '12px',
                        marginTop: '4px',
                        textTransform: 'capitalize',
                      }}>
                        Mode: {child.difficultyMode}
                      </div>
                    </ProgressiveDisclosure>
                  </div>
                  <button
                    onClick={() => removeChild(child.id)}
                    style={{
                      minWidth: '48px',
                      minHeight: '48px',
                      padding: '12px',
                      background: COLORS.coral + '22',
                      border: `1px solid ${COLORS.coral}`,
                      borderRadius: '8px',
                      color: COLORS.coral,
                      fontSize: '16px',
                      cursor: 'pointer',
                    }}
                    aria-label={`Remove ${child.name}`}
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <ProgressiveDisclosure priority={3}>
        <footer style={{
          padding: '16px 24px',
          borderTop: `1px solid ${COLORS.panelBorder}`,
          background: COLORS.void,
          textAlign: 'center',
        }}>
          <p style={{
            color: COLORS.textDim,
            fontSize: '13px',
            margin: 0,
          }}>
            P31 Parent Dashboard • ages 6-80 accessible • Phosphor Green #00FF88
          </p>
        </footer>
      </ProgressiveDisclosure>
    </div>
  );
}

// ParentDashboard is exported as default at the function declaration