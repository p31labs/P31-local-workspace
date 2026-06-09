# Spaceship Earth - ESP32 BLE Proxy Network Integration Guide

## Overview

This guide explains how the ESP32 BLE Proxy Network integrates with your existing Spaceship Earth software stack to create a seamless physical-to-digital boundary detection system.

## System Architecture

```
Physical World                    Digital World (Spaceship Earth PWA)
┌─────────────────┐               ┌─────────────────────────────────┐
│   ESP32 Beacon  │               │   Web Bluetooth Scanner         │
│   (iBeacon)     │  BLE Signal   │   (bleScanner.ts)              │
│                 │ ────────────▶ │   - RSSI Detection             │
│   UUID:         │               │   - -60dBm Threshold           │
│   12345678-...  │               │   - 3s Sustained Detection     │
└─────────────────┘               └─────────────────────────────────┘
                                           │
                                           ▼
                                    ┌─────────────────────────────────┐
                                    │   Zone Store                    │
                                    │   (zoneStore.ts)               │
                                    │   - Active Zone Updates        │
                                    │   - Spatial State Management   │
                                    └─────────────────────────────────┘
                                           │
                                           ▼
                                    ┌─────────────────────────────────┐
                                    │   Visitor Mindset Modal         │
                                    │   (VisitorMindsetModal.tsx)    │
                                    │   - 3s Physical Hold           │
                                    │   - Grounding Sequence         │
                                    └─────────────────────────────────┘
```

## Integration Points

### 1. BLE Scanner Integration (`bleScanner.ts`)

Your existing BLE scanner is already configured to work with the ESP32 beacons:

```typescript
// RSSI thresholds (matches ESP32 TX Power)
const RSSI_IMMEDIATE = -60;  // Strong signal (< 1m)
const RSSI_NEAR = -70;       // Moderate signal (< 3m)
const RSSI_FAR = -80;        // Weak signal (< 10m)

// Sustained detection (matches WCD-SE03 requirement)
const SUSTAINED_DURATION = 3000; // 3 seconds
```

**How it works:**
- ESP32 broadcasts iBeacon with TX Power of -59dBm
- Web Bluetooth detects signal strength (RSSI)
- When RSSI ≥ -60dBm for 3+ seconds, triggers zone transition
- Dispatches `ZONE_TRANSITION` event to Zustand store

### 2. Zone Store Integration (`zoneStore.ts`)

The zone store receives and processes the transition events:

```typescript
// Zone transition handler
triggerZoneTransition: (zoneId: string) => {
  const zone = get().zones.find(z => z.id === zoneId);
  if (!zone) return;

  set((state) => ({
    activeZoneId: zoneId,
    spatialState: {
      ...state.spatialState,
      currentLevel: 'Level1',
      currentZone: zoneId,
      isTransitioning: true,
      transitionProgress: 0,
    },
    environmentalState: {
      ...state.environmentalState,
      visitorMode: true,
      lastThresholdCrossing: zone.name,
    },
  }));

  // Broadcast ZONE_TRANSITION event
  window.dispatchEvent(new CustomEvent('ZONE_TRANSITION', {
    detail: {
      zoneId,
      zoneName: zone.name,
      transitionType: 'entering',
    },
  }));
}
```

### 3. Visitor Mindset Modal Integration

The modal activates when `isTransitioning` becomes true:

```typescript
// Modal triggers when transition starts
if (!isTransitioning || isGrounded) return null;

// Requires 3-second physical hold to complete
const handleGroundingComplete = useCallback(() => {
  setIsHolding(false);
  setProgress(100);
  completeGrounding(); // Updates zone store
}, [completeGrounding]);
```

## Hardware Configuration

### ESP32 Firmware Settings

Each ESP32 is configured with:

```cpp
// Zone-specific UUIDs
const char* ZONE_UUIDS[] = {
  "12345678-1234-5678-1234-56789abcdef0",  // Dad Zone
  "12345678-1234-5678-1234-56789abcdef1",  // Bash Zone  
  "12345678-1234-5678-1234-56789abcdef2"   // Kitchen
};

// iBeacon configuration
#define BEACON_MAJOR 1000
#define BEACON_MINOR 1
#define BEACON_TX_POWER -59  // TX Power at 1 meter
#define ADVERTISING_INTERVAL 100  // ms
```

### Power Optimization

- **NimBLE-Arduino Library**: 70% lower RAM usage vs standard Bluedroid
- **Broadcast-only Mode**: No active connections, minimal power draw
- **Wall Power**: Continuous operation via USB wall adapters

## Deployment Workflow

### 1. Flash ESP32s

```bash
# Flash Dad Zone beacon
python deploy_zones.py --zone dad --port /dev/ttyUSB0

# Flash Bash Zone beacon  
python deploy_zones.py --zone bash --port /dev/ttyUSB1

# Flash Kitchen beacon
python deploy_zones.py --zone kitchen --port /dev/ttyUSB2
```

### 2. Physical Placement

- **Location**: Near room thresholds (entrances), not center of rooms
- **Height**: 3-5 feet above ground for optimal signal propagation
- **Power**: USB wall adapters for continuous operation
- **Clearance**: Avoid placement behind metal appliances

### 3. Software Testing

```bash
# Test BLE detection
python test_ble_detection.py

# Expected output:
# [+] New Beacon Detected!
#     Zone: Dad Zone (Ordered/Quiet)
#     RSSI: -55 dBm (threshold: -60dBm)
```

### 4. PWA Integration Testing

1. Open Spaceship Earth PWA on tablet
2. Enable Chrome flags: `chrome://flags/#enable-experimental-web-platform-features`
3. Walk between rooms with ESP32s
4. Verify:
   - RSSI crosses -60dBm threshold
   - Visitor Mindset modal appears
   - 3-second hold requirement activates

## Signal Characteristics

### Expected RSSI Values

| Distance from ESP32 | Expected RSSI | Zone State |
|---------------------|---------------|------------|
| 0-1 meter           | -40 to -55 dBm | IMMEDIATE |
| 1-3 meters          | -55 to -70 dBm | NEAR |
| 3-10 meters         | -70 to -80 dBm | FAR |
| >10 meters          | <-80 dBm      | OUTSIDE |

### Signal Penetration

- **Drywall**: Minimal attenuation (~3dB)
- **Wood doors**: Moderate attenuation (~6dB)
- **Metal appliances**: High attenuation (~20dB) - avoid placement
- **Human bodies**: Variable attenuation (~5-15dB)

## Troubleshooting

### No Signal Detected

1. **Check ESP32 Power**: LED should be active
2. **Verify Zone ID**: Ensure correct UUID is flashed
3. **Chrome Flags**: Enable experimental Web Bluetooth features
4. **Physical Obstructions**: Remove metal objects between ESP32 and tablet

### Inconsistent Detection

1. **RSSI Threshold**: Verify -60dBm threshold in software
2. **Sustained Detection**: Ensure 3-second requirement is met
3. **Signal Interference**: Check for other BLE devices
4. **ESP32 Placement**: Optimize for line-of-sight

### Modal Not Appearing

1. **Zone Store State**: Check `isTransitioning` flag
2. **Event Dispatch**: Verify `ZONE_TRANSITION` events
3. **BLE Scanner**: Confirm beacon detection
4. **Web Bluetooth**: Check browser permissions

## Performance Optimization

### ESP32 Power Settings

```cpp
// Optimize for battery life (if using battery)
NimBLEDevice::setPower(ESP_PWR_LVL_P0);  // 0dBm TX power

// Optimize for range (wall power)
NimBLEDevice::setPower(ESP_PWR_LVL_P3);  // 3dBm TX power
```

### Software Efficiency

- **EMA Smoothing**: Reduces signal noise in `bleScanner.ts`
- **Sustained Detection**: Prevents false positives from signal bounce
- **Zone Caching**: Minimizes repeated calculations in zone store

## Security Considerations

### Physical Security
- ESP32s are wall-powered and mounted out of reach
- No sensitive data stored on devices
- Broadcast-only operation (no connections)

### Signal Security
- UUIDs are not secret (physical presence required)
- RSSI-based detection prevents remote spoofing
- 3-second hold requirement adds physical factor

## Future Enhancements

### Multi-Device Support
- Add more ESP32s for finer-grained zone detection
- Implement triangulation for precise location tracking
- Support for mobile device detection

### Advanced Features
- Dynamic TX power adjustment based on room size
- Signal strength calibration for different environments
- Integration with environmental sensors (motion, sound)

## Conclusion

The ESP32 BLE Proxy Network successfully bridges the physical and digital worlds of Spaceship Earth. By broadcasting zone-specific iBeacon signals, the ESP32s enable your sophisticated WebGPU and Zustand-based system to detect physical boundary crossings and trigger appropriate cognitive transitions.

The integration is seamless, power-efficient, and ready for real-world deployment in your home environment.