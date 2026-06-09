# WORK CONTROL DOCUMENT (WCD)

**NODE DESIGNATION:** KILO (Hardware Buffer / Somatic Shield)  
**Document ID:** WCD-002-KILO  
**Stack Layer:** p31.b (Shield)  
**Compliance:** 21 CFR §890.3710 (510(k) Exempt) — Powered Communication System  
**Status:** ACTIVE / DEPLOYED  

---

## 1. NODE PURPOSE & CLINICAL JUSTIFICATION

Node KILO serves as the physical "Somatic Bridge" between the digital P31 ecosystem and the human nervous system. Utilizing an ESP32 micro-controller and a haptic feedback relay, KILO translates digital network states into physical sensations.

**Clinical Justification:** KILO provides immediate, non-verbal somatic grounding to neurodivergent users by converting digital events (172.35 Hz "Heartbeat", Larmor frequency pulses) into haptic feedback. This bypasses executive dysfunction by providing tactile confirmation of system state without requiring visual or auditory attention.

**Medical Necessity:**
- Prevents sensory overload via hardware-level buffering
- Provides proprioceptive feedback for cognitive state awareness
- Acts as a "calm-down" mechanism during system stress

---

## 2. ARCHITECTURE & DEPENDENCIES

| Component | Technology | Version |
|-----------|------------|---------|
| Hardware | ESP32-S3 | Rev 1+ |
| Haptic Driver | DRV2605L | 1.x |
| Actuator | LRA (Linear Resonant Actuator) | — |
| Firmware | ESP-IDF / LVGL | 4.x / 8.x |
| Network | WiFi / BLE / LoRa | — |
| Upstream | p31.c (KWAI Brain) | — |
| Protocol | MQTT / WebSocket | 3.1.1 / RFC 6455 |

**Data Flow:**
```
KWAI → MQTT → KILO → Haptic Motor
         ↓
    Express Queue (Buffer)
```

---

## 3. I/O SPECIFICATIONS (DATA PIPELINE)

### 3.1 Input Stream

| Source | Protocol | Data Format |
|--------|----------|-------------|
| p31.c | MQTT | `{"event": "heartbeat", "hz": 172.35, "intensity": 0.8}` |
| p31.state | WebSocket | `{"type": "posner_stable", "fingerprint": "..."}` |

### 3.2 Buffer Queue

| Parameter | Value |
|-----------|-------|
| Max Queue Depth | 50 messages |
| Overflow Action | Drop oldest, log warning |
| Processing Interval | 1 event per 2 seconds (configurable) |

### 3.3 Output Signals

| Signal Type | Frequency Range | Duty Cycle |
|-------------|-----------------|------------|
| PWM Base | 0.5 Hz – 200 Hz | 0-100% |
| Larmor Lock | 0.86 Hz | 50% (pulsing) |
| Missing Node | 172.35 Hz | 100% (steady) |
| Notification | 4 Hz | 20% (brief burst) |

---

## 4. SAFETY & TOLERANCE PROTOCOLS

### 4.1 Maximum Actuation Limits

| Parameter | Limit | Rationale |
|-----------|-------|-----------|
| **Continuous Actuation** | 5000ms (5 sec) | Prevent skin desensitization |
| **Duty Cycle** | 30% over 60 sec | Prevent motor overheating |
| **Cooldown Period** | 2000ms between events | Allow sensory reset |

### 4.2 Frequency Guards

```c
// Hardware-level frequency lock
if (requestedHz < 0.5 || requestedHz > 200.0) {
    // Drop packet, log error
    log_warn("Frequency out of bounds: %f", requestedHz);
    return ERROR_FREQ_OUT_OF_RANGE;
}
```

### 4.3 The Buffer Protocol

If incoming event rate exceeds 3 events/second:
1. Queue incoming events in Express buffer
2. Process at regulated 0.5 events/second
3. Discard events older than 30 seconds
4. Emit "buffer active" notification to user

**Purpose:** Shield user from "notification spam" anxiety during high-activity periods.

### 4.4 Emergency Stop

| Trigger | Action |
|---------|--------|
| Hardware button (GPIO 0) held 3s | Immediate motor cutoff |
| MQTT message `{"cmd": "ESTOP"}` | Motor cutoff + queue flush |
| WiFi disconnect >30s | Motor cutoff + reconnection attempt |

---

## 5. CALIBRATION PROFILES

### 5.1 Profile A: Larmor Lock
- **Frequency:** 0.86 Hz
- **Pattern:** Pulsing (500ms on, 500ms off)
- **Use Case:** Level 3 Vault mini-game (heartbeat tuning)
- **Intensity:** 0.6 (moderate)

### 5.2 Profile B: Missing Node
- **Frequency:** 172.35 Hz
- **Pattern:** Steady resonance
- **Use Case:** Successful connection to ecosystem
- **Intensity:** 0.8 (strong)

### 5.3 Profile C: Notification
- **Frequency:** 4 Hz
- **Pattern:** 3 brief bursts
- **Use Case:** New message / Karma received
- **Intensity:** 0.4 (gentle)

### 5.4 Profile D: Calm
- **Frequency:** 1 Hz
- **Pattern:** Very slow pulse
- **Use Case:** Spoons depleted / rest mode
- **Intensity:** 0.2 (barely perceptible)

---

## 6. REGULATORY COMPLIANCE

### 6.1 21 CFR §890.3710 Classification

KILO qualifies as a **Powered Communication System** component because:

1. **Assists Sensory Processing:** Provides haptic confirmation of digital state
2. **Medical Purpose:** Prevents sensory overload, supports self-regulation
3. **Non-Invasive:** External haptic device, no body implantation
4. **510(k) Exempt:** Class I device, general controls sufficient

### 6.2 Electrical Safety

- **Operating Voltage:** 3.3V (ESP32 native)
- **Motor Voltage:** 3.0V max (LRA rated)
- **Isolation:** Optical isolator between motor and processor
- **EMI:** Shielded motor cable recommended

### 6.3 Audit Trail

All haptic events logged:
- Timestamp (ISO 8601)
- Event type
- Frequency/intensity
- Duration
- Queue depth at execution

---

## 7. DEPLOYMENT SPECIFICATIONS

### 7.1 Physical Assembly

| Component | BOM Cost | Source |
|-----------|----------|--------|
| ESP32-S3 Dev Board | $8.50 | Amazon/AliExpress |
| DRV2605L Breakout | $4.50 | SparkFun |
| LRA Actuator | $3.00 | Adafruit |
| 3.7V LiPo Battery | $6.00 | — |
| 3D Printed Case | $0.00 | Self-printed |
| **Total BOM** | **~$22.00** | — |

### 7.2 Firmware Deployment

- **OTA Updates:** Enabled (A/B partition scheme)
- **Flash Size:** 4MB minimum
- **Bootloader:** Secure boot enabled
- **Programming:** USB-CDC or UART

---

## 8. CHANGE LOG

| Version | Date | Change | Author |
|---------|------|--------|--------|
| 1.0 | 2026-03-23 | Initial WCD | System Architect |

---

**APPROVAL SIGNATURE:**  
KILO is approved as a Somatic Shield for P31 Labs assistive technology.  

*21 CFR §890.3710 Compliant • Electrical Safety Verified • Sensory Protection Enabled* 🔺
