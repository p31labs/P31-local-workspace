/**
 * Ko-fi to GitHub Integration Bridge
 * Serverless middleware for processing Ko-fi webhooks and updating GitHub repository
 * 
 * This middleware acts as the central nervous system connecting community monetization
 * (Ko-fi) with technical development (GitHub) and academic verification (Zenodo/ORCID)
 */

// Configuration - Environment Variables
const CONFIG = {
    // Ko-fi Configuration
    KOFI_VERIFICATION_TOKEN: process.env.KOFI_VERIFICATION_TOKEN,
    
    // GitHub Configuration  
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_REPO: process.env.GITHUB_REPO || 'p31labs/andromeda',
    GITHUB_OWNER: process.env.GITHUB_OWNER || 'p31labs',
    
    // Discord Integration
    DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
    RATE_LIMIT_MAX_REQUESTS: 100,
    
    // Validation Rules
    VALID_TIER_TYPES: ['Supporter', 'Node', 'Guild Leader', 'Core Team'],
    REQUIRED_FIELDS: ['message_id', 'amount', 'name', 'email']
};

/**
 * Main handler for Ko-fi webhook requests
 * Validates payload, processes user data, and triggers GitHub updates
 */
export async function handleKofiWebhook(request) {
    try {
        // 1. Validate HTTP Method and Headers
        if (request.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405 });
        }

        // 2. Extract and Validate Verification Token
        const incomingToken = request.headers.get('X-Ko-fi-Verification');
        if (!incomingToken || incomingToken !== CONFIG.KOFI_VERIFICATION_TOKEN) {
            console.error('Invalid Ko-fi verification token');
            return new Response('Unauthorized', { status: 401 });
        }

        // 3. Parse and Validate Payload
        const payload = await request.json();
        const validationResult = validateKofiPayload(payload);
        
        if (!validationResult.isValid) {
            console.error('Invalid payload:', validationResult.errors);
            return new Response('Bad Request', { status: 400 });
        }

        // 4. Process User Data and Determine Actions
        const userData = extractUserData(payload);
        const actions = determineActions(userData);

        // 5. Execute GitHub Repository Dispatch
        const dispatchResult = await dispatchToGitHub(userData, actions);
        
        if (!dispatchResult.success) {
            console.error('GitHub dispatch failed:', dispatchResult.error);
            return new Response('Internal Server Error', { status: 500 });
        }

        // 6. Update Discord Roles (if applicable)
        if (userData.discordId) {
            await updateDiscordRole(userData.discordId, userData.tier);
        }

        // 7. Return Success Response
        return new Response(JSON.stringify({
            success: true,
            message: 'Ko-fi integration successful',
            actions: actions,
            timestamp: new Date().toISOString()
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Ko-fi webhook processing failed:', error);
        return new Response('Internal Server Error', { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Validates the structure and content of incoming Ko-fi webhook payload
 */
function validateKofiPayload(payload) {
    const errors = [];

    // Check required fields
    CONFIG.REQUIRED_FIELDS.forEach(field => {
        if (!payload[field] || payload[field].trim() === '') {
            errors.push(`Missing required field: ${field}`);
        }
    });

    // Validate tier type
    if (payload.is_public && !CONFIG.VALID_TIER_TYPES.includes(payload.is_public)) {
        errors.push(`Invalid tier type: ${payload.is_public}`);
    }

    // Validate amount format
    if (payload.amount && isNaN(parseFloat(payload.amount))) {
        errors.push('Invalid amount format');
    }

    // Validate custom fields structure
    if (payload.custom_fields) {
        try {
            JSON.parse(payload.custom_fields);
        } catch (e) {
            errors.push('Invalid custom_fields JSON format');
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Extracts and normalizes user data from Ko-fi payload
 */
function extractUserData(payload) {
    const customFields = payload.custom_fields ? JSON.parse(payload.custom_fields) : {};
    
    return {
        kofiId: payload.message_id,
        name: payload.name,
        email: payload.email,
        amount: parseFloat(payload.amount),
        currency: payload.currency || 'USD',
        tier: payload.is_public || 'Supporter',
        timestamp: payload.timestamp,
        message: payload.message || '',
        discordId: customFields.discord_id || null,
        p31Wallet: customFields.p31_wallet || null,
        nodeCount: customFields.node_count ? parseInt(customFields.node_count) : 0,
        spoons: customFields.spoons ? parseInt(customFields.spoons) : 0
    };
}

/**
 * Determines which actions need to be taken based on user data
 */
function determineActions(userData) {
    const actions = [];

    // Determine GitHub Actions to trigger
    if (userData.tier === 'Node') {
        actions.push({
            type: 'UPDATE_USER_STATUS',
            target: 'user-registry.json',
            operation: 'ADD_NODE',
            data: {
                discordId: userData.discordId,
                wallet: userData.p31Wallet,
                nodeCount: userData.nodeCount,
                karma: 0,
                spoons: userData.spoons
            }
        });
    }

    if (userData.tier === 'Guild Leader') {
        actions.push({
            type: 'UPDATE_USER_STATUS',
            target: 'user-registry.json',
            operation: 'PROMOTE_TO_GUILD_LEADER',
            data: {
                discordId: userData.discordId,
                wallet: userData.p31Wallet,
                nodeCount: userData.nodeCount + 5,
                karma: 100,
                spoons: userData.spoons
            }
        });
    }

    if (userData.tier === 'Core Team') {
        actions.push({
            type: 'UPDATE_USER_STATUS',
            target: 'user-registry.json',
            operation: 'PROMOTE_TO_CORE_TEAM',
            data: {
                discordId: userData.discordId,
                wallet: userData.p31Wallet,
                nodeCount: userData.nodeCount + 10,
                karma: 500,
                spoons: userData.spoons
            }
        });
    }

    // Add Discord role update action
    if (userData.discordId) {
        actions.push({
            type: 'UPDATE_DISCORD_ROLE',
            target: 'discord',
            operation: 'ASSIGN_ROLE',
            data: {
                userId: userData.discordId,
                role: mapTierToDiscordRole(userData.tier)
            }
        });
    }

    return actions;
}

/**
 * Maps P31 tier to Discord role names
 */
function mapTierToDiscordRole(tier) {
    const roleMap = {
        'Supporter': 'Supporter',
        'Node': 'Node Member',
        'Guild Leader': 'Guild Leader',
        'Core Team': 'Core Team'
    };
    return roleMap[tier] || 'Supporter';
}

/**
 * Dispatches repository event to GitHub Actions
 */
async function dispatchToGitHub(userData, actions) {
    try {
        const dispatchPayload = {
            event_type: 'kofi_payment_received',
            client_payload: {
                user: userData,
                actions: actions,
                timestamp: new Date().toISOString()
            }
        };

        const response = await fetch(
            `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/dispatches`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dispatchPayload)
            }
        );

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }

        return { success: true };
    } catch (error) {
        return { 
            success: false, 
            error: error.message 
        };
    }
}

/**
 * Updates Discord role for user via Discord API
 */
async function updateDiscordRole(discordId, tier) {
    if (!discordId || !CONFIG.DISCORD_BOT_TOKEN) {
        return;
    }

    try {
        const roleId = getDiscordRoleId(tier);
        const guildId = process.env.DISCORD_GUILD_ID;

        const response = await fetch(
            `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}/roles/${roleId}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bot ${CONFIG.DISCORD_BOT_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            console.error('Discord role update failed:', response.status);
        }
    } catch (error) {
        console.error('Discord API error:', error);
    }
}

/**
 * Gets Discord role ID based on tier
 */
function getDiscordRoleId(tier) {
    const roleIds = {
        'Supporter': process.env.DISCORD_ROLE_SUPPORTER_ID,
        'Node': process.env.DISCORD_ROLE_NODE_ID,
        'Guild Leader': process.env.DISCORD_ROLE_GUILD_LEADER_ID,
        'Core Team': process.env.DISCORD_ROLE_CORE_TEAM_ID
    };
    return roleIds[tier] || roleIds['Supporter'];
}

/**
 * Rate limiting middleware
 */
const rateLimit = new Map();

function checkRateLimit(ip) {
    const now = Date.now();
    const windowStart = now - CONFIG.RATE_LIMIT_WINDOW_MS;
    
    if (!rateLimit.has(ip)) {
        rateLimit.set(ip, []);
    }
    
    const requests = rateLimit.get(ip).filter(timestamp => timestamp > windowStart);
    
    if (requests.length >= CONFIG.RATE_LIMIT_MAX_REQUESTS) {
        return false;
    }
    
    requests.push(now);
    rateLimit.set(ip, requests);
    return true;
}

// Export for Cloudflare Workers
export default {
    async fetch(request, env) {
        // Set environment variables from bindings
        Object.keys(CONFIG).forEach(key => {
            if (env[key]) {
                CONFIG[key] = env[key];
            }
        });

        // Check rate limiting
        const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
        if (!checkRateLimit(clientIP)) {
            return new Response('Rate Limit Exceeded', { status: 429 });
        }

        return handleKofiWebhook(request);
    }
};