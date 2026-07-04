// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ProofOfCare.sol";

contract ProofOfCareTest is Test {
    ProofOfCare public poc;
    address public deployer = address(this);
    address public oracle = address(0x2);
    address public user = address(0x3);
    address public loveToken = address(0x4);
    address public sbt = address(0x5);

    function setUp() public {
        vm.prank(deployer);
        poc = new ProofOfCare(loveToken, oracle, sbt);
    }

    function testInitialState() public {
        assertEq(poc.owner(), deployer);
        assertEq(poc.careOracle(), oracle);
        assertEq(poc.loveTokenAddress(), loveToken);
        assertEq(poc.loveSBTAddress(), sbt);
    }

    function testSyncCareScoreAsOracle() public {
        vm.prank(oracle);
        poc.syncCareScore(user, 1e18);
        assertEq(poc.getScore(user), 1e18);
    }

    function testSyncCareScoreAsOwner() public {
        vm.prank(deployer);
        poc.syncCareScore(user, 1e18);
        assertEq(poc.getScore(user), 1e18);
    }

    function testSyncCareScoreRevertsForRandom() public {
        vm.prank(address(0x99));
        vm.expectRevert("Not oracle");
        poc.syncCareScore(user, 1e18);
    }

    function testIsEligibleForReward() public {
        vm.warp(2 days);
        assertFalse(poc.isEligibleForReward(user));
        vm.prank(oracle);
        poc.syncCareScore(user, 1e18);
        vm.warp(2 days + 1);
        assertTrue(poc.isEligibleForReward(user));
    }

    function testBindIdentity() public {
        vm.prank(deployer);
        poc.bindIdentity(user, sbt);
        assertEq(poc.identityBinding(user), sbt);
    }
}
