// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {P31TransparencyAnchor} from "../src/P31TransparencyAnchor.sol";

contract P31TransparencyAnchorTest is Test {
    P31TransparencyAnchor internal a;

    function setUp() public {
        a = new P31TransparencyAnchor();
    }

    function testAnchor_emitsAndStores() public {
        bytes32 d = keccak256("p31-contract-registry fingerprint");
        uint256 id = a.anchor(d, "https://p31ca.org/p31-contract-registry.json");
        assertEq(id, 0);
        assertEq(a.anchorCount(), 1);

        P31TransparencyAnchor.Anchor memory row = a.getAnchor(0);
        assertEq(row.digest, d);
        assertEq(row.uri, "https://p31ca.org/p31-contract-registry.json");
        assertEq(row.sender, address(this));
    }

    function testAnchor_multipleSequential() public {
        a.anchor(keccak256("first"), "https://first");
        a.anchor(keccak256("second"), "https://second");
        assertEq(a.anchorCount(), 2);

        P31TransparencyAnchor.Anchor memory r0 = a.getAnchor(0);
        assertEq(r0.digest, keccak256("first"));

        P31TransparencyAnchor.Anchor memory r1 = a.getAnchor(1);
        assertEq(r1.digest, keccak256("second"));
    }

    function testAnchor_revertZeroDigest() public {
        vm.expectRevert(bytes("P31: zero digest"));
        a.anchor(bytes32(0), "ipfs://bafy");
    }

    function testAnchor_revertEmptyUri() public {
        vm.expectRevert(bytes("P31: empty uri"));
        a.anchor(bytes32(uint256(1)), "");
    }

    function testGetAnchor_revertUnknown() public {
        vm.expectRevert(bytes("P31: unknown id"));
        a.getAnchor(0);
    }
}
