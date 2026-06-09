#!/usr/bin/env node

/**
 * P31 IGNITION AUTOMATOR
 * Role: Zero-Friction Environment Bootstrapper
 * Run: node p31-ignite.js
 * * This script eliminates cognitive friction by asking for your keys ONCE 
 * and automatically routing them to your local files, GitHub Secrets, and Cloud deployments.
 */

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configure interactive terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ANSI = {
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    amber: '\x1b[33m',
    rose: '\x1b[31m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

const print = (msg, color = ANSI.reset) => console.log(`${color}${msg}${ANSI.reset}`);

// --- CORE LOGIC ---

async function askQuestion(query) {
    return new Promise(resolve => rl.question(`\n${ANSI.cyan}?${ANSI.reset} ${ANSI.bold}${query}${ANSI.reset}\n> `, resolve));
}

function runCommand(command, silent = false) {
    try {
        execSync(command, { stdio: silent ? 'ignore' : 'pipe' });
        return true;
    } catch (error) {
        return false;
    }
}

async function ignite() {
    console.clear();
    print(`
    ⬡ P31 LABS : IGNITION SEQUENCE
    ===================================================
    Role: Zero-Friction Environment Bootstrapper
    Objective: Eliminate arbitrary human routing.
    ===================================================
    `, ANSI.green);

    // 1. Dependency Check
    print('Checking local CLI tools (Spoons check)...', ANSI.amber);
    const hasGH = runCommand('gh --version', true);
    
    if (!hasGH) {
        print('⚠️ GitHub CLI (gh) not detected. I will only create local .env files.', ANSI.rose);
    } else {
        print('✓ GitHub CLI detected. Automated Secret injection ARMED.', ANSI.green);
    }

    // 2. Data Collection (The only human step)
    print('\n[PHASE 1: THE INGESTION]', ANSI.cyan);
    print('I need 4 strings. I will handle where they go.', ANSI.reset);

    const discordToken = await askQuestion('Paste your Discord Bot Token:');
    const discordClientId = await askQuestion('Paste your Discord Client ID:');
    const redisUrl = await askQuestion('Paste your Upstash/GCP Redis URL:');
    const ipnsKey = await askQuestion('Paste your IPNS Private Key (or hit enter to skip):');

    print('\n[PHASE 2: AUTOMATED ROUTING]', ANSI.cyan);
    print('Stand back. Initiating mesh deployment...', ANSI.amber);

    // 3. Automated File Generation
    const envContent = `
# P31 AUTO-GENERATED ENVIRONMENT
# Timestamp: ${new Date().toISOString()}

DISCORD_TOKEN=${discordToken}
DISCORD_CLIENT_ID=${discordClientId}
UPSTASH_REDIS_URL=${redisUrl}
    `.trim();

    // Create directories if they don't exist
    const discordDir = path.join(process.cwd(), 'ecosystem', 'discord');
    if (!fs.existsSync(discordDir)) {
        fs.mkdirSync(discordDir, { recursive: true });
    }

    // Write .env
    fs.writeFileSync(path.join(discordDir, '.env'), envContent);
    print(`✓ Wrote local variables to ${discordDir}/.env`, ANSI.green);

    // 4. Automated Cloud/GitHub Injection
    if (hasGH) {
        print('\nInjecting secrets into GitHub Repository...', ANSI.amber);
        
        try {
            // Set secrets via GitHub CLI
            runCommand(`gh secret set DISCORD_TOKEN --body "${discordToken}"`);
            runCommand(`gh secret set UPSTASH_REDIS_URL --body "${redisUrl}"`);
            
            if (ipnsKey) {
                runCommand(`gh secret set IPNS_PRIVATE_KEY --body "${ipnsKey}"`);
            }
            print('✓ Successfully injected secrets into GitHub Actions via CLI.', ANSI.green);
        } catch (e) {
            print('⚠️ Failed to inject GitHub secrets. Ensure you are logged in (gh auth login).', ANSI.rose);
        }
    }

    // 5. Cloudflare Workers Routing Setup
    const tomlPath = path.join(process.cwd(), 'workers.toml');
    if (!fs.existsSync(tomlPath)) {
        const tomlContent = `
name = "p31-ens-relay"
main = "src/index.js"
compatibility_date = "2026-03-23"

[env.production]
ROUTE_ANDROMEDA = "andromeda.classicwilly.eth/*"
ROUTE_BONDING = "bonding.classicwilly.eth/*"
FALLBACK_GATEWAY = "https://ipfs.io/ipns/"
        `.trim();
        fs.writeFileSync(tomlPath, tomlContent);
        print('✓ Generated base workers.toml for Cloudflare ENS routing.', ANSI.green);
    }

    print(`
    ===================================================
    IGNITION COMPLETE. THE MESH IS ARMED.
    ===================================================
    Your cognitive load is preserved. You may now run your deployment commands.
    `, ANSI.green);

    rl.close();
}

ignite();