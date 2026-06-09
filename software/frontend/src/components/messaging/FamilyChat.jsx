import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useWebSocket, useWebSocketQueue } from '../hooks/useWebSocket';
import { createMeshClient } from '../api/mesh-client';
import './FamilyChat.css';

/**
 * FamilyChat Component
 * Real-time messaging for family and friends within K⁴ mesh
 */
export const FamilyChat = ({ userId, userName }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const clientRef = useRef(null);
  
  // Initialize API client
  const client = useMemo(() => {
    if (!userId) return null;
    const c = createMeshClient({ userId });
    clientRef.current = c;
    return c;
  }, [userId]);

  // WebSocket connection
  const ws = useWebSocket(userId, { autoConnect: true });
  
  // Message queue for offline support
  const { queueMessage, flushQueue, queueSize } = useWebSocketQueue(ws);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [userId]);

  // WebSocket event handlers
  useEffect(() => {
    if (!ws) return;

    const handlers = {
      'message:new': handleNewMessage,
      'message:delivered': handleMessageDelivered,
      'message:read': handleMessageRead,
      'typing:indicator': handleTypingIndicator,
      'presence:changed': handlePresenceChange,
      'message:reaction': handleReaction
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      ws.on(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        ws.off(event, handler);
      });
    };
  }, [ws, currentConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/conversations?userId=${userId}`);
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (err) {
      setError('Failed to load conversations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messages/${conversationId}?limit=50`);
      const data = await response.json();
      setMessages(data.messages || []);
      setCurrentConversation(conversationId);
      
      // Mark as read
      markConversationAsRead(conversationId);
    } catch (err) {
      setError('Failed to load messages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentConversation) return;

    const messageData = {
      conversationId: currentConversation,
      content: newMessage.trim(),
      type: 'text',
      senderId: userId
    };

    try {
      // Optimistic update
      const tempId = `temp_${Date.now()}`;
      const optimisticMessage = {
        id: tempId,
        ...messageData,
        timestamp: Date.now(),
        delivered: false,
        read: false
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');

      // Send via WebSocket if available
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'message:send',
          ...messageData
        }));
      } else {
        // Fallback to HTTP
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageData)
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();
        // Replace temp message with real one
        setMessages(prev => prev.map(m => 
          m.id === tempId ? { ...m, id: data.messageId, delivered: true } : m
        ));
      }
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    }
  };

  const handleNewMessage = (data) => {
    const { message } = data;
    
    setMessages(prev => {
      // Avoid duplicates
      if (prev.some(m => m.id === message.id)) return prev;
      
      const updated = [...prev, message];
      return updated.sort((a, b) => a.timestamp - b.timestamp);
    });

    // Show notification if not focused
    if (document.hidden && message.senderId !== userId) {
      showNotification(message);
    }
  };

  const handleMessageDelivered = (data) => {
    const { messageId } = data;
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, delivered: true } : m
    ));
  };

  const handleMessageRead = (data) => {
    const { messageId } = data;
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, read: true } : m
    ));
  };

  const handleTypingIndicator = (data) => {
    const { userId, conversationId, typing } = data;
    
    if (conversationId === currentConversation) {
      setTypingUsers(prev => ({
        ...prev,
        [userId]: typing
      }));
    }
  };

  const handlePresenceChange = (data) => {
    const { userId, status } = data;
    setOnlineUsers(prev => ({
      ...prev,
      [userId]: status
    }));
  };

  const handleReaction = (data) => {
    const { messageId, userId, emoji } = data;
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const reactions = [...(m.reactions || [])];
        const existing = reactions.find(r => r.userId === userId);
        
        if (existing) {
          existing.emoji = emoji;
        } else {
          reactions.push({ userId, emoji });
        }
        
        return { ...m, reactions };
      }
      return m;
    }));
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (ws && currentConversation) {
      // Send typing start
      ws.send(JSON.stringify({
        type: 'typing:start',
        conversationId: currentConversation
      }));

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Send typing stop after delay
      typingTimeoutRef.current = setTimeout(() => {
        ws.send(JSON.stringify({
          type: 'typing:stop',
          conversationId: currentConversation
        }));
      }, 2000);
    }
  };

  const markConversationAsRead = async (conversationId) => {
    try {
      await fetch(`/api/messages/${conversationId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showNotification = (message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Message', {
        body: `${message.senderName}: ${message.content.substring(0, 50)}...`,
        icon: '/favicon.ico'
      });
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="family-chat">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h3>Family Messages</h3>
          <button 
            className="btn btn-primary"
            onClick={() => {/* Open new conversation modal */}}
          >
            New Chat
          </button>
        </div>
        
        <div className="conversations-list">
          {loading && <div className="loading">Loading...</div>}
          {error && <div className="error">{error}</div>}
          
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`conversation-item ${currentConversation === conv.id ? 'active' : ''}`}
              onClick={() => fetchMessages(conv.id)}
            >
              <div className="conversation-avatar">
                {conv.participants
                  .filter(id => id !== userId)
                  .slice(0, 3)
                  .map(id => (
                    <div key={id} className="avatar">
                      {id.charAt(0).toUpperCase()}
                    </div>
                  ))}
              </div>
              
              <div className="conversation-info">
                <div className="conversation-name">
                  {conv.name || conv.participants
                    .filter(id => id !== userId)
                    .map(id => id.charAt(0).toUpperCase())
                    .join(', ')}
                </div>
                
                {conv.lastMessage && (
                  <div className="last-message">
                    {conv.lastMessage.content.substring(0, 50)}
                  </div>
                )}
              </div>
              
              {conv.unreadCount > 0 && (
                <div className="unread-badge">{conv.unreadCount}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        {currentConversation ? (
          <>
            <div className="chat-header">
              <h3>Conversation</h3>
              <div className="online-indicators">
                {Object.entries(onlineUsers).map(([id, status]) => (
                  <div
                    key={id}
                    className={`online-dot ${status}`}
                    title={`${id}: ${status}`}
                  />
                ))}
              </div>
            </div>

            <div className="messages-container">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`message ${msg.senderId === userId ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    {msg.content}
                  </div>
                  
                  <div className="message-meta">
                    <span className="message-time">{formatTime(msg.timestamp)}</span>
                    
                    {msg.senderId === userId && (
                      <span className="message-status">
                        {msg.read ? '✓✓' : msg.delivered ? '✓' : ''}
                      </span>
                    )}
                    
                    {msg.reactions && msg.reactions.length > 0 && (
                      <span className="message-reactions">
                        {msg.reactions.map((r, i) => (
                          <span key={i} className="reaction">{r.emoji}</span>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {Object.entries(typingUsers).some(([_, typing]) => typing) && (
                <div className="typing-indicator">
                  <span>Someone is typing...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input">
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                disabled={loading}
              />
              <button 
                onClick={sendMessage}
                disabled={!newMessage.trim() || loading}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="chat-placeholder">
            <h3>Select a conversation to start messaging</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyChat;