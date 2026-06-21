export type TaskType = 'ping' | 'call' | 'game' | 'task' | 'reminder' | 'check-in';

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export type TaskStatus = 'pending' | 'dispatched' | 'accepted' | 'completed' | 'declined' | 'expired';

export type IntentType = 'connect' | 'delegate' | 'checkin' | 'play' | 'support' | 'schedule';

export interface Actor {
  id: string;
  displayName: string;
  relationshipType: string;
  trustScore: number;
  availability: Availability;
  consentFlags: string[];
}

export interface Availability {
  status: 'available' | 'busy' | 'away' | 'do-not-disturb';
  nextAvailable: number | null;
  timeWindow: { start: number; end: number } | null;
}

export interface Task {
  id: string;
  type: TaskType;
  intent: IntentType;
  title: string;
  description: string;
  fromActor: string;
  toActor: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: number;
  expiresAt: number | null;
  metadata: Record<string, unknown>;
}

export interface TaskDispatch {
  taskId: string;
  fromActor: string;
  toActor: string;
  dispatchedAt: number;
  channel: 'voice' | 'notification' | 'sms' | 'email' | 'app';
  expiresAt: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface EngagementLogEntry {
  taskId: string;
  event: 'dispatched' | 'accepted' | 'declined' | 'completed' | 'expired' | 'cancelled';
  actor: string;
  timestamp: number;
  evidenceHash: string;
  metadata: Record<string, unknown>;
}

export function createTask(params: {
  type: TaskType;
  intent: IntentType;
  title: string;
  description?: string;
  fromActor: string;
  toActor: string;
  priority?: TaskPriority;
  expiresIn?: number;
}): Task {
  const timestamp = Date.now();
  const id = `task-${timestamp}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    type: params.type,
    intent: params.intent,
    title: params.title,
    description: params.description ?? '',
    fromActor: params.fromActor,
    toActor: params.toActor,
    priority: params.priority ?? 'normal',
    status: 'pending',
    createdAt: timestamp,
    expiresAt: params.expiresIn ? timestamp + params.expiresIn : null,
    metadata: {},
  };
}

export function createTaskDispatch(task: Task, channel: TaskDispatch['channel']): TaskDispatch {
  return {
    taskId: task.id,
    fromActor: task.fromActor,
    toActor: task.toActor,
    dispatchedAt: Date.now(),
    channel,
    expiresAt: task.expiresAt ?? Date.now() + 3600_000,
    status: 'pending',
  };
}
