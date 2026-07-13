// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title P31ContentRoot
/// @notice Maps logical content keys to IPFS / Arweave CIDs for decentralized distribution.
/// @dev Keys are keccak256("p31-hub-dist") style labels.
contract P31ContentRoot {
    address public owner;

    mapping(bytes32 key => string cid) private _cidOf;

    event RootSet(bytes32 indexed key, string cid, address indexed sender);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "P31: not owner");
        _;
    }

    /// @param key keccak256 of a stable ASCII label.
    /// @param cid Full CID or ipfs:// / ar:// string.
    function setRoot(bytes32 key, string calldata cid) external onlyOwner {
        require(key != bytes32(0), "P31: zero key");
        require(bytes(cid).length > 0, "P31: empty cid");
        _cidOf[key] = cid;
        emit RootSet(key, cid, msg.sender);
    }

    function cidOf(bytes32 key) external view returns (string memory) {
        return _cidOf[key];
    }

    function transferOwnership(address next) external onlyOwner {
        require(next != address(0), "P31: zero owner");
        emit OwnershipTransferred(owner, next);
        owner = next;
    }
}
