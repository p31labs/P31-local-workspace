import { getPrivateKey } from '../../store/identity';

export async function signPayload(payload: any): Promise<{ body: any; signature: string }> {
  const privateKey = getPrivateKey();
  if (!privateKey) {
    throw new Error('No private key available. Please complete the Abdication Ritual.');
  }

  const payloadString = JSON.stringify(payload);
  const payloadBytes = new TextEncoder().encode(payloadString);

  const signatureBytes = await crypto.subtle.sign(
    'Ed25519',
    privateKey,
    payloadBytes
  );

  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

  return { body: payload, signature };
}

export async function signedFetch(
  url: string,
  options: RequestInit = {},
  didField: string = 'did'
): Promise<Response> {
  const method = options.method || 'POST';
  const body = options.body ? JSON.parse(options.body as string) : {};

  const did = body[didField] || body.voterDid || body.author || body.from || body.partyADid;
  if (!did) {
    throw new Error(`No DID found in payload. Expected field: ${didField}`);
  }

  const { body: signedBody, signature } = await signPayload(body);

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'X-Signature': signature,
    },
    body: JSON.stringify(signedBody),
  });
}
