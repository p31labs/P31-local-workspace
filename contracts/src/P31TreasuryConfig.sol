// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title P31TreasuryConfig
/// @notice SMART T — on-chain pointers for Safe treasury + USDC + home chain id.
/// @dev One-time configure then optional lock(); upgrade by deploying a new config.
contract P31TreasuryConfig {
    address public owner;

    address public safe;
    address public usdc;
    uint256 public homeChainId;

    bool public locked;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event TreasuryConfigured(address indexed safe, address indexed usdc, uint256 homeChainId);
    event Locked();

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "P31: not owner");
        _;
    }

    function configure(address safe_, address usdc_, uint256 chainId_) external onlyOwner {
        require(!locked, "P31: locked");
        require(safe_ != address(0), "P31: zero safe");
        require(usdc_ != address(0), "P31: zero usdc");
        require(chainId_ != 0, "P31: zero chainId");
        safe = safe_;
        usdc = usdc_;
        homeChainId = chainId_;
        emit TreasuryConfigured(safe_, usdc_, chainId_);
    }

    function lock() external onlyOwner {
        require(!locked, "P31: locked");
        require(safe != address(0), "P31: not configured");
        locked = true;
        emit Locked();
    }

    function transferOwnership(address next) external onlyOwner {
        require(next != address(0), "P31: zero owner");
        emit OwnershipTransferred(owner, next);
        owner = next;
    }
}
