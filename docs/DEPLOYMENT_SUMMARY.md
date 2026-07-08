# Sepolia Deployment Summary

**Date**: 2026-06-29  
**Network**: Ethereum Sepolia (Chain ID 11155111)  
**Deployer**: `0x51c285Df171C76bE36252e32679F098d90768413`

> **Update (2026-07-07):** `LOVEToken` has been **archived** — there is no longer an on-chain LOVE ERC20. LOVE balances now live in the off-chain `love-ledger` worker (two-pool model). On-chain attestations are `LOVESBT` (ERC-5192) + `GenesisSpark` badges only. The `LOVEToken` address below is retained for historical record only.

## Deployed Contracts

| Contract | Address | Tx Hash |
|----------|---------|---------|
| LOVEToken _(archived)_ | `0x83307e54782661e220D3E34A4297590B91112924` | [0x2ea650...](https://sepolia.etherscan.io/tx/0x2ea650bad588da5b5760505245f44aecc45e32773252d4d91d8d1475ddb7d03a) |
| ProofOfCare | `0x4384C856C0ccc9CB5a4ADb148937Ea557293543b` | [0x92d501...](https://sepolia.etherscan.io/tx/0x92d5013229e993878888402fc46b451409a6fc643c63b0c41ba9b2846157051a) |
| LOVESBT | `0x34A1D3fff3958843C43aD80F30b94c510645C316` | [0x5dd8a4...](https://sepolia.etherscan.io/tx/0x5dd8a4a660060a2fa35ef449e4704316a5847a6c56a335ebfcd6cee21d576825) |
| PayrollStream | `0x91ED0B6b940e5446933A89709D437D4345963100` | [0x625315...](https://sepolia.etherscan.io/tx/0x625315c7ab2b7edafffbe3459c6d6af26a5fa1d0e09f96b909f41099a5f6900d) |
| SlicingPieLedger | `0x6677562Eb23cAf699B510C96D8eae36F6F637bb5` | [0xde45af...](https://sepolia.etherscan.io/tx/0xde45afef20124f93f59cd6938a5740bd19118e2de7ed9f8aff1413a672f46e9b) |
| TrancheWaterfall | `0x39014DbaA0B6cF6528823690090302aA407833b0` | [0x6bae22...](https://sepolia.etherscan.io/tx/0x6bae22cd4cf5f2e49d7fd9a7d7c8b2f30334d63a22bdd50074c3841a5c555929) |
| PerpetualPurposeTrust | `0x79e8d7BE19A79398459bCd0475E09D7502004167` | [0x72a613...](https://sepolia.etherscan.io/tx/0x72a61372ccbd5a01df135a3a9c8566875af77e9b8677936fbf78457f18ea6e67) |

## Wire-up

All contracts wired in `script/DeployAll.s.sol`:
- _(archived)_ LOVEToken → PoolManager: TrancheWaterfall
- _(archived)_ LOVEToken → CareOracle: ProofOfCare
- _(archived)_ ProofOfCare → LOVE: LOVEToken
- ProofOfCare → LoveSBT: LOVESBT
- SlicingPieLedger → PayrollStream: PayrollStream
- _(archived)_ TrancheWaterfall → PayrollStream, SlicingPieLedger, LOVEToken, PPT
- _(archived)_ PerpetualPurposeTrust → LOVEToken, TrancheWaterfall

## Workers Updated

| Worker | Address | Status |
|--------|---------|--------|
| care-api | api.p31ca.org | ✅ Deployed |
| events-queue | events-queue.trimtab-signal.workers.dev | ✅ Live |
| pdf-generator | pdf-generator.trimtab-signal.workers.dev | ✅ Live |

## Secrets Configured

- `LOVEToken_ADDRESS` _(archived/removed)_ → `0x83307e54782661e220D3E34A4297590B91112924`
- `LOVE_SBT_ADDRESS` → `0x34A1D3fff3958843C43aD80F30b94c510645C316`
- `PROOF_OF_CARE_ADDRESS` → `0x4384C856C0ccc9CB5a4ADb148937Ea557293543b`

## CI/CD

- `.github/workflows/deploy-contracts.yml` → Created in `bonding-soup` repo
- `.github/workflows/deploy-workers.yml` → Expanded in `andromeda` repo to cover care-api, events-queue, pdf-generator
