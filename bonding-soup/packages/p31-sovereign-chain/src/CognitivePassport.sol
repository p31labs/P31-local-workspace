// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IERC5192 {
    event Locked(uint256 indexed tokenId);
    event Unlocked(uint256 indexed tokenId);
    function locked(uint256 tokenId) external view returns (bool);
}

contract CognitivePassport is ERC721, IERC5192, AccessControl {
    using Strings for uint256;

    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant REVOKER_ROLE = keccak256("REVOKER_ROLE");
    bytes4 private constant _INTERFACE_ID_ERC5192 = 0xb45a3c0e;

    struct PassportData {
        string displayName;
        string sensoryProfile;
        string communicationPrefs;
        string spoonProfile;
        string maskingProfile;
        uint256 issuedAt;
        uint256 updatedAt;
        bool revoked;
    }

    mapping(uint256 => PassportData) private _passportData;
    mapping(uint256 => bool) private _locked;
    uint256 private _nextTokenId;
    string private _baseTokenURI;

    event PassportIssued(uint256 indexed tokenId, address indexed holder);
    event PassportUpdated(uint256 indexed tokenId);
    event PassportRevoked(uint256 indexed tokenId, string reason);

    constructor(string memory baseTokenURI)
        ERC721("Cognitive Passport", "CPASS")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
        _grantRole(REVOKER_ROLE, msg.sender);
        _baseTokenURI = baseTokenURI;
    }

    function locked(uint256 tokenId) external view returns (bool) {
        _requireOwned(tokenId);
        return _locked[tokenId];
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, AccessControl)
        returns (bool)
    {
        return interfaceId == _INTERFACE_ID_ERC5192 || super.supportsInterface(interfaceId);
    }

    function issuePassport(
        address to,
        string memory displayName,
        string memory sensoryProfile,
        string memory communicationPrefs,
        string memory spoonProfile,
        string memory maskingProfile
    ) external onlyRole(ISSUER_ROLE) returns (uint256 tokenId) {
        require(to != address(0), "Zero address");
        require(bytes(displayName).length > 0, "Display name required");

        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        _passportData[tokenId] = PassportData({
            displayName: displayName,
            sensoryProfile: sensoryProfile,
            communicationPrefs: communicationPrefs,
            spoonProfile: spoonProfile,
            maskingProfile: maskingProfile,
            issuedAt: block.timestamp,
            updatedAt: block.timestamp,
            revoked: false
        });

        _locked[tokenId] = true;
        emit Locked(tokenId);
        emit PassportIssued(tokenId, to);
    }

    function updatePassport(
        uint256 tokenId,
        string memory sensoryProfile,
        string memory communicationPrefs,
        string memory spoonProfile,
        string memory maskingProfile
    ) external onlyRole(ISSUER_ROLE) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        require(!_passportData[tokenId].revoked, "Revoked");

        PassportData storage p = _passportData[tokenId];
        p.sensoryProfile = sensoryProfile;
        p.communicationPrefs = communicationPrefs;
        p.spoonProfile = spoonProfile;
        p.maskingProfile = maskingProfile;
        p.updatedAt = block.timestamp;

        emit PassportUpdated(tokenId);
    }

    function revokePassport(uint256 tokenId, string memory reason)
        external
        onlyRole(REVOKER_ROLE)
    {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        require(!_passportData[tokenId].revoked, "Already revoked");
        _passportData[tokenId].revoked = true;
        emit PassportRevoked(tokenId, reason);
    }

    function getPassportData(uint256 tokenId)
        external
        view
        returns (
            string memory displayName,
            string memory sensoryProfile,
            string memory communicationPrefs,
            string memory spoonProfile,
            string memory maskingProfile,
            uint256 issuedAt,
            uint256 updatedAt,
            bool revoked
        )
    {
        _requireOwned(tokenId);
        PassportData memory p = _passportData[tokenId];
        return (
            p.displayName,
            p.sensoryProfile,
            p.communicationPrefs,
            p.spoonProfile,
            p.maskingProfile,
            p.issuedAt,
            p.updatedAt,
            p.revoked
        );
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireOwned(tokenId);
        PassportData memory p = _passportData[tokenId];
        string memory tid = tokenId.toString();
        string memory attr = string(abi.encodePacked(
            '[{"trait_type":"Display Name","value":"', p.displayName, '"},',
            '{"trait_type":"Issued","value":"', p.issuedAt.toString(), '"},',
            '{"trait_type":"Updated","value":"', p.updatedAt.toString(), '"},',
            '{"trait_type":"Revoked","value":"', p.revoked ? "true" : "false", '"}',
            ']'
        ));
        string memory json = string(abi.encodePacked(
            '{"name":"Cognitive Passport #', tid,
            '","description":"Soulbound identity for neurodivergent self-sovereignty."',
            ',"attributes":', attr,
            ',"image":"', _baseTokenURI, tid, '.svg"}'
        ));
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            require(!_locked[tokenId], "Soulbound (ERC-5192)");
        }
        return super._update(to, tokenId, auth);
    }

    function approve(address, uint256) public pure override {
        revert("Soulbound: no approvals");
    }

    function setApprovalForAll(address, bool) public pure override {
        revert("Soulbound: no approvals");
    }

    function unlock(uint256 tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _locked[tokenId] = false;
        emit Unlocked(tokenId);
    }

    function relock(uint256 tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _locked[tokenId] = true;
        emit Locked(tokenId);
    }

    function setBaseURI(string memory baseTokenURI)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _baseTokenURI = baseTokenURI;
    }
}
