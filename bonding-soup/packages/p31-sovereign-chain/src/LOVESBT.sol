// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title LOVESBT — LOVE Soulbound Badge (ERC-5192 compliant)
/// @notice Non-transferable reputation badge mirroring high-value milestones.
///         The liquid LOVE economy lives off-chain in the D1 ledger.
contract LOVESBT is ERC721Enumerable, Ownable {
    uint256 public constant TRUST_TIER_SCALE = 0.5e18;
    uint256 private _nextTokenId;

    // Per-token URI mapping (replaces desynced array)
    mapping(uint256 => string) private _tokenURIs;

    struct ReputationData {
        uint256 score;
        uint8 trustTier;
        uint8 category;
        uint256 issuedAt;
    }

    mapping(uint256 => ReputationData) public reputationData;
    mapping(address => uint256[]) public ownerSBTs;
    mapping(address => bool) public authorizedMinters;

    // ERC-5192 events
    event Locked(uint256 indexed tokenId);

    // P31 events
    event SBTMinted(address indexed to, uint256 indexed tokenId, uint256 score, uint8 trustTier);
    event SBTUpdated(uint256 indexed tokenId, uint256 newScore, uint8 newTier);
    event SBTBurnt(uint256 indexed tokenId, address indexed owner);
    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);

    constructor(address initialOwner) ERC721("LOVE Soulbound Badge", "LOVESBT") Ownable(initialOwner) {}

    /// @notice Authorize an address (e.g. ProofOfCare) to mint SBTs.
    function authorizeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }

    /// @notice Revoke minter authorization.
    function revokeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRevoked(minter);
    }

    modifier onlyMinterOrOwner() {
        require(owner() == msg.sender || authorizedMinters[msg.sender], "Not minter");
        _;
    }

    /// @notice Mint a soulbound badge. Emits Locked on mint.
    function mintSBT(address to, uint256 score, uint8 category, string calldata uri) external onlyMinterOrOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        if (bytes(uri).length > 0) _tokenURIs[tokenId] = uri;
        uint8 trustTier = uint8(score / TRUST_TIER_SCALE);
        reputationData[tokenId] = ReputationData({score: score, trustTier: trustTier, category: category, issuedAt: block.timestamp});
        ownerSBTs[to].push(tokenId);
        emit Locked(tokenId);
        emit SBTMinted(to, tokenId, score, trustTier);
        return tokenId;
    }

    // ── ERC-5192: Soulbound interface ──

    /// @notice Returns true if the token is soulbound (all tokens are).
    function locked(uint256 tokenId) public view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "ERC-5192: invalid token");
        return true;
    }

    /// @notice Block setApprovalForAll — soulbound tokens cannot be approved.
    function setApprovalForAll(address, bool) public pure override(ERC721, IERC721) {
        revert("SBT soulbound");
    }

    // ── Token metadata ──

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (tokenId >= _nextTokenId) revert("Invalid token");
        return _tokenURIs[tokenId];
    }

    // ── Owner functions ──

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
        delete _tokenURIs[tokenId];
        emit SBTBurnt(tokenId, owner);
    }

    // ── Views ──

    function getSBTs(address owner_) external view returns (uint256[] memory) { return ownerSBTs[owner_]; }

    function getReputationData(uint256 tokenId) external view returns (ReputationData memory) {
        return reputationData[tokenId];
    }

    // ── Overrides ──

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable) returns (bool) {
        return interfaceId == 0xb45a3c0e || super.supportsInterface(interfaceId);
    }

    function _increaseBalance(address account, uint128 amount) internal override(ERC721Enumerable) {
        super._increaseBalance(account, amount);
    }

    /// @dev Block approve — soulbound.
    function approve(address, uint256) public override(ERC721, IERC721) { revert("SBT soulbound"); }

    /// @dev Block transfers. Allow mint (to != address(0)) and burn (auth == address(0)).
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721Enumerable) returns (address) {
        if (to == address(0) || auth == address(0)) return super._update(to, tokenId, auth);
        revert("SBT soulbound");
    }
}
