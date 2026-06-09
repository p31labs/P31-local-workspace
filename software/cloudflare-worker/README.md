# P31 Mesh Discord Worker

A Cloudflare Worker that serves as the Discord Interactions endpoint for the P31 Labs quantum mesh network, providing real-time telemetry and command capabilities for the digital egg hunt.

## Features

- **Discord Slash Commands**: Real-time mesh status, spoon economy monitoring, and ARK access control
- **KV Integration**: Seamless integration with Cloudflare KV for persistent state management
- **Cryptographic Verification**: Secure Discord signature verification using Ed25519
- **Multi-Environment Support**: Development, staging, and production configurations

## Commands

### `/ping-mesh`
Check the current status of the quantum mesh network and K4 tetrahedron completion.

### `/spoon-check [user]`
Monitor the metabolic load (spoon count) of specific nodes to prevent cognitive overload.

### `/ground-status`
Get detailed phase information and target location status.

### `/ark-access`
Check if ARK access is available (requires K4 tetrahedron completion).

### `/ark-download`
Download Node One CAD files and documentation (requires K4 tetrahedron completion).

## Setup Instructions

### 1. Create KV Namespace
```bash
npx wrangler kv:namespace create "P31_MESH_STATE"
```

### 2. Add Environment Variables
```bash
# Discord credentials
npx wrangler secret put DISCORD_PUBLIC_KEY
npx wrangler secret put DISCORD_CLIENT_ID
npx wrangler secret put DISCORD_BOT_TOKEN

# KV namespace ID
npx wrangler secret put P31_MESH_STATE_ID
```

### 3. Register Discord Commands
```bash
# Set environment variables
export DISCORD_CLIENT_ID="your_client_id"
export DISCORD_GUILD_ID="your_guild_id"
export DISCORD_BOT_TOKEN="your_bot_token"

# Register commands
node register-commands.js register
```

### 4. Deploy Worker
```bash
# Development
npx wrangler dev

# Production
npx wrangler publish
```

## KV Schema

### Node Data
```javascript
{
  "user_id": "string",
  "status": "transit|grounded|locked",
  "frequency": 0,
  "lat": null,
  "lon": null,
  "spoon_count": 100,
  "last_update": "timestamp"
}
```

### Edge Data
```javascript
[
  { "from": "user_id_A", "to": "user_id_B", "timestamp": "timestamp" },
  // ... up to 6 edges for K4 tetrahedron
]
```

### Mesh Status
```javascript
{
  "phase": "superposition|measurement|triadic_closure|payload",
  "active_nodes": 0,
  "completed_edges": 0,
  "target_location": {
    "name": "Pablo Creek Quasicrystal",
    "lat": 30.3322,
    "lon": -81.4700,
    "radius_meters": 50
  }
}
```

## Development

### Local Testing
```bash
# Start development server
npx wrangler dev

# Test Discord interactions locally using ngrok
ngrok http 8787
```

### Command Management
```bash
# List current commands
node register-commands.js list

# Delete all commands
node register-commands.js delete

# Reset commands (delete + register)
node register-commands.js reset
```

## Security

- All Discord requests are verified using Ed25519 signatures
- KV namespace access is restricted to the worker environment
- No sensitive data is logged or exposed in responses
- Spoon economy monitoring includes Fawn Guard activation for cognitive protection

## Monitoring

The worker provides real-time telemetry through Discord commands:
- Mesh topology status (WYE → TRANSIT → DELTA)
- Active node count and edge completion
- Metabolic load monitoring with automatic warnings
- Phase progression tracking

## Integration Points

- **BONDING PWA**: Updates KV state during physical convergence
- **Node One Hardware**: Reports frequency and location data
- **L.O.V.E. Ledger**: Triggers token distribution on K4 completion
- **Supertonk Platform**: Coordinates financial and community aspects

## Troubleshooting

### Common Issues

1. **Signature Verification Failed**: Check DISCORD_PUBLIC_KEY is correctly set
2. **KV Access Denied**: Verify P31_MESH_STATE_ID is properly configured
3. **Commands Not Appearing**: Ensure bot has `applications.commands` scope and is in the guild

### Debug Mode
Set `ENVIRONMENT=development` to enable additional logging and error details.

## License

MIT License - See LICENSE file for details.