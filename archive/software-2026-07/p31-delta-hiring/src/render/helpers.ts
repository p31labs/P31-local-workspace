import type { Priority, RolePacket } from '../types';

export function priorityClass(p: Priority): string {
  if (p === 'high') return 'pill pill-high';
  if (p === 'medium') return 'pill pill-med';
  return 'pill pill-low';
}

export function uniqueGuilds(roles: RolePacket[]): string[] {
  return [...new Set(roles.map((r) => r.guild))].sort();
}
