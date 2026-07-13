// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {P31ManifestRegistry} from "../src/P31ManifestRegistry.sol";

contract P31ManifestRegistryTest is Test {
    P31ManifestRegistry internal m;
    bytes32 internal constant MID = keccak256(bytes("p31.contractRegistry/1.0.0"));

    function setUp() public {
        m = new P31ManifestRegistry();
    }

    function testPublish_andHead() public {
        bytes32 d = keccak256("digest");
        m.publish(MID, d, "https://p31ca.org/p31-contract-registry.json");
        P31ManifestRegistry.Head memory h = m.head(MID);
        assertEq(h.digest, d);
        assertEq(h.publisher, address(this));
        assertGt(h.updatedAt, 0);
    }

    function testPublish_overwrites() public {
        m.publish(MID, bytes32(uint256(1)), "a");
        vm.prank(address(0xB0B));
        m.publish(MID, bytes32(uint256(2)), "b");
        assertEq(m.head(MID).digest, bytes32(uint256(2)));
        assertEq(m.head(MID).publisher, address(0xB0B));
    }

    function testRevertZeroManifestId() public {
        vm.expectRevert(bytes("P31: zero manifestId"));
        m.publish(bytes32(0), bytes32(uint256(1)), "x");
    }

    function testRevertZeroDigest() public {
        vm.expectRevert(bytes("P31: zero digest"));
        m.publish(MID, bytes32(0), "x");
    }

    function testRevertEmptyUri() public {
        vm.expectRevert(bytes("P31: empty uri"));
        m.publish(MID, bytes32(uint256(1)), "");
    }
}
