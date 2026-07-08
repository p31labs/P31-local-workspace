// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/LOVESBT.sol";
import "../src/ProofOfCare.sol";
import "../src/GenesisSpark.sol";

contract LOVEIntegrationTest is Test {
    address public deployer = address(this);
    address public oracle = address(0x2);
    address public user = address(0x3);

    LOVESBT public sbt;
    ProofOfCare public poc;
    GenesisSpark public spark;

    function setUp() public {
        vm.prank(deployer);
        sbt = new LOVESBT(deployer);
        poc = new ProofOfCare(oracle, address(sbt));
        spark = new GenesisSpark();
        // Authorize ProofOfCare to mint SBTs
        vm.prank(deployer);
        sbt.authorizeMinter(address(poc));
    }

    // ── LOVESBT: ERC-5192 compliance ──

    function testSBTMintByOracle() public {
        vm.prank(deployer);
        uint256 tokenId = sbt.mintSBT(user, 1e18, 1, "ipfs://test");
        assertEq(sbt.ownerOf(tokenId), user);
        LOVESBT.ReputationData memory data = sbt.getReputationData(tokenId);
        assertEq(data.score, 1e18);
        assertEq(data.trustTier, 2);
        assertEq(data.category, 1);
    }

    function testLockedReturnsTrue() public {
        vm.prank(deployer);
        uint256 tokenId = sbt.mintSBT(user, 1e18, 1, "");
        assertTrue(sbt.locked(tokenId));
    }

    function testLockedRevertsForNonExistent() public {
        vm.expectRevert("ERC-5192: invalid token");
        sbt.locked(999);
    }

    function testSupportsInterfaceERC5192() public {
        assertTrue(sbt.supportsInterface(0xb45a3c0e));
    }

    function testSetApprovalForAllReverts() public {
        vm.prank(user);
        vm.expectRevert("SBT soulbound");
        sbt.setApprovalForAll(address(0x99), true);
    }

    function testApproveReverts() public {
        vm.prank(deployer);
        uint256 tokenId = sbt.mintSBT(user, 1e18, 1, "");
        vm.prank(user);
        vm.expectRevert("SBT soulbound");
        sbt.approve(address(0x99), tokenId);
    }

    function testTransferReverts() public {
        vm.prank(deployer);
        uint256 tokenId = sbt.mintSBT(user, 1e18, 1, "");
        vm.prank(user);
        vm.expectRevert("SBT soulbound");
        sbt.transferFrom(user, address(0x99), tokenId);
    }

    function testSBTThresholdScaling() public {
        vm.prank(deployer);
        uint256 lowId = sbt.mintSBT(user, 0.49e18, 1, "");
        LOVESBT.ReputationData memory lowData = sbt.getReputationData(lowId);
        assertEq(lowData.trustTier, 0);

        vm.prank(deployer);
        uint256 highId = sbt.mintSBT(user, 1.0e18, 1, "");
        LOVESBT.ReputationData memory highData = sbt.getReputationData(highId);
        assertEq(highData.trustTier, 2);
    }

    // ── ProofOfCare: oracle SBT mint ──

    function testProofOfCareMintsSBT() public {
        vm.prank(oracle);
        poc.syncCareScore(user, 1.0e18);

        uint256[] memory sbts = sbt.getSBTs(user);
        assertEq(sbts.length, 1);
        LOVESBT.ReputationData memory data = sbt.getReputationData(sbts[0]);
        assertEq(data.score, 1.0e18);
    }

    function testProofOfCareSkipsBelowThreshold() public {
        vm.prank(oracle);
        poc.syncCareScore(user, 0.1e18);

        uint256[] memory sbts = sbt.getSBTs(user);
        assertEq(sbts.length, 0);
    }

    function testProofOfCareRateLimits() public {
        vm.prank(oracle);
        poc.syncCareScore(user, 1.0e18);

        // Second mint within 1 day should be skipped
        vm.prank(oracle);
        poc.syncCareScore(user, 1.0e18);

        uint256[] memory sbts = sbt.getSBTs(user);
        assertEq(sbts.length, 1);
    }

    // ── GenesisSpark: soulbound ──

    function testGenesisSparkIgnite() public {
        vm.prank(deployer);
        spark.ignite(user, "0xabc");
        assertTrue(spark.ignited());
        assertEq(spark.ownerOf(1), user);
    }

    function testGenesisSparkTransferReverts() public {
        vm.prank(deployer);
        spark.ignite(user, "0xabc");
        vm.prank(user);
        vm.expectRevert("GenesisSpark soulbound");
        spark.transferFrom(user, address(0x99), 1);
    }

    function testGenesisSparkApproveReverts() public {
        vm.prank(deployer);
        spark.ignite(user, "0xabc");
        vm.prank(user);
        vm.expectRevert("GenesisSpark soulbound");
        spark.approve(address(0x99), 1);
    }

    function testGenesisSparkDoubleIgniteReverts() public {
        vm.prank(deployer);
        spark.ignite(user, "0xabc");
        vm.prank(deployer);
        vm.expectRevert("Already ignited");
        spark.ignite(user, "0xdef");
    }

    // ── Integration: full flow ──

    function testFullFlow() public {
        // 1. Mint SBT
        vm.prank(deployer);
        uint256 tokenId = sbt.mintSBT(user, 1e18, 1, "ipfs://flow");
        assertEq(sbt.getSBTs(user).length, 1);

        // 2. ProofOfCare syncs and mints another SBT
        vm.prank(oracle);
        poc.syncCareScore(user, 0.8e18);
        assertEq(sbt.getSBTs(user).length, 2);

        // 3. Genesis spark
        vm.prank(deployer);
        spark.ignite(user, "0xflow");
        assertEq(spark.ownerOf(1), user);
    }
}
