#!/usr/bin/env node

/**
 * Process Ko-fi payment data and update user registry
 * This script is called by the GitHub Action workflow
 */

const fs = require('fs');
const path = require('path');

// Get the payload from GitHub Actions environment
const payload = JSON.parse(process.env.GITHUB_EVENT_PATH ? 
    fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8') : 
    '{}');

const userData = payload.client_payload?.user;
const actions = payload.client_payload?.actions;

if (!userData) {
    console.error('No user data found in payload');
    process.exit(1);
}

console.log(`Processing payment for: ${userData.name}`);
console.log(`Tier: ${userData.tier}`);
console.log(`Amount: ${userData.amount} ${userData.currency}`);

// Load existing user registry
const registryPath = path.join(__dirname, '..', '..', 'user-registry.json');
let registry = {};

if (fs.existsSync(registryPath)) {
    try {
        registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    } catch (error) {
        console.error('Error reading user registry:', error);
        registry = {};
    }
}

// Process user data
const userId = userData.discordId || userData.email;
if (!registry[userId]) {
    registry[userId] = {
        name: userData.name,
        email: userData.email,
        discordId: userData.discordId,
        p31Wallet: userData.p31Wallet,
        joinDate: new Date().toISOString(),
        payments: [],
        karma: 0,
        spoons: 0,
        nodeCount: 0,
        tier: 'Supporter',
        totalSupport: 0
    };
}

// Add payment record
const paymentRecord = {
    id: userData.kofiId,
    amount: userData.amount,
    currency: userData.currency,
    tier: userData.tier,
    timestamp: userData.timestamp,
    message: userData.message
};

registry[userId].payments.push(paymentRecord);
registry[userId].totalSupport += userData.amount;

// Update tier based on total support
const totalSupport = registry[userId].totalSupport;
if (totalSupport >= 500) {
    registry[userId].tier = 'Core Team';
} else if (totalSupport >= 200) {
    registry[userId].tier = 'Guild Leader';
} else if (totalSupport >= 50) {
    registry[userId].tier = 'Node';
} else {
    registry[userId].tier = 'Supporter';
}

// Apply actions
if (actions && Array.isArray(actions)) {
    actions.forEach(action => {
        if (action.type === 'UPDATE_USER_STATUS') {
            switch (action.operation) {
                case 'ADD_NODE':
                    registry[userId].nodeCount += 1;
                    registry[userId].karma += 10;
                    break;
                case 'PROMOTE_TO_GUILD_LEADER':
                    registry[userId].nodeCount += 5;
                    registry[userId].karma += 100;
                    break;
                case 'PROMOTE_TO_CORE_TEAM':
                    registry[userId].nodeCount += 10;
                    registry[userId].karma += 500;
                    break;
            }
        }
    });
}

// Save updated registry
try {
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
    console.log('User registry updated successfully');
} catch (error) {
    console.error('Error writing user registry:', error);
    process.exit(1);
}

// Output results for GitHub Actions
console.log(`::set-output name=payment_processed::true`);
console.log(`::set-output name=user_id::${userId}`);
console.log(`::set-output name=new_tier::${registry[userId].tier}`);
console.log(`::set-output name=node_count::${registry[userId].nodeCount}`);
console.log(`::set-output name=karma::${registry[userId].karma}`);