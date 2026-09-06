import type { CognitivePassport } from './schema';
import type { StoredIdentity } from './store';

export interface PresentationPayload {
  sub: string;
  iss: string;
  iat: number;
  exp: number;
  vp: {
    '@context': string[];
    type: string[];
      verifiableCredential: {
        did: string;
        displayName?: string;
        pronouns?: string;
        cognition?: Record<string, unknown>;
      };
  };
}

export async function generatePresentation(
  passport: CognitivePassport,
  identity: StoredIdentity,
  ttlMs = 5 * 60_000,
): Promise<string> {
  const payload: PresentationPayload = {
    sub: passport.did,
    iss: passport.did,
    iat: Date.now(),
    exp: Date.now() + ttlMs,
    vp: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiablePresentation', 'CognitivePassportPresentation'],
      verifiableCredential: {
        did: passport.did,
        displayName: passport.identity?.displayName,
        pronouns: passport.identity?.pronouns,
        cognition: passport.cognition ? { ...passport.cognition } : undefined,
      },
    },
  };

  const msg = new TextEncoder().encode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    'jwk',
    identity.privateKeyJwk,
    { name: 'Ed25519' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('Ed25519', key, msg);
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));

  return JSON.stringify({ payload, signature: sigB64 });
}

export function presentationToQRData(presentationJwt: string): string {
  const data = JSON.parse(presentationJwt);
  return JSON.stringify({
    type: 'openid4vp',
    presentation_uri: `openid4vp://?request=${encodeURIComponent(presentationJwt)}`,
    exp: data.payload.exp,
  });
}
