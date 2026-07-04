// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title GenesisSpark
/// @notice One-of-a-kind NFT minted to the wallet that triggers the Genesis Gate deployment
/// @dev Deployed alongside LOVEToken, LOVESBT, ProofOfCare
contract GenesisSpark is ERC721, Ownable {
    uint256 private _nextTokenId;
    address public triggerAddress;
    bool public ignited;
    string public triggerTxHash;

    event SparkIgnited(address indexed trigger, string txHash, uint256 timestamp);

    constructor() ERC721("Genesis Spark", "SPARK") Ownable(msg.sender) {}

    /// @notice Mint the Genesis Spark to the wallet that triggered deployment
    /// @param trigger The wallet address that sent the donation
    /// @param txHash The transaction hash of the donation
    function ignite(address trigger, string calldata txHash) external onlyOwner {
        require(!ignited, "Already ignited");
        require(trigger != address(0), "Invalid trigger");
        require(bytes(txHash).length > 0, "Invalid txHash");

        ignited = true;
        triggerAddress = trigger;
        triggerTxHash = txHash;

        _nextTokenId++;
        _safeMint(trigger, _nextTokenId);

        emit SparkIgnited(trigger, txHash, block.timestamp);
    }

    /// @notice Contract metadata URI
    function contractURI() external pure returns (string memory) {
        return "ipfs://QmGenesisSparkMetadata";
    }

    /// @notice Token URI — returns dynamic SVG with spark visual
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId <= _nextTokenId && tokenId > 0, "Invalid token");
        return string.concat(
            "data:application/json;utf8,",
            "{",
            '"name":"Genesis Spark #', Strings.toString(tokenId), '",',
            '"description":"One-of-a-kind NFT commemorating the P31 Genesis Gate ignition.",',
            '"attributes":[{"trait_type":"Network","value":"Base"},{"trait_type":"Date","value":"', Strings.toString(block.timestamp), '"},{"trait_type":"Trigger","value":"', Strings.toHexString(triggerAddress), '"}],',
            '"image":"data:image/svg+xml;base64,', _svgBase64(), '"',
            "}"
        );
    }

    function _svgBase64() internal pure returns (string memory) {
        return "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIHZpZXdCb3g9IjAgMCA1MDAgNTAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxyYWRpYWxHcmFkaWVudCBpZD0iZyI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzAwZjBmZiIvPjxzdG9wIG9mZnNldD0iNTAlIiBzdG9wLWNvbG9yPSIjYjUzY2ZmIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZmZkNzAwIi8+PC9yYWRpYWxHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiMwMzAzMDUiLz48Y2lyY2xlIGN4PSIyNTAiIGN5PSIyNTAiIHI9IjE4MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ1cmwoI2cpIiBzdHJva2Utd2lkdGg9IjIiLz48Y2lyY2xlIGN4PSIyNTAiIGN5PSIyNTAiIHI9IjYwIiBmaWxsPSJ1cmwoI2cpIiBvcGFjaXR5PSIwLjgiLz48cGF0aCBkPSJNMjUwIDk2IEwyOTAgMjUwIEwyNTAgNDA0IEwyMTAgMjUwIFoiIGZpbGw9InVybCgjZykiIG9wYWNpdHk9IjAuNCIvPjx0ZXh0IHg9IjI1MCIgeT0iMjYwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iTW9ubyI+R0VORVNJUzwvdGV4dD48dGV4dCB4PSIyNTAiIHk9IjI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzAwZjBmZiI+U1BBUks8L3RleHQ+PC9zdmc+";
    }
}


