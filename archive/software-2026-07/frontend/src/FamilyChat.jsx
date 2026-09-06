import React, { useState, useEffect, useRef } from 'react';

export default function FamilyChat({ client, userId, onNetworkEvent }) {
  const [conversations, setConversations] = useState([]);
  const [currentConv, setCurrentConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [presence, setPresence] = useState({});
  const [groupState, setGroupState] = useState(null);
  const [e2eeEnabled, setE2eeEnabled] = useState(true);

  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize and fetch conversations
  useEffect(() => {
    if (!client) return;

    const init = async () => {
      try {
        const convs = await client.getConversations();
        setConversations(convs.conversations || []);
      } catch (err) {
        console.warn('Failed to fetch conversations:', err);
      }
    };
    init();
  }, [client]);

  // Sync group state
  useEffect(() => {
    if (!client) return;

    const fetchGroupState = async () => {
      try {
        const res = await fetch('/api/group/state');
        if (res.ok) {
          const gs = await res.json();
          setGroupState(gs);
          await client.syncGroupState(gs);
        }
      } catch (e) {
        console.warn('Group state fetch failed');
      }
    };
    fetchGroupState();
  }, [client]);

  // Connect WebSocket when conversation selected
  useEffect(() => {
    if (!client || !currentConv) return;

    client.getMessages(currentConv).then(data => {
      setMessages(data.messages ? data.messages.reverse() : []);
    });

    wsRef.current = client.connectWebSocket(
      currentConv,
      // On New Message
      (msg) => {
        setMessages(prev => [...prev, msg]);
        if (onNetworkEvent) onNetworkEvent('message:new', msg);
      },
      // On Typing Indicator
      (data) => {
        setTypingUsers(prev => ({ ...prev, [data.userId]: data.typing }));
        if (onNetworkEvent) onNetworkEvent('typing:indicator', data);
      },
      // On Presence Change
      (data) => {
        setPresence(prev => ({ ...prev, [data.userId]: data.status }));
        if (onNetworkEvent) onNetworkEvent('presence:changed', data);
      }
    );

    return () => {
      if (wsRef.current && wsRef.current.close) wsRef.current.close();
    };
  }, [currentConv, client, onNetworkEvent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSend = async () => {
    if (!newMessage.trim() || !currentConv) return;
    const text = newMessage.trim();
    setNewMessage('');

    const tempMsg = { id: `temp-${Date.now()}`, senderId: userId, content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, tempMsg]);

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'message:send', conversationId: currentConv, content: text }));
      } else {
        await client.sendMessage(currentConv, text);
        setTimeout(() => {
          setMessages(prev => [...prev, { id: `resp-${Date.now()}`, senderId: 'sj', content: 'Message received (E2EE).', timestamp: Date.now() }]);
        }, 1000);
      }
    } catch (err) {
      console.error('Send failed:', err);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'typing:start', conversationId: currentConv }));
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      wsRef.current.send(JSON.stringify({ type: 'typing:stop', conversationId: currentConv }));
    }, 2000);
  };

  const rotateEpoch = async () => {
    if (!client) return;
    try {
      const commit = await client.broadcastCommit();
      if (onNetworkEvent) onNetworkEvent('commit', commit);
      setGroupState(await (await fetch('/api/group/state')).json());
    } catch (e) {
      console.error('Epoch rotation failed:', e);
    }
  };

  const toggleE2EE = () => {
    setE2eeEnabled(!e2eeEnabled);
    client.options.useE2EE = !e2eeEnabled;
  };

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a24; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4db8a8; }
        .e2ee-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #0a3d3d; color: #4db8a8; }
        .e2ee-off { background: #3d1a1a !important; color: #c84b4b !important; }
      `}</style>
      <div className="h-screen w-full flex bg-[#050508] text-white font-sans">
        {/* Sidebar */}
        <div className="w-80 border-r border-[#1a1a24] bg-[#12121a] flex flex-col">
          <div className="p-4 border-b border-[#1a1a24]">
            <div className="flex items-center justify-between">
              <h2 className="text-[#4db8a8] font-bold tracking-widest text-sm">K⁴ CONVERSATIONS</h2>
              <div className="flex gap-2">
                <span className={`e2ee-badge ${!e2eeEnabled ? 'e2ee-off' : ''}`}>
                  {e2eeEnabled ? 'E2EE ON' : 'E2EE OFF'}
                </span>
              </div>
            </div>
            {groupState && (
              <div className="text-[10px] text-gray-500 mt-1">Epoch: {groupState.epoch}</div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setCurrentConv(conv.id)}
                className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${currentConv === conv.id ? 'bg-[#4db8a8]/10 border-l-2 border-[#4db8a8]' : 'hover:bg-white/5'}`}
              >
                <div className="font-bold text-sm">{conv.name || conv.participants.filter(p => p !== userId).join(', ')}</div>
                {conv.last_message_content && (
                  <div className="text-xs text-gray-500 truncate mt-1">{conv.last_message_content}</div>
                )}
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-[#1a1a24] space-y-1">
            <button
              onClick={rotateEpoch}
              className="w-full text-xs text-[#4db8a8] hover:bg-[#4db8a8]/10 rounded px-2 py-1 transition-colors"
              title="Rotate epoch (new TreeKEM keys)"
            >
              🔄 Rotate Epoch
            </button>
            <button
              onClick={toggleE2EE}
              className="w-full text-xs text-orange-400 hover:bg-orange-400/10 rounded px-2 py-1 transition-colors"
            >
              {e2eeEnabled ? '🔒 Disable E2EE' : '🔓 Enable E2EE'}
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-[#050508] relative">
          {currentConv ? (
            <>
              <div className="p-4 border-b border-[#1a1a24] bg-[#12121a]/80 backdrop-blur flex justify-between items-center absolute top-0 w-full z-10">
                <div>
                  <h3 className="font-bold tracking-wider text-sm">Mesh Node Connection</h3>
                  <div className="text-[10px] text-gray-500">{e2eeEnabled ? 'E2EE: AES-GCM 256-bit' : 'E2EE: Disabled'}</div>
                </div>
                <div className="flex gap-4">
                  {['will', 'sj', 'wj', 'christyn'].map(user => (
                    <div key={user} className="flex items-center gap-1.5 text-xs font-mono">
                      <div className={`w-2 h-2 rounded-full ${presence[user] === 'online' ? 'bg-[#4db8a8] shadow-[0_0_8px_#4db8a8]' : 'bg-gray-600'}`} />
                      <span className={presence[user] === 'online' ? 'text-gray-300' : 'text-gray-600'}>{user}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar pt-20">
                {messages.map(msg => {
                  const isMe = msg.senderId === userId;
                  const isEncrypted = msg.encrypted || msg.decrypted;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="text-[10px] text-gray-500 mb-1 ml-1 font-mono uppercase tracking-widest">
                        {msg.senderId} {isEncrypted && <span className="text-[#4db8a8]">🔒</span>}
                      </div>
                      <div className={`px-4 py-2.5 rounded-2xl max-w-[70%] text-sm ${isMe ? 'bg-[#4db8a8] text-[#050508] rounded-br-sm font-medium' : 'bg-[#12121a] border border-[#1a1a24] rounded-bl-sm shadow-md'}`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                {Object.entries(typingUsers).filter(([uid, isTyping]) => isTyping && uid !== userId).map(([uid]) => (
                  <div key={uid} className="text-xs text-[#e8863a] animate-pulse ml-2 font-mono">
                    {uid} is transmitting...
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-[#12121a] border-t border-[#1a1a24]">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Transmit encrypted payload to mesh..."
                    className="flex-1 bg-[#050508] border border-[#1a1a24] rounded-full px-5 py-2.5 text-sm focus:outline-none focus:border-[#4db8a8] transition-colors"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                    className="bg-[#4db8a8] text-[#050508] font-bold tracking-widest px-6 py-2.5 rounded-full text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3ca394] transition-colors"
                  >
                    SEND
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#4a4a5a] text-sm tracking-widest uppercase font-bold">
              Select a node to establish E2EE connection
            </div>
          )}
        </div>
      </div>
    </>
  );
}
