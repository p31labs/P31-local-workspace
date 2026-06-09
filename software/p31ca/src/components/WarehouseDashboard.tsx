/**
 * Warehouse Dashboard — Real-time Zone Overview
 * Cycle counts, pending sync, recent activity
 * @component
 */

import React, { useEffect, useState } from 'react';
import { getWarehouseDB, getZoneSummary, getRecentActivity } from '../utils/pglite-warehouse';
import type { Zone } from './ZeroTapWarehouse';

interface ZoneSummary {
  id: number;
  name: string;
  inStock: number;
  pending: number;
}

interface ActivityItem {
  scannedAt: number;
  qrData: string;
  action: string;
  zoneName: string;
  category: string;
}

export function WarehouseDashboard(): React.ReactElement {
  const [zones, setZones] = useState<ZoneSummary[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const db = await getWarehouseDB();

      // Load zone summaries
      const zoneData = await getZoneSummary(db);
      setZones(zoneData);
      setTotalPending(zoneData.reduce((sum, z) => sum + z.pending, 0));

      // Load recent activity
      const activityData = await getRecentActivity(db, 20);
      setActivities(activityData);
    } catch (err) {
      console.error('Dashboard load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ts: number): string => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getActionIcon = (action: string): string => {
    const icons: Record<string, string> = {
      received: '📥',
      sold: '📤',
      moved: '🔄',
      counted: '✓',
    };
    return icons[action] || '•';
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header Stats */}
      <div style={styles.header}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>
            {zones.reduce((sum, z) => sum + z.inStock, 0)}
          </div>
          <div style={styles.statLabel}>In Stock</div>
        </div>

        <div style={{ ...styles.statCard, background: totalPending > 0 ? '#fff8e1' : '#f0f9f4' }}>
          <div style={{ ...styles.statValue, color: totalPending > 0 ? '#f9a825' : '#5DCAA5' }}>
            {totalPending}
          </div>
          <div style={styles.statLabel}>Pending Sync</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statValue}>{zones.length}</div>
          <div style={styles.statLabel}>Zones Active</div>
        </div>
      </div>

      {/* Zone Grid */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Zone Inventory</h3>
        <div style={styles.zoneGrid}>
          {zones.map((zone) => (
            <div key={zone.id} style={styles.zoneCard}>
              <div style={styles.zoneHeader}>
                <span style={styles.zoneNumber}>{String(zone.id).padStart(2, '0')}</span>
                <span style={styles.zoneName}>{zone.name.replace('Zone ' + zone.id + ': ', '')}</span>
              </div>
              <div style={styles.zoneStats}>
                <div style={styles.zoneStat}>
                  <span style={styles.zoneStatValue}>{zone.inStock}</span>
                  <span style={styles.zoneStatLabel}>in stock</span>
                </div>
                {zone.pending > 0 && (
                  <div style={{ ...styles.zoneStat, color: '#f9a825' }}>
                    <span style={styles.zoneStatValue}>{zone.pending}</span>
                    <span style={styles.zoneStatLabel}>pending</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Recent Activity</h3>
        {activities.length === 0 ? (
          <div style={styles.emptyState}>No scans yet. Start scanning inventory!</div>
        ) : (
          <div style={styles.activityList}>
            {activities.map((act, i) => (
              <div key={i} style={styles.activityItem}>
                <span style={styles.activityIcon}>{getActionIcon(act.action)}</span>
                <div style={styles.activityInfo}>
                  <div style={styles.activityQr}>{act.qrData}</div>
                  <div style={styles.activityMeta}>
                    {act.category} • {act.zoneName}
                  </div>
                </div>
                <span style={styles.activityTime}>{formatTime(act.scannedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <button onClick={loadDashboard} style={styles.refreshBtn}>
        🔄 Refresh Dashboard
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, sans-serif',
    color: '#0f1115',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  header: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  statCard: {
    flex: 1,
    background: '#f0f9f4',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#5DCAA5',
  },
  statLabel: {
    fontSize: '13px',
    color: '#666',
    marginTop: '4px',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#0f1115',
  },
  zoneGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  zoneCard: {
    background: 'white',
    borderRadius: '10px',
    padding: '12px',
    border: '1px solid #e0e0e0',
  },
  zoneHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  zoneNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    background: '#0f1115',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  zoneName: {
    fontSize: '14px',
    fontWeight: '500',
  },
  zoneStats: {
    display: 'flex',
    gap: '16px',
  },
  zoneStat: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  },
  zoneStatValue: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
  zoneStatLabel: {
    fontSize: '12px',
    color: '#666',
  },
  activityList: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
  },
  activityIcon: {
    fontSize: '20px',
  },
  activityInfo: {
    flex: 1,
  },
  activityQr: {
    fontSize: '14px',
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  activityMeta: {
    fontSize: '12px',
    color: '#666',
  },
  activityTime: {
    fontSize: '12px',
    color: '#999',
  },
  emptyState: {
    textAlign: 'center',
    padding: '32px',
    color: '#999',
    fontStyle: 'italic',
  },
  refreshBtn: {
    width: '100%',
    padding: '14px',
    background: '#0f1115',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    cursor: 'pointer',
    marginTop: '8px',
  },
};

export default WarehouseDashboard;
