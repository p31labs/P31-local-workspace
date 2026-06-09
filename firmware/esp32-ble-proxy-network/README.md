# ESP32 BLE Proxy Network - Phase 3 Implementation

## Overview

This firmware implements the physical proxy network for Spaceship Earth, creating Sovereign BLE Beacons that broadcast zone-specific UUIDs to trigger the Visitor Mindset modal when users cross physical boundaries.

## Hardware Requirements

- ESP32 (NodeMCU or WROOM-32)
- USB wall adapter for power
- PlatformIO or Arduino IDE for flashing

## Installation

### 1. Install NimBLE-Arduino Library

```bash
# Using PlatformIO
pio lib install "h2zero/NimBLE-Arduino"

# Using Arduino IDE
# Download from: https://github.com/h2zero/NimBLE-Arduino
```

### 2. Zone Configuration

Each ESP32 must be flashed with the appropriate zone UUID:

| Physical Zone | Elemental Energy | Primary UUID (Service) | Node ID |
|---------------|------------------|------------------------|---------|
| Dad Zone      | Ordered / Quiet  | `12345678-1234-5678-1234-56789abcdef0` | Node 1 |
| Bash Zone     | High Kinetic     | `12345678-1234-5678-1234-56789abcdef1` | Node 2 |
| Kitchen       | Utility / Fluid  | `12345678-1234-5678-1234-56789abcdef2` | Node 3 |

## Deployment Instructions

### Physical Placement
- Mount ESP32s near room thresholds (entrances), not center of rooms
- Use USB wall adapters for continuous power
- Avoid placing directly behind metal appliances (refrigerators, etc.)
- Ensure clear line-of-sight for optimal BLE signal propagation

### Power Optimization
- Uses NimBLE-Arduino library for 70% lower RAM usage vs standard Bluedroid
- Minimal power consumption for continuous operation
- No active connections required - broadcast-only operation

## Testing

1. Flash Node 1 with Dad Zone UUID
2. Flash Node 2 with Bash Zone UUID
3. Power both ESP32s via USB wall adapters
4. Open Spaceship Earth PWA on tablet
5. Walk between rooms and verify:
   - RSSI crosses -60dBm threshold
   - Visitor Mindset modal appears
   - 3-second physical hold requirement activates

## Technical Specifications

- **Advertising Interval**: 100ms (standard iBeacon)
- **TX Power**: 0dBm (medium range)
- **Battery Life**: Continuous operation via wall power
- **Protocol**: iBeacon (compatible with Web Bluetooth)
- **Detection Range**: 3-5 meters (configurable via TX power)

## Troubleshooting

### Signal Issues
- Check for metal obstructions between ESP32 and tablet
- Verify ESP32 is powered and LED is active
- Ensure Chrome flags are enabled: `chrome://flags/#enable-experimental-web-platform-features`

### Detection Problems
- Verify correct UUID is flashed to each ESP32
- Check that RSSI threshold is set to -60dBm in software
- Ensure sustained detection time (3 seconds) is met

## Integration with Spaceship Earth

This firmware integrates seamlessly with your existing software stack:

1. **BLE Scanner** (`bleScanner.ts`) detects iBeacon UUIDs
2. **RSSI Threshold** (-60dBm) triggers zone transition
3. **Visitor Mindset Modal** appears requiring physical grounding
4. **Zone Store** updates active zone state
5. **WebGPU Processing** handles spatial analysis

The hardware provides the physical BLE signals that your sophisticated WebGPU and Zustand-based system is designed to detect and respond to.