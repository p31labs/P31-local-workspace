#!/usr/bin/env node

/**
 * Update README with Latest IPFS Link
 * Updates the main README with the latest IPFS CID for the release
 */

const fs = require('fs');
const path = require('path');

const readmePath = path.join(__dirname, '..', '..', 'README.md');

// Load current README
let readmeContent = '';
if (fs.existsSync(readmePath)) {
    readmeContent = fs.readFileSync(readmePath, 'utf8');
}

// Get CID from environment (set by GitHub Actions)
const cid = process.env.CID || process.env.GITHUB_SHA;

if (!cid) {
    console.log('No CID provided, skipping README update');
    process.exit(0);
}

// Update IPFS section in README
const ipfsSectionRegex = /## 🌐 Decentralized Access[\s\S]*?##/;
const newIPFSSection = `## 🌐 Decentralized Access

**Latest Release CID:** \`${cid}\`

**Access Methods:**
- [Cloudflare IPFS Gateway](https://cloudflare-ipfs.com/ipfs/${cid}/)
- [Pinata IPFS Gateway](https://gateway.pinata.cloud/ipfs/${cid}/)
- [Infura IPFS Gateway](https://ipfs.io/ipfs/${cid}/)

**IPFS CLI:**
\`\`\`bash
ipfs get ${cid}
\`\`\`

**Data Sovereignty:** All releases are permanently archived on IPFS, ensuring censorship resistance and data sovereignty.

##`;

if (ipfsSectionRegex.test(readmeContent)) {
    readmeContent = readmeContent.replace(ipfsSectionRegex, newIPFSSection);
} else {
    // Add IPFS section if it doesn't exist
    const communitySection = '## Community';
    if (readmeContent.includes(communitySection)) {
        readmeContent = readmeContent.replace(
            communitySection,
            `${newIPFSSection}\n\n${communitySection}`
        );
    } else {
        // Add at the end if no community section
        readmeContent += `\n\n${newIPFSSection}\n`;
    }
}

// Save updated README
fs.writeFileSync(readmePath, readmeContent);

console.log(`README updated with IPFS CID: ${cid}`);