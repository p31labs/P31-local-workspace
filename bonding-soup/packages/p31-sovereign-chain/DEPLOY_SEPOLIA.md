# Deploy LOVE-SBT Contracts to Sepolia

## Prerequisites
- Node.js 18+
- Foundry installed (`curl -L https://foundry.paradigm.xyz | bash`)
- Sepolia RPC endpoint
- Deployer private key with Sepolia ETH
- Contract pool addresses (can be any addresses for initial deployment)

## Environment Variables
Set these in your shell or `.env` file:

```bash
# Sepolia Network
export SEPOLIA_RPC=***REDACTED***
# OR: export SEPOLIA_RPC=***REDACTED***

# Deployer Account (must have Sepolia ETH for gas)
export DEPLOYER_PRIVATE_KEY="0xyour_private_key_here"

# Contract Pool Addresses (can be any addresses for deployment)
export SOVEREIGNTY_POOL="0x0000000000000000000000000000000000000000"
export PERFORMANCE_POOL="0x0000000000000000000000000000000000000000"
```

## Deployment Steps

1. **Install Dependencies**
```bash
cd /home/p31/P31-local-workspace/bonding-soup/packages/p31-sovereign-chain
forge install
```

2. **Verify Configuration**
```bash
# Check that contracts compile
forge build

# Run tests
forge test
```

3. **Deploy to Sepolia**
```bash
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $SEPOLIA_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --ffi
```

## Expected Output
After deployment, you'll see contract addresses like:
```
LOVEToken: 0x...
LOVESBT: 0x...
ProofOfCare: 0x...
```

## Post-Deployment
1. Update the `care-api` worker environment variables:
   - `LOVE_TOKEN_ADDRESS`
   - `LOVE_SBT_ADDRESS` 
   - `PROOF_OF_CARE_ADDRESS`

2. Redeploy the care-api worker:
```bash
cd /home/p31/P31-local-workspace/workers/care-api
wrangler deploy
```

3. Verify deployment by calling:
```bash
curl -X POST https://api.p31ca.org/pqc/session \
  -H "Content-Type: application/json" \
  -d '{"publicKeyHex":"0x...","encryptedKey":"0x..."}'
```