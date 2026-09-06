// @p31/sovereign — Ed25519 identity (WebCrypto)
import bs58 from "bs58";

export async function generateSessionKey(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: "Ed25519" },
    false,
    ["sign", "verify"]
  );
}

export async function publicKeyToDid(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  const bytes = new Uint8Array(raw);
  const prefixed = new Uint8Array(2 + bytes.length);
  prefixed[0] = 0xed;
  prefixed[1] = 0x01;
  prefixed.set(bytes, 2);
  const encoded = bs58.encode(prefixed);
  return `did:key:z${encoded}`;
}

export async function signData(
  key: CryptoKey,
  data: Uint8Array
): Promise<Uint8Array> {
  const sig = await crypto.subtle.sign("Ed25519", key, data as unknown as BufferSource);
  return new Uint8Array(sig);
}

export async function verifySignature(
  publicKey: CryptoKey,
  signature: Uint8Array,
  data: Uint8Array
): Promise<boolean> {
  return crypto.subtle.verify(
    "Ed25519", 
    publicKey, 
    signature as unknown as BufferSource, 
    data as unknown as BufferSource
  );
}
