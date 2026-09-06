import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dispatchHubPingRelay, validateRelayUrl } from '../hub-live-relay.js';

describe('hub-live-relay', () => {
  it('validateRelayUrl requires https and real host', () => {
    assert.equal(validateRelayUrl('').ok, false);
    assert.equal(validateRelayUrl('http://example.com/hook').ok, false);
    assert.equal(validateRelayUrl('https://127.0.0.1/x').ok, false);
    const ok = validateRelayUrl('https://relay.example.com/ping');
    assert.equal(ok.ok, true);
    if (ok.ok) assert.ok(ok.href.startsWith('https://relay.example.com'));
  });

  it('dispatchHubPingRelay rejects bad URL without fetch', async () => {
    const r = await dispatchHubPingRelay('http://insecure.example/x', null, {});
    assert.equal(r.ok, false);
  });
});
