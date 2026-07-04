# Cognitive Passport Deployment Guide

## Prerequisites

- Foundry installed (`forge --version`)
- Base ETH in deployer wallet (>= 0.01 ETH)
- BaseScan API key (already in `foundry.toml`)

## Environment Variables

```bash
export DEPLOYER_PRIVATE_KEY=0x...
export PASSPORT_BASE_URI="ipfs://QmPassportMetadata/"
```

## Test Compile

```bash
cd bonding-soup/packages/p31-sovereign-chain
forge build
```

## Run Tests

```bash
forge test --match-path test/CognitivePassport.t.sol -vvv
```

## Testnet Deployment (Base Sepolia)

```bash
forge script script/DeployPassport.s.sol \
  --rpc-url base_sepolia \
  --broadcast --verify \
  --sig "run()"
```

## Mainnet Deployment (Base)

```bash
forge script script/DeployPassport.s.sol \
  --rpc-url base \
  --broadcast --verify \
  --sig "run()"
```

## Post-Deployment

Grant `ISSUER_ROLE` to the backend wallet:

```bash
cast send <PASSPORT_ADDRESS> \
  "grantRole(bytes32,address)" \
  0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624f45ddee5d7a302e0 \
  <BACKEND_WALLET> \
  --rpc-url base \
  --private-key $DEPLOYER_PRIVATE_KEY
```

Grant `REVOKER_ROLE`:

```bash
cast send <PASSPORT_ADDRESS> \
  "grantRole(bytes32,address)" \
  0x5244884655139bbe3aa2e7e1e8a10e27d3f2e3e30eeba4b5cbf7b6a717586ace \
  <BACKEND_WALLET> \
  --rpc-url base \
  --private-key $DEPLOYER_PRIVATE_KEY
```

Verify on BaseScan: `https://basescan.org/address/<PASSPORT_ADDRESS>#code`

## Frontend Integration

- Address: `<PASSPORT_ADDRESS>`
- ABI functions: `issuePassport`, `getPassportData`, `locked`, `updatePassport`, `revokePassport`
- Network: Base (chain ID 8453)

## References

- [ERC-5192: Minimal Soulbound NFTs](https://eips.ethereum.org/EIPS/eip-5192)
- [ERC-8004: Trustless Agents (emerging)](https://eips.ethereum.org/EIPS/eip-8004)
- [ZK-SBT: Zero-Knowledge Soulbound Tokens](https://www.outlookindia.com/xhub/blockchain-insights/how-do-zero-knowledge-proofs-protect-privacy-in-soulbound-token-systems)
