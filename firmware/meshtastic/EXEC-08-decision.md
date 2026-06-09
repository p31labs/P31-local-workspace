# EXEC-08: Meshtastic vs. Reticulum — Decision

**Decision date:** 2026-05-05  
**Decision:** Meshtastic Phase 1, Reticulum Phase 2

## Trade-off matrix

| Criterion | Meshtastic | Reticulum (RNS) |
|-----------|-----------|----------------|
| Ready NOW | ✅ Yes | ❌ Requires MicroPython port |
| Existing hardware | ✅ SX1262 in Node Zero BOM | ✅ Same radio |
| iOS app | ✅ Meshtastic iOS (App Store) | ❌ No iOS client yet |
| Android | ✅ Official app | ❌ Sideload only |
| Crypto | AES-128 PSK | Ed25519 + Fernet (stronger) |
| Identity model | Location-based node ID | Identity-based (handles move) |
| Bandwidth | ~1.3 kbps (LONG_FAST) | ~0.5 kbps (RNS overhead) |
| Flash footprint | ~800 KB ESP-IDF | ~1.2 MB (MicroPython + RNS) |
| CPU on ESP32-S3 | Low | Medium (Ed25519 in Python) |
| Multi-hop routing | Flooding (simple) | Identity routing (complex, better) |
| MQTT bridge | ✅ Built-in | ❌ Custom bridge needed |
| Federation | ❌ No Matrix bridge | ❌ No Matrix bridge |
| P31 family UX | ✅ Ready today | ❌ 6-12 month dev sprint |

## Phase 1: Meshtastic (now — Q2 2026)

**Scope:** Node Zero + iPhone + Android tablets  
**Config:** `p31-mesh-config.yaml` (PSK-encrypted P31_FAMILY channel)  
**HA integration:** `ha-mqtt-bridge.yaml`  
**Range:** ~5-10 km with Node Zero as relay

Meshtastic delivers the core value: LoRa mesh communication that survives
cellular shutdown, routes through Node Zero as an always-on relay, and
bridges to Home Assistant via MQTT.

## Phase 2: Reticulum (Q4 2026 — Node One)

**Scope:** Node One firmware + long-range mesh  
**Why:** RNS's identity-based routing means messages route to Will Johnson
regardless of physical location. Critical for family court mobility scenarios.  
**Trigger:** Node One hardware ready (Q4 2026 BOM)  
**Interop:** Run Meshtastic on Phase 1 nodes + RNS on Node One; bridge via
custom MQTT adapter on the VPS.

## Interoperability plan

```
iPhone (Meshtastic) ←LoRa→ Node Zero (Meshtastic relay)
                              ↓ MQTT
                           Home Assistant (ha-mqtt-bridge.yaml)
                              ↓ REST
                           Q-Factor Worker (api.p31ca.org/qfactor/event)
                              ↓ Webhook
                           Matrix room (court-alerts)
```

Phase 2 adds:
```
Node One (RNS) ←LoRa→ Node Zero (dual stack: Meshtastic + RNS bridge)
```

## Files

- `p31-mesh-config.yaml` — Meshtastic node config (apply via CLI or QR)
- `ha-mqtt-bridge.yaml` — HA automations for LoRa→Matrix relay + Q-Factor
- `EXEC-10-rns-firmware-cwp.md` — DeepSeek prompt for Phase 2 RNS firmware
