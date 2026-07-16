// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./LOVEToken.sol";
import "./LOVESBT.sol";

interface ILOVEToken {
    function mintCareReward(address to, uint256 amount) external;
}

/// @title Proof of Care Consensus
/// @notice Oracle contract ingesting care metrics (T_prox, Q_res from HRV)
///         and computing care scores for the L.O.V.E. token system.
///         Care_Score = sum(T_prox * Q_res) + Tasks_verified.
/// @dev Operates as an oracle — authorized relay (love-ledger.ts worker) pushes
///      physiological telemetry. On-chain verifiable via event history.
///      Also mints LOVE-SBT badges and LOVE token rewards on threshold crossings.
contract ProofOfCare {
    // ── Types ────────────────────────────────────────────────────────
    /// @notice A single care proof window (e.g. one day).
    struct CareProof {
        uint256 timeProximity;  // T_prox — minutes of co-presence (scaled 1e18)
        uint256 qualityResonance; // Q_res — HRV coherence 0-1e18
        uint256 tasksVerified;    // Completed care tasks this window
        uint256 timestamp;
        bytes32 entropyRoot;     // Off-chain telemetry commitment
    }

    struct UserCareState {
        uint256 totalTProx;
        uint256 totalQRes;
        uint256 totalTasksVerified;
        uint256 currentScore;    // 0-1e18
        uint256 lastUpdate;
        uint256 proofCount;
    }

    // ── State ────────────────────────────────────────────────────────
    address public architect;
    address public loveToken;         // LOVEToken contract
    address public relay;             // Authorized off-chain relay (love-ledger.ts worker)
    LOVESBT public loveSBT;           // LOVE-SBT contract

    mapping(address => UserCareState) public careStates;
    mapping(address => CareProof[]) public careProofs;
    mapping(address => uint256) public lastRewardMint;
    mapping(address => uint256) public lastSBTMintLevel;

    uint256 public constant CARE_THRESHOLD = 0.5e18;
    uint256 public constant REWARD_AMOUNT = 100 ether;
    uint256 public constant REWARD_COOLDOWN = 1 days;

    // Decay parameters
    uint256 public constant GRACE_PERIOD = 7 days;
    uint256 public constant DECAY_PER_SECOND = 5787037037; // 0.005 / 86400 in 1e18 precision
    uint256 public constant SCORE_MIN = 0.1e18;
    uint256 public constant SCORE_MAX = 1e18;
    uint256 public constant COHERENCE_THRESHOLD = 0.7e18; // Min Q_res for meaningful care

    // ── Events ───────────────────────────────────────────────────────
    event CareProofSubmitted(address indexed user, uint256 indexed proofId, uint256 score, uint256 timestamp);
    event CareScoreSynced(address indexed user, uint256 newScore);
    event RelayUpdated(address indexed relay);
    event LoveTokenSet(address indexed token);
    event SBTMinted(address indexed user, uint256 indexed tokenId, uint256 careScore);
    event RewardMinted(address indexed user, uint256 amount);

    // ── Errors ───────────────────────────────────────────────────────
    error Unauthorized();
    error InvalidInput();
    error ZeroAddress();

    // ── Modifiers ────────────────────────────────────────────────────
    modifier onlyArchitect() { if (msg.sender != architect) revert Unauthorized(); _; }
    modifier onlyRelay() { if (msg.sender != relay) revert Unauthorized(); _; }

    // ── Constructor ──────────────────────────────────────────────────
    constructor(address _architect, address _loveToken, address _loveSBT) {
        if (_architect == address(0)) revert ZeroAddress();
        architect = _architect;
        relay = _architect;
        loveToken = _loveToken;
        loveSBT = LOVESBT(_loveSBT);

        assembly {
            let test := tload(0)
        }
    }

    // ── Oracle Ingestion ─────────────────────────────────────────────
    /// @notice Submit a batch of care proofs from off-chain telemetry.
    /// @param users Array of user addresses.
    /// @param tProx Array of T_prox values (minutes scaled 1e18).
    /// @param qRes  Array of Q_res values (0-1e18).
    /// @param tasks Array of tasks verified counts.
    /// @param entropyRoots Array of off-chain telemetry commitments.
    function submitCareProofs(
        address[] calldata users,
        uint256[] calldata tProx,
        uint256[] calldata qRes,
        uint256[] calldata tasks,
        bytes32[] calldata entropyRoots
    ) external onlyRelay {
        uint256 len = users.length;
        if (len == 0 || len != tProx.length || len != qRes.length || len != tasks.length || len != entropyRoots.length)
            revert InvalidInput();

        for (uint256 i = 0; i < len; i++) {
            _submitSingle(users[i], tProx[i], qRes[i], tasks[i], entropyRoots[i]);
        }
    }

    function _submitSingle(address user, uint256 tProx, uint256 qRes, uint256 tasks, bytes32 entropyRoot) internal {
        if (user == address(0)) revert ZeroAddress();

        CareProof memory proof = CareProof({
            timeProximity: tProx,
            qualityResonance: qRes,
            tasksVerified: tasks,
            timestamp: block.timestamp,
            entropyRoot: entropyRoot
        });

        careProofs[user].push(proof);
        uint256 proofId = careProofs[user].length - 1;

        UserCareState storage state = careStates[user];
        state.totalTProx += tProx;
        state.totalQRes += qRes;
        state.totalTasksVerified += tasks;
        state.proofCount++;

        // Compute new score: Care_Score = sum(T_prox * Q_res) + tasks_verified
        // Normalize to 0-1e18 range using diminishing returns curve
        uint256 rawScore = _computeRawScore(state);
        uint256 decayedScore = _applyDecay(rawScore, state.lastUpdate);
        state.currentScore = decayedScore > SCORE_MAX ? SCORE_MAX : decayedScore;
        state.lastUpdate = block.timestamp;

        _maybeMintSBT(user, state.currentScore);
        _maybeMintLOVEReward(user, state.currentScore);

        emit CareProofSubmitted(user, proofId, state.currentScore, block.timestamp);
    }

    function _maybeMintSBT(address user, uint256 score) internal {
        if (address(loveSBT) == address(0)) return;

        uint256 currentLevel = score / CARE_THRESHOLD;
        if (currentLevel == 0) return;

        uint256 previousLevel = lastSBTMintLevel[user];
        if (currentLevel <= previousLevel) return;

        uint256[] memory existing = loveSBT.getSBTs(user);
        bool hasLevelBadge = false;
        for (uint256 i = 0; i < existing.length; i++) {
            (, uint256 tier,,) = loveSBT.reputationData(existing[i]);
            if (tier == currentLevel) { hasLevelBadge = true; break; }
        }

        if (!hasLevelBadge) {
            loveSBT.mintSBT(user, score, currentLevel, string(abi.encodePacked("ipfs://love-sbt/", uint2str(currentLevel))));
            lastSBTMintLevel[user] = currentLevel;
            emit SBTMinted(user, existing.length, score);
        } else {
            uint256 tokenId = existing[existing.length - 1];
            loveSBT.updateReputation(tokenId, score);
            emit SBTMinted(user, tokenId, score);
        }
    }

    function _maybeMintLOVEReward(address user, uint256 score) internal {
        if (score < CARE_THRESHOLD) return;
        if (address(loveToken) == address(0)) return;

        uint256 cooldown = block.timestamp - lastRewardMint[user];
        if (cooldown < REWARD_COOLDOWN) return;

        lastRewardMint[user] = block.timestamp;
        ILOVEToken(loveToken).mintCareReward(user, REWARD_AMOUNT);
        emit RewardMinted(user, REWARD_AMOUNT);
    }

    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 length;
        while (j != 0) { length++; j /= 10; }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bstr[k] = bytes1(temp);
            _i /= 10;
        }
        return string(bstr);
    }

    // ── Score Computation ────────────────────────────────────────────
    /// @notice Care_Score = sum(T_prox * Q_res) + Tasks_verified (diminishing returns).
    function _computeRawScore(UserCareState storage state) internal view returns (uint256) {
        uint256 proxResonance = state.totalTProx * state.totalQRes / 1e18;
        uint256 taskComponent = state.totalTasksVerified * 1e14; // Scale tasks
        uint256 combined = proxResonance + taskComponent;

        // Sigmoid-like normalization: 1 - 1/(1 + combined)
        uint256 denominator = 1e18 + combined;
        uint256 normalized = (combined * 1e18) / denominator;
        return normalized;
    }

    /// @notice Apply time-based decay: -0.005/day after 7-day grace period.
    function _applyDecay(uint256 score, uint256 lastUpdate) internal view returns (uint256) {
        if (score <= SCORE_MIN) return SCORE_MIN;
        uint256 elapsed = block.timestamp - lastUpdate;
        if (elapsed <= GRACE_PERIOD) return score;
        uint256 decay = (elapsed - GRACE_PERIOD) * DECAY_PER_SECOND;
        if (decay >= score) return SCORE_MIN;
        uint256 result = score - decay;
        return result < SCORE_MIN ? SCORE_MIN : result;
    }

    // ── On-Chain Score Sync ──────────────────────────────────────────
    /// @notice Push computed care score to LOVEToken contract.
    function syncCareScore(address user) external {
        UserCareState storage state = careStates[user];
        uint256 rawScore = _computeRawScore(state);
        uint256 decayed = _applyDecay(rawScore, state.lastUpdate);
        state.currentScore = decayed > SCORE_MAX ? SCORE_MAX : decayed;

        if (loveToken != address(0)) {
            (bool ok,) = loveToken.call(abi.encodeWithSignature("updateCareScore(address,uint256)", user, state.currentScore));
            if (!ok) revert("Push failed");
        }

        emit CareScoreSynced(user, state.currentScore);
    }

    // ── Queries ──────────────────────────────────────────────────────
    /// @notice Compute effective score for a user (current + decay).
    function computeEffectiveScore(address user) external view returns (uint256) {
        UserCareState storage state = careStates[user];
        uint256 raw = _computeRawScore(state);
        return _applyDecay(raw, state.lastUpdate);
    }

    function getProofCount(address user) external view returns (uint256) {
        return careProofs[user].length;
    }

    function getProof(address user, uint256 index) external view returns (CareProof memory) {
        return careProofs[user][index];
    }

    // ── Admin ────────────────────────────────────────────────────────
    function setRelay(address _relay) external onlyArchitect {
        if (_relay == address(0)) revert ZeroAddress();
        relay = _relay;
        emit RelayUpdated(_relay);
    }

    function setLoveToken(address token) external onlyArchitect {
        if (token == address(0)) revert ZeroAddress();
        loveToken = token;
        emit LoveTokenSet(token);
    }

    function setLoveSBT(address _loveSBT) external onlyArchitect {
        if (_loveSBT == address(0)) revert ZeroAddress();
        loveSBT = LOVESBT(_loveSBT);
    }
}
