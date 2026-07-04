// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ProofOfCare is ReentrancyGuard, Ownable {
    uint256 public constant CARE_THRESHOLD = 0.5e18;
    uint256 public constant REWARD_AMOUNT = 100 ether;

    address public loveTokenAddress;
    address public loveSBTAddress;
    address public immutable careOracle;

    mapping(address => uint256) public careScores;
    mapping(address => uint256) public lastRewardMint;
    mapping(address => address) public identityBinding;

    event CareScoreUpdated(address indexed user, uint256 score);
    event RewardMinted(address indexed user, uint256 amount);
    event IdentityBound(address indexed user, address identity);

    constructor(address _loveToken, address _oracle, address _sbt) Ownable(msg.sender) {
        loveTokenAddress = _loveToken;
        careOracle = _oracle;
        loveSBTAddress = _sbt;
    }

    function setLoveSBT(address sbt) external onlyOwner { loveSBTAddress = sbt; }

    function syncCareScore(address user, uint256 score) external onlyOracle nonReentrant returns (bool) {
        if (user == address(0)) revert("Invalid user");
        careScores[user] = score;
        emit CareScoreUpdated(user, score);
        _maybeMintSBT(user, score);
        _maybeMintLOVEReward(user);
        return true;
    }

    function bindIdentity(address user, address identityContract) external onlyOwner {
        identityBinding[user] = identityContract;
        emit IdentityBound(user, identityContract);
    }

    modifier onlyOracle() { if (msg.sender != careOracle && msg.sender != owner()) revert("Not oracle"); _; }

    function _maybeMintSBT(address user, uint256 score) internal {
        if (loveSBTAddress == address(0)) return;
        uint256 trustTier = score / CARE_THRESHOLD;
        // Revert-on-no-SBT to keep flow atomic; callers may ignore
        try this.suggestSBTMint(user, score, uint8(trustTier), "") {} catch {}
    }

    function _maybeMintLOVEReward(address user) internal {
        if (loveTokenAddress == address(0)) return;
        if (block.timestamp < lastRewardMint[user] + 1 days) return;
        if (careScores[user] < CARE_THRESHOLD) return;
        try this.suggestLOVEMint(user) {} catch {}
    }

    // External callbacks called by LOVESBT/LOVEToken contracts
    function suggestSBTMint(address user, uint256 score, uint8 tier, string calldata) external onlyOwner returns (bool) {
        return true;
    }

    function suggestLOVEMint(address user) external onlyOwner returns (bool) { return true; }

    function getScore(address user) external view returns (uint256) { return careScores[user]; }
    function isEligibleForReward(address user) external view returns (bool) {
        return careScores[user] >= CARE_THRESHOLD && block.timestamp >= lastRewardMint[user] + 1 days;
    }
}
