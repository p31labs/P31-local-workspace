// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title L.O.V.E. Token
/// @notice Soulbound ERC-20 with 50/50 sovereignty/performance pool split.
///         No external transfer allowed — only mint/burn by authorized entities.
///         Represents "Ledger of Ontological Volume and Entropy".
contract LOVEToken {
    // ── ERC-20 Basics ───────────────────────────────────────────────
    string public constant name = "L.O.V.E. Token";
    string public constant symbol = "LOVE";
    uint8  public constant decimals = 18;

    /// @notice Architect (contract owner, can abdicate to ZERO_ADDRESS).
    address public architect;
    /// @notice Authorized pool manager (TrancheWaterfall, etc.).
    address public poolManager;
    /// @notice Authorized care oracle (ProofOfCare contract).
    address public careOracle;

    address internal constant ZERO_ADDRESS = address(0x000000000000000000000000000000000000dEaD);

    // ── Two-Pool Accounting ──────────────────────────────────────────
    struct PoolBalance {
        uint256 totalEarned;
        uint256 sovereigntyPool;
        uint256 performancePool;
        uint256 careScore;   // 0-1e18 (scaled)
        uint256 updatedAt;
    }

    mapping(address => PoolBalance) internal _pools;
    mapping(address => uint256) internal _balance;
    uint256 internal _totalSupply;

    // ── Events ───────────────────────────────────────────────────────
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Mint(address indexed to, uint256 sovereigntyAmount, uint256 performanceAmount);
    event Burn(address indexed from, uint256 value);
    event CareScoreUpdated(address indexed user, uint256 newScore);
    event ArchitectTransferred(address indexed previous, address indexed newArchitect);
    event PoolManagerUpdated(address indexed manager);

    // ── Errors ───────────────────────────────────────────────────────
    error Soulbound();
    error Unauthorized();
    error ZeroAddress();
    error InvalidCareScore();
    error InvalidInput();

    // ── Modifiers ────────────────────────────────────────────────────
    modifier onlyArchitect() { if (msg.sender != architect) revert Unauthorized(); _; }
    modifier onlyPoolManager() { if (msg.sender != poolManager) revert Unauthorized(); _; }
    modifier onlyCareOracle() { if (msg.sender != careOracle) revert Unauthorized(); _; }

    // ── Constructor ──────────────────────────────────────────────────
    constructor(address _architect) {
        if (_architect == address(0)) revert ZeroAddress();
        architect = _architect;
        poolManager = _architect;
        careOracle = _architect;
    }

    // ── ERC-20 Read ──────────────────────────────────────────────────
    function totalSupply() external view returns (uint256) { return _totalSupply; }
    function balanceOf(address account) external view returns (uint256) { return _balance[account]; }

    function transfer(address, uint256) external pure returns (bool) { revert Soulbound(); }
    function transferFrom(address, address, uint256) external pure returns (bool) { revert Soulbound(); }
    function approve(address, uint256) external pure returns (bool) { revert Soulbound(); }
    function allowance(address, address) external pure returns (uint256) { return 0; }

    // ── Pool Queries ─────────────────────────────────────────────────
    function getPoolBalance(address user) external view returns (
        uint256 totalEarned,
        uint256 sovereigntyPool,
        uint256 performancePool,
        uint256 careScore,
        uint256 availableBalance,
        uint256 frozenBalance
    ) {
        PoolBalance memory p = _pools[user];
        totalEarned = p.totalEarned;
        sovereigntyPool = p.sovereigntyPool;
        performancePool = p.performancePool;
        careScore = p.careScore;
        availableBalance = (performancePool * careScore) / 1e18;
        frozenBalance = performancePool - availableBalance;
        return (totalEarned, sovereigntyPool, performancePool, careScore, availableBalance, frozenBalance);
    }

    // ── Mint ─────────────────────────────────────────────────────────
    /// @notice Mint LOVE tokens with 50/50 pool split.
    function mint(address to, uint256 amount) external onlyPoolManager {
        if (to == address(0)) revert ZeroAddress();
        uint256 half = amount / 2;
        uint256 sovereigntyAmount = half;
        uint256 performanceAmount = amount - half;

        _balance[to] += amount;
        _totalSupply += amount;
        PoolBalance storage p = _pools[to];
        p.totalEarned += amount;
        p.sovereigntyPool += sovereigntyAmount;
        p.performancePool += performanceAmount;
        p.updatedAt = block.timestamp;

        emit Transfer(address(0), to, amount);
        emit Mint(to, sovereigntyAmount, performanceAmount);
    }

    // ── Burn ─────────────────────────────────────────────────────────
    function burn(address from, uint256 amount) external onlyPoolManager {
        if (from == address(0)) revert ZeroAddress();
        if (_balance[from] < amount) revert("Insufficient balance");
        _balance[from] -= amount;
        _totalSupply -= amount;

        PoolBalance storage p = _pools[from];
        uint256 sovereigntyBurn = (amount * p.sovereigntyPool) / (p.totalEarned == 0 ? 1 : p.totalEarned);
        uint256 performanceBurn = amount - sovereigntyBurn;
        p.sovereigntyPool -= sovereigntyBurn;
        p.performancePool -= performanceBurn;
        p.totalEarned -= amount;
        p.updatedAt = block.timestamp;

        emit Burn(from, amount);
        emit Transfer(from, address(0), amount);
    }

    // ── Care Score ───────────────────────────────────────────────────
    /// @notice Update care score (0-1e18 scale). Called by ProofOfCare.
    function updateCareScore(address user, uint256 newScore) external onlyCareOracle {
        if (newScore > 1e18) revert InvalidCareScore();
        _pools[user].careScore = newScore;
        _pools[user].updatedAt = block.timestamp;
        emit CareScoreUpdated(user, newScore);
    }

    function mintCareReward(address to, uint256 amount) external onlyCareOracle {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidInput();
        _balance[to] += amount;
        _totalSupply += amount;
        PoolBalance storage p = _pools[to];
        uint256 half = amount / 2;
        p.totalEarned += amount;
        p.sovereigntyPool += half;
        p.performancePool += amount - half;
        p.updatedAt = block.timestamp;
        emit Transfer(address(0), to, amount);
        emit Mint(to, half, amount - half);
    }

    // ── Admin ────────────────────────────────────────────────────────
    function transferArchitect(address next) external onlyArchitect {
        if (next == address(0)) revert ZeroAddress();
        emit ArchitectTransferred(architect, next);
        architect = next;
    }

    function setPoolManager(address manager) external onlyArchitect {
        if (manager == address(0)) revert ZeroAddress();
        poolManager = manager;
        emit PoolManagerUpdated(manager);
    }

    function setCareOracle(address oracle) external onlyArchitect {
        if (oracle == address(0)) revert ZeroAddress();
        careOracle = oracle;
    }

    /// @notice Abdication Protocol — permanently renounce control.
    function abdicate() external onlyArchitect {
        architect = ZERO_ADDRESS;
    }
}
