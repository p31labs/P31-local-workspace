// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title P31TransparencyAnchor
/// @notice Permissionless, ordered commitments for public P31 contract digests.
/// @dev Anchors a sha256 digest (as bytes32) with a URI to the manifest.
///      Spam costs gas; official release lines are established by operator practice.
contract P31TransparencyAnchor {
    struct Anchor {
        bytes32 digest;
        string uri;
        address sender;
        uint64 blockNumber;
        uint64 timestamp;
    }

    uint256 public anchorCount;
    mapping(uint256 id => Anchor) private _anchors;

    event Anchored(
        uint256 indexed id,
        bytes32 indexed digest,
        string uri,
        address indexed sender,
        uint256 blockNumber,
        uint256 timestamp
    );

    /// @param digest sha256 of the canonical bytes being anchored.
    /// @param uri HTTPS or IPFS location of the full manifest.
    function anchor(bytes32 digest, string calldata uri) external returns (uint256 id) {
        require(digest != bytes32(0), "P31: zero digest");
        require(bytes(uri).length > 0, "P31: empty uri");

        id = anchorCount++;
        _anchors[id] = Anchor({
            digest: digest,
            uri: uri,
            sender: msg.sender,
            blockNumber: uint64(block.number),
            timestamp: uint64(block.timestamp)
        });

        emit Anchored(id, digest, uri, msg.sender, block.number, block.timestamp);
    }

    function getAnchor(uint256 id) external view returns (Anchor memory) {
        require(id < anchorCount, "P31: unknown id");
        return _anchors[id];
    }
}
