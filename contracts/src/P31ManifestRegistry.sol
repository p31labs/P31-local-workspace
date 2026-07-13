// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title P31ManifestRegistry
/// @notice SMART M — stable manifest id → latest digest + URI head.
/// @dev Permissionless publish; last writer wins per manifestId.
contract P31ManifestRegistry {
    struct Head {
        bytes32 digest;
        string uri;
        address publisher;
        uint64 updatedAt;
    }

    mapping(bytes32 manifestId => Head) private _heads;

    event ManifestPublished(
        bytes32 indexed manifestId,
        bytes32 digest,
        string uri,
        address indexed publisher,
        uint256 timestamp
    );

    function publish(bytes32 manifestId, bytes32 digest, string calldata uri) external {
        require(manifestId != bytes32(0), "P31: zero manifestId");
        require(digest != bytes32(0), "P31: zero digest");
        require(bytes(uri).length > 0, "P31: empty uri");

        _heads[manifestId] = Head({
            digest: digest,
            uri: uri,
            publisher: msg.sender,
            updatedAt: uint64(block.timestamp)
        });

        emit ManifestPublished(manifestId, digest, uri, msg.sender, block.timestamp);
    }

    function head(bytes32 manifestId) external view returns (Head memory) {
        return _heads[manifestId];
    }
}
