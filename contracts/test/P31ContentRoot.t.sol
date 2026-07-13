// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {P31ContentRoot} from "../src/P31ContentRoot.sol";

contract P31ContentRootTest is Test {
    P31ContentRoot internal r;
    bytes32 internal constant KEY = keccak256(bytes("p31-hub-dist"));

    function setUp() public {
        r = new P31ContentRoot();
    }

    function testSetRoot_andView() public {
        r.setRoot(KEY, "bafyTESTcidREPLACE");
        assertEq(r.cidOf(KEY), "bafyTESTcidREPLACE");
    }

    function testTransferOwnership() public {
        address bob = address(0xB0B);
        r.transferOwnership(bob);
        assertEq(r.owner(), bob);
        vm.prank(bob);
        r.setRoot(KEY, "ipfs://bafyNEW");
        assertEq(r.cidOf(KEY), "ipfs://bafyNEW");
    }

    function testRevertNotOwner() public {
        vm.prank(address(0xACE));
        vm.expectRevert(bytes("P31: not owner"));
        r.setRoot(KEY, "x");
    }

    function testRevertZeroKey() public {
        vm.expectRevert(bytes("P31: zero key"));
        r.setRoot(bytes32(0), "x");
    }

    function testRevertEmptyCid() public {
        vm.expectRevert(bytes("P31: empty cid"));
        r.setRoot(KEY, "");
    }
}
