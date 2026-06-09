#!/usr/bin/env node

/**
 * Notify Discord about Ko-fi payments
 * Sends notifications to Discord channels about new supporters
 */

const fs = require('fs');
const path = require('path');

// Get payload from GitHub Actions
const payload = JSON.parse(process.env.GITHUB_EVENT_PATH ? 
    fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8') : 
    '{}');

const userData = payload.client_payload?.user;

if (!userData || !userData.discordId) {
    console.log('No Discord ID provided, skipping Discord notification');
    process.exit(0);
}

// Discord webhook configuration
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

if (!DISCORD_WEBHOOK_URL) {
    console.log('No Discord webhook URL configured, skipping Discord notification');
    process.exit(0);
}

// Create Discord embed message
const embed = {
    title: '🎉 New Supporter Alert!',
    description: `**${userData.name}** has joined the P31 community!`,
    color: 0x6366f1, // Indigo color
    fields: [
        {
            name: 'Support Level',
            value: userData.tier,
            inline: true
        },
        {
            name: 'Contribution',
            value: `$${userData.amount} ${userData.currency}`,
            inline: true
        },
        {
            name: 'Message',
            value: userData.message || 'No message provided',
            inline: false
        }
    ],
    timestamp: new Date().toISOString(),
    footer: {
        text: 'P31 Labs Community'
    }
};

// Send notification to Discord
async function sendDiscordNotification() {
    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                embeds: [embed]
            })
        });

        if (!response.ok) {
            throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
        }

        console.log('Discord notification sent successfully');
    } catch (error) {
        console.error('Failed to send Discord notification:', error);
    }
}

// Only send notification for significant contributions
if (userData.amount >= 10) {
    sendDiscordNotification();
} else {
    console.log('Contribution too small for Discord notification');
}