// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LOVESBT is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    address public oracle;

    struct ReputationMetadata {
        uint256 careScore;
        uint256 trustTier;
        uint256 lastUpdate;
        string metadataURI;
    }

    mapping(uint256 => ReputationMetadata) public reputationData;
    mapping(address => uint256[]) public userSBTs;

    event SBTMinted(address indexed to, uint256 indexed tokenId, uint256 careScore);
    event SBTUpdated(uint256 indexed tokenId, uint256 newCareScore);
    event OracleUpdated(address indexed oracle);

    error SoulboundTransferNotAllowed();
    error ZeroAddress();
    error Unauthorized();

    modifier onlyOwnerOrOracle() {
        if (msg.sender != owner() && msg.sender != oracle) revert Unauthorized();
        _;
    }

    constructor(address _architect, address _oracle) ERC721("LOVE Soulbound Token", "LOVE-SBT") Ownable(_architect) {
        oracle = _oracle;
    }

    function setOracle(address _oracle) external onlyOwner {
        if (_oracle == address(0)) revert ZeroAddress();
        oracle = _oracle;
        emit OracleUpdated(_oracle);
    }

    function mintSBT(
        address to,
        uint256 careScore,
        uint256 trustTier,
        string memory metadataURI
    ) external onlyOwnerOrOracle {
        if (to == address(0)) revert ZeroAddress();

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        userSBTs[to].push(tokenId);

        reputationData[tokenId] = ReputationMetadata({
            careScore: careScore,
            trustTier: trustTier,
            lastUpdate: block.timestamp,
            metadataURI: metadataURI
        });

        emit SBTMinted(to, tokenId, careScore);
    }

    function updateReputation(uint256 tokenId, uint256 newCareScore) external onlyOwnerOrOracle {
        reputationData[tokenId].careScore = newCareScore;
        reputationData[tokenId].lastUpdate = block.timestamp;
        emit SBTUpdated(tokenId, newCareScore);
    }

    function getSBTs(address owner) external view returns (uint256[] memory) {
        return userSBTs[owner];
    }

    function safeMintBatch(address to, uint256 count) external onlyOwnerOrOracle {
        if (to == address(0)) revert ZeroAddress();
        uint256 startTokenId = _tokenIdCounter;
        _tokenIdCounter += count;

        for (uint256 i = 0; i < count; i++) {
            _safeMint(to, startTokenId + i);
            userSBTs[to].push(startTokenId + i);
            reputationData[startTokenId + i] = ReputationMetadata({
                careScore: 0,
                trustTier: 0,
                lastUpdate: block.timestamp,
                metadataURI: ""
            });
        }

        emit SBTMinted(to, startTokenId, 0);
    }

    function burn(uint256 tokenId) external {
        address tokenOwner = ERC721.ownerOf(tokenId);
        require(tokenOwner == msg.sender || Ownable.owner() == msg.sender, "Not authorized");

        uint256[] storage userTokens = userSBTs[tokenOwner];
        for (uint256 i = 0; i < userTokens.length; i++) {
            if (userTokens[i] == tokenId) {
                userTokens[i] = userTokens[userTokens.length - 1];
                userTokens.pop();
                break;
            }
        }
        delete reputationData[tokenId];

        ERC721._burn(tokenId);
    }

    function transferFrom(address, address, uint256) public pure override {
        revert SoulboundTransferNotAllowed();
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert SoulboundTransferNotAllowed();
    }

    function approve(address, uint256) public pure override {
        revert SoulboundTransferNotAllowed();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert SoulboundTransferNotAllowed();
    }

    function getApproved(uint256) public pure override returns (address) {
        revert SoulboundTransferNotAllowed();
    }
}
