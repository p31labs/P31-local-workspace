// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title P31AccessAllowlist
/// @notice SMART A — owner-managed capability bit per address.
contract P31AccessAllowlist {
    address public owner;

    mapping(bytes32 capability => mapping(address who => bool)) private _allowed;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event AllowanceSet(bytes32 indexed capability, address indexed who, bool allowed);

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "P31: not owner");
        _;
    }

    function setAllowed(bytes32 capability, address who, bool allowed) external onlyOwner {
        require(who != address(0), "P31: zero address");
        _allowed[capability][who] = allowed;
        emit AllowanceSet(capability, who, allowed);
    }

    function isAllowed(bytes32 capability, address who) external view returns (bool) {
        return _allowed[capability][who];
    }

    function transferOwnership(address next) external onlyOwner {
        require(next != address(0), "P31: zero owner");
        emit OwnershipTransferred(owner, next);
        owner = next;
    }
}
