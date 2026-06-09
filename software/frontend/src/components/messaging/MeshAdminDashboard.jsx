import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import './MeshAdminDashboard.css';

/**
 * MeshAdminDashboard - Admin monitoring and management interface
 * Provides real-time metrics, user management, and moderation tools
 */
export const MeshAdminDashboard = ({ userId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState({
    messagesPerSecond: 0,
    activeConnections: 0,
    totalConversations: 0,
    totalMembers: 0,
    avgLatency: 0,
    errorRate: 0
  });
  const [conversations, setConversations] = useState([]);
  const [members, setMembers] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    worker: 'unknown',
    d1: 'unknown',
    kv: 'unknown',
    websocket: 'unknown'
  });
  const [logs, setLogs] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const ws = useWebSocket();

  // Fetch metrics on interval
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket event handlers
  useEffect(() => {
    if (!ws) return;

    const handlers = {
      'metrics:update': handleMetricsUpdate,
      'health:update': handleHealthUpdate,
      'log:new': handleNewLog
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      ws.on(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        ws.off(event, handler);
      });
    };
  }, [ws]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/mesh/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  };

  const fetchConversations = async (query = '') => {
    try {
      const url = query 
        ? `/api/admin/conversations?search=${encodeURIComponent(query)}`
        : '/api/admin/conversations';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/family/members');
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/admin/system/health');
      if (response.ok) {
        const data = await response.json();
        setSystemHealth(data.health);
      }
    } catch (err) {
      console.error('Failed to fetch health:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs?limit=100');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  const handleMetricsUpdate = (data) => {
    setMetrics(prev => ({ ...prev, ...data.metrics }));
  };

  const handleHealthUpdate = (data) => {
    setSystemHealth(prev => ({ ...prev, ...data.health }));
  };

  const handleNewLog = (data) => {
    setLogs(prev => [data.log, ...prev].slice(0, 1000));
  };

  const muteConversation = async (conversationId) => {
    try {
      await fetch(`/api/admin/conversations/${conversationId}/mute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ muted: true })
      });
      fetchConversations(searchQuery);
    } catch (err) {
      console.error('Failed to mute conversation:', err);
    }
  };

  const blockMember = async (memberId) => {
    try {
      await fetch(`/api/family/members/${memberId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked: true })
      });
      fetchMembers();
    } catch (err) {
      console.error('Failed to block member:', err);
    }
  };

  const exportConversation = async (conversationId) => {
    try {
      const response = await fetch(`/api/admin/conversations/${conversationId}/export`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${conversationId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export conversation:', err);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatLatency = (ms) => {
    if (ms < 100) return `${ms}ms`;
    if (ms < 1000) return `${(ms/1000).toFixed(2)}s`;
    return `${(ms/1000).toFixed(1)}s`;
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy': return '#4db8a8';
      case 'degraded': return '#ffd700';
      case 'unhealthy': return '#e8863a';
      default: return '#666';
    }
  };

  return (
    <div className="mesh-admin-dashboard">
      <div className="admin-header">
        <h2>K⁴ Mesh Administration</h2>
        <div className="admin-status">
          <span className="status-indicator healthy">System Operational</span>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'conversations' ? 'active' : ''}`}
          onClick={() => { setActiveTab('conversations'); fetchConversations(); }}
        >
          Conversations
        </button>
        <button 
          className={`tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => { setActiveTab('members'); fetchMembers(); }}
        >
          Family Members
        </button>
        <button 
          className={`tab ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => { setActiveTab('health'); fetchSystemHealth(); }}
        >
          System Health
        </button>
        <button 
          className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => { setActiveTab('logs'); fetchLogs(); }}
        >
          Logs
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'overview' && (
          <OverviewTab 
            metrics={metrics}
            conversations={conversations}
            members={members}
            onSearch={setSearchQuery}
          />
        )}

        {activeTab === 'conversations' && (
          <ConversationsTab 
            conversations={conversations}
            onSearch={setSearchQuery}
            onMute={muteConversation}
            onExport={exportConversation}
            onSelect={setSelectedConversation}
            selected={selectedConversation}
          />
        )}

        {activeTab === 'members' && (
          <MembersTab 
            members={members}
            onBlock={blockMember}
          />
        )}

        {activeTab === 'health' && (
          <HealthTab 
            health={systemHealth}
            metrics={metrics}
          />
        )}

        {activeTab === 'logs' && (
          <LogsTab logs={logs} />
        )}
      </div>
    </div>
  );

  function OverviewTab({ metrics, conversations, members, onSearch }) {
    return (
      <div className="overview-tab">
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Active Connections</div>
            <div className="metric-value">{metrics.activeConnections}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Messages/sec</div>
            <div className="metric-value">{metrics.messagesPerSecond}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total Conversations</div>
            <div className="metric-value">{metrics.totalConversations}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Family Members</div>
            <div className="metric-value">{metrics.totalMembers}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Avg Latency</div>
            <div className="metric-value">{formatLatency(metrics.avgLatency)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Error Rate</div>
            <div className="metric-value">{(metrics.errorRate * 100).toFixed(2)}%</div>
          </div>
        </div>

        <div className="overview-sections">
          <div className="recent-conversations">
            <h3>Recent Conversations</h3>
            <ConversationsTable 
              conversations={conversations.slice(0, 10)}
              onMute={muteConversation}
              onExport={exportConversation}
              onSelect={setSelectedConversation}
            />
          </div>

          <div className="active-members">
            <h3>Active Family Members</h3>
            <div className="members-grid">
              {members.filter(m => m.status === 'active').slice(0, 8).map(member => (
                <div key={member.id} className="member-card">
                  <div className="member-avatar">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="member-info">
                    <div className="member-name">{member.name}</div>
                    <div className="member-relationship">{member.relationship}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function ConversationsTab({ conversations, onMute, onExport, onSelect, selected }) {
    const [localSearch, setLocalSearch] = useState('');

    const filtered = conversations.filter(c => 
      c.name?.toLowerCase().includes(localSearch.toLowerCase()) ||
      c.participants?.some(p => p.toLowerCase().includes(localSearch.toLowerCase()))
    );

    return (
      <div className="conversations-tab">
        <div className="tab-header">
          <input
            type="text"
            placeholder="Search conversations..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="conversations-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Participants</th>
                <th>Messages</th>
                <th>Last Activity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(conv => (
                <tr 
                  key={conv.id} 
                  className={selected === conv.id ? 'selected' : ''}
                  onClick={() => onSelect(conv.id)}
                >
                  <td>{conv.name || 'Direct Message'}</td>
                  <td>
                    <div className="participants">
                      {(conv.participants || []).slice(0, 3).map(p => (
                        <span key={p} className="participant-tag">{p}</span>
                      ))}
                      {conv.participants?.length > 3 && (
                        <span className="participant-more">+{conv.participants.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td>{conv.messageCount || 0}</td>
                  <td>{formatTime(conv.updatedAt)}</td>
                  <td>
                    <span className={`status-badge ${conv.muted ? 'muted' : 'active'}`}>
                      {conv.muted ? 'Muted' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm"
                      onClick={(e) => { e.stopPropagation(); onMute(conv.id); }}
                    >
                      {conv.muted ? 'Unmute' : 'Mute'}
                    </button>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={(e) => { e.stopPropagation(); onExport(conv.id); }}
                    >
                      Export
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="empty-state">No conversations found</div>
          )}
        </div>
      </div>
    );
  }

  function MembersTab({ members, onBlock }) {
    const [filter, setFilter] = useState('all');

    const filtered = members.filter(m => {
      if (filter === 'active') return m.status === 'active';
      if (filter === 'blocked') return m.status === 'blocked';
      return true;
    });

    return (
      <div className="members-tab">
        <div className="tab-header">
          <div className="filter-tabs">
            {['all', 'active', 'blocked'].map(f => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="members-grid">
          {filtered.map(member => (
            <div key={member.id} className="member-card">
              <div className="member-avatar">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="member-details">
                <div className="member-name">{member.name}</div>
                <div className="member-id">@{member.userId}</div>
                <div className="member-meta">
                  <span className="relationship">{member.relationship}</span>
                  <span className="status">{member.status}</span>
                </div>
                {member.email && <div className="member-email">{member.email}</div>}
              </div>
              <div className="member-actions">
                <button 
                  className={`btn btn-sm ${member.status === 'blocked' ? 'btn-unblock' : 'btn-block'}`}
                  onClick={() => onBlock(member.id)}
                >
                  {member.status === 'blocked' ? 'Unblock' : 'Block'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function HealthTab({ health, metrics }) {
    return (
      <div className="health-tab">
        <div className="health-cards">
          <div className="health-card">
            <div className="card-title">K4-Cage Worker</div>
            <div 
              className="health-indicator"
              style={{ color: getHealthColor(health.worker) }}
            >
              {health.worker || 'Unknown'}
            </div>
          </div>
          <div className="health-card">
            <div className="card-title">D1 Database</div>
            <div 
              className="health-indicator"
              style={{ color: getHealthColor(health.d1) }}
            >
              {health.d1 || 'Unknown'}
            </div>
          </div>
          <div className="health-card">
            <div className="card-title">KV Storage</div>
            <div 
              className="health-indicator"
              style={{ color: getHealthColor(health.kv) }}
            >
              {health.kv || 'Unknown'}
            </div>
          </div>
          <div className="health-card">
            <div className="card-title">WebSocket</div>
            <div 
              className="health-indicator"
              style={{ color: getHealthColor(health.websocket) }}
            >
              {health.websocket || 'Unknown'}
            </div>
          </div>
        </div>

        <div className="metrics-detail">
          <h3>Performance Metrics</h3>
          <div className="metrics-table">
            <div className="metric-row">
              <span>Messages Per Second</span>
              <span className="value">{metrics.messagesPerSecond}</span>
            </div>
            <div className="metric-row">
              <span>Average Latency</span>
              <span className="value">{formatLatency(metrics.avgLatency)}</span>
            </div>
            <div className="metric-row">
              <span>Error Rate</span>
              <span className="value">{(metrics.errorRate * 100).toFixed(2)}%</span>
            </div>
            <div className="metric-row">
              <span>Active Connections</span>
              <span className="value">{metrics.activeConnections}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function LogsTab({ logs }) {
    const [levelFilter, setLevelFilter] = useState('all');

    const filtered = logs.filter(log => {
      if (levelFilter === 'all') return true;
      return log.level === levelFilter;
    });

    const getLogColor = (level) => {
      switch (level) {
        case 'error': return '#e8863a';
        case 'warn': return '#ffd700';
        case 'info': return '#4db8a8';
        default: return '#666';
      }
    };

    return (
      <div className="logs-tab">
        <div className="tab-header">
          <select 
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="level-filter"
          >
            <option value="all">All Levels</option>
            <option value="error">Error</option>
            <option value="warn">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>

        <div className="logs-container">
          {filtered.slice(0, 100).map((log, i) => (
            <div key={i} className="log-entry">
              <span className="log-time">{formatTime(log.timestamp)}</span>
              <span 
                className="log-level"
                style={{ color: getLogColor(log.level) }}
              >
                {log.level.toUpperCase()}
              </span>
              <span className="log-source">{log.source}</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
};

export default MeshAdminDashboard;
