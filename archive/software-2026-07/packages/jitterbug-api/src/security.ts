// Constant-time string comparison to avoid timing leaks when checking
// secrets (Bearer PSK, webhook HMAC signatures). XOR-accumulates over the
// full length with no early return.
export function timingSafeEqualStr(a: string | null | undefined, b: string): boolean {
  if (!a) return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
