-- 006_cbs_coin.sql — Axis-1 single-use withdrawn coins.
--
-- Each blind-signature coin (c', s') is spent exactly once at
-- /withdraw. Replaying the same coin (same c',s') against the
-- payer's DID drains the balance, so the coin id (c') is
-- claimed here BEFORE the debit. A second presentation hits
-- the PRIMARY KEY: INSERT OR IGNORE -> changes() == 0 ->
-- rejected with 409. This is the missing half of replay
-- protection (cbs_nonce guards the signing nonce t; this
-- guards the issued token at withdrawal).
CREATE TABLE IF NOT EXISTS cbs_coin (
  coin    TEXT PRIMARY KEY,
  did     TEXT NOT NULL,
  expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cbs_coin_expires ON cbs_coin (expires);
