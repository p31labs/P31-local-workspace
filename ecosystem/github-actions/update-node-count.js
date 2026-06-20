#!/usr/bin/env node

/**
 * Update Node Count Display
 * Updates the main README or dashboard with current node count
 */

const fs = require('fs');
const path = require('path');

const registryPath = path.join(__dirname, '..', '..', 'user-registry.json');
const readmePath = path.join(__dirname, '..', '..', 'README.md');

// Load user registry
let registry = {};
if (fs.existsSync(registryPath)) {
    registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
}

// Calculate total node count
const totalNodes = Object.values(registry).reduce((sum, user) => sum + user.nodeCount, 0);

// Load current README
let readmeContent = '';
if (fs.existsSync(readmePath)) {
    readmeContent = fs.readFileSync(readmePath, 'utf8');
}

// Update node count in README
const nodeCountRegex = /## Node Count\s*\*\*(\d+)\*\*/;
const newNodeCount = `## Node Count\n**${totalNodes}**`;

if (nodeCountRegex.test(readmeContent)) {
    readmeContent = readmeContent.replace(nodeCountRegex, newNodeCount);
} else {
    // Add node count section if it doesn't exist
    const communitySection = '## Community';
    if (readmeContent.includes(communitySection)) {
        readmeContent = readmeContent.replace(
            communitySection,
            `${communitySection}\n\n${newNodeCount}`
        );
    } else {
        // Add at the end if no community section
        readmeContent += `\n\n## Community\n\n${newNodeCount}\n`;
    }
}

// Save updated README
fs.writeFileSync(readmePath, readmeContent);

console.log(`Node count updated to: ${totalNodes}`);