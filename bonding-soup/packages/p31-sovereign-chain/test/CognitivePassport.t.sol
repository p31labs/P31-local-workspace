// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/CognitivePassport.sol";

contract CognitivePassportTest is Test {
    CognitivePassport public passport;
    address public issuer = address(0x1);
    address public holder = address(0x2);
    address public admin;
    address public other = address(0x4);

    function setUp() public {
        admin = address(this);
        passport = new CognitivePassport("ipfs://QmBase/");

        passport.grantRole(passport.ISSUER_ROLE(), issuer);
        passport.grantRole(passport.REVOKER_ROLE(), issuer);
    }

    function test_IssuePassport() public {
        vm.prank(issuer);
        uint256 tokenId = passport.issuePassport(
            holder,
            "Test User",
            '{"auditory":"high","visual":"medium"}',
            '{"channels":["text"],"threshold":"medium"}',
            '{"baseline":12,"current":8,"threshold":3}',
            '{"frequency":"sometimes","triggers":["crowds"]}'
        );

        assertEq(passport.ownerOf(tokenId), holder);
        assertTrue(passport.locked(tokenId));

        (string memory name, string memory sensory,,,,,,) = passport.getPassportData(tokenId);
        assertEq(name, "Test User");
        assertEq(sensory, '{"auditory":"high","visual":"medium"}');
    }

    function test_CannotTransferWhenLocked() public {
        vm.prank(issuer);
        uint256 tokenId = passport.issuePassport(holder, "A", "{}", "{}", "{}", "{}");

        vm.expectRevert("Soulbound (ERC-5192)");
        vm.prank(holder);
        passport.transferFrom(holder, other, tokenId);
    }

    function test_NoApproval() public {
        vm.prank(issuer);
        uint256 tokenId = passport.issuePassport(holder, "A", "{}", "{}", "{}", "{}");

        vm.expectRevert("Soulbound: no approvals");
        vm.prank(holder);
        passport.approve(other, tokenId);
    }

    function test_NoSetApprovalForAll() public {
        vm.expectRevert("Soulbound: no approvals");
        passport.setApprovalForAll(other, true);
    }

    function test_RevokePassport() public {
        vm.prank(issuer);
        uint256 tokenId = passport.issuePassport(holder, "A", "{}", "{}", "{}", "{}");

        vm.prank(issuer);
        passport.revokePassport(tokenId, "User requested");

        (,,,,,,,bool revoked) = passport.getPassportData(tokenId);
        assertTrue(revoked);
    }

    function test_RevokeTwiceReverts() public {
        vm.prank(issuer);
        uint256 tokenId = passport.issuePassport(holder, "A", "{}", "{}", "{}", "{}");

        vm.prank(issuer);
        passport.revokePassport(tokenId, "First");

        vm.prank(issuer);
        vm.expectRevert("Already revoked");
        passport.revokePassport(tokenId, "Second");
    }

    function test_UpdatePassport() public {
        vm.prank(issuer);
        uint256 tokenId = passport.issuePassport(holder, "A", "{}", "{}", "{}", "{}");

        vm.prank(issuer);
        passport.updatePassport(
            tokenId,
            '{"auditory":"low"}',
            '{"channels":["voice"]}',
            '{"baseline":10}',
            '{"frequency":"never"}'
        );

        (,,string memory comm,,,,,) = passport.getPassportData(tokenId);
        assertEq(comm, '{"channels":["voice"]}');
    }

    function test_UpdateRevokedReverts() public {
        vm.prank(issuer);
        uint256 tokenId = passport.issuePassport(holder, "A", "{}", "{}", "{}", "{}");

        vm.prank(issuer);
        passport.revokePassport(tokenId, "Done");

        vm.prank(issuer);
        vm.expectRevert("Revoked");
        passport.updatePassport(tokenId, "{}", "{}", "{}", "{}");
    }

    function test_SupportsERC5192Interface() public {
        assertTrue(passport.supportsInterface(0xb45a3c0e));
    }

    function test_SupportsERC721Interface() public {
        assertTrue(passport.supportsInterface(type(IERC721).interfaceId));
    }

    function test_SupportsERC5192() public {
        assertTrue(passport.supportsInterface(type(IERC5192).interfaceId));
    }

    function test_OnlyIssuerCanIssue() public {
        vm.prank(holder);
        vm.expectRevert();
        passport.issuePassport(holder, "A", "{}", "{}", "{}", "{}");
    }

    function test_OnlyRevokerCanRevoke() public {
        vm.prank(issuer);
        uint256 tokenId = passport.issuePassport(holder, "A", "{}", "{}", "{}", "{}");

        vm.prank(holder);
        vm.expectRevert();
        passport.revokePassport(tokenId, "Nope");
    }

    function test_OnlyAdminCanUnlock() public {
        vm.prank(issuer);
        uint256 tokenId = passport.issuePassport(holder, "A", "{}", "{}", "{}", "{}");

        vm.startPrank(issuer);
        vm.expectRevert();
        passport.unlock(tokenId);
        vm.stopPrank();
    }

    function test_AdminUnlockRelock() public {
        vm.prank(issuer);
        uint256 tokenId = passport.issuePassport(holder, "A", "{}", "{}", "{}", "{}");

        passport.unlock(tokenId);
        assertFalse(passport.locked(tokenId));

        passport.relock(tokenId);
        assertTrue(passport.locked(tokenId));
    }

    function test_TransferAfterUnlock() public {
        vm.prank(issuer);
        uint256 tokenId = passport.issuePassport(holder, "A", "{}", "{}", "{}", "{}");

        passport.unlock(tokenId);

        vm.prank(holder);
        passport.transferFrom(holder, other, tokenId);
        assertEq(passport.ownerOf(tokenId), other);
    }

    function test_TokenURI() public {
        vm.prank(issuer);
        uint256 tokenId = passport.issuePassport(holder, "Alice", "{}", "{}", "{}", "{}");

        string memory uri = passport.tokenURI(tokenId);
        assertTrue(bytes(uri).length > 0);
        string memory prefix = "data:application/json;base64,";
        assertEq(bytes(uri).length >= bytes(prefix).length, true);
    }

    function test_DisplayNameRequired() public {
        vm.prank(issuer);
        vm.expectRevert("Display name required");
        passport.issuePassport(holder, "", "{}", "{}", "{}", "{}");
    }

    function test_ZeroAddressReverts() public {
        vm.prank(issuer);
        vm.expectRevert("Zero address");
        passport.issuePassport(address(0), "A", "{}", "{}", "{}", "{}");
    }

    function test_SetBaseURI() public {
        passport.setBaseURI("ipfs://QmNew/");

        vm.prank(issuer);
        uint256 tokenId = passport.issuePassport(holder, "A", "{}", "{}", "{}", "{}");

        string memory uri = passport.tokenURI(tokenId);
        assertTrue(bytes(uri).length > 0);
    }
}
