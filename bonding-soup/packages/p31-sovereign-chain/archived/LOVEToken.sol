// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LOVEToken is ERC20, Ownable {
    uint256 public constant REWARD_AMOUNT = 100 ether;
    uint256 public constant CARE_THRESHOLD = 0.5e18;
    uint256 public immutable SOVEREIGNTY_POOL_PCT;
    uint256 public immutable PERFORMANCE_POOL_PCT;
    address public immutable SOVEREIGNTY_POOL;
    address public immutable PERFORMANCE_POOL;
    address public careOracle;
    mapping(address => uint256) public lastRewardMint;
    uint256 public constant REWARD_COOLDOWN = 1 days;

    event MintCareReward(address indexed to, uint256 amount);
    event SetOracle(address indexed oracle);

    constructor(address initialOwner, address _sovereigntyPool, address _performancePool) ERC20("LOVE Token", "LOVE") Ownable(initialOwner) {
        SOVEREIGNTY_POOL = _sovereigntyPool;
        PERFORMANCE_POOL = _performancePool;
        SOVEREIGNTY_POOL_PCT = 50;
        PERFORMANCE_POOL_PCT = 50;
        careOracle = address(0);
    }

    function setCareOracle(address oracle) external onlyOwner {
        careOracle = oracle;
        emit SetOracle(oracle);
    }

    function mintCareReward(address to) external {
        if (msg.sender != careOracle && msg.sender != owner()) revert("Only oracle or owner");
        if (to == address(0)) revert("Invalid recipient");
        if (block.timestamp < lastRewardMint[to] + REWARD_COOLDOWN) revert("Cooldown active");

        lastRewardMint[to] = block.timestamp;
        uint256 sovereignAmount = (REWARD_AMOUNT * SOVEREIGNTY_POOL_PCT) / 100;
        uint256 performanceAmount = (REWARD_AMOUNT * PERFORMANCE_POOL_PCT) / 100;
        _mint(SOVEREIGNTY_POOL, sovereignAmount);
        _mint(PERFORMANCE_POOL, performanceAmount);

        emit MintCareReward(to, REWARD_AMOUNT);
    }

    function exists(address account) external view returns (bool) { return balanceOf(account) > 0; }

    function transfer(address, uint256) public pure override returns (bool) { revert("Soulbound: no direct transfers"); }
    function transferFrom(address, address, uint256) public pure override returns (bool) { revert("Soulbound: no transfers"); }
    function approve(address, uint256) public pure override returns (bool) { revert("Soulbound: no approvals"); }

    function _update(address from, address to, uint256 value) internal override(ERC20) {
        if (from == address(0) || to == address(0)) { super._update(from, to, value); return; }
        revert("Soulbound: no transfers");
    }
}
