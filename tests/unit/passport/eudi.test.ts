import { describe, it, expect } from 'vitest';
import {
  createSDJWTVC,
  parseSDJWT,
  SDJWTVCEnvelope,
} from '../../../packages/ui/src/passport/eudi';
import type { CognitivePassport } from '../../../packages/ui/src/passport/schema';

describe('EUDI SD-JWT VC', () => {
  const passport: CognitivePassport = {
    did: 'did:key:z6MkhaXgBZDjot9sz2i9iBYZpyCVi7gUbSqj9G9qZnGz8zYz',
    identity: { displayName: 'Test User', pronouns: 'they/them' },
    cognition: { processingStyle: 'visual' },
    accessibility: { screenComfort: 3, motionPreference: 'reduced', contrastPreference: 'standard', fontSize: 16, density: 1 },
    created: new Date().toISOString(),
  };

  it('creates SD-JWT VC envelope', () => {
    const vc = createSDJWTVC(passport, passport.did, passport.did);
    expect(vc.type).toContain('VerifiableCredential');
    expect(vc.type).toContain('CognitivePassportCredential');
    expect(vc.credentialSubject.id).toBe(passport.did);
    expect(vc.credentialSubject.displayName).toBe('Test User');
    expect(vc.credentialSubject.pronouns).toBe('they/them');
  });

  it('has valid issuance and expiration dates', () => {
    const vc = createSDJWTVC(passport, passport.did, passport.did);
    const issued = new Date(vc.issuanceDate);
    const expires = new Date(vc.expirationDate!);
    expect(issued.getTime()).toBeLessThan(expires.getTime());
    expect(expires.getTime() - issued.getTime()).toBeGreaterThan(300 * 24 * 60 * 60 * 1000);
    expect(expires.getTime() - issued.getTime()).toBeLessThan(400 * 24 * 60 * 60 * 1000);
  });

  it('parses SD-JWT correctly', () => {
    const vc = createSDJWTVC(passport, passport.did, passport.did);
    const jwt = `header.${btoa(JSON.stringify(vc))}.sig~~`;
    const parsed = parseSDJWT(jwt);
    expect(parsed).not.toBeNull();
    expect(parsed!.payload).toBeDefined();
    expect(parsed!.disclosures).toEqual([]);
  });

  it('parses SD-JWT with credentialSubject', () => {
    const vc = createSDJWTVC(passport, passport.did, passport.did);
    const jwt = `header.${btoa(JSON.stringify(vc))}.sig~~`;
    const parsed = parseSDJWT(jwt);
    expect(parsed!.payload.credentialSubject.displayName).toBe('Test User');
  });
});
