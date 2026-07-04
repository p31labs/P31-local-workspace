type LogEntry = { type: string; message?: string; data?: unknown; timestamp: number };

const MAX_LOGS = 200;
let logs: LogEntry[] = [];

export function addLog(type: string, data?: unknown): void {
  logs.push({ type, message: typeof data === 'string' ? data : undefined, data, timestamp: Date.now() });
  if (logs.length > MAX_LOGS) logs = logs.slice(-MAX_LOGS);
}

export function getHistory(): LogEntry[] {
  return [...logs];
}
