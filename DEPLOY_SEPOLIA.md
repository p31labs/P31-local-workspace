# P31 LOVE-SBT Deployment Instructions

## Overview
This document provides instructions for deploying the LOVE-SBT smart contract suite to the Sepolia testnet.

## Prerequisites
Before beginning deployment, ensure you have:

1. **Environment Variables Set**:
   - `SEPOLIA_RPC`: Sepolia Ethereum RPC endpoint (e.g., https://sepolia.infura.io/v3/YOUR_KEY)
   - `DEPLOYER_PRIVATE_KEY`: Private key of the deployer account (must have Sepolia ETH)
   - `SOVEREIGNTY_POOL`: Address to receive 50% of LOVE rewards
   - `PERFORMANCE_POOL`: Address to receive 50% of LOVE rewards

2. **Required Tools**:
   - Node.js 18.x or later
   - npm 9.x or later
   - Foundry (`forge`)
   - Git

## Deployment Steps

### 1. Clone Repository and Install Dependencies
```bash
git clone https://github.com/p31labs/p31-capital-machine.git
cd p31-capital-machine
npm install

cd bonding-soup/packages/p31-sovereign-chain
forge install
cd ../../..
```

### 2. Fund Deployer Account
Ensure the deployer account has sufficient Sepolia ETH for contract deployment:
- Visit Sepolia faucet: https://sepoliafaucet.com/
- Request ~0.05 ETH for deployment (more if planning multiple deployments)

### 3. Set Environment Variables
```bash
export SEPOLIA_RPC=***REDACTED***
export DEPLOYER_PRIVATE_KEY="0xyour_private_key_here"
export SOVEREIGNTY_POOL="0xYourSovereigntyPoolAddress"
export PERFORMANCE_POOL="0xYourPerformancePoolAddress"
```

### 4. Deploy Contracts
```bash
cd bonding-soup/packages/p31-sovereign-chain

# Verify contracts compile correctly
forge build

# Run tests to ensure everything works
forge test

# Deploy contracts
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $SEPOLIA_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --ffi
```

### 5. Record Deployed Addresses
After deployment completes, you will see output similar to:
```
[ (archived) ] LOVEToken: — no on-chain LOVE ERC20 (archived in Phase 1)
[ 0x5678... ] LOVESBT: 0x112233445566...
[ 0x90ab... ] ProofOfCare: 0xaabbccddeeff...
```

Save these addresses for configuring the care-api worker.

### 6. Update care-api Worker Configuration
Once deployed, update the care-api worker secrets:
```bash
cd workers/care-api
wrangler secret put LOVE_TOKEN_ADDRESS
wrangler secret put LOVE_SBT_ADDRESS
wrangler secret put PROOF_OF_CARE_ADDRESS
# Enter the respective addresses when prompted
cd ../..
```

### 7. Verify Deployment
Test the deployed contracts:
```bash
# Example verification calls (replace with actual addresses)
cast call 0xAaBbCcDdEeFf... "symbol()" --rpc-url $SEPOLIA_RPC
cast call 0x112233445566... "name()" --rpc-url $SEPOLIA_RPC
cast call 0xaabbccddeeff... "getScore(0x0000000000000000000000000000000000000000)" --rpc-url $SEPOLIA_RPC
```

## Post-Deployment Verification

### 1. Test LOVE Token Minting
```bash
# Simulate a reward distribution (requires oracle privileges)
cast send 0xAaBbCcDdEeFf... "mintCareReward(address)" 0x1111111111111111111111111111111111111111 \
  --rpc-url $SEPOLIA_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY
```

### 2. Test SBT Minting
```bash
# Simulate SBT minting (requires owner privileges)
cast send 0x112233445566... "mintSBT(address,uint256,uint8,string)" \
  0x1111111111111111111111111111111111111111 \
  1000000000000000000 \
  2 \
  "ipfs://QmExample/metadata.json" \
  --rpc-url $SEPOLIA_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY
```

### 3. Test ProofOfCare Integration
```bash
# Simulate score update (requires oracle privileges)
cast send 0xaabbccddeeff... "syncCareScore(address,uint256)" \
  0x1111111111111111111111111111111111111111 \
  1000000000000000000 \
  --rpc-url $SEPOLIA_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY
```

## Troubleshooting

### Common Issues

#### 1. Insufficient Funds
```
Error: insufficient funds for gas * price + value
```
Solution: Ensure deployer account has sufficient Sepolia ETH

#### 2. Contract Verification Failed
```
Error: Contract verification failed
```
Solution:
- Verify contract source code matches deployed bytecode
- Check that optimizer settings match
- Try manual verification on Etherscan/Basescan

#### 3. Transaction Reverted
```
Error: VM Exception while processing transaction: reverted with reason string
```
Solution:
- Check require() statements in contract code
- Verify input parameters meet all conditions
- Check access controls (onlyOwner, etc.)

#### 4. RPC Endpoint Issues
```
Error: Provider error or connection timeout
```
Solution:
- Try alternative RPC endpoint (e.g., Alchemy instead of Infura)
- Check network connectivity
- Verify API key is valid and not rate-limited

## Security Considerations

### Private Key Management
- Never commit private keys to version control
- Use environment variables or secure secret stores
- Consider using hardware wallets for deployment
- Rotate keys after deployment if using hot wallet

### Contract Verification
- Always verify contracts on block explorer
- Verify source code matches exactly what was deployed
- Check that optimizations settings are correct

### Access Control
- Immediately transfer ownership to multisig/governance after deployment
- Consider implementing timelock for administrative functions
- Review all onlyOwner functions for necessity

## Next Steps After Deployment

1. **Configure care-api Worker**:
   - Set contract address secrets as described above
   - Deploy/update care-api worker
   - Test integration with test transactions

2. **Set Up Monitoring**:
   - Configure alerts for contract interactions
   - Monitor gas usage and transaction success rates
   - Set up alerts for failed oracle calls

3. **Documentation**:
   - Update any external documentation with live contract addresses
   - Notify users/stakeholders of deployment
   - Update any frontend applications to use new addresses

4. **Governance Setup**:
   - Consider transferring ownership to DAO/multisig
   - Establish upgrade procedures if needed
   - Set up emergency pause/resume procedures if implementing

## Support
For deployment issues or questions, refer to:
- [DEPLOYMENT.md](./DEPLOYMENT.md) in this repository
- [CONTRACTS.md](./docs/CONTRACTS.md) for contract specifications
- [SECURITY.md](./docs/SECURITY.md) for security best practices

Last Updated: 2026-06-29