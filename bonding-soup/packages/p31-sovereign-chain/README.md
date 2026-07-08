# P31 Sovereign Chain

Foundry project for the P31 LOVE economy smart contracts.

## Contracts

| Contract | Description |
|----------|-------------|
| `LOVESBT` | Soulbound ERC-721 reputation badge (ERC-5192). Non-transferable. Stores score, trustTier, category, issuedAt. |
| `ProofOfCare` | Oracle contract that syncs care scores and automatically triggers SBT mint/update via try/catch callbacks. |
| `GenesisSpark` | Soulbound ERC-721 ceremonial ignition badge (ERC-5192). Non-transferable. |

> **Note:** `LOVEToken.sol` has been **archived** (`archived/LOVEToken.sol`). There is **no on-chain LOVE ERC20**. LOVE balances live in the off-chain D1-backed `love-ledger` worker (two-pool model). On-chain attestations are SBT badges only.

## Trust Tiers

- `TRUST_TIER_SCALE = 0.5e18`
- Each 0.5e18 care score = 1 tier level
- `trustTier = floor(score / 0.5e18)`

## LOVE Rewards (off-chain ledger)

LOVE is minted off-chain by the `love-ledger` worker, not by a contract.

- Care score thresholds and reward amounts are defined in `software/workers/love-ledger.ts` (`LOVE_AMOUNTS`, `CARE_TYPES`).
- Two-pool split: 50% → Sovereignty Pool (immutable), 50% → Performance Pool (liquid, modulated by `care_score`).
- `CARE_THRESHOLD = 0.5e18` (minimum care score for SBT mint eligibility in `ProofOfCare`).
- On-chain `ProofOfCare` only mints `LOVESBT` badges; it does **not** mint LOVE.

## Testing

```bash
forge test
```

Run specific suite:
```bash
forge test --match-path test/LOVESBT.t.sol
```

## Deployment

```bash
# Set required env vars
export DEPLOYER_PRIVATE_KEY=0x...
export SOVEREIGNTY_POOL=0x...
export PERFORMANCE_POOL=0x...

# Deploy to Sepolia
forge script script/DeployAll.s.sol:DeployAll --rpc-url $SEPOLIA_RPC --broadcast --verify
```

## Dependencies

- OpenZeppelin Contracts v5.x (in `lib/openzeppelin-contracts`)
- Foundry (forge installed)

## Architecture Notes

- `ProofOfCare` does NOT own `LOVESBT` directly — it is authorized as a minter via `LOVESBT.authorizeMinter()`.
- `LOVESBT` is soulbound ERC-721 / ERC-5192 (all transfer/approve functions revert; `locked()` returns true).
- `GenesisSpark` is soulbound ERC-721 / ERC-5192 (all transfer/approve functions revert).
- `ProofOfCare._maybeMintSBT()` mints/updates the SBT on care-score thresholds using try/catch for atomic flow.
- LOVE rewards are issued by the off-chain `love-ledger` worker, not by any contract.
