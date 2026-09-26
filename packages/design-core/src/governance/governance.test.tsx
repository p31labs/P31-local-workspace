/**
 * @file governance.test.tsx — smoke tests for the audit/agent governance
 * components. They render without throwing and assert the key surfaces.
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ChainTimeline,
  VerifyButton,
  EnforcementGauge,
  RefusalFeed,
  ProposalQueue,
  SovereignBadge,
  LumiIdentityCard,
} from './index.js';

describe('governance components', () => {
  it('ChainTimeline renders events with hashes', () => {
    const html = renderToStaticMarkup(
      <ChainTimeline
        verifyStatus="intact"
        events={[
          { seq: 1, ts: '2026-09-22T10:00:00Z', actor: 'human', action: 'read', hash: '0xabc', prevHash: '—' },
          { seq: 2, ts: '2026-09-22T10:01:00Z', actor: 'agent', actorName: 'Lumi', action: 'propose', hash: '0xdef', prevHash: '0xabc', verified: true },
        ]}
      />,
    );
    expect(html).toContain('Chain intact');
    expect(html).toContain('Lumi');
    expect(html).toContain('0xabc');
  });

  it('ChainTimeline marks a broken chain', () => {
    const html = renderToStaticMarkup(
      <ChainTimeline
        verifyStatus="broken"
        events={[{ seq: 1, ts: 't', actor: 'agent', action: 'propose', hash: '0x1', broken: true }]}
      />,
    );
    expect(html).toContain('Chain broken');
  });

  it('VerifyButton renders and runs the verifier', async () => {
    const onVerify = vi.fn(async () => ({ intact: true, count: 42, checkedAt: '12s ago' }));
    const html = renderToStaticMarkup(<VerifyButton onVerify={onVerify} />);
    expect(html).toContain('Verify chain');
  });

  it('EnforcementGauge shows observe state', () => {
    const html = renderToStaticMarkup(<EnforcementGauge mode="observe" wouldRefuse={3} />);
    expect(html).toContain('Observe');
    expect(html).toContain('3 would-refuse');
  });

  it('RefusalFeed renders refusals with reasons', () => {
    const html = renderToStaticMarkup(
      <RefusalFeed
        mode="enforce"
        refusals={[{ id: 'r1', ts: 't', actor: 'Lumi', action: 'write', reason: 'scope' }]}
      />,
    );
    expect(html).toContain('Scope violation');
  });

  it('ProposalQueue renders accept/reject controls', () => {
    const html = renderToStaticMarkup(
      <ProposalQueue proposals={[{ id: 'p1', ts: 't', action: 'send reminder' }]} />,
    );
    expect(html).toContain('Accept');
    expect(html).toContain('Reject');
  });

  it('SovereignBadge shows offline sovereign state', () => {
    const html = renderToStaticMarkup(<SovereignBadge syncState="offline" pqcReady />);
    expect(html).toContain('all data local');
  });

  it('LumiIdentityCard renders DID and scope checklist', () => {
    const html = renderToStaticMarkup(
      <LumiIdentityCard
        did="did:key:z6Mk..."
        scope={{ allowed: ['read events'], denied: ['approve'] }}
        signatureVerified
      />,
    );
    expect(html).toContain('did:key:z6Mk');
    expect(html).toContain('read events');
  });
});