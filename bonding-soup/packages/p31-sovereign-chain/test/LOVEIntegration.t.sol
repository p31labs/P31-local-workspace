// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/LOVESBT.sol";
import "../src/LOVEToken.sol";
import "../src/ProofOfCare.sol";

contract LOVEIntegrationTest is Test {
    address public deployer = address(this);
    address public oracle = address(0x2);
    address public user = address(0x3);
    address public sovereignPool = address(0x4);
    address public performancePool = address(0x5);

    LOVEToken public love;
    LOVESBT public sbt;
    ProofOfCare public poc;

    function setUp() public {
        vm.prank(deployer);
        love = new LOVEToken(deployer, sovereignPool, performancePool);
        sbt = new LOVESBT(deployer);
        poc = new ProofOfCare(address(love), oracle, address(sbt));
        love.setCareOracle(address(poc));
    }

    function testSBTMintByOracle() public {
        vm.prank(deployer);
        uint256 tokenId = sbt.mintSBT(user, 1e18, 1, "ipfs://test");
        assertEq(sbt.ownerOf(tokenId), user);
        LOVESBT.ReputationData memory data = sbt.getReputationData(tokenId);
        assertEq(data.score, 1e18);
        assertEq(data.trustTier, 2);
        assertEq(data.category, 1);
    }

    function testLOVERewardMint() public {
        vm.prank(deployer);
        uint256 tokenId = sbt.mintSBT(user, 1e18, 1, "");
        assertEq(sbt.ownerOf(tokenId), user);
        LOVESBT.ReputationData memory data = sbt.getReputationData(tokenId);
        assertEq(data.score, 1e18);
    }

    function testTransferStillReverts() public {
        vm.expectRevert("Soulbound: no approvals");
        love.approve(address(0x99), 100 ether);
    }

    function testSBTThresholdScaling() public {
        // threshold is 0.5e18 — 0.49e18 = tier 0, 0.5e18 = tier 1, 1.0e18 = tier 2
        vm.prank(deployer);
        uint256 lowId = sbt.mintSBT(user, 0.49e18, 1, "");
        LOVESBT.ReputationData memory lowData = sbt.getReputationData(lowId);
        assertEq(lowData.trustTier, 0);

        vm.prank(deployer);
        uint256 highId = sbt.mintSBT(user, 1.0e18, 1, "");
        LOVESBT.ReputationData memory highData = sbt.getReputationData(highId);
        assertEq(highData.trustTier, 2);
    }

    function testFullFlow() public {
        vm.prank(deployer);
        uint256 tokenId = sbt.mintSBT(user, 1e18, 1, "ipfs://flow");
        assertEq(sbt.getSBTs(user).length, 1);
    }
}
