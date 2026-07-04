// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/LOVESBT.sol";

contract LOVESBTTest is Test {
    LOVESBT public sbt;
    address public deployer = address(this);
    address public user = address(0x2);

    function setUp() public {
        vm.prank(deployer);
        sbt = new LOVESBT(deployer);
    }

    function testInitialSupply() public {
        assertEq(sbt.name(), "LOVE Soulbound Badge");
        assertEq(sbt.symbol(), "LOVESBT");
    }

    function testMintSBT() public {
        vm.prank(deployer);
        uint256 tokenId = sbt.mintSBT(user, 1e18, 1, "ipfs://test");
        assertEq(sbt.ownerOf(tokenId), user);
        LOVESBT.ReputationData memory data = sbt.getReputationData(tokenId);
        assertEq(data.score, 1e18);
        assertEq(data.trustTier, 2);
        assertEq(data.category, 1);
        assertEq(sbt.getSBTs(user).length, 1);
    }

    function testCannotTransferSBT() public {
        vm.prank(deployer);
        uint256 tokenId = sbt.mintSBT(user, 1e18, 1, "");
        vm.prank(user);
        vm.expectRevert("SBT soulbound");
        sbt.transferFrom(user, address(0x3), tokenId);
    }

    function testCannotApproveSBT() public {
        vm.prank(deployer);
        uint256 tokenId = sbt.mintSBT(user, 1e18, 1, "");
        vm.prank(user);
        vm.expectRevert("SBT soulbound");
        sbt.approve(address(0x3), tokenId);
    }

    function testBurnSBT() public {
        vm.prank(deployer);
        uint256 tokenId = sbt.mintSBT(user, 1e18, 1, "");
        vm.prank(deployer);
        sbt.burn(tokenId);
        assertEq(sbt.getSBTs(user).length, 0);
    }

    function testUpdateReputation() public {
        vm.prank(deployer);
        uint256 tokenId = sbt.mintSBT(user, 1e18, 1, "");
        vm.prank(deployer);
        sbt.updateReputation(tokenId, 1.5e18);
        LOVESBT.ReputationData memory data = sbt.getReputationData(tokenId);
        assertEq(data.score, 1.5e18);
        assertEq(data.trustTier, 3);
    }

    function testFuzzMint(uint96 score) public {
        vm.prank(deployer);
        uint256 tokenId = sbt.mintSBT(user, score, 1, "");
        assertEq(sbt.ownerOf(tokenId), user);
    }
}
