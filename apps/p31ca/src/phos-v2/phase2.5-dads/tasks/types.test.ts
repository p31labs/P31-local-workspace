import { describe, it, expect } from 'vitest';
import { createTask, createTaskDispatch } from './types';

describe('task types', () => {
  it('createTask generates a valid task', () => {
    const task = createTask({
      type: 'check-in',
      intent: 'connect',
      title: 'How are you?',
      fromActor: 'will',
      toActor: 'sj',
    });

    expect(task.id).toBeDefined();
    expect(task.id.startsWith('task-')).toBe(true);
    expect(task.type).toBe('check-in');
    expect(task.intent).toBe('connect');
    expect(task.title).toBe('How are you?');
    expect(task.status).toBe('pending');
    expect(task.createdAt).toBeGreaterThan(0);
  });

  it('createTaskDispatch generates a valid dispatch', () => {
    const task = createTask({
      type: 'ping',
      intent: 'connect',
      title: 'Test',
      fromActor: 'will',
      toActor: 'sj',
    });

    const dispatch = createTaskDispatch(task, 'voice');
    expect(dispatch.taskId).toBe(task.id);
    expect(dispatch.channel).toBe('voice');
    expect(dispatch.status).toBe('pending');
    expect(dispatch.dispatchedAt).toBeGreaterThan(0);
  });

  it('tasks can have custom priority', () => {
    const task = createTask({
      type: 'reminder',
      intent: 'delegate',
      title: 'Important',
      fromActor: 'will',
      toActor: 'sj',
      priority: 'high',
    });

    expect(task.priority).toBe('high');
  });

  it('tasks can have expiration', () => {
    const task = createTask({
      type: 'call',
      intent: 'checkin',
      title: 'Call',
      fromActor: 'will',
      toActor: 'sj',
      expiresIn: 3600_000, // 1 hour
    });

    expect(task.expiresAt).toBeGreaterThan(task.createdAt);
  });
});
