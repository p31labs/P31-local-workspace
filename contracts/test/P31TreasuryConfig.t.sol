// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {P31TreasuryConfig} from "../src/P31TreasuryConfig.sol";

contract P31TreasuryConfigTest is Test {
    P31TreasuryConfig internal t;

    function setUp() public {
        t = new P31TreasuryConfig();
    }

    function testConfigure_andLock() public {
        address safe_ = address(uint160(0x5AFE));
        address usdc_ = address(uint160(0xabc0001));
        t.configure(safe_, usdc_, 8453);
        assertEq(t.safe(), safe_);
        assertEq(t.usdc(), usdc_);
        assertEq(t.homeChainId(), 8453);
        t.lock();
        assertTrue(t.locked());
        vm.expectRevert(bytes("P31: locked"));
        t.configure(safe_, usdc_, 1);
    }

    function testRevertConfigureZero() public {
        vm.expectRevert(bytes("P31: zero safe"));
        t.configure(address(0), address(1), 1);
    }

    function testRevertConfigureZeroUsdc() public {
        vm.expectRevert(bytes("P31: zero usdc"));
        t.configure(address(1), address(0), 1);
    }

    function testRevertConfigureZeroChainId() public {
        vm.expectRevert(bytes("P31: zero chainId"));
        t.configure(address(1), address(2), 0);
    }

    function testRevertLockNotConfigured() public {
        vm.expectRevert(bytes("P31: not configured"));
        t.lock();
    }

    function testRevertLockAlreadyLocked() public {
        t.configure(address(1), address(2), 8453);
        t.lock();
        vm.expectRevert(bytes("P31: locked"));
        t.lock();
    }

    function testTransferOwnership() public {
        address bob = address(0xB0B);
        t.transferOwnership(bob);
        assertEq(t.owner(), bob);
        vm.prank(bob);
        t.configure(address(1), address(2), 8453);
        assertEq(t.safe(), address(1));
    }

    function testRevertNotOwnerConfigure() public {
        vm.prank(address(0xACE));
        vm.expectRevert(bytes("P31: not owner"));
        t.configure(address(1), address(2), 8453);
    }

    function testRevertNotOwnerLock() public {
        t.configure(address(1), address(2), 8453);
        vm.prank(address(0xACE));
        vm.expectRevert(bytes("P31: not owner"));
        t.lock();
    }

    function testRevertZeroOwnerTransfer() public {
        vm.expectRevert(bytes("P31: zero owner"));
        t.transferOwnership(address(0));
    }
}
