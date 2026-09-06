import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createCommandRegistry,
  parseArgs,
  getPrefix,
  getTimeout,
  getApiUrls,
  type P31Command,
  type CommandContext,
} from '../commands/base';

describe('parseArgs', () => {
  it('strips prefix and splits on whitespace', () => {
    expect(parseArgs('p31 spoon @user 5', 'p31')).toEqual(['spoon', '@user', '5']);
  });

  it('returns empty array for bare prefix', () => {
    expect(parseArgs('p31', 'p31')).toEqual([]);
  });

  it('collapses multiple spaces', () => {
    expect(parseArgs('p31  nodes  ', 'p31')).toEqual(['nodes']);
  });
});

describe('createCommandRegistry', () => {
  const makeCmd = (name: string, aliases?: string[]): P31Command => ({
    name,
    description: `${name} desc`,
    aliases,
    usage: name,
    execute: vi.fn(),
  });

  it('registers and retrieves a command by name', () => {
    const registry = createCommandRegistry();
    const cmd = makeCmd('spoon');
    registry.register(cmd);
    expect(registry.get('spoon')).toBe(cmd);
  });

  it('lookup is case-insensitive', () => {
    const registry = createCommandRegistry();
    const cmd = makeCmd('Nodes');
    registry.register(cmd);
    expect(registry.get('NODES')).toBe(cmd);
    expect(registry.get('nodes')).toBe(cmd);
  });

  it('registers aliases', () => {
    const registry = createCommandRegistry();
    const cmd = makeCmd('nodes', ['mesh', 'network']);
    registry.register(cmd);
    expect(registry.get('mesh')).toBe(cmd);
    expect(registry.get('network')).toBe(cmd);
  });

  it('getAll returns unique commands (no alias duplicates)', () => {
    const registry = createCommandRegistry();
    registry.register(makeCmd('nodes', ['mesh', 'network']));
    registry.register(makeCmd('spoon'));
    const all = registry.getAll();
    expect(all).toHaveLength(2);
    expect(all.map(c => c.name)).toContain('nodes');
    expect(all.map(c => c.name)).toContain('spoon');
  });

  it('returns undefined for unknown command', () => {
    const registry = createCommandRegistry();
    expect(registry.get('unknown')).toBeUndefined();
  });
});

describe('getPrefix', () => {
  beforeEach(() => {
    delete process.env.BOT_PREFIX;
  });

  it('returns default prefix when env not set', () => {
    expect(getPrefix()).toBe('p31');
  });

  it('returns custom prefix from env', () => {
    process.env.BOT_PREFIX = '!';
    expect(getPrefix()).toBe('!');
  });
});

describe('getTimeout', () => {
  beforeEach(() => {
    delete process.env.RESPONSE_TIMEOUT_MS;
  });

  it('returns default 5000ms', () => {
    expect(getTimeout()).toBe(5000);
  });

  it('parses custom timeout from env', () => {
    process.env.RESPONSE_TIMEOUT_MS = '10000';
    expect(getTimeout()).toBe(10000);
  });
});

describe('getApiUrls', () => {
  beforeEach(() => {
    delete process.env.BONDING_API_URL;
    delete process.env.NODE_ONE_API_URL;
  });

  it('returns defaults when env not set', () => {
    const urls = getApiUrls();
    expect(urls.bonding).toBe('https://bonding.p31ca.org/api');
    expect(urls.nodeOne).toBe('http://localhost:3001/api');
  });

  it('uses env vars when set', () => {
    process.env.BONDING_API_URL = 'https://custom.api/bonding';
    const urls = getApiUrls();
    expect(urls.bonding).toBe('https://custom.api/bonding');
  });
});
