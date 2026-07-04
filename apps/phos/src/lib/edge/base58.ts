const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE58_MAP = new Map<string, number>();
for (let i = 0; i < BASE58_ALPHABET.length; i++) {
  BASE58_MAP.set(BASE58_ALPHABET[i], i);
}

export function decodeBase58(input: string): Uint8Array {
  if (!input || input.length === 0) return new Uint8Array(0);

  let value = 0n;
  for (const char of input) {
    const digit = BASE58_MAP.get(char);
    if (digit === undefined) throw new Error(`Invalid base58 character: ${char}`);
    value = value * 58n + BigInt(digit);
  }

  const bytes: number[] = [];
  while (value > 0n) {
    bytes.unshift(Number(value & 0xFFn));
    value >>= 8n;
  }

  for (const char of input) {
    if (char === '1') {
      bytes.unshift(0);
    } else {
      break;
    }
  }

  return new Uint8Array(bytes);
}
