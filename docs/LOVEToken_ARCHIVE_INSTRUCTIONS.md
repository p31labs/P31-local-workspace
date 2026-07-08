# LOVEToken.sol & GODConstitution — Archive Instructions

## 1. Archive LOVEToken.sol

```bash
cd /home/p31/P31-local-workspace

# 1. Move the file to archived/
mkdir -p bonding-soup/packages/p31-sovereign-chain/archived
mv bonding-soup/packages/p31-sovereign-chain/src/LOVEToken.sol bonding-soup/packages/p31-sovereign-chain/archived/LOVEToken.sol

# 2. Remove LOVEToken from Foundry build (if referenced in foundry.toml or script/DeployAll.s.sol)
# Check if LOVEToken is deployed in DeployAll.s.sol
grep -n "LOVEToken" script/DeployAll.s.sol
# If found, comment out or remove the deployment lines.

# 3. Stage (do NOT commit unless explicitly told)
git add bonding-soup/packages/p31-sovereign-chain/archived/LOVEToken.sol
git rm bonding-soup/packages/p31-sovereign-chain/src/LOVEToken.sol
```

## 2. Strip loveLedger from GODConstitution.sol (5b)

```bash
cd /home/p31/P31-local-workspace

# Evaluate whether to strip loveLedger only or archive entirely.
# If the contract has no other purpose, archive it:
mkdir -p p31-surrogate-backend/archived
mv p31-surrogate-backend/contracts/GODConstitution.sol p31-surrogate-backend/archived/GODConstitution.sol

# Stage:
git add p31-surrogate-backend/archived/GODConstitution.sol
git rm p31-surrogate-backend/contracts/GODConstitution.sol
```

## 3. Remove LOVEToken from Any References

```bash
# Check for import/require references to LOVEToken
grep -rn "LOVEToken" --include="*.sol" --include="*.s.sol" --include="*.t.sol" .

# If any remain, remove or comment them out.
```

## 4. Update Foundry.toml (if needed)

```bash
# If LOVEToken was explicitly listed in foundry.toml, remove it.
grep -n "LOVEToken" foundry.toml
# Remove the line if present.
```

## 5. Deploy Contracts (Post-Archive)

After archiving, the only on-chain contracts are:

- `LOVESBT.sol` (ERC-5192)
- `GenesisSpark.sol` (soulbound)
- `ProofOfCare.sol` (off-chain oracle)

Run:

```bash
forge build
forge script script/DeployAll.s.sol --rpc-url $RPC_URL --broadcast
```

Verify that LOVEToken is no longer deployed and that LOVESBT/GenesisSpark deploy successfully.
