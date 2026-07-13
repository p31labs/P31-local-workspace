#!/usr/bin/env node
// cli/generate-contract.js — Generate a P31 SMART governance contract from template.
//
// Usage:
//   node cli/generate-contract.js <type> [--name <Name>] [--owner <0x...>] [--output <path>]
//
// Types: anchor, registry, allowlist, content-root, treasury, erc5192, custom
//
// Examples:
//   node cli/generate-contract.js anchor --name P31ReleaseAnchor
//   node cli/generate-contract.js allowlist --name P31CapabilityRegistry --owner 0x51c...
//   node cli/generate-contract.js custom --name P31VoteEscrow

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

function tplAnchor(name) {
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ${name}
/// @notice Permissionless, ordered commitments for public P31 digests.
contract ${name} {
    struct Anchor {
        bytes32 digest;
        string uri;
        address sender;
        uint64 blockNumber;
        uint64 timestamp;
    }

    uint256 public anchorCount;
    mapping(uint256 id => Anchor) private _anchors;

    event Anchored(
        uint256 indexed id,
        bytes32 indexed digest,
        string uri,
        address indexed sender,
        uint256 blockNumber,
        uint256 timestamp
    );

    function anchor(bytes32 digest, string calldata uri) external returns (uint256 id) {
        require(digest != bytes32(0), "P31: zero digest");
        require(bytes(uri).length > 0, "P31: empty uri");
        id = anchorCount++;
        _anchors[id] = Anchor({
            digest: digest,
            uri: uri,
            sender: msg.sender,
            blockNumber: uint64(block.number),
            timestamp: uint64(block.timestamp)
        });
        emit Anchored(id, digest, uri, msg.sender, block.number, block.timestamp);
    }

    function getAnchor(uint256 id) external view returns (Anchor memory) {
        require(id < anchorCount, "P31: unknown id");
        return _anchors[id];
    }
}
`;
}

function tplRegistry(name) {
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ${name}
/// @notice Stable manifestId -> latest digest + URI head. Last writer wins.
contract ${name} {
    struct Head {
        bytes32 digest;
        string uri;
        address publisher;
        uint64 updatedAt;
    }

    mapping(bytes32 manifestId => Head) private _heads;

    event ManifestPublished(
        bytes32 indexed manifestId,
        bytes32 digest,
        string uri,
        address indexed publisher,
        uint256 timestamp
    );

    function publish(bytes32 manifestId, bytes32 digest, string calldata uri) external {
        require(manifestId != bytes32(0), "P31: zero manifestId");
        require(digest != bytes32(0), "P31: zero digest");
        require(bytes(uri).length > 0, "P31: empty uri");
        _heads[manifestId] = Head({
            digest: digest,
            uri: uri,
            publisher: msg.sender,
            updatedAt: uint64(block.timestamp)
        });
        emit ManifestPublished(manifestId, digest, uri, msg.sender, block.timestamp);
    }

    function head(bytes32 manifestId) external view returns (Head memory) {
        return _heads[manifestId];
    }
}
`;
}

function tplAllowlist(name, ownerAddr) {
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ${name}
/// @notice Owner-managed capability bit per address.
contract ${name} {
    address public owner;

    mapping(bytes32 capability => mapping(address who => bool)) private _allowed;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event AllowanceSet(bytes32 indexed capability, address indexed who, bool allowed);

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "P31: not owner");
        _;
    }

    function setAllowed(bytes32 capability, address who, bool allowed) external onlyOwner {
        require(who != address(0), "P31: zero address");
        _allowed[capability][who] = allowed;
        emit AllowanceSet(capability, who, allowed);
    }

    function isAllowed(bytes32 capability, address who) external view returns (bool) {
        return _allowed[capability][who];
    }

    function transferOwnership(address next) external onlyOwner {
        require(next != address(0), "P31: zero owner");
        emit OwnershipTransferred(owner, next);
        owner = next;
    }
}
`;
}

function tplContentRoot(name) {
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ${name}
/// @notice Maps logical content keys to IPFS / Arweave CIDs.
contract ${name} {
    address public owner;

    mapping(bytes32 key => string cid) private _cidOf;

    event RootSet(bytes32 indexed key, string cid, address indexed sender);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "P31: not owner");
        _;
    }

    function setRoot(bytes32 key, string calldata cid) external onlyOwner {
        require(key != bytes32(0), "P31: zero key");
        require(bytes(cid).length > 0, "P31: empty cid");
        _cidOf[key] = cid;
        emit RootSet(key, cid, msg.sender);
    }

    function cidOf(bytes32 key) external view returns (string memory) {
        return _cidOf[key];
    }

    function transferOwnership(address next) external onlyOwner {
        require(next != address(0), "P31: zero owner");
        emit OwnershipTransferred(owner, next);
        owner = next;
    }
}
`;
}

function tplTreasury(name) {
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ${name}
/// @notice On-chain pointers for Safe treasury + USDC + home chain id.
contract ${name} {
    address public owner;

    address public safe;
    address public usdc;
    uint256 public homeChainId;
    bool public locked;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event TreasuryConfigured(address indexed safe, address indexed usdc, uint256 homeChainId);
    event Locked();

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "P31: not owner");
        _;
    }

    function configure(address safe_, address usdc_, uint256 chainId_) external onlyOwner {
        require(!locked, "P31: locked");
        require(safe_ != address(0), "P31: zero safe");
        require(usdc_ != address(0), "P31: zero usdc");
        require(chainId_ != 0, "P31: zero chainId");
        safe = safe_;
        usdc = usdc_;
        homeChainId = chainId_;
        emit TreasuryConfigured(safe_, usdc_, chainId_);
    }

    function lock() external onlyOwner {
        require(!locked, "P31: locked");
        require(safe != address(0), "P31: not configured");
        locked = true;
        emit Locked();
    }

    function transferOwnership(address next) external onlyOwner {
        require(next != address(0), "P31: zero owner");
        emit OwnershipTransferred(owner, next);
        owner = next;
    }
}
`;
}

function tplERC5192(name) {
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ${name}
/// @notice Soulbound (ERC-5192 minimal) token with owner-mint + lock.
contract ${name} {
    address public owner;
    uint256 public nextTokenId;

    mapping(uint256 => address) private _ownerOf;
    mapping(uint256 => bool) private _locked;

    event Minted(uint256 indexed tokenId, address indexed to);
    event Locked(uint256 indexed tokenId);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "P31: not owner");
        _;
    }

    function mint(address to) external onlyOwner returns (uint256 tokenId) {
        require(to != address(0), "P31: zero address");
        tokenId = nextTokenId++;
        _ownerOf[tokenId] = to;
        emit Minted(tokenId, to);
    }

    function lock(uint256 tokenId) external {
        require(msg.sender == _ownerOf[tokenId], "P31: not owner");
        require(!_locked[tokenId], "P31: already locked");
        _locked[tokenId] = true;
        emit Locked(tokenId);
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        return _ownerOf[tokenId];
    }

    function locked(uint256 tokenId) external view returns (bool) {
        return _locked[tokenId];
    }

    function transferOwnership(address next) external onlyOwner {
        require(next != address(0), "P31: zero owner");
        emit OwnershipTransferred(owner, next);
        owner = next;
    }
}
`;
}

function tplCustom(name) {
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ${name}
/// @notice Custom P31 governance contract. Edit this template to add logic.
contract ${name} {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "P31: not owner");
        _;
    }

    function transferOwnership(address next) external onlyOwner {
        require(next != address(0), "P31: zero owner");
        emit OwnershipTransferred(owner, next);
        owner = next;
    }
}
`;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const TYPES = {
  anchor:       tplAnchor,
  registry:     tplRegistry,
  allowlist:    tplAllowlist,
  'content-root': tplContentRoot,
  treasury:     tplTreasury,
  erc5192:      tplERC5192,
  custom:       tplCustom,
};

function usage() {
  console.log(`Usage: node cli/generate-contract.js <type> [options]

Types:
  anchor          Permissionless ordered commitments (P31TransparencyAnchor)
  registry        Manifest publish (P31ManifestRegistry)
  allowlist       Owner-managed capability allowlist (P31AccessAllowlist)
  content-root    Key -> CID map (P31ContentRoot)
  treasury        Safe + USDC + chain config (P31TreasuryConfig)
  erc5192         Soulbound ERC-5192 token with owner-mint + lock
  custom          Empty owner-only scaffold

Options:
  --name <Name>       Contract name (required)
  --owner <0x...>     Initial owner address (default: msg.sender at deploy)
  --output <path>     Write file instead of stdout

Examples:
  node cli/generate-contract.js anchor --name P31ReleaseAnchor
  node cli/generate-contract.js allowlist --name P31CapabilityRegistry
  node cli/generate-contract.js erc5192 --name P31VotingToken --output contracts/src/P31VotingToken.sol`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    usage();
    process.exit(0);
  }

  const type = args[0];
  if (!TYPES[type]) {
    console.error(`Unknown type: ${type}. Valid types: ${Object.keys(TYPES).join(', ')}`);
    process.exit(1);
  }

  let name = null;
  let output = null;
  let owner = null;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--name' && args[i + 1]) {
      name = args[++i];
    } else if (args[i] === '--output' && args[i + 1]) {
      output = args[++i];
    } else if (args[i] === '--owner' && args[i + 1]) {
      owner = args[++i];
    }
  }

  if (!name) {
    console.error('--name is required. Example: --name P31ReleaseAnchor');
    process.exit(1);
  }

  // Validate contract name (must start with uppercase letter, alphanumeric only)
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
    console.error(`Invalid contract name: ${name}. Must start with uppercase, alphanumeric only.`);
    process.exit(1);
  }

  let code;
  switch (type) {
    case 'anchor':
    case 'registry':
    case 'content-root':
    case 'treasury':
    case 'erc5192':
    case 'custom':
      code = TYPES[type](name);
      break;
    case 'allowlist':
      code = TYPES[type](name, owner);
      break;
  }

  if (output) {
    const dir = path.dirname(output);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(output, code);
    console.log(`Written: ${output}`);
  } else {
    process.stdout.write(code);
  }
}

main();
