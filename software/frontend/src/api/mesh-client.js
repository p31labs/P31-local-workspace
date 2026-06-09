/**
 * K⁴ Mesh Frontend API Client
 * Centralized service for interacting with the messaging infrastructure.
 * 
 * Handles:
 * - REST API calls with error handling
 * - WebSocket connection management
 * - Automatic reconnection
 * - Request/response interceptors
 * - Environment switching (dev/staging/prod)
 */

class MeshClient {
  constructor(config = {}) {
    this.userId = config.userId || 'anonymous';
    this.baseUrl = config.baseUrl || this.detectBaseUrl();
    this.wsUrl = config.wsUrl || this.detectWsUrl();
    this.token = config.token || null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.ws = null;
    this.messageHandlers = new Map();
    this.typingHandlers = new Map();
    this.presenceHandlers = new Map();
    this.connectionCallbacks = {
      onOpen: [],
      onClose: [],
      onError: []
    };
  }

  /**
   * Auto-detect environment
   */
  detectBaseUrl() {
    if (process.env.NODE_ENV === 'production') {
      return 'https://k4-cage.trimtab-signal.workers.dev';
    }
    // Development
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:8787';
    }
    // Staging (could be p31ca.org)
    return `https://${host}`;
  }

  detectWsUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = this.baseUrl.replace(/^https?:\/\//, '');
    return `${protocol}//${host}/ws/family-mesh`;
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Generic request wrapper with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      ...options.headers
    };

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      
      // Handle 401 unauthorized
      if (response.status === 401) {
        this.handleUnauthorized();
        throw new Error('Unauthorized - token may be expired');
      }

      // Handle non-OK responses
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[MeshClient] ${options.method || 'GET'} ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Handle unauthorized responses
   */
  handleUnauthorized() {
    // Emit event for UI to handle re-auth
    window.dispatchEvent(new CustomEvent('mesh:unauthorized'));
  }

  // ============ CONVERSATIONS ============

  /**
   * List user's conversations
   */
  async getConversations(userId = this.userId) {
    return this.request(`/api/conversations?userId=${encodeURIComponent(userId)}`, {
      method: 'GET'
    });
  }

  /**
   * Get single conversation
   */
  async getConversation(conversationId) {
    return this.request(`/api/conversations/${conversationId}`, {
      method: 'GET'
    });
  }

  /**
   * Create new conversation
   */
  async createConversation(data) {
    // data: { type, name?, participants[] }
    return this.request('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({
        ...data
      })
    });
  }

  /**
   * Update typing status
   */
  async setTyping(conversationId, isTyping) {
    return this.request(`/api/conversations/${conversationId}/typing`, {
      method: 'PUT',
      body: JSON.stringify({
        userId: this.userId,
        typing: Boolean(isTyping)
      })
    });
  }

  /**
   * Add message reaction
   */
  async addReaction(conversationId, messageId, emoji) {
    return this.request(`/api/conversations/${conversationId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({
        messageId,
        userId: this.userId,
        emoji
      })
    });
  }

  // ============ MESSAGES ============

  /**
   * Get message history for conversation
   */
  async getMessages(conversationId, options = {}) {
    const params = new URLSearchParams({
      limit: options.limit || 50,
      ...(options.before && { before: options.before }),
      ...(options.after && { after: options.after })
    });
    return this.request(`/api/messages/${conversationId}?${params}`, {
      method: 'GET'
    });
  }

  /**
   * Send message
   */
  async sendMessage(conversationId, content, type = 'text', metadata = {}) {
    return this.request('/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversationId,
        senderId: this.userId,
        content,
        type,
        metadata
      })
    });
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId) {
    return this.request(`/api/messages/${messageId}/read`, {
      method: 'PUT',
      body: JSON.stringify({ userId: this.userId })
    });
  }

  /**
   * Mark message as delivered
   */
  async markAsDelivered(messageId) {
    return this.request(`/api/messages/${messageId}/delivered`, {
      method: 'PUT',
      body: JSON.stringify({ userId: this.userId })
    });
  }

  /**
   * Search messages
   */
  async searchMessages(query, options = {}) {
    const params = new URLSearchParams({
      q: query,
      userId: this.userId,
      limit: options.limit || 20
    });
    return this.request(`/api/messages/search?${params}`, {
      method: 'GET'
    });
  }

  // ============ FAMILY REGISTRY ============

  /**
   * Get family member profile
   */
  async getMember(memberId) {
    return this.request(`/api/family/members/${memberId}`);
  }

  /**
   * List all family members
   */
  async listMembers() {
    return this.request('/api/family/members');
  }

  /**
   * Register device for push notifications
   */
  async registerDevice(deviceInfo) {
    return this.request('/api/family/devices', {
      method: 'POST',
      body: JSON.stringify({
        memberId: this.userId,
        ...deviceInfo
      })
    });
  }

  // ============ WEBSOCKET ============

  /**
   * Connect to real-time messaging WebSocket
   */
  connectWebSocket(onMessage, onTyping, onPresence, onError) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn('[MeshClient] WebSocket already connected');
      return this.ws;
    }

    // Build URL with userId
    const url = `${this.wsUrl}?userId=${encodeURIComponent(this.userId)}`;
    
    this.ws = new WebSocket(url);
    this.reconnectAttempts = 0;

    this.ws.onopen = () => {
      console.log('[MeshClient] WebSocket connected');
      this.reconnectAttempts = 0;
      
      // Send auth if token present
      if (this.token) {
        this.ws.send(JSON.stringify({
          type: 'auth',
          token: this.token
        }));
      }

      // Emit connected event
      if (onMessage) {
        onMessage({ type: 'connected', userId: this.userId, timestamp: Date.now() });
      }
      
      // Call all open callbacks
      this.connectionCallbacks.onOpen.forEach(cb => cb());
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'message:new':
            if (onMessage) onMessage(data.message);
            break;
          case 'typing:indicator':
            if (onTyping) onTyping(data);
            break;
          case 'presence:changed':
            if (onPresence) onPresence(data);
            break;
          case 'message:read':
          case 'message:delivered':
          case 'message:reaction':
            if (onMessage) onMessage(data);
            break;
          case 'error':
            console.error('[MeshClient] Server error:', data);
            break;
          default:
            // Unhandled but logged for debugging
            console.log('[MeshClient] Unhandled WS event:', data.type);
        }
      } catch (err) {
        console.error('[MeshClient] Failed to parse WS message:', err);
      }
    };

    this.ws.onclose = (event) => {
      console.log(`[MeshClient] WebSocket closed (code: ${event.code})`);
      this.ws = null;
      
      // Attempt reconnection with exponential backoff
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
        console.log(`[MeshClient] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
        
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connectWebSocket(onMessage, onTyping, onPresence, onError);
        }, delay);
      } else {
        console.error('[MeshClient] Max reconnection attempts reached');
        if (onError) onError(new Error('WebSocket connection lost'));
      }
    };

    this.ws.onerror = (error) => {
      console.error('[MeshClient] WebSocket error:', error);
      if (onError) onError(error);
    };

    return this.ws;
  }

  /**
   * Send message via WebSocket (optimized)
   */
  sendMessageWS(conversationId, content, type = 'text', metadata = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const payload = {
      type: 'message:send',
      conversationId,
      content,
      type,
      metadata,
      timestamp: Date.now()
    };

    this.ws.send(JSON.stringify(payload));
  }

  /**
   * Send typing indicator via WebSocket
   */
  sendTyping(conversationId, isTyping) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return; // Best effort, don't throw
    }

    const payload = {
      type: isTyping ? 'typing:start' : 'typing:stop',
      conversationId,
      userId: this.userId,
      timestamp: Date.now()
    };

    this.ws.send(JSON.stringify(payload));
  }

  /**
   * Close WebSocket connection
   */
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Add connection state callback
   */
  onConnectionState(callback) {
    this.connectionCallbacks.onOpen.push(callback.onOpen);
    this.connectionCallbacks.onClose.push(callback.onClose);
    this.connectionCallbacks.onError.push(callback.onError);
  }

  // ============ ADMIN ============

  /**
   * Get system metrics (admin only)
   */
  async getSystemMetrics() {
    return this.request('/api/admin/mesh/metrics', {
      method: 'GET'
    });
  }

  /**
   * Get system health (admin only)
   */
  async getSystemHealth() {
    return this.request('/api/admin/system/health', {
      method: 'GET'
    });
  }

  // ============ UTILITIES ============

  /**
   * Generate unique ID for optimistic UI
   */
  generateTempId() {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format timestamp for display
   */
  formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Format relative time (e.g., "2 min ago")
   */
  formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }
}

/**
 * Factory function
 */
export const createMeshClient = (config) => new MeshClient(config);

export { MeshClient };

/**
 * Default export for convenience
 */
export default MeshClient;
