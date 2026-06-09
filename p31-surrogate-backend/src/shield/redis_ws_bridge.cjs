#!/usr/bin/env node
/**
 * P31 Surrogate Backend - Redis to WebSocket Bridge
 * ===================================================
 * 
 * Bridges Redis Stream data to WebSocket clients for real-time frontend updates.
 * This middleware connects the Catcher's Mitt Redis Stream to the React frontend.
 * 
 * Usage: node src/shield/redis_ws_bridge.cjs
 * Requires: npm install ioredis ws
 * 
 * Author: P31 Labs
 * License: MIT
 */

const Redis = require('ioredis');
const WebSocket = require('ws');
const crypto = require('crypto');

// Security: Token-based handshake for local authentication
const VALID_TOKENS = new Set([
    process.env.WS_AUTH_TOKEN || 'p31-local-secret-token-change-in-prod'
]);

function authenticateClient(url) {
    // Parse token from query string: ws://localhost:8031/ws?token=xxx
    try {
        const urlObj = new URL(url);
        const token = urlObj.searchParams.get('token');
        if (token && VALID_TOKENS.has(token)) {
            return true;
        }
    } catch (e) {
        // Invalid URL parsing
    }
    return false;
}

// Initialize Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    retryStrategy: (times) => Math.min(times * 50, 2000)
});

// Initialize WebSocket server
const wss = new WebSocket.Server({ 
    port: parseInt(process.env.WEBSOCKET_PORT || '8031', 10)
});

console.log('🔺 P31 Bridge: Listening on ws://localhost:8031/ws');
console.log('📡 Redis Stream: sanitized_comms');

// Track last message ID for stream polling
let lastMessageId = '$';

/**
 * Poll Redis Stream for new messages and broadcast to WebSocket clients
 */
async function pollRedisStream() {
    console.log('📡 Starting Redis Stream polling...');
    
    while (true) {
        try {
            // Block read from stream - waits up to 1 second for new messages
            const messages = await redis.xread('BLOCK', 1000, 'STREAMS', 'sanitized_comms', lastMessageId);
            
            if (messages && messages.length > 0) {
                for (const stream of messages) {
                    const streamName = stream[0];
                    const events = stream[1];
                    
                    console.log(`📥 Received ${events.length} new messages from ${streamName}`);
                    
                    for (const event of events) {
                        const msgId = event[0];
                        const fields = event[1];
                        
                        // Find the payload field (stored as key-value pairs in stream)
                        let payloadStr = null;
                        for (let i = 0; i < fields.length; i += 2) {
                            if (fields[i] === 'payload') {
                                payloadStr = fields[i + 1];
                                break;
                            }
                        }
                        
                        // Update last processed ID
                        lastMessageId = msgId;
                        
                        if (payloadStr) {
                            try {
                                const payload = JSON.parse(payloadStr);
                                
                                // Broadcast to all connected React clients
                                const clientCount = wss.clients.size;
                                if (clientCount > 0) {
                                    const broadcastData = JSON.stringify({
                                        type: 'sanitized_message',
                                        data: payload,
                                        timestamp: Date.now(),
                                        message_id: msgId
                                    });
                                    
                                    wss.clients.forEach(client => {
                                        if (client.readyState === WebSocket.OPEN) {
                                            client.send(broadcastData);
                                        }
                                    });
                                    
                                    console.log(`📤 Broadcasted message ${msgId} to ${clientCount} client(s)`);
                                }
                            } catch (parseError) {
                                console.error('❌ JSON parse error:', parseError.message);
                            }
                        }
                    }
                }
            }
            
        } catch (error) {
            console.error('🔴 Redis poll error:', error.message);
            
            // Reconnect on connection error
            if (error.message.includes('ECONNREFUSED')) {
                console.log('⏳ Reconnecting to Redis...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        // Brief delay to prevent CPU spinning
        await new Promise(resolve => setTimeout(resolve, 10));
    }
}

// WebSocket connection handling - NOW WITH AUTHENTICATION
wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    const authResult = authenticateClient(req.url);
    
    if (!authResult) {
        console.log(`🚫 REJECTED unauthenticated connection from ${clientIp}`);
        ws.close(4001, 'Unauthorized: Valid token required');
        return;
    }
    
    console.log(`✅ AUTHENTICATED client connected from ${clientIp}`);
    
    ws.on('close', () => {
        console.log('❌ Client disconnected from P31 Bridge');
    });
    
    ws.on('error', (error) => {
        console.error('🔴 WebSocket error:', error.message);
    });
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
    console.log('\n🛑 P31 Bridge shutting down...');
    await redis.quit();
    wss.close(() => {
        console.log('✅ WebSocket server closed');
        process.exit(0);
    });
});

// Start the bridge
console.log('🚀 Starting P31 Bridge...');
pollRedisStream().catch((error) => {
    console.error('💥 P31 Bridge failed to start:', error);
    process.exit(1);
});