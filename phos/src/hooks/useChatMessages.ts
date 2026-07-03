import { useState, useCallback } from 'react';
import { useLiveQuery } from '@electric-sql/pglite-react';
import { saveMessage, deleteMessage, clearAllChats } from '../lib/chatStore';
import { semanticSearch } from '../lib/semanticSearch';

export function useChatMessages(limit = 100) {
  const [error, setError] = useState<string | null>(null);

  const liveResult = useLiveQuery<{ id: string; role: string; content: string }>(
    'SELECT id, role, content, created_at FROM chat_messages ORDER BY created_at ASC LIMIT $1',
    [limit]
  );

  const sendMessage = useCallback(async (role: string, content: string) => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const message = { id, role, content };
    try {
      await saveMessage(message);
      semanticSearch.indexContent(id, content, 'chat_message', undefined, {
        role,
        created_at: new Date().toISOString(),
      }).catch(() => {});
      return message;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save message');
      return null;
    }
  }, []);

  const removeMessage = useCallback(async (id: string) => {
    try {
      await deleteMessage(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await clearAllChats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear messages');
    }
  }, []);

  return {
    messages: liveResult?.rows ?? [],
    isLoading: liveResult === undefined,
    error,
    sendMessage,
    removeMessage,
    clearAll,
    isReady: liveResult !== undefined,
  };
}
