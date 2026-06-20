# Node Zero — Bill of Materials
## First Edition · 8 Units · Family Release

**Target date:** 2026-05-15  
**Recipients:** Johnson family (4) + Tyler's family (4)  
**Confirmed target board:** Waveshare ESP32-S3-Touch-LCD-3.5B **Type B** (N16R8)

---

## On-Board (included with Waveshare Type B)

| Component | Notes |
|-----------|-------|
| ESP32-S3 N16R8 | 16 MB flash, 8 MB Octal PSRAM |
| AXS15231B 3.5" QSPI touch display | 480×320 capacitive |
| ES8311 audio codec | I2S mic + speaker |
| AXP2101 PMIC | LiPo charge + power rail management |
| QMI8658 IMU | 6-axis accel/gyro |
| microSD slot | for local log / OTA staging |

---

## Must Source Separately

### Required (mesh radio — Node Zero is not Node Zero without LoRa)

| # | Component | Spec | Where | Est. Unit | 8-unit |
|---|-----------|------|-------|-----------|--------|
| 8 | **Waveshare ESP32-S3-Touch-LCD-3.5B (Type B)** | N16R8, 3.5" touch | waveshare.com / Amazon | ~$35 | ~$280 |
| 8 | **SX1262 LoRa module** | 915 MHz, SPI, e.g. Ebyte E22-900M22S or CDEBYTE Ra-01SH | lcsc.com / AliExpress | ~$4 | ~$32 |
| 8 | **915 MHz LoRa antenna** | SMA or u.FL, 2-3 dBi omni | Amazon / Mouser | ~$3 | ~$24 |
| 8 | **SMA pigtail (u.FL to SMA-F)** | ~15 cm, if module uses u.FL | Amazon | ~$2 | ~$16 |
| 8 | **LiPo battery** | 3.7V, 1000–2000 mAh, JST-PH 2.0 | Amazon / Adafruit | ~$8 | ~$64 |

### Optional (first edition can ship without)

| # | Component | Why | Est. |
|---|-----------|-----|------|
| 8 | NXP SE050 breakout | EAL6+ hardware key storage — deferred to v2 | ~$8/unit |
| 8 | 3D-printed enclosure | STL not yet designed | TBD |
| 8 | Wrist strap / mount | biometric wear config | TBD |

---

## GPIO Wiring (LoRa → Type B camera header)

The SX1262 connects to SPI3_HOST via the camera header (GPIOs above PSRAM kill zone):

| SX1262 Pin | ESP32-S3 GPIO | Label in config.h |
|------------|---------------|-------------------|
| SCK | GPIO 41 | LORA_SCK |
| MOSI | GPIO 42 | LORA_MOSI |
| MISO | GPIO 39 | LORA_MISO |
| NSS (CS) | GPIO 40 | LORA_NSS |
| BUSY | GPIO 21 | LORA_BUSY |
| DIO1 | GPIO 38 | LORA_DIO1 |
| NRST | GPIO 45 | LORA_NRST |
| 3.3V | 3V3 rail | — |
| GND | GND | — |

All GPIOs are above 37 — clear of the Octal PSRAM kill zone (26-37).

---

## Firmware Status

| Module | Status |
|--------|--------|
| Display init (AXS15231B QSPI) | ✅ complete — `main/display.c` |
| Touch (AXS15231B DDIC I2C) | ✅ complete — `main/touch.c` |
| LoRa (SX1262 LONG_FAST 915 MHz) | ✅ complete — `main/lora.c` |
| P31 UI (LVGL 8.4) | ✅ scaffolded — `main/p31_ui.c` |
| P31 Net (mesh + Q-Factor sync) | ✅ scaffolded — `main/p31_net.c` |
| NVS DID (6-byte esp_random()) | 🔧 implement in app_main |
| SE050 HSM | ⏸ deferred to v2 |

---

## Order Checklist

- [ ] 8× Waveshare ESP32-S3-Touch-LCD-3.5B Type B — ordered from waveshare.com
- [ ] 8× SX1262 915 MHz module — confirm footprint (Ra-01SH recommended, breadboard-friendly)
- [ ] 8× 915 MHz antenna + SMA pigtail
- [ ] 8× LiPo 3.7V 1000–2000 mAh JST-PH 2.0
- [ ] Shipping timeline verified (≤7 days for May 15)
- [ ] Flash script tested on one unit before batch flash
- [ ] `provision.sh` seeds NVS DID on each unit

---

## Estimated Total (required only)

| Item | Cost |
|------|------|
| 8× Waveshare board | ~$280 |
| 8× SX1262 module | ~$32 |
| 8× antenna + pigtail | ~$40 |
| 8× LiPo | ~$64 |
| **Total** | **~$416** |
