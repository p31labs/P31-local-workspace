# Spaceship Earth - Sovereign Mesh Synchronization Guide

## Overview

Phase 4: The Sovereign Mesh enables peer-to-peer synchronization of your PGLite ledger across multiple devices on your local network. This creates a distributed, offline-first state management system that maintains sovereignty while ensuring household consensus.

## Architecture Summary

```
Physical World                    Digital World (Multi-Device)
┌─────────────────┐               ┌─────────────────────────────────┐
│   ESP32 Beacon  │               │   Device 1 (Kitchen Tablet)     │
│   (iBeacon)     │  BLE Signal   │   - PGLite Ledger              │
│                 │ ────────────▶ │   - MeshSync Service           │
│   UUID:         │               │   - WebRTC DataChannels        │
│   12345678-...  │               └─────────────────────────────────┘
└─────────────────┘                            │
                                             │ WebRTC
┌─────────────────┐               ┌─────────────────────────────────┐
│   ESP32 Beacon  │               │   Device 2 (Dad Tablet)         │
│   (iBeacon)     │  BLE Signal   │   - PGLite Ledger              │
│                 │ ────────────▶ │   - MeshSync Service           │
│   UUID:         │               │   - WebRTC DataChannels        │
│   12345678-...  │               └─────────────────────────────────┘
└─────────────────┘                            │
                                             │ WebRTC
┌─────────────────┐               ┌─────────────────────────────────┐
│   ESP32 Beacon  │               │   Device 3 (Bash Tablet)        │
│   (iBeacon)     │  BLE Signal   │   - PGLite Ledger              │
│                 │ ────────────▶ │   - MeshSync Service           │
│   UUID:         │               │   - WebRTC DataChannels        │
│   12345678-...  │               └─────────────────────────────────┘
└─────────────────┘
                                             │
                                             ▼
                                    ┌─────────────────────────────────┐
                                    │   Cloudflare KV Relay           │
                                    │   (Signaling Only)             │
                                    │   - SDP Offer/Answer Exchange  │
                                    │   - ICE Candidate Relay        │
                                    │   - Peer Discovery             │
                                    └─────────────────────────────────┘
```

## Key Features

### ✅ Sovereign Architecture
- **No Cloud Database**: Pure P2P synchronization
- **Offline-First**: All devices work independently when disconnected
- **Local Network Only**: WebRTC connections stay within your LAN
- **Idempotent Operations**: `INSERT ON CONFLICT DO NOTHING` prevents merge conflicts

### ✅ Automatic Synchronization
- **Real-time Gossip**: Ledger entries broadcast to all peers immediately
- **State Recovery**: New devices sync full history from existing peers
- **Heartbeat Monitoring**: Automatic peer discovery and connection management
- **Conflict-Free**: Append-only ledger design eliminates merge conflicts

### ✅ Seamless Integration
- **Existing Infrastructure**: Works with your current PGLite persistence
- **Zustand Integration**: Automatic state updates across devices
- **WebRTC Native**: Browser-native peer-to-peer communication
- **Cloudflare KV**: Minimal signaling infrastructure (optional)

## Implementation Details

### 1. MeshSync Service (`meshSync.ts`)

The core synchronization engine that handles:

```typescript
// Key Components:
- WebRTC Peer Connections: Direct device-to-device communication
- WebSocket Signaling: CF KV relay for SDP exchange
- Gossip Protocol: Broadcast ledger entries to all peers
- Idempotent Inserts: Conflict-free database operations
- State Subscriptions: Real-time updates to Zustand stores
```

### 2. Integration Points

**Ledger Store Integration:**
```typescript
// Automatic synchronization when ledger entries are added
this.ledgerSubscription = useLedgerStore.subscribe(
  (state) => state.entries,
  (newEntries, oldEntries) => {
    // Broadcast new entries to all connected peers
    this.broadcastLedgerEntry(newEntry);
  }
);
```

**Zone Store Integration:**
```typescript
// Synchronize zone transitions and spatial state
this.zoneSubscription = useZoneStore.subscribe(
  (state) => ({ activeZoneId: state.activeZoneId, spatialState: state.spatialState }),
  (newState, oldState) => {
    // Broadcast zone changes to all peers
    this.broadcastZoneTransition(transition);
    this.broadcastZoneSnapshot(snapshot);
  }
);
```

### 3. Database Schema

Your existing PGLite schema is perfect for mesh synchronization:

```sql
-- Ledger (append-only, conflict-free)
CREATE TABLE ledger (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance INTEGER NOT NULL,
  reason TEXT NOT NULL,
  signature TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Zone Transitions (spatial state changes)
CREATE TABLE zone_transitions (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  zone_id TEXT NOT NULL,
  zone_name TEXT NOT NULL,
  transition_type TEXT NOT NULL,
  rssi INTEGER,
  beacon_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Zone Snapshots (spatial state persistence)
CREATE TABLE zone_snapshots (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  active_zone_id TEXT,
  current_level TEXT NOT NULL,
  camera_position TEXT NOT NULL,
  camera_target TEXT NOT NULL,
  zoom_level REAL NOT NULL,
  is_transitioning BOOLEAN NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

## Deployment Instructions

### 1. Enable Mesh Synchronization

Add the mesh sync service to your application initialization:

```typescript
// In your main App component or initialization file
import { meshSync } from './services/meshSync';

// Initialize mesh synchronization
useEffect(() => {
  meshSync.initialize().catch(console.error);
  
  return () => {
    meshSync.disconnect();
  };
}, []);
```

### 2. Add Mesh Status UI

Create a component to display mesh connection status:

```typescript
import { useMeshSync } from './services/meshSync';

function MeshStatus() {
  const { isInitialized, peerCount, connectionState, peers } = useMeshSync();
  
  return (
    <div className="mesh-status">
      <h3>Sovereign Mesh Status</h3>
      <p>Connection: {connectionState}</p>
      <p>Peers: {peerCount}</p>
      <div className="peer-list">
        {peers.map(peer => (
          <div key={peer.id} className={`peer ${peer.connectionState}`}>
            {peer.name} ({peer.connectionState})
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. Configure Signaling Server

The system uses Cloudflare KV as a signaling relay. You can:

**Option A: Use Public Relay (Recommended)**
```typescript
const meshSync = new MeshSyncService({
  signalingUrl: 'wss://p31-mesh-relay.workers.dev',
  enableRelay: true,
});
```

**Option B: Self-Hosted Signaling**
```typescript
const meshSync = new MeshSyncService({
  signalingUrl: 'ws://your-local-server:8080',
  enableRelay: true,
});
```

**Option C: Direct LAN Discovery (No Relay)**
```typescript
const meshSync = new MeshSyncService({
  enableRelay: false, // Devices must know each other's IP addresses
});
```

### 4. Network Configuration

Ensure your local network supports WebRTC:

**Router Configuration:**
- Enable UPnP or manually forward ports 3478-3497 (STUN/TURN)
- Allow WebSocket connections on your signaling server port
- Ensure devices are on the same subnet for optimal performance

**Firewall Settings:**
- Allow WebRTC traffic (UDP ports 3478-3497)
- Allow WebSocket connections to your signaling server
- Ensure local network discovery is enabled

## Usage Scenarios

### Scenario 1: Multi-Device Karma Tracking

1. **Dad completes a work package** on the Kitchen tablet
2. **Ledger entry created** in local PGLite database
3. **Entry broadcast** to all connected peers via WebRTC
4. **Bash tablet receives** the entry and updates its local ledger
5. **Both devices show** updated Karma balance in real-time

### Scenario 2: Zone Transition Synchronization

1. **User walks from Kitchen to Dad Zone** with Kitchen tablet
2. **ESP32 beacon detected** by Kitchen tablet
3. **Zone transition triggered** in Kitchen tablet's zone store
4. **Transition broadcast** to all peers
5. **Dad tablet receives** transition and updates its spatial state
6. **Both devices reflect** the new zone state

### Scenario 3: Device Recovery

1. **New device joins** the network
2. **Peer discovery** via Cloudflare KV relay
3. **WebRTC connection** established with existing peers
4. **State synchronization** - new device receives full ledger history
5. **Real-time updates** begin immediately

## Troubleshooting

### Common Issues

**No Peers Discovered:**
- Check WebSocket connection to signaling server
- Verify devices are on the same network
- Ensure firewall allows WebRTC traffic

**Connection Drops:**
- Check network stability
- Verify STUN server configuration
- Monitor heartbeat intervals

**Synchronization Failures:**
- Check PGLite database permissions
- Verify idempotent insert queries
- Monitor console for error messages

### Debug Tools

**Mesh Status Component:**
```typescript
// Add to your debug panel
const { meshSync } = useMeshSync();
console.log('Mesh Status:', meshSync.getMeshStatus());
```

**Network Monitoring:**
```typescript
// Monitor WebRTC connections
meshSync.peers.forEach(peer => {
  console.log(`Peer ${peer.name}: ${peer.connectionState}`);
});
```

## Performance Considerations

### Bandwidth Optimization
- **Delta-only sync**: Only new entries are transmitted
- **Compression**: JSON messages are automatically compressed by WebRTC
- **Batching**: Multiple entries can be batched in single messages

### Storage Efficiency
- **Append-only design**: No UPDATE/DELETE operations
- **Automatic cleanup**: Old entries can be archived without affecting sync
- **Index optimization**: Database indexes maintained for performance

### Memory Management
- **Connection pooling**: Limited number of concurrent peers
- **Message queuing**: Backpressure handling for high-frequency updates
- **Cleanup timers**: Automatic cleanup of stale connections

## Security Considerations

### Physical Security
- **Local network only**: WebRTC connections stay within LAN
- **No cloud storage**: All data remains on local devices
- **Encrypted communication**: WebRTC provides end-to-end encryption

### Data Integrity
- **Idempotent operations**: Prevents duplicate entries
- **Signature verification**: Optional cryptographic signatures
- **Audit trail**: Complete history maintained in append-only ledger

### Network Security
- **STUN/TURN servers**: Use trusted infrastructure
- **WebSocket security**: WSS (WebSocket Secure) recommended
- **Peer authentication**: Optional peer identity verification

## Future Enhancements

### Advanced Features
- **Selective sync**: Sync only specific ledgers or time ranges
- **Compression**: Advanced compression for large datasets
- **Caching**: Intelligent caching for frequently accessed data

### Scalability
- **Mesh routing**: Multi-hop connections for larger networks
- **Load balancing**: Distribute sync load across multiple peers
- **Failover**: Automatic failover to backup peers

### Monitoring
- **Metrics collection**: Performance and usage metrics
- **Alerting**: Notifications for sync failures or performance issues
- **Analytics**: Usage patterns and optimization opportunities

## Conclusion

The Sovereign Mesh transforms your single-device Spaceship Earth implementation into a distributed, household-wide system. By leveraging WebRTC for peer-to-peer communication and PGLite's append-only design for conflict-free synchronization, you achieve true digital sovereignty while maintaining seamless user experience across all devices.

This implementation perfectly aligns with your architectural principles:
- ✅ No cloud database dependency
- ✅ Offline-first operation
- ✅ Local network sovereignty
- ✅ Conflict-free state management
- ✅ Real-time synchronization