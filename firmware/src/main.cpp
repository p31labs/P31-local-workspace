/**
 * P31 Thick Click Firmware — ESP32-S3
 *
 * Node One hardware totem firmware providing:
 * - USB CDC serial communication (GPIO19/20, 115200 baud)
 * - COBS framed protocol with CRC8-MAXIM integrity
 * - DRV2605L haptic feedback via I2C
 * - Button input with debounce for "thick click" events
 * - Heartbeat response and spoon reporting
 * - Breathing sync with LED and haptic feedback
 *
 * Protocol v2.0: Added error codes, transaction IDs, validation
 * Canonical protocol: magic=0x31, CRC8 poly=0x31 init=0xFF, COBS framing
 */

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_DRV2605.h>
#include "protocol.h"

// ═══════════════════════════════════════════════════════════════════
// Pin Definitions
// ═══════════════════════════════════════════════════════════════════

#define BUTTON_PIN      0       // Boot button (GPIO0)
#define LED_PIN         48      // Onboard RGB LED (ESP32-S3 DevKitC)
#define I2C_SDA         8       // Default I2C SDA
#define I2C_SCL         9       // Default I2C SCL

// ═══════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════

#define DEBOUNCE_MS     50
#define HEARTBEAT_INTERVAL_MS  5000
#define SPOON_REPORT_INTERVAL_MS 10000

// ═══════════════════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════════════════

Adafruit_DRV2605 haptic;
bool hapticReady = false;

// Serial receive buffer
uint8_t rxBuffer[P31_MAX_FRAME_SIZE];
size_t rxIndex = 0;

// Transmit buffer
uint8_t txRaw[P31_MAX_FRAME_SIZE];
uint8_t txEncoded[P31_MAX_FRAME_SIZE + 2];

// Button state
bool lastButtonState = HIGH;
unsigned long lastDebounceTime = 0;
bool buttonPressed = false;

// Timing
unsigned long lastHeartbeat = 0;
unsigned long lastSpoonReport = 0;

// Spoon tracking (fixed point: value * 10)
uint16_t spoonsCurrent = SPOON_BASELINE;

// Statistics counters
uint32_t totalFramesReceived = 0;
uint32_t crcFailCount = 0;
uint32_t bufferOverflowCount = 0;
uint32_t unknownCmdCount = 0;

// Transaction ID counter for outbound frames
uint8_t txIdCounter = 0;

// Breathing state
bool breathingActive = false;
uint8_t breathingPhase = BREATH_PHASE_IDLE;
uint16_t breathingDuration = 0;  // Current phase duration in ms
unsigned long breathingPhaseStart = 0;

// ═══════════════════════════════════════════════════════════════════
// Frame Transmit
// ═══════════════════════════════════════════════════════════════════

/**
 * Build and send a frame: MAGIC | CMD | payload | CRC8, COBS encoded + delimiter
 */
void sendFrame(uint8_t cmd, const uint8_t *payload, size_t payloadLen) {
    // Build raw frame
    size_t rawLen = 2 + payloadLen;
    txRaw[0] = P31_MAGIC_BYTE;
    txRaw[1] = cmd;
    if (payloadLen > 0 && payload != nullptr) {
        memcpy(&txRaw[2], payload, payloadLen);
    }

    // Compute CRC8
    uint8_t crc = p31_crc8(txRaw, rawLen);
    txRaw[rawLen] = crc;
    rawLen++;

    // COBS encode
    size_t encodedLen = p31_cobs_encode(txRaw, rawLen, txEncoded);

    // Send encoded frame + delimiter
    Serial.write(txEncoded, encodedLen);
    Serial.write(P31_FRAME_DELIMITER);
}

/**
 * Send ACK with optional status byte
 */
void sendAck(uint8_t status = ERR_NONE) {
    uint8_t payload[1] = { status };
    sendFrame(CMD_ACK, payload, 1);
}

/**
 * Send NACK with error code
 */
void sendNack(uint8_t errorCode) {
    uint8_t payload[1] = { errorCode };
    sendFrame(CMD_NACK, payload, 1);
}

void sendClickEvent() {
    txIdCounter++;
    sendFrame(CMD_CLICK_EVENT, nullptr, 0);
}

void sendSpoonReport() {
    uint8_t payload[2];
    payload[0] = (spoonsCurrent >> 8) & 0xFF;
    payload[1] = spoonsCurrent & 0xFF;
    sendFrame(CMD_SPOON_REPORT, payload, 2);
}

void sendVersionReport() {
    uint8_t payload[3] = {
        FW_VERSION_MAJOR,
        FW_VERSION_MINOR,
        FW_VERSION_PATCH
    };
    sendFrame(CMD_VERSION_REPORT, payload, 3);
}

void sendStatsReport() {
    uint8_t payload[12];
    // Total frames (4 bytes, big-endian)
    payload[0] = (totalFramesReceived >> 24) & 0xFF;
    payload[1] = (totalFramesReceived >> 16) & 0xFF;
    payload[2] = (totalFramesReceived >> 8) & 0xFF;
    payload[3] = totalFramesReceived & 0xFF;
    // CRC failures (4 bytes)
    payload[4] = (crcFailCount >> 24) & 0xFF;
    payload[5] = (crcFailCount >> 16) & 0xFF;
    payload[6] = (crcFailCount >> 8) & 0xFF;
    payload[7] = crcFailCount & 0xFF;
    // Buffer overflows (4 bytes)
    payload[8] = (bufferOverflowCount >> 24) & 0xFF;
    payload[9] = (bufferOverflowCount >> 16) & 0xFF;
    payload[10] = (bufferOverflowCount >> 8) & 0xFF;
    payload[11] = bufferOverflowCount & 0xFF;
    sendFrame(CMD_STATS_REPORT, payload, 12);
}

// ═══════════════════════════════════════════════════════════════════
// Breathing LED Control
// ═══════════════════════════════════════════════════════════════════

void updateBreathingLED() {
    if (!breathingActive) {
        analogWrite(LED_PIN, 0);
        return;
    }

    unsigned long elapsed = millis() - breathingPhaseStart;
    float progress = (breathingDuration > 0) ? min(1.0f, (float)elapsed / breathingDuration) : 0;
    uint8_t brightness = 0;

    switch (breathingPhase) {
        case BREATH_PHASE_INHALE:
            // Fade in
            brightness = (uint8_t)(64 * progress);
            break;
        case BREATH_PHASE_HOLD:
            // Steady
            brightness = 64;
            break;
        case BREATH_PHASE_EXHALE:
            // Fade out
            brightness = (uint8_t)(64 * (1.0f - progress));
            break;
        default:
            brightness = 0;
            break;
    }

    analogWrite(LED_PIN, brightness);
}

// ═══════════════════════════════════════════════════════════════════
// Frame Receive & Parse
// ═══════════════════════════════════════════════════════════════════

void processFrame(const uint8_t *cobsData, size_t cobsLen) {
    uint8_t decoded[P31_MAX_FRAME_SIZE];
    size_t decodedLen = p31_cobs_decode(cobsData, cobsLen, decoded);

    totalFramesReceived++;

    // Minimum frame: magic + cmd + crc = 3 bytes
    if (decodedLen < 3) {
        sendNack(ERR_INVALID_LENGTH);
        return;
    }

    // Verify magic byte
    if (decoded[0] != P31_MAGIC_BYTE) {
        sendNack(ERR_INVALID_PARAM);
        return;
    }

    // Verify CRC8
    uint8_t receivedCrc = decoded[decodedLen - 1];
    uint8_t computedCrc = p31_crc8(decoded, decodedLen - 1);
    if (receivedCrc != computedCrc) {
        crcFailCount++;
        sendNack(ERR_CRC_FAIL);
        return;
    }

    // Extract command and payload
    uint8_t cmd = decoded[1];
    const uint8_t *payload = &decoded[2];
    size_t payloadLen = decodedLen - 3; // minus magic, cmd, crc

    // Handle commands
    switch (cmd) {
        case CMD_HEARTBEAT:
            sendAck();
            break;

        case CMD_HAPTIC:
            if (!hapticReady) {
                sendNack(ERR_HAPTIC_FAIL);
                break;
            }
            if (payloadLen < 1) {
                sendNack(ERR_INVALID_LENGTH);
                break;
            }
            // Validate waveform ID range
            if (payload[0] < MIN_WAVEFORM_ID || payload[0] > MAX_WAVEFORM_ID) {
                sendNack(ERR_INVALID_PARAM);
                break;
            }
            haptic.stop();
            haptic.setWaveform(0, payload[0]);
            haptic.setWaveform(1, 0);
            haptic.go();
            sendAck();
            break;

        case CMD_LED:
            if (payloadLen < 1) {
                sendNack(ERR_INVALID_LENGTH);
                break;
            }
            analogWrite(LED_PIN, payload[0]);
            sendAck();
            break;

        case CMD_BREATHING_SYNC:
            if (payloadLen >= 3) {
                breathingActive = payload[0] > 0;
                breathingPhase = payload[1];
                breathingDuration = payload[2] * 100;  // Convert from 100ms units to ms
                breathingPhaseStart = millis();

                // Haptic feedback for phase transitions
                if (hapticReady && breathingActive) {
                    haptic.stop();
                    if (breathingPhase == BREATH_PHASE_INHALE) {
                        haptic.setWaveform(0, HAPTIC_SOFT_BUMP);
                        haptic.setWaveform(1, 0);
                        haptic.go();
                    } else if (breathingPhase == BREATH_PHASE_EXHALE) {
                        haptic.setWaveform(0, HAPTIC_CLICK);
                        haptic.setWaveform(1, 0);
                        haptic.go();
                    }
                }

                // Update LED immediately
                updateBreathingLED();
                sendAck();
            } else {
                sendNack(ERR_INVALID_LENGTH);
            }
            break;

        case CMD_VERSION_QUERY:
            sendVersionReport();
            break;

        case CMD_STATS_QUERY:
            sendStatsReport();
            break;

        default:
            // Unknown command
            unknownCmdCount++;
            sendNack(ERR_UNKNOWN_CMD);
            break;
    }
}

void readSerial() {
    while (Serial.available()) {
        uint8_t byte = Serial.read();

        if (byte == P31_FRAME_DELIMITER) {
            if (rxIndex > 0) {
                processFrame(rxBuffer, rxIndex);
                rxIndex = 0;
            }
        } else {
            if (rxIndex < P31_MAX_FRAME_SIZE) {
                rxBuffer[rxIndex++] = byte;
            } else {
                // Buffer overflow — reset and notify
                bufferOverflowCount++;
                rxIndex = 0;
                sendNack(ERR_BUFFER_OVERFLOW);
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// Button Handling
// ═══════════════════════════════════════════════════════════════════

void checkButton() {
    bool reading = digitalRead(BUTTON_PIN);
    unsigned long now = millis();

    if (reading != lastButtonState) {
        lastDebounceTime = now;
    }

    if ((now - lastDebounceTime) > DEBOUNCE_MS) {
        if (reading == LOW && !buttonPressed) {
            buttonPressed = true;

            // Thick Click event!
            sendClickEvent();

            // Haptic feedback
            if (hapticReady) {
                haptic.stop();
                haptic.setWaveform(0, HAPTIC_CLICK);
                haptic.setWaveform(1, 0);
                haptic.go();
            }

            // Restore spoons (0.5 = 5 in fixed point)
            spoonsCurrent = min((uint16_t)(spoonsCurrent + SPOON_CLICK_RESTORE),
                               (uint16_t)SPOON_BASELINE);
        }

        if (reading == HIGH) {
            buttonPressed = false;
        }
    }

    lastButtonState = reading;
}

// ═══════════════════════════════════════════════════════════════════
// Setup & Loop
// ═══════════════════════════════════════════════════════════════════

void setup() {
    // USB CDC Serial
    Serial.begin(P31_BAUD_RATE);

    // GPIO
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);
    analogWrite(LED_PIN, 0);

    // I2C + Haptic
    Wire.begin(I2C_SDA, I2C_SCL);
    if (haptic.begin()) {
        hapticReady = true;
        haptic.selectLibrary(1);
        haptic.setMode(DRV2605_MODE_INTTRIG);

        // LRA closed-loop feedback control (register 0x1A = 0xB6)
        // Enables back-EMF sensing for LRA actuators — prevents overdrive
        Wire.beginTransmission(0x5A);
        Wire.write(0x1A);
        Wire.write(0xB6);
        if (Wire.endTransmission() != 0) {
            hapticReady = false;
        }

        // Startup haptic: gentle bump
        if (hapticReady) {
            haptic.setWaveform(0, HAPTIC_SOFT_BUMP);
            haptic.setWaveform(1, 0);
            haptic.go();
        }
    }

    // Startup LED blink
    for (int i = 0; i < 3; i++) {
        analogWrite(LED_PIN, 64);
        delay(100);
        analogWrite(LED_PIN, 0);
        delay(100);
    }
}

void loop() {
    unsigned long now = millis();

    // Process incoming serial
    readSerial();

    // Check button
    checkButton();

    // Update breathing LED if active
    if (breathingActive) {
        updateBreathingLED();
    }

    // Periodic heartbeat (to indicate firmware is alive)
    if (now - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
        lastHeartbeat = now;
        sendFrame(CMD_HEARTBEAT, nullptr, 0);
    }

    // Periodic spoon report
    if (now - lastSpoonReport >= SPOON_REPORT_INTERVAL_MS) {
        lastSpoonReport = now;
        sendSpoonReport();
    }
}
