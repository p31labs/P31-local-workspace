# P31 Q-Suite: Quantum User Testing Suite Documentation

## Overview

The P31 Q-Suite is a comprehensive testing framework designed to find and fix race conditions in the Spoons economy system. It implements a "Double Agent Parallel Path Quantum User Testing" methodology that executes two contradictory testing states simultaneously to force the system to reconcile overlapping realities.

## Architecture

### Dual Agent Methodology

The Q-Suite employs two specialized testing agents:

#### Agent RED (Headless Chaos Node)
- **Vector**: Direct API hits to `http://localhost:3001/api/shelter/brain/expend`
- **Target**: Backend Spoons economy and Upstash Redis
- **Objective**: Break the Spoons Economy via Async Race Conditions
- **Method**: Fires overlapping asynchronous requests at millisecond intervals

#### Agent BLUE (Headed Empathy Node)  
- **Vector**: Playwright automated UI testing (Android Tablet / 3G Network speeds)
- **Target**: p31.ui and Discord UX
- **Objective**: Simulate neurodivergent users with motor tics and cognitive load
- **Method**: Tests double-clicks, cognitive load limits, and somatic visual feedback

## Components

### 1. Backend API (`spoons_api.py`)

**Purpose**: Implements the `/api/shelter/brain/expend` endpoint with race condition protection.

**Key Features**:
- Atomic Lua script execution in Redis
- Idempotency key system (5-second TTL)
- Medical safety hard-stop at 0 spoons (21 CFR §890.3710)
- FastAPI with comprehensive error handling

**Endpoints**:
- `GET /health` - Health check
- `GET /spoons/{fingerprint_hash}` - Get current spoons
- `PATCH /api/shelter/brain/expend` - Expend spoons (protected)
- `POST /spoons/reset/{fingerprint_hash}` - Reset for testing
- `DELETE /spoons/clear/{fingerprint_hash}` - Clear user data

### 2. Agent RED (`qsuite_agent_red.py`)

**Purpose**: Backend race condition testing with chaos engineering principles.

**Test Scenarios**:
1. **Quantum Double Tap**: Simulates 20ms double-clicks
2. **Rapid Fire Stress Test**: 100+ simultaneous requests
3. **Interleaved Read-Write**: Classic race condition simulation
4. **Idempotency Protection**: Verifies duplicate request handling

**Key Metrics**:
- Response times under load
- Spoon deduction accuracy
- Race condition detection
- System resilience

### 3. Agent BLUE (`qsuite_agent_blue.py`)

**Purpose**: UI empathy testing for neurodivergent user scenarios.

**Test Scenarios**:
1. **Double-Click Scenario**: Motor tic simulation on slow networks
2. **Cognitive Load**: Multiple rapid actions under pressure
3. **Phantom Haptic**: UI/backend synchronization testing
4. **Somatic Visual Feedback**: State consistency verification

**Key Metrics**:
- UI/API consistency
- Visual feedback accuracy
- Network resilience
- User experience quality

### 4. Test Runner (`run_q_suite.py`)

**Purpose**: Orchestrates complete Q-Suite execution and analysis.

**Features**:
- Sequential execution of both agents
- Cross-phase vulnerability analysis
- Comprehensive reporting
- Compliance verification

## Race Condition Protection: The Resin

### Atomic Lua Script

The core protection mechanism is an atomic Lua script executed within Redis:

```lua
-- ATOMIC_SPOON_DEDUCTION
-- 1. Check Idempotency (Did they double click in the last 5 seconds?)
-- 2. Lock the idempotency key for 5 seconds  
-- 3. Check Spoons Capacity
-- 4. Safely deduct and return new balance
```

### Protection Layers

1. **Idempotency Keys**: Prevent duplicate requests within 5-second window
2. **Atomic Operations**: Single Redis transaction prevents race conditions
3. **Medical Hard-Stop**: System halts at 0 spoons (21 CFR §890.3710 compliance)
4. **Rate Limiting**: Additional protection against abuse

## Usage

### Prerequisites

```bash
# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers (for Agent BLUE)
playwright install
```

### Running the Complete Suite

```bash
# Basic usage
python run_q_suite.py

# Custom endpoints
python run_q_suite.py --api-url http://your-api:3001 --ui-url http://your-ui:3000

# Skip UI testing
python run_q_suite.py --no-ui
```

### Running Individual Agents

```bash
# Agent RED only
python qsuite_agent_red.py

# Agent BLUE only  
python qsuite_agent_blue.py
```

### Running the Backend API

```bash
# Start the API server
python spoons_api.py

# Or with uvicorn
uvicorn spoons_api:app --host 0.0.0.0 --port 3001 --reload
```

## Test Results Interpretation

### Agent RED Results

- **PASS**: All race condition protections working
- **CRITICAL**: Spoons went below 0 (medical safety violation)
- **WARNING**: Potential race conditions detected

### Agent BLUE Results

- **PASS**: All UI empathy protections working
- **CRITICAL**: UI/API inconsistencies
- **WARNING**: Phantom haptic issues

### Compliance Status

- **✅ PASS**: ISO 13485:2016 and 21 CFR §890.3710 compliance
- **⚠️ ISSUES**: Review and address detected vulnerabilities

## Medical Safety Compliance

### 21 CFR §890.3710 Hard-Stop

The system enforces a strict 0-spoon minimum to prevent cognitive overload:

```python
if current_spoons <= 0:
    return {err = "CLINICAL_HALT", spoons = 0}
```

### ISO 13485:2016 Post-Market Clinical Follow-up

The Q-Suite provides continuous monitoring and validation of the medical device software.

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**: Ensure Redis is running and accessible
2. **Playwright Not Installed**: Run `playwright install`
3. **API Not Responding**: Check if backend server is running on correct port
4. **UI Tests Failing**: Verify UI is accessible at specified URL

### Debug Mode

Enable debug logging:

```python
logging.basicConfig(level=logging.DEBUG)
```

### Manual Testing

Test the API endpoint directly:

```bash
curl -X PATCH http://localhost:3001/api/shelter/brain/expend \
  -H "Content-Type: application/json" \
  -d '{"fingerprint_hash": "test_user", "action_type": "POSNER_VOTE"}'
```

## Security Considerations

### Idempotency Key Security

- Keys are UUID4-based for uniqueness
- 5-second TTL prevents replay attacks
- Keys are namespaced by user fingerprint

### Rate Limiting

- Built-in protection against rapid-fire requests
- Additional middleware can be added for production

### Data Privacy

- Test data is isolated and temporary
- Production deployments should use separate Redis instances

## Integration with Existing Systems

### Discord Integration

The system can be extended to work with Discord bot interactions:

```python
# Discord button click handler
@app.post("/discord/button/click")
async def discord_button_click(interaction_id: str, user_id: str):
    # Generate idempotency key from interaction_id
    # Call expend_spoons with proper context
    pass
```

### Frontend Integration

Frontend applications should:

1. Generate unique idempotency keys for each user action
2. Handle `CLINICAL_HALT` responses gracefully
3. Display appropriate feedback for `IDEMPOTENT_REJECT`
4. Implement retry logic for network failures

## Future Enhancements

### Planned Features

1. **WebSocket Integration**: Real-time spoon updates
2. **Multi-Region Support**: Distributed Redis clusters
3. **Advanced Analytics**: Spoon usage patterns and insights
4. **Machine Learning**: Adaptive rate limiting and protection

### Performance Optimization

1. **Connection Pooling**: Optimize Redis connections
2. **Caching**: Add application-level caching for frequently accessed data
3. **Load Balancing**: Distribute load across multiple API instances

## Conclusion

The P31 Q-Suite provides comprehensive protection against race conditions in the Spoons economy system. By combining backend atomic operations with frontend empathy testing, it ensures both technical correctness and user experience quality while maintaining strict medical device compliance.

The "Resin" - our atomic Lua script - mathematically guarantees that spoons can never drop below zero, even under extreme load conditions. This protects neurodivergent users from cognitive overload while maintaining system integrity.

## Contact

For questions or support regarding the Q-Suite implementation:

- Review the source code comments for detailed explanations
- Check the test results for specific failure analysis
- Consult the medical device compliance documentation