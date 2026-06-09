// @p31/sovereign — Genesis Block document schema
export interface GenesisBlock {
  deviceId: string;           // did:key of this device
  created: string;            // ISO timestamp
  chainHead: string;          // SHA-256 hash of latest entry
  entries: TelemetryEntry[];  // Append-only chain
  love: number;               // LOVE balance
  spoons: number;             // Current spoon count
  maxSpoons: number;
}

export interface TelemetryEntry {
  timestamp: string;
  type: string;
  data: Record<string, unknown>;
  prevHash: string;           // Hash of previous entry
  hash: string;               // SHA-256(data + prevHash + timestamp + signerDid)
  signature: string;          // Ed25519 signature
  signerDid: string;          // did:key of signer
}
