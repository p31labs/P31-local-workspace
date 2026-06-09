# P31 Surrogate Backend - Star-Delta Boot Sequence

## Overview

This document provides the complete boot sequence for the P31 Surrogate Backend system, following the Star-Delta motor starter pattern to safely initialize all components in the correct order.

## Prerequisites

Before starting the boot sequence, ensure you have:

1. **Backend Dependencies Installed:**
   ```bash
   # Install Python dependencies
   pip install -r p31-surrogate-backend/requirements.txt
   
   # Install Node.js dependencies
   npm install
   
   # Install frontend dependencies
   cd software/frontend && npm install
   ```

2. **Environment Configuration:**
   - Redis server running on localhost:6379
   - LiteLLM proxy configured and accessible
   - All required environment variables set

## Boot Sequence

### Phase 1: Memory Mesh Initialization (Star Configuration)

**Terminal 1: Redis Memory Mesh**
```bash
# Start Redis server for memory mesh
redis-server

# Verify Redis is running
redis-cli ping
# Expected response: PONG
```

### Phase 2: Reference Frame Independence (Local Proxy)

**Terminal 2: LiteLLM Proxy**
```bash
# Start local LLM proxy for reference frame independence
litellm --model ollama/llama3 --port 4000

# Verify proxy is running
curl http://localhost:4000/v1/models
```

### Phase 3: Cognitive Shield & Bridge (Delta Configuration)

**Terminal 3: Cognitive Shield & WebSocket Bridge**
```bash
# Navigate to backend directory
cd p31-surrogate-backend

# Start Catcher's Mitt middleware
python src/shield/catchers_mitt.py &

# Start Redis-to-WebSocket bridge
node src/shield/redis_ws_bridge.js

# Verify both services are running
# Check logs for "Catcher's Mitt Initialized" and "P31 Bridge: Listening"
```

### Phase 4: Sovereign Vault APIs

**Terminal 4: Sovereign Vault APIs**
```bash
# Start the sovereign vault API server
# (Assuming you have wrapped the init_pglite.js and routers in a FastAPI/Express server)

# For Python FastAPI:
uvicorn src.main:app --port 8000

# For Node.js Express:
node src/server.js

# Verify API is running
curl http://localhost:8000/health
```

### Phase 5: Z-Index Cockpit Interface

**Terminal 5: Frontend Cockpit**
```bash
# Navigate to frontend directory
cd software/frontend

# Start the Z-Index Cockpit
npm run dev

# Verify frontend is running
# Open browser to http://localhost:3000
```

## Verification Steps

After completing all phases, verify the system is fully operational:

### 1. System Health Check
```bash
# Check all services are running
curl http://localhost:8000/health
curl http://localhost:4000/v1/models
curl http://localhost:3000/api/health
```

### 2. WebSocket Connection Test
```bash
# Test WebSocket connection
wscat -c ws://localhost:8031/ws
# Should connect successfully
```

### 3. Redis Stream Verification
```bash
# Check Redis streams
redis-cli XLEN incoming_comms
redis-cli XLEN sanitized_comms
# Both should show stream lengths > 0 after processing
```

### 4. Frontend State Verification
Open http://localhost:3000 and verify:
- Cockpit interface loads successfully
- Voltage display shows initial value (50%)
- WebSocket connection indicator shows connected
- No error messages in browser console

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Ensure Redis server is running
   - Check Redis URL in .env files
   - Verify Redis port (default: 6379)

2. **LiteLLM Proxy Not Responding**
   - Verify Ollama is running with llama3 model
   - Check proxy port configuration
   - Ensure model is available

3. **WebSocket Connection Failed**
   - Verify Redis-to-WebSocket bridge is running
   - Check WebSocket port (default: 8031)
   - Ensure no firewall blocking the port

4. **Frontend Not Loading**
   - Check if API server is running on port 8000
   - Verify frontend dependencies are installed
   - Check browser console for errors

### Service Status Commands

```bash
# Check Redis status
redis-cli ping

# Check if ports are in use
netstat -an | grep :6379  # Redis
netstat -an | grep :4000  # LiteLLM
netstat -an | grep :8000  # API
netstat -an | grep :8031  # WebSocket
netstat -an | grep :3000  # Frontend

# Check process status
ps aux | grep redis
ps aux | grep litellm
ps aux | grep python
ps aux | grep node
```

## Shutdown Sequence

To properly shutdown the system:

1. **Frontend:** Ctrl+C in Terminal 5
2. **API Server:** Ctrl+C in Terminal 4
3. **WebSocket Bridge:** Ctrl+C in Terminal 3
4. **Catcher's Mitt:** Ctrl+C in Terminal 3
5. **LiteLLM Proxy:** Ctrl+C in Terminal 2
6. **Redis:** Ctrl+C in Terminal 1 or `redis-cli shutdown`

## Production Deployment

For production deployment, consider:

1. **Process Management:** Use systemd, PM2, or Docker Compose
2. **Environment Variables:** Use proper secrets management
3. **Monitoring:** Add health checks and logging
4. **Load Balancing:** Consider multiple instances for high availability
5. **Security:** Implement proper authentication and authorization

## Next Steps

Once the system is booting successfully:

1. Test the complete data flow from input to output
2. Verify the Cognitive Shield is processing messages correctly
3. Test Fawn Guard activation with high-voltage signals
4. Validate the Spoon Economy tracking
5. Run integration tests if available

## Support

For additional support or issues:
- Check the project documentation
- Review the error logs from each service
- Verify all dependencies are properly installed
- Ensure all environment variables are correctly configured