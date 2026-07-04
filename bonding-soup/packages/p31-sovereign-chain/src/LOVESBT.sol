// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LOVESBT is ERC721Enumerable, Ownable {
    uint256 public constant TRUST_TIER_SCALE = 0.5e18;
    uint256 private _nextTokenId;

    string[] private _tokenURIs;

    struct ReputationData {
        uint256 score;
        uint8 trustTier;
        uint8 category;
        uint256 issuedAt;
    }

    mapping(uint256 => ReputationData) public reputationData;
    mapping(address => uint256[]) public ownerSBTs;

    event SBTMinted(address indexed to, uint256 indexed tokenId, uint256 score, uint8 trustTier);
    event SBTUpdated(uint256 indexed tokenId, uint256 newScore, uint8 newTier);
    event SBTBurnt(uint256 indexed tokenId, address indexed owner);

    constructor(address initialOwner) ERC721("LOVE Soulbound Badge", "LOVESBT") Ownable(initialOwner) {}

    function mintSBT(address to, uint256 score, uint8 category, string calldata tokenURI) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        if (bytes(tokenURI).length > 0) _tokenURIs.push(tokenURI);
        uint8 trustTier = uint8(score / TRUST_TIER_SCALE);
        reputationData[tokenId] = ReputationData({score: score, trustTier: trustTier, category: category, issuedAt: block.timestamp});
        ownerSBTs[to].push(tokenId);
        emit SBTMinted(to, tokenId, score, trustTier);
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (tokenId >= _nextTokenId || tokenId >= _tokenURIs.length) return "";
        return _tokenURIs[tokenId];
    }

    function updateReputation(uint256 tokenId, uint256 newScore) external onlyOwner {
        _requireOwned(tokenId);
        uint8 newTier = uint8(newScore / TRUST_TIER_SCALE);
        reputationData[tokenId] = ReputationData({score: newScore, trustTier: newTier, category: reputationData[tokenId].category, issuedAt: block.timestamp});
        emit SBTUpdated(tokenId, newScore, newTier);
    }

    function burn(uint256 tokenId) external onlyOwner {
        _requireOwned(tokenId);
        address owner = ownerOf(tokenId);
        _burn(tokenId);
        uint256[] storage sbtArray = ownerSBTs[owner];
        for (uint256 i = 0; i < sbtArray.length; i++) {
            if (sbtArray[i] == tokenId) {
                sbtArray[i] = sbtArray[sbtArray.length - 1];
                sbtArray.pop();
                break;
            }
        }
        delete reputationData[tokenId];
        emit SBTBurnt(tokenId, owner);
    }

    function getSBTs(address owner_) external view returns (uint256[] memory) { return ownerSBTs[owner_]; }

    function getReputationData(uint256 tokenId) external view returns (ReputationData memory) {
        return reputationData[tokenId];
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _increaseBalance(address account, uint128 amount) internal override(ERC721Enumerable) {
        super._increaseBalance(account, amount);
    }

    // Soulbound — block all user-initiated transfers via internal _update hook + external overrides
    function approve(address, uint256) public override(ERC721, IERC721) { revert("SBT soulbound"); }

    // Soulbound — block all user-initiated transfers via internal _update hook
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721Enumerable) returns (address) {
        if (to == address(0) || auth == address(0)) return super._update(to, tokenId, auth); // mint/burn allowed
        revert("SBT soulbound"); // transfer blocked
    }
}
