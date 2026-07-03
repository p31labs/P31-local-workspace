export interface LogEvent {
  event: string;
  level?: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  timestamp: number;
  did?: string;
  success?: boolean;
  durationMs?: number;
  [key: string]: any;
}

export function logEvent(event: LogEvent): void {
  const entry = {
    ...event,
    level: event.level || 'info',
    environment: process.env.NODE_ENV || 'production',
  };
  console.log(JSON.stringify(entry));
}
