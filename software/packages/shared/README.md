# @p31/shared

System-wide shared modules for the P31 Labs ecosystem, promoting code reuse and consistency across all applications including Spaceship Earth, Bonding, and Node One.

## Overview

This package contains the four core vectors of the Spaceship Earth system:

1. **ZUI (Zone User Interface)** - 3D mesh visualizer using Sierpinski tetrahedron
2. **Economy** - LOVE ledger and token economy system
3. **Rules** - Constitution-based rules engine with cognitive shield
4. **BLE** - Web Bluetooth scanner for environmental nudging

## Architecture

### ZUI Vector
- **Purpose**: 3D visualization of zone topology using Sierpinski tetrahedron
- **Key Features**:
  - Performance-adaptive rendering (0.5-1.0 factor)
  - Three zoom levels: Macro (0), Meso (1), Micro (2)
  - Camera store with smooth transitions
  - Optimal depth calculation based on device capabilities

### Economy Vector
- **Purpose**: LOVE (Ledger of Ontological Volume and Entropy) token economy
- **Key Features**:
  - Real-time LOVE value tracking
  - Telemetry integration for usage metrics
  - Immutable ledger with transaction history
  - Integration with sovereign identity system

### Rules Vector
- **Purpose**: Constitution-based rules engine with cognitive conflict detection
- **Key Features**:
  - Prime Directives (immutable core principles)
  - Global Rules (system-wide policies)
  - Creator Rules (zone-specific regulations)
  - Cognitive Shield for message conflict detection
  - Rule evaluation with context-aware enforcement

### BLE Vector
- **Purpose**: Environmental nudging through Web Bluetooth
- **Key Features**:
  - RSSI-based proximity detection
  - Zone transition event handling
  - ESP32-S3 Totem beacon support
  - Haptic feedback integration
  - Experimental Web Bluetooth API support

## Installation

```bash
npm install @p31/shared
```

## Usage

### Basic Integration

```typescript
import {
  // ZUI
  useZUICameraStore,
  generateSierpinskiNodes,
  getOptimalSierpinskiDepth,
  
  // Rules Engine
  evaluateRules,
  createDefaultConstitution,
  addCreatorRule,
  CognitiveShield,
  
  // Economy
  useEconomyStore,
  
  // BLE
  SpaceshipBLEScanner,
  defaultBLEConfig,
} from '@p31/shared';

// Initialize the complete system
const integration = new SpaceshipEarthIntegration();
await integration.initialize();

// Start BLE scanning (requires user gesture)
document.getElementById('start-ble').addEventListener('click', async () => {
  await integration.startBLEScanning();
});

// Check system status
console.log(integration.getSystemStatus());
```

### ZUI Usage

```typescript
import { useZUICameraStore, generateSierpinskiNodes } from '@p31/shared';

// Set performance factor based on device
const cameraStore = useZUICameraStore.getState();
cameraStore.setPerformanceFactor(0.8);

// Generate optimal mesh
const depth = getOptimalSierpinskiDepth();
const nodes = generateSierpinskiNodes(depth);

// Navigate to specific zone
cameraStore.zoomToNode('workshop', 1); // Meso level
```

### Rules Engine Usage

```typescript
import { 
  createDefaultConstitution, 
  addCreatorRule,
  evaluateRules 
} from '@p31/shared';

// Create constitution
const constitution = createDefaultConstitution();

// Add zone-specific rule
addCreatorRule(constitution, 'workshop', {
  name: 'Kinetic Zone Quiet Hours',
  description: 'Require acknowledgment during quiet hours',
  conditions: [
    {
      field: 'time',
      operator: 'TIME_RANGE',
      value: [22, 7],
      description: '10PM–7AM'
    }
  ],
  conditionLogic: 'AND',
  action: {
    type: 'REQUIRE_ACK',
    message: 'Quiet hours active. Keep volume below conversational level.'
  },
  priority: 150,
  createdBy: 'SYSTEM',
  enabled: true,
});

// Evaluate rules for context
const context = {
  time: Date.now(),
  spoonBalance: 5,
  karma: 100,
  zoneEnergy: 'kinetic',
  userId: 'user123',
  zoneId: 'workshop',
};

const result = evaluateRules(constitution, context, 'workshop');
if (!result.allowed) {
  console.warn('Access denied:', result.deniedBy?.action?.message);
}
```

### BLE Scanner Usage

```typescript
import { SpaceshipBLEScanner, defaultBLEConfig } from '@p31/shared';

// Check if supported
if (!SpaceshipBLEScanner.isSupported()) {
  console.warn('Web Bluetooth not supported');
}

// Initialize scanner
const scanner = new SpaceshipBLEScanner(defaultBLEConfig);

// Start scanning (requires user gesture)
await scanner.startScan((event) => {
  console.log('Zone transition:', event);
  // Handle transition logic here
});

// Stop scanning
await scanner.stopScan();
```

### Cognitive Shield Usage

```typescript
import { CognitiveShield, defaultShieldConfig } from '@p31/shared';

const shield = new CognitiveShield(defaultShieldConfig);

// Shield a message
const result = await shield.shieldMessage("I'm feeling overwhelmed");
if (result.rewritten) {
  console.log('Original:', result.original);
  console.log('Rewritten:', result.rewritten);
  console.log('Conflicts:', result.conflicts);
}
```

## API Reference

### ZUI Functions

- `useZUICameraStore()` - React store for camera state management
- `generateSierpinskiNodes(depth: number)` - Generate mesh nodes for visualization
- `getOptimalSierpinskiDepth()` - Calculate optimal mesh depth for device
- `useZUIPerformance()` - Hook for performance monitoring

### Rules Engine Functions

- `createDefaultConstitution()` - Create constitution with prime directives
- `addCreatorRule(constitution, zoneId, rule)` - Add zone-specific rule
- `evaluateRules(constitution, context, zoneId)` - Evaluate rules for context
- `CognitiveShield(config)` - Class for message conflict detection

### Economy Functions

- `useEconomyStore()` - React store for LOVE economy
- `LOVE_VALUES` - Constants for LOVE value calculations

### BLE Functions

- `SpaceshipBLEScanner(config)` - Class for Web Bluetooth scanning
- `defaultBLEConfig` - Default configuration for BLE scanner
- `isSupported()` - Check Web Bluetooth support

## Configuration

### Performance Tuning

```typescript
// Set performance factor (0.5 = low, 1.0 = high)
useZUICameraStore.getState().setPerformanceFactor(0.7);

// Optimize mesh depth for device
const depth = getOptimalSierpinskiDepth();
```

### BLE Configuration

```typescript
const customConfig = {
  serviceUUIDs: ['custom-uuid'],
  enableHaptic: true,
  proximityThresholds: {
    immediate: 0.3,
    near: 1.5,
    approaching: 4.0,
  },
  cooldownMs: 20_000,
};
```

### Cognitive Shield Configuration

```typescript
const customConfig = {
  conflictThreshold: 0.8,
  maxConflicts: 3,
  enableLogging: true,
};
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run linting and type checking
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Check the [documentation](./docs/)
- Open an [issue](https://github.com/p31labs/andromeda/issues)
- Join our [Discord community](https://discord.gg/p31labs)

## Related Projects

- [Spaceship Earth](https://github.com/p31labs/spaceship-earth) - Main application
- [Bonding](https://github.com/p31labs/bonding) - Molecule builder game
- [Node One](https://github.com/p31labs/node-one) - Sovereign node firmware
- [P31 Sovereign SDK](https://github.com/p31labs/sovereign-sdk) - Development toolkit