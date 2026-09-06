export async function signPremiumToken(secret: string): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const message = encoder.encode(`premium:${expiresAt}`);
  const signature = await crypto.subtle.sign('HMAC', key, message);
  const token = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return { token, expiresAt };
}
