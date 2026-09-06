# P31 Device Mesh — Architecture & Setup Guide

## Overview

The P31 Device Mesh transforms every screen, sensor, and microcontroller in a family's home into a node in the P31 distributed edge network. Each device joins via WebSocket to Shadow Bridge, sends telemetry to Genesis Gate (SHA-256 hash chain), and earns LOVE for environmental monitoring and care data.

## Architecture

```
                    CLOUDFLARE EDGE (300+ POPs)
┌──────────────────────────────────────────────────────────────┐
│  device-registry (DO)  ←─ register / heartbeat / status     │
│  shadow-bridge /device/ws ←─ ESP32 WebSocket relay          │
│  shadow-bridge /device/register ←─ HTTP registration        │
│  Genesis Gate ←─ sensor_reading, device_online/offline      │
│  LOVE Ledger ←─ care-score for device monitoring            │
└──────────────────────────────────────────────────────────────┘
                         │ WebSocket / HTTP
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                      DEVICE LAYER                            │
│  ESP32 (Arduino C++) │  Phone (PWA) │  Tablet │  Chromebook │
│  Desktop (Web)       │  CLI (Node)   │         │             │
└──────────────────────────────────────────────────────────────┘
```

## Device Types

| Type | Identifier | Connectivity | Capabilities |
|------|-----------|-------------|--------------|
| ESP32 | `esp32` | WiFi + WebSocket | Temperature, humidity, air quality, heart rate, accelerometer, battery |
| Phone | `phone` | WiFi/Cellular + PWA | GPS, camera, accelerometer, gyroscope, haptics |
| Tablet | `tablet` | WiFi + PWA | Same as phone, larger screen |
| Desktop | `desktop` | Ethernet/WiFi + Web | Full keyboard, large display, CLI |
| Chromebook | `chromebook` | WiFi + PWA | Lightweight server, Lubuntu + Coolify + Tailscale |

## Setting Up an ESP32

### Prerequisites
- ESP32 board (ESP32-S3 recommended)
- Arduino IDE with ESP32 board support
- Libraries: `WebSockets_Generic`, `ArduinoJson`

### Steps
1. Open `software/firmware/esp32-p31-client/esp32-p31-client.ino`
2. Create `secrets.h` with your credentials:
```cpp
#define WIFI_SSID "YourWiFi"
#define WIFI_PASS "YourPassword"
#define DEVICE_ID "esp32_node_001"
#define FAMILY_ID "did:p31:family:your-family"
```
3. Upload to ESP32
4. Monitor serial output (115200 baud) — you should see "Device registered successfully"

### Optional Sensors
- **BME280**: Temperature, humidity, pressure (I2C 0x76)
- **PMS5003**: Air quality (PM2.5, PM10)
- **MAX30102**: Heart rate (I2C)
- **MPU6050**: Accelerometer/gyroscope (I2C 0x68)

## Setting Up a Chromebook as Server

1. Install Lubuntu Linux
2. Install Tailscale: `curl -fsSL https://tailscale.com/install.sh | sh`
3. Install Coolify: self-hosting platform
4. Clone P31 repo: `git clone https://github.com/p31labs/P31-local-workspace`
5. Run PHOS dev: `cd apps/phos && pnpm dev`
6. The Chromebook is now a P31 edge node on the mesh

## Installing PHOS as a PWA

1. Open `phos.p31ca.org` in Chrome or Firefox
2. Tap the install icon in the address bar
3. PHOS installs with offline support via service worker
4. The device automatically registers in the device registry

## Event Flow

```
ESP32 WebSocket → Shadow Bridge /device/ws → device-registry DO
  │                                              │
  │ device_register                              │ register()
  │ device_heartbeat (every 30s)                 │ heartbeat()
  │ device_telemetry (every 60s)                 │
  │                                              ▼
  └─────────────── Genesis Gate ───────────────────
                   POST /event
                   type: sensor_reading
                   payload: { temperature, humidity, rssi, ... }
                   SHA-256 hash chain entry
                              │
                              ▼
                   LOVE Ledger
                   care-score += sensor_uptime * quality_factor
```

## API Reference

### Device Registry (`device-registry.trimtab-signal.workers.dev`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/register` | POST | Register a new device |
| `/heartbeat` | POST | Update device heartbeat |
| `/status` | POST | Update device status |
| `/get?deviceId=` | GET | Get device by ID |
| `/list?familyId=` | GET | List all devices for a family |
| `/online?familyId=` | GET | List online devices |
| `/health` | GET | Health check |

### Shadow Bridge Device Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/device/ws` | GET | Upgrade to WebSocket for device relay |
| `/device/register` | POST | Proxy registration to device-registry |

### Genesis Gate — Device Event Types

| Event Type | Source | Payload |
|-----------|--------|---------|
| `device_online` | Shadow Bridge | `{ deviceId, familyId, type, ip }` |
| `device_offline` | Shadow Bridge | `{ deviceId, familyId, uptime }` |
| `device_heartbeat` | ESP32/Shadow Bridge | `{ deviceId, batteryLevel, uptime, freeHeap }` |
| `sensor_reading` | ESP32/Shadow Bridge | `{ deviceId, temperature, humidity, pressure, airQuality, heartRate, rssi, batteryVoltage }` |
| `device_ota_update` | Shadow Bridge | `{ deviceId, firmwareVersion, r2Url }` |

## Troubleshooting

### ESP32 won't connect
- Check WiFi credentials in `secrets.h`
- Verify the WiFi network is 2.4GHz (ESP32 doesn't support 5GHz)
- Try a different USB cable (some are power-only, no data)
- Check serial monitor for error messages

### Device not appearing in registry
- Check that `DEVICE_ID` is unique
- Verify the Shadow Bridge `/device/register` endpoint is reachable
- Check the device has internet access (ping test)

### PWA doesn't install
- Make sure you're on `phos.p31ca.org` (not a preview URL)
- Use Chrome or Firefox (Safari has limited PWA support)
- The service worker must be registered successfully

## Love Earned from Devices

| Action | LOVE |
|--------|------|
| ESP32 heartbeat (every 30s) | 0.01 LOVE/min |
| Sensor reading submitted | 1 LOVE |
| Continuous monitoring (24h) | 15 LOVE |
| Air quality alert triggered | 5 LOVE |
| Temperature threshold crossed | 3 LOVE |

---

P31 Labs, Inc. | EIN 42-1888158 | AGPL-3.0
The cage holds. 863 Hz. The mesh is everywhere.
