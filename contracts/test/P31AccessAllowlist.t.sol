// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {P31AccessAllowlist} from "../src/P31AccessAllowlist.sol";

contract P31AccessAllowlistTest is Test {
    P31AccessAllowlist internal a;
    bytes32 internal constant CAP = keccak256(bytes("mesh.relay"));

    function setUp() public {
        a = new P31AccessAllowlist();
    }

    function testSetAllowed() public {
        address bob = address(0xB0B);
        assertFalse(a.isAllowed(CAP, bob));
        a.setAllowed(CAP, bob, true);
        assertTrue(a.isAllowed(CAP, bob));
        a.setAllowed(CAP, bob, false);
        assertFalse(a.isAllowed(CAP, bob));
    }

    function testTransferOwnership() public {
        address bob = address(0xB0B);
        a.transferOwnership(bob);
        assertEq(a.owner(), bob);
        vm.prank(bob);
        bytes32 cap2 = keccak256(bytes("elevated.mesh"));
        a.setAllowed(cap2, address(1), true);
        assertTrue(a.isAllowed(cap2, address(1)));
    }

    function testRevertNotOwner() public {
        vm.prank(address(0xACE));
        vm.expectRevert(bytes("P31: not owner"));
        a.setAllowed(CAP, address(1), true);
    }

    function testRevertZeroAddress() public {
        vm.expectRevert(bytes("P31: zero address"));
        a.setAllowed(CAP, address(0), true);
    }
}
