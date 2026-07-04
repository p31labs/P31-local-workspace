# P31 Sovereign Chain

Foundry project for the P31 LOVE economy smart contracts.

## Contracts

| Contract | Description |
|----------|-------------|
| `LOVEToken` | Soulbound ERC-20 LOVE token. Minted by oracle only, split 50/50 between sovereignty/performance pools. No external transfers. |
| `LOVESBT` | Soulbound ERC-721 reputation badge. Non-transferable. Stores score, trustTier, category, issuedAt. |
| `ProofOfCare` | Oracle contract that syncs care scores and automatically triggers SBT mint/update and LOVE reward via try/catch callbacks. |

## Trust Tiers

- `TRUST_TIER_SCALE = 0.5e18`
- Each 0.5e18 care score = 1 tier level
- `trustTier = floor(score / 0.5e18)`

## LOVE Rewards

- `REWARD_AMOUNT = 100 ether`
- `CARE_THRESHOLD = 0.5e18` (minimum score for reward eligibility)
- `REWARD_COOLDOWN = 1 day`
- Split: 50 ether → Sovereignty Pool, 50 ether → Performance Pool

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

- `ProofOfCare` does NOT own `LOVEToken` or `LOVESBT` directly
- `LOVEToken` is soulbound ERC-20 (no `transferFrom`/`approve` for external use)
- `LOVESBT` is soulbound ERC-721 (all transfer/approve functions revert)
- `ProofOfCare._maybeMintSBT()` and `_maybeMintLOVEReward()` use try/catch for atomic flow
- Constructor EIP-1153 check ensures `REWARD_AMOUNT` doesn't exceed balance (prevents underflow)
