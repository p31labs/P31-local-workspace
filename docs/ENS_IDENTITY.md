# ENS Identity: classicwilly.eth

## Overview

`classicwilly.eth` is the sovereign ENS identity for P31 Labs. It functions as the root Web3 identity anchor for the entire ecosystem.

## Subdomain Tree

| Subdomain | Purpose | Status |
|-----------|---------|--------|
| `classicwilly.eth` | Root treasury / human-readable burn address | 🔄 Active — Safe target |
| `andromeda.classicwilly.eth` | Andromeda mesh / k4-cage services | 🔄 Active — DNS + contenthash |
| `mesh.classicwilly.eth` | K₄ mesh node registry | ⏳ Reserved |
| `node-zero.classicwilly.eth` | Node Zero firmware identity | ⏳ Reserved |
| `agent.classicwilly.eth` | AI agent endpoints | ⏳ Reserved |

## Current Allocations

### Treasury
- **ENS:** `classicwilly.eth`
- **Target:** Safe multisig on Base mainnet
- **Resolver:** `0x4976fb03C32e5B8cfe2b6cCB31c09dA78E64c3d2` (default ENS resolver)

### Mesh Infrastructure
- **ENS:** `andromeda.classicwilly.eth`
- **Target:** Cloudflare Worker gateway / IPFS contenthash
- **Use:** Jitterbug API, K4 Cage, sovereign-justice workers

## Setup Commands

```bash
# Point classicwilly.eth to Safe multisig (requires ENS ownership + ETH for gas)
# Using ethers.js or similar:
# resolver.setAddr('classicwilly.eth', SAFE_ADDRESS)

# Set andromeda.classicwilly.eth contenthash for decentralized hosting
# resolver.setContenthash('andromeda.classicwilly.eth', IPFS_CID)

# Create subdomain delegation
# controller.setSubnode('classicwilly.eth', 'andromeda')
```

## Funding Integration

The donate bar on `cli.p31ca.org` points to `classicwilly.eth` as the canonical crypto treasury address. Donors can send ETH, USDC, or any ERC-20 to this ENS name on Base mainnet.

## Security Notes

- ENS ownership keys must be stored in a hardware wallet or multisig
- The root `classicwilly.eth` should be treated as a deployer-equivalent credential
- Subdomain creation should be gated behind a timelock or multisig
