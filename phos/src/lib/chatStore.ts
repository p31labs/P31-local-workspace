import { getDb } from './pglite';
import type { ChatMessage } from './pglite';

export async function saveMessage(message: ChatMessage): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('PGlite not initialized');
  await db.query(
    'INSERT INTO chat_messages (id, role, content) VALUES ($1, $2, $3)',
    [message.id, message.role, message.content]
  );
}

export async function deleteMessage(id: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('PGlite not initialized');
  await db.query('DELETE FROM chat_messages WHERE id = $1', [id]);
}

export async function clearAllChats(): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('PGlite not initialized');
  await db.exec('DELETE FROM chat_messages');
}
