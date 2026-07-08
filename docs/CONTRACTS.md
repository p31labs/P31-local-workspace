# P31 Capital Machine — Smart Contracts

> **⚠️ Retired architecture (historical reference).** `LOVEToken.sol` was **archived** in Phase 1 — there is no on-chain LOVE ERC20. LOVE balances now live in the off-chain `love-ledger` worker (two-pool model); on-chain attestations are `LOVESBT` (ERC-5192) + `GenesisSpark` badges. See [`docs/LOVE_ECONOMY.md`](./LOVE_ECONOMY.md) for the current architecture. This document describes the pre-archive design.

## Overview
This document describes the smart contract suite for the P31 LOVE economy and reputation system. These contracts are deployed on Ethereum-compatible networks (including Sepolia testnet and Base mainnet) and interact with the off-chain care-api worker via oracle patterns.

## Contract Addresses (Placeholders)
*Replace with actual addresses after deployment*

| Contract | Sepolia Testnet | Base Mainnet |
|----------|-----------------|--------------|
| LOVEToken | `0x...` | `0x...` |
| LOVESBT | `0x...` | `0x...` |
| ProofOfCare | `0x...` | `0x...` |
| **Note**: Addresses will be updated post-deployment |

## Contract Suite

### 1. LOVEToken (Soulbound ERC-20)
**Contract**: `LOVEToken.sol`  
**Purpose**: Non-transferable reward token for verified care work  
**Standards**: ERC-20, EIP-2612 (permit), Soulbound (non-transferable)

#### Key Features
- **Soulbound**: Cannot be transferred between addresses
- **Fixed Supply**: Minted only via oracle rewards
- **Dual Pool Distribution**: 50% sovereignty pool, 50% performance pool
- **Cooldown Protection**: 1-day minimum between rewards
- **Minimum Threshold**: 0.5e18 care score required for eligibility

#### State Variables
```solidity
uint256 public constant REWARD_AMOUNT = 100 ether; // 100 LOVE tokens
uint256 public constant CARE_THRESHOLD = 0.5e18;   // Minimum score for reward
uint256 public constant REWARD_COOLDOWN = 1 days;  // 24 hours between rewards

uint256 public immutable SOVEREIGNTY_POOL_PCT;  // 50%
uint256 public immutable PERFORMANCE_POOL_PCT;  // 50%
address public immutable SOVEREIGNTY_POOL;
address public immutable PERFORMANCE_POOL;
address public careOracle; // Set by owner, updated by governance

mapping(address => uint256) public lastRewardMint; // Timestamp of last reward
```

#### Key Functions
- `mintCareReward(address to)`: Oracle-only function to distribute rewards
  - Checks cooldown and eligibility before minting
  - Splits amount 50/50 between sovereignty and performance pools
  - Emits `MintCareReward` event
- `setCareOracle(address oracle)`: Owner-only function to update oracle address
- `exists(address account)`: View function to check if address has non-zero balance
- `transfer()` and `transferFrom()`: Overridden to revert (soulbound property)
- `approve()` and `increaseAllowance()`: Overridden to revert (no allowances allowed)

#### Events
```solidity
event MintCareReward(address indexed to, uint256 amount);
event SetOracle(address indexed oracle);
```

#### Security Considerations
- Reentrancy protection via non-reentrant pattern (though not strictly needed due to external call limits)
- Oracle address validation prevents unauthorized minting
- Overflow protection via Solidity 0.8.x built-in checks
- Minimum stake requirement prevents dust attacks

### 2. LOVESBT (Soulbound ERC-721)
**Contract**: `LOVESBT.sol`  
**Purpose**: Soulbound reputation badge representing trust tier and care participation  
**Standards**: ERC-721, ERC-721Enumerable, EIP-721 (Soulbound Token)

#### Key Features
- **Soulbound**: Non-transferable by design (all transfer functions revert)
- **Metadata Storage**: On-chain storage of reputation data (score, tier, category, timestamp)
- **Dynamic Updates**: Score and tier can be updated by oracle
- **Burnable**: Allows removal of reputation (e.g., for fraud)
- **Enumeration**: Supports counting and iteration of user's SBTs

#### State Variables
```solidity
uint256 public constant TRUST_TIER_SCALE = 0.5e18; // Each 0.5e18 = 1 tier level
uint256 private _nextTokenId;

string[] private _tokenURIs; // IPFS URIs for metadata

struct ReputationData {
    uint256 score;           // Current care score
    uint8 trustTier;         // Calculated trust tier (floor(score / TRUST_TIER_SCALE))
    uint8 category;          // Type of care (0=general, 1=medical, 2=emotional, etc.)
    uint256 issuedAt;        // Timestamp when last issued/updated
}

mapping(uint256 => ReputationData) public reputationData;
mapping(address => uint256[]) public ownerSBTs; // User -> their token IDs
```

#### Key Functions
- `mintSBT(address to, uint256 score, uint8 category, string calldata tokenURI)`: 
  - Owner-only function to mint new SBT
  - Stores reputation data and updates user's token array
  - Emits `SBTMinted` event
- `updateReputation(uint256 tokenId, uint256 newScore)`: 
  - Owner-only function to update existing SBT score
  - Recalculates trust tier and updates timestamp
  - Emits `SBTUpdated` event
- `burn(uint256 tokenId)`: 
  - Owner-only function to burn SBT
  - Clears reputation data and removes from user's array
  - Emits `SBTBurnt` event
- `getSBTs(address owner)`: View function returning array of token IDs owned by address
- `getReputationData(uint256 tokenId)`: View function returning full ReputationData struct
- `getTokenURI(uint256 tokenId)`: View function returning metadata URI

#### Key Overrides (Soulbound Properties)
All transfer and approval functions revert:
- `transferFrom(address, address, uint256)`
- `safeTransferFrom(address, address, uint256)`
- `approve(address, uint256)`
- `setApprovalForAll(address, bool)`
- `getApproved(uint256)`: Returns zero address (no approvals possible)

#### Events
```solidity
event SBTMinted(address indexed to, uint256 indexed tokenId, uint256 score, uint8 trustTier);
event SBTUpdated(uint256 indexed tokenId, uint256 newScore, uint8 newTier);
event SBTBurnt(uint256 indexed tokenId, address indexed owner);
```

#### Security Considerations
- Owner-only privileges for minting/burning/updating prevent unauthorized changes
- Metadata URI stored privately to prevent front-running of metadata changes
- Array-based ownership tracking avoids costly iterations
- Reentrancy protection not needed for state-changing functions (all are owner-only)
- Integer overflow protection via Solidity 0.8.x

### 3. ProofOfCare (Oracle Contract)
**Contract**: `ProofOfCare.sol`  
**Purpose**: Bridge between off-chain care verification and on-chain rewards/reputation  
**Standards**: EIP-1271 (Signature Validation), Ownable

#### Key Features
- **Oracle Pattern**: Accepts signed care score updates from trusted off-chain service
- **Automatic Rewards**: Triggers LOVE token minting when score thresholds are met
- **Automatic Reputation**: Updates SBT when trust tiers change
- **Replay Protection**: Nonce-based prevention of replay attacks
- **Flexible Callback**: Uses try/catch pattern to allow for missing contract addresses

#### State Variables
```solidity
uint256 public constant CARE_THRESHOLD = 0.5e18; // 0.5e18 = 1 ETH in wei
uint256 public constant REWARD_AMOUNT = 100 ether;

address public loveTokenAddress;   // LOVEToken contract
address public loveSBTAddress;     // LOVESBT contract
address public immutable careOracle; // Set at constructor, updated by owner

mapping(address => uint256) public careScores;     // User -> current score
mapping(address => uint256) public lastRewardMint; // User -> last reward timestamp
mapping(address => address) public identityBinding; // User -> identity contract (optional)

event CareScoreUpdated(address indexed user, uint256 score);
event RewardMinted(address indexed user, uint256 amount);
event IdentityBound(address indexed user, address identity);
```

#### Key Functions
- `constructor(address _loveToken, address _oracle, address _sbt)`:
  - Sets immutable addresses and initializes owner
- `setLoveSBT(address sbt)`: Owner-only function to set SBT address post-construction
- `syncCareScore(address user, uint256 score)`: 
  - Only callable by `careOracle` or owner
  - Updates user's care score in storage
  - Emits `CareScoreUpdated` event
  - Calls `_maybeMintSBT(user, score)` and `_maybeMintLOVEReward(user)`
  - Returns boolean success
- `bindIdentity(address user, address identityContract)`: 
  - Owner-only function to link Ethereum address to identity system
  - Emits `IdentityBound` event
- `getScore(address user)`: View function returning current care score
- `isEligibleForReward(address user)`: View function checking reward eligibility
  - Returns true if: score >= CARE_THRESHOLD AND (now >= lastRewardMint[user] + 1 day)

#### Internal Functions
- `_maybeMintSBT(address user, uint256 score)`:
  - Calculates trust tier: `uint8(trustTier = score / CARE_THRESHOLD)`
  - Attempts to call `suggestSBTMint` on LOVESBT contract via try/catch
  - Continues execution even if call fails (contract may not exist yet)
- `_maybeMintLOVEReward(address user)`:
  - Checks cooldown and eligibility
  - Attempts to call `mintCareReward` on LOVEToken contract via try/catch
  - Continues execution even if call fails

#### Key Overrides (Security)
- `receive()` and `fallback()`: Accept ETH but do nothing (prevents accidental locking)
- All state-changing functions have appropriate access controls

#### Events
```solidity
event CareScoreUpdated(address indexed user, uint256 score);
event RewardMinted(address indexed user, uint256 amount);
event IdentityBound(address indexed user, address identity);
```

#### Security Considerations
- **Oracle Restriction**: Only `careOracle` or owner can call `syncCareScore`
- **Replay Protection**: Relies on off-chain nonce mechanism (to be implemented in care-api)
- **Try/Catch Pattern**: Prevents reverts if dependent contracts aren't deployed yet
- **Input Validation**: Checks for zero address and basic bounds
- **Non-Reentrancy**: Not strictly needed as external calls are limited to trusted contracts
- **Upgradeability**: Not implemented; intended as immutable deployment

## Contract Interactions

### Data Flow: Care Score → Reward + Reputation
```mermaid
sequenceDiagram
    participant Offchain as Off-chain Service (care-api)
    participant Oracle as ProofOfCare Contract
    token as LOVEToken Contract
    sbt as LOVESBT Contract
    User as Ethereum User

    Offchan</|reserved_token_163129|>Offchain->>Oracle: syncCareScore(user, newScore) [signed]
    Oracle->>Oracle: Update careScores[user] = newScore
    Oracle->>Oracle: Emit CareScoreUpdated(user, newScore)
    alt newScore >= CARE_THRESHOLD AND cooldown passed
        Oracle->>token: mintCareReward(user) [via try/catch]
        token->>User: Mint 100 LOVE tokens (50% each pool)
        token->>Oracle: Return success/failure
    end
    alt trustTierChanged
        Oracle->>sbt: updateReputation(tokenId, newScore) [via try/catch]
        sbt->>Oracle: Update internal reputation data
        sbt->>Oracle: Return success/failure
    end
```

### Trust Tier Calculation
```
trustTier = floor(careScore / 0.5e18)

Examples:
- 0.0 to 0.499...e18 → Tier 0
- 0.5e18 to 0.999...e18 → Tier 1
- 1.0e18 to 1.499...e18 → Tier 2
- etc.
```

## Deployment Notes

### Deployment Order
1. Deploy LOVEToken (requires sovereignty and performance pool addresses)
2. Deploy LOVESBT
3. Deploy ProofOfCare (requires addresses of LOVEToken and LOVESBT)

### Constructor Parameters
- **LOVEToken**:
  - `address initialOwner`: Deployer address (becomes owner)
  - `address _sovereigntyPool`: Address receiving 50% of rewards
  - `address _performancePool`: Address receiving 50% of rewards

- **LOVESBT**:
  - `address initialOwner`: Deployer address (becomes owner)

- **ProofOfCare**:
  - `address _loveToken`: Address of deployed LOVEToken contract
  - `address _oracle`: Address authorized to call syncCareScore (typically multisig or DAO)
  - `address _sbt`: Address of deployed LOVESBT contract

### Post-Deployment Setup
1. After deploying ProofOfCare, call `setLoveSBT` on LOVEToken and LOVESBT if needed (for circular dependencies)
2. Update care-api worker environment variables with contract addresses
3. Verify contract verification on block explorer (Etherscan/Basescan)

## ABI Interfaces
Standard ERC-20 and ERC-721 ABIs apply. Custom events and functions are as documented above.

### LoveToken ABI (Relevant Parts)
```json
[
  {"type":"function","name":"mintCareReward","inputs":[{"name":"to","type":"address"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"setCareOracle","inputs":[{"name":"oracle","type":"address"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"exists","inputs":[{"name":"account","type":"address"}],"outputs":[{"name":"","type":"bool"}],"stateMutability":"view"},
  {"type":"event","name":"MintCareReward","inputs":[{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"anonymous":false},
  {"type":"event","name":"SetOracle","inputs":[{"indexed":true,"name":"oracle","type":"address"}],"anonymous":false}
]
```

### LoveSBT ABI (Relevant Parts)
```json
[
  {"type":"function","name":"mintSBT","inputs":[{"name":"to","type":"address"},{"name":"score","type":"uint256"},{"name":"category","type":"uint8"},{"name":"tokenURI","type":"string"}],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"nonpayable"},
  {"type":"function","name":"updateReputation","inputs":[{"name":"tokenId","type":"uint256"},{"name":"newScore","type":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"burn","inputs":[{"name":"tokenId","type":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"getSBTs","inputs":[{"name":"owner","type":"address"}],"outputs":[{"name":"","type":"uint256[]"}],"stateMutability":"view"},
  {"type":"function","name":"getReputationData","inputs":[{"name":"tokenId","type":"uint256"}],"outputs":[{"name":"","type":"tuple(uint256 score,uint8 trustTier,uint8 category,uint256 issuedAt)"}],"stateMutability":"view"},
  {"type":"event","name":"SBTMinted","inputs":[{"indexed":true,"name":"to","type":"address"},{"indexed":true,"name":"tokenId","type":"uint256"},{"indexed":false,"name":"score","type":"uint256"},{"indexed":false,"name":"trustTier","type":"uint8"}],"anonymous":false},
  {"type":"event","name":"SBTUpdated","inputs":[{"indexed":true,"name":"tokenId","type":"uint256"},{"indexed":false,"name":"newScore","type":"uint256"},{"indexed":false,"name":"newTier","type":"uint8"}],"anonymous":false},
  {"type":"event","name":"SBTBurnt","inputs":[{"indexed":true,"name":"tokenId","type":"uint256"},{"indexed":false,"name":"owner","type":"address"}],"anonymous":false}
]
```

### ProofOfCare ABI (Relevant Parts)
```json
[
  {"type":"function","name":"syncCareScore","inputs":[{"name":"user","type":"address"},{"name":"score","type":"uint256"}],"outputs":[{"name":"","type":"bool"}],"stateMutability":"nonpayable"},
  {"type":"function","name":"setLoveSBT","inputs":[{"name":"sbt","type":"address"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"bindUser","inputs":[{"name":"user","type":"address"},{"name":"identityContract","type":"address"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"getScore","inputs":[{"name":"user","type":"address"}],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view"},
  {"type":"function","name":"isEligibleForReward","inputs":[{"name":"user","type":"address"}],"outputs":[{"name":"","type":"bool"}],"stateMutability":"view"},
  {"type":"event","name":"CareScoreUpdated","inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":false,"name":"score","type":"uint256"}],"anonymous":false},
  {"type":"event","name":"RewardMinted","inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"anonymous":false},
  {"type":"event","name":"IdentityBound","inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":false,"name":"identity","type":"address"}],"anonymous":false}
]
```

## Upgradeability Considerations
Current contracts are **not upgradeable** to:
- Maximize trust and predictability
- Minimize attack surface
- Reduce complexity and audit burden

For future versions requiring upgrades:
1. Consider proxy pattern (EIP-1967/EIP-1822) with transparent upgradeable proxy
2. Implement timelock for administrative functions
3. Use multi-signature wallets for ownership
4. Provide migration scripts for data transfer

## Gas Optimization Notes
- Minimal storage writes (only update when values change)
- Use of `immutable` for constructor-set values
- Efficient data types (uint8 for tiers, uint256 only when needed)
- Batch operations where possible (though limited by soulbound nature)
- Preference for memory over stack variables in complex functions

## Testing Strategy
- Unit tests for all internal functions and edge cases
- Integration tests simulating full reward and reputation flows
- Fuzz testing for numerical boundary conditions
- Gas usage profiling and optimization
- Testnet deployment verification on Sepolia before mainnet

## License
MIT License - see LICENSE file in repository root.

---
*Document Version: 1.0.0*
*Last Updated: 2026-06-29*
*Contracts Version: 1.0.0 (Initial Release)*