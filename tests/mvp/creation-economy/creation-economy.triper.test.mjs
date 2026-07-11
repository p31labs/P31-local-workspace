// TRIPER MVP suite — CREATION ECONOMY (L5 intent-driven generation)
// Certifies the 6 TRIPER axes against the interface-generator's
// intent path — the IntentResolver's core. Live e2e (intent ->
// execution -> bridge -> receipt) needs the deployed Workers; here we
// certify the generation core offline (matches how TRIPER certs UIG).
import { describe, it, expect } from 'vitest';
import {
  generateInterface,
  generateInterfaceFromIntent,
  isValidDescription,
  triperScorecard,
} from '../_triper.mjs';
import { signReceipt, verifyReceipt } from '../../../software/workers/creation-accountant/src/receipt-crypto.ts';

const scenario = {
  prompt: 'Build an arcade game with a leaderboard',
  spoons: 3,
  role: 'participant',
  passport: null,
};

describe('TRIPER · CREATION ECONOMY — intent-driven generation', () => {
  it('Task: intent yields a purpose-built interface', () => {
    const d = generateInterfaceFromIntent({ prompt: scenario.prompt, spoons: scenario.spoons });
    expect(isValidDescription(d)).toBe(true);
    expect(triperScorecard(d, scenario).Task).toBe(true);
    expect(d.widgets.length).toBeGreaterThan(0);
  });

  it('Resilience: spoons=0 engages crisis mode without throwing', () => {
    const d = generateInterfaceFromIntent({ prompt: scenario.prompt, spoons: 0 });
    expect(d.crisisMode).toBe(true);
    expect(d.layout).toBe('focus-mode');
    expect(d.density).toBe('minimal');
    expect(isValidDescription(d)).toBe(true);
  });

  it('Resilience: malformed prompt degrades gracefully', () => {
    expect(() => generateInterfaceFromIntent({ prompt: '???', spoons: 3 })).not.toThrow();
    const d = generateInterfaceFromIntent({ prompt: '???', spoons: 3 });
    expect(isValidDescription(d)).toBe(true);
  });

  it('Interface: structurally valid description', () => {
    const d = generateInterfaceFromIntent({ prompt: scenario.prompt, spoons: 3 });
    expect(isValidDescription(d)).toBe(true);
    expect(triperScorecard(d).Interface).toBe(true);
  });

  it('Purity: deterministic for identical intent', () => {
    const a = JSON.stringify(generateInterfaceFromIntent({ prompt: scenario.prompt, spoons: 3 }));
    const b = JSON.stringify(generateInterfaceFromIntent({ prompt: scenario.prompt, spoons: 3 }));
    expect(a).toBe(b);
  });

  it('E2E: intent path yields a valid interface (offline core)', () => {
    const d = generateInterfaceFromIntent({ prompt: scenario.prompt, spoons: 3 });
    expect(isValidDescription(d)).toBe(true);
    expect(triperScorecard(d).E2E).toBe(true);
  });

  it('Regression: stable widget shape for fixed intent', () => {
    const d = generateInterfaceFromIntent({ prompt: scenario.prompt, spoons: 3 });
    expect(d.widgets.every((w) => typeof w.type === 'string')).toBe(true);
    expect(d.widgets.length).toBeGreaterThan(0);
  });

  it('Axis-2: Ed25519 receipt signature round-trips and rejects tampering', async () => {
    const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
    const priv = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
    const pub = new Uint8Array(await crypto.subtle.exportKey('spki', pair.publicKey));
    const msg = 'intent-1|did:key:u|did:key:w|2|0.15|love|0.15';
    const sig = await signReceipt(msg, priv);
    expect(await verifyReceipt(msg, sig, pub)).toBe(true);
    expect(await verifyReceipt('intent-1|tampered', sig, pub)).toBe(false);
  });
});
