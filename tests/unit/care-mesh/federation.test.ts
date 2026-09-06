import { describe, it, expect } from 'vitest';
import { CareFederationNode } from '../../../workers/care-mesh/src/federation';

class MockDurableObjectState {
  storage = new Map<string, unknown>();
  blockConcurrencyWhile(fn: () => Promise<void>) { return fn(); }
}

class MockEnv {
  CARE_FEDERATION = {} as DurableObjectNamespace;
}

describe('CareFederationNode', () => {
  it('constructs with empty peers', () => {
    const state = new MockDurableObjectState() as unknown as DurableObjectState;
    const env = new MockEnv() as unknown as Env;
    const node = new CareFederationNode(state, env);
    expect(node).toBeDefined();
  });

  it('handles health check', async () => {
    const state = new MockDurableObjectState() as unknown as DurableObjectState;
    const env = new MockEnv() as unknown as Env;
    const node = new CareFederationNode(state, env);
    const req = new Request('http://internal/health');
    const res = await node.fetch(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.node).toBe('care-federation');
  });
});
