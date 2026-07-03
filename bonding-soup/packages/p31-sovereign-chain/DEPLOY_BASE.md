# Deploy LOVE-SBT Contracts to Base Mainnet

## Prerequisites
- Foundry installed (`curl -L https://foundry.paradigm.xyz | bash`)
- Base mainnet RPC endpoint
- Deployer private key with Base ETH for gas (~0.01 ETH sufficient)
- Contract pool addresses (can be any addresses for initial deployment)

## Environment Variables
Set these in your shell or `.env` file:

```bash
# Base Mainnet
export BASE_RPC="https://mainnet.base.org"
# OR: export BASE_RPC="https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY"

# Deployer Account (must have Base ETH for gas)
export DEPLOYER_PRIVATE_KEY="0xyour_private_key_here"

# Contract Pool Addresses
export SOVEREIGNTY_POOL="0x0000000000000000000000000000000000000000"
export PERFORMANCE_POOL="0x0000000000000000000000000000000000000000"
```

## Pre-Flight Check
```bash
cd /home/p31/P31-local-workspace/bonding-soup/packages/p31-sovereign-chain

# Verify contracts compile
forge build

# Run tests
forge test
```

## Deploy to Base Mainnet
```bash
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $BASE_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --ffi
```

## Post-Deployment
1. Record the deployed contract addresses
2. Update the `care-api` worker secrets:
   - `LOVE_TOKEN_ADDRESS`
   - `LOVE_SBT_ADDRESS`
   - `PROOF_OF_CARE_ADDRESS`
3. Redeploy the `care-api` worker:
   ```bash
   cd /home/p31/P31-local-workspace/workers/care-api
   wrangler deploy
   ```
4. Verify contracts on Basescan using the addresses output from the deploy script

## Abdication Protocol
After verification (minimum 24-hour buffer recommended):
```bash
# Execute abdication transfer to burn address
bash abdicate.sh
# This transfers contract ownership to 0x000000000000000000000000000000000000dEaD
```

## Notes
- Base gas costs are negligible (~$0.10 per tx). Full 7-contract deployment costs well under $1.
- Chain ID: 8453
- Block explorer: https://basescan.org
