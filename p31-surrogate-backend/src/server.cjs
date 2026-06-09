/**
 * P31 Surrogate Backend — Entry Point
 * 
 * Redis WebSocket Bridge Server
 * Bridges Catcher's Mitt signals from Redis to WebSocket clients
 * 
 * Author: P31 Labs
 * License: MIT
 */

const WebSocket = require('ws');
const Redis = require('ioredis');

// ═══════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {
  port: parseInt(process.env.WS_PORT || '8080', 10),
  redisHost: process.env.REDIS_HOST || '127.0.0.1',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  channel: process.env.REDIS_CHANNEL || 'p31:catchers_mitt',
  mockMode: process.env.MOCK_REDIS === 'true' || process.env.MOCK_MODE === 'true'
};

// ═══════════════════════════════════════════════════════════════════
// Redis Client (or Mock)
// ═══════════════════════════════════════════════════════════════════

let redis;
let isMock = false;

if (CONFIG.mockMode) {
  console.log('🔶 Running in MOCK MODE — Redis disabled');
  isMock = true;
} else {
  try {
    redis = new Redis({
      host: CONFIG.redisHost,
      port: CONFIG.redisPort,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`Redis reconnecting in ${delay}ms...`);
        return delay;
      },
      maxRetriesPerRequest: 3
    });
    
    redis.on('connect', () => {
      console.log(`✅ Connected to Redis at ${CONFIG.redisHost}:${CONFIG.redisPort}`);
    });
    
    redis.on('error', (err) => {
      console.warn('⚠️ Redis error:', err.message);
    });
  } catch (err) {
    console.warn('⚠️ Failed to initialize Redis, running in mock mode:', err.message);
    isMock = true;
  }
}

// ═══════════════════════════════════════════════════════════════════
// WebSocket Server
// ═══════════════════════════════════════════════════════════════════

const wss = new WebSocket.Server({ port: CONFIG.port });

console.log(`🚀 P31 WebSocket Bridge running on port ${CONFIG.port}`);
console.log(`📡 Listening on channel: ${CONFIG.channel}`);

wss.on('connection', (ws) => {
  console.log('🔗 Client connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleClientMessage(ws, data);
    } catch (err) {
      console.warn('⚠️ Invalid message:', err.message);
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 Client disconnected');
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to P31 WebSocket Bridge',
    mockMode: isMock,
    timestamp: new Date().toISOString()
  }));
});

function handleClientMessage(ws, data) {
  console.log('📥 Client message:', data.type);
  
  if (data.type === 'ping') {
    ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
  }
  
  if (data.type === 'subscribe') {
    // Client subscribing to a channel
    console.log(`📥 Client subscribed to: ${data.channel}`);
    ws.send(JSON.stringify({ 
      type: 'subscribed', 
      channel: data.channel,
      timestamp: new Date().toISOString()
    }));
  }
}

// ═══════════════════════════════════════════════════════════════════
// Redis Subscription (or Mock Loop)
// ═══════════════════════════════════════════════════════════════════

if (!isMock && redis) {
  // Subscribe to Catcher's Mitt channel
  const subscriber = redis.duplicate();
  
  subscriber.on('message', (channel, message) => {
    if (channel === CONFIG.channel) {
      try {
        const signal = JSON.parse(message);
        broadcastSignal(signal);
      } catch (err) {
        console.warn('⚠️ Invalid signal JSON:', err.message);
      }
    }
  });
  
  subscriber.subscribe(CONFIG.channel).then(() => {
    console.log(`📡 Subscribed to ${CONFIG.channel}`);
  }).catch(err => {
    console.warn('⚠️ Failed to subscribe:', err.message);
  });
} else {
  // Mock mode: simulate signals
  console.log('🔶 Starting mock signal generation...');
  setInterval(() => {
    const mockSignal = generateMockSignal();
    broadcastSignal(mockSignal);
  }, 10000); // Every 10 seconds
}

function generateMockSignal() {
  const tiers = ['LOW', 'MODERATE', 'HIGH'];
  const tier = tiers[Math.floor(Math.random() * tiers.length)];
  const voltageScore = tier === 'LOW' ? Math.floor(Math.random() * 30) :
                      tier === 'MODERATE' ? 30 + Math.floor(Math.random() * 40) :
                      70 + Math.floor(Math.random() * 30);
  
  return {
    message_id: `mock_${Date.now()}`,
    bluf_summary: 'Mock signal for testing',
    voltage_score: voltageScore,
    tier: tier,
    raw_sequestered: tier === 'HIGH',
    timestamp: new Date().toISOString()
  };
}

function broadcastSignal(signal) {
  const message = JSON.stringify({
    type: 'catchers_mitt',
    data: signal,
    timestamp: new Date().toISOString()
  });
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  
  console.log(`📡 Broadcast: [${signal.tier}] voltage=${signal.voltage_score}`);
}

// ═══════════════════════════════════════════════════════════════════
// Graceful Shutdown
// ═══════════════════════════════════════════════════════════════════

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  wss.close(() => {
    if (redis) redis.quit();
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  wss.close(() => {
    if (redis) redis.quit();
    process.exit(0);
  });
});
