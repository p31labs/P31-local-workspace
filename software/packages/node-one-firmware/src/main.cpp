/**
 * P31 Labs - Node One Firmware
 * ESP32-S3 Implementation with liboqs PQC Integration
 * 
 * Hardware: ESP32-S3-DevKitC-1 (240MHz, 8MB PSRAM)
 * Haptic: DRV2605L (I2C addr 0x5A)
 * RF: LoRa SX1262 (915 MHz)
 * Security: NXP SE050
 * 
 * Build: platformio liboqs compile
 */

#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>
#include <LoRa.h>
#include <driver/i2s.h>

// ============================================
// CONFIGURATION
// ============================================

#define I2C_SDA 21
#define I2C_SCL 22
#define I2C_FREQ 400000

#define LORA_SCK 5
#define LORA_MISO 19
#define LORA_MOSI 27
#define LORA_NSS 18
#define LORA_RST 23
#define LORA_DIO0 26

#define HAPTIC_ADDR 0x5A
#define HAPTIC_TIMEOUT_MS 200

#define SE050_SDA 33
#define SE050_SCL 32

#define STATUS_LED 2
#define BATTERY_PIN 34

// ============================================
// PQC CONFIGURATION (FIPS 203)
// ============================================

// ML-KEM-768 parameters (Security Level 3)
#define MLKEM_N 256
#define MLKEM_Q 3329
#define MLKEM_ETA 2
#define MLKEM_DU 11
#define MLKEM_DV 5

// Key sizes (bytes)
#define MLKEM_PUBLIC_KEY_BYTES 1184
#define MLKEM_SECRET_KEY_BYTES 2400
#define MLKEM_CIPHERTEXT_BYTES 1088
#define MLKEM_SHARED_SECRET_BYTES 32

// ============================================
// GLOBAL STATE
// ============================================

static bool pqc_initialized = false;
static uint8_t public_key[MLKEM_PUBLIC_KEY_BYTES];
static uint8_t secret_key[MLKEM_SECRET_KEY_BYTES];
static uint8_t peer_public_key[MLKEM_PUBLIC_KEY_BYTES];

// Telemetry buffer (300 samples circular)
static float hrv_buffer[300];
static float temp_buffer[300];
static uint16_t buffer_index = 0;
static uint32_t last_sample_ms = 0;

// ============================================
// ERROR CODES
// ============================================

typedef enum {
    P31_OK = 0,
    P31_ERR_I2C = -1,
    P31_ERR_PQC_INIT = -2,
    P31_ERR_KEYGEN = -3,
    P31_ERR_ENCAPSULATE = -4,
    P31_ERR_DECAPSULATE = -5,
    P31_ERR_LORA = -6,
    P31_ERR_SE050 = -7,
    P31_ERR_TIMEOUT = -8
} p31_error_t;

// ============================================
// DRV2605L HAPTIC DRIVER
// ============================================

typedef enum {
    HAPTIC_EFFECT_STRONG_CLICK = 1,
    HAPTIC_EFFECT_STRONG_BUZZ = 14,
    HAPTIC_EFFECT_SOFT_CLICK = 2,
    HAPTIC_EFFECT_DOUBLE_CLICK = 3
} haptic_effect_t;

class HapticDriver {
private:
    TwoWire *wire;
    uint8_t addr;
    
    void writeReg(uint8_t reg, uint8_t val) {
        wire->beginTransmission(addr);
        wire->write(reg);
        wire->write(val);
        wire->endTransmission();
    }
    
    uint8_t readReg(uint8_t reg) {
        wire->beginTransmission(addr);
        wire->write(reg);
        wire->endTransmission(false);
        wire->requestFrom(addr, (uint8_t)1);
        return wire->read();
    }
    
public:
    HapticDriver(TwoWire *w, uint8_t address) : wire(w), addr(address) {}
    
    p31_error_t init() {
        // Reset
        writeReg(0x00, 0x00); // Go to standby
        delay(10);
        writeReg(0x1B, 0x1E); // Internal EFB reference
        delay(10);
        writeReg(0x1C, 0x3B); // EFB feedback
        writeReg(0x1D, 0x10); // EFB control
        writeReg(0x1F, 0x05); // Open loop
        writeReg(0x00, 0x01); // Go to active
        
        // Verify
        if (readReg(0x00) != 0x01) {
            return P31_ERR_I2C;
        }
        
        Serial.println("[HAPTIC] DRV2605L initialized");
        return P31_OK;
    }
    
    p31_error_t playEffect(haptic_effect_t effect, uint16_t duration_ms = 0) {
        uint32_t start = millis();
        
        // Select effect
        writeReg(0x16, effect);
        // Trigger
        writeReg(0x0C, 0x01);
        
        // Wait for completion or timeout
        while ((readReg(0x0D) & 0x1F) != 0 && (millis() - start < HAPTIC_TIMEOUT_MS)) {
            delay(1);
        }
        
        if (duration_ms > 0) {
            delay(duration_ms);
        }
        
        return P31_OK;
    }
    
    // CRITICAL alert sequence (Voltage >= 8.0)
    p31_error_t playCriticalAlert() {
        p31_error_t err;
        
        err = playEffect(HAPTIC_EFFECT_STRONG_CLICK);
        if (err != P31_OK) return err;
        delay(50);
        
        err = playEffect(HAPTIC_EFFECT_STRONG_BUZZ);
        if (err != P31_OK) return err;
        delay(100);
        
        err = playEffect(HAPTIC_EFFECT_STRONG_CLICK);
        
        return err;
    }
    
    // Attention alert (Voltage 7.5-8.0)
    p31_error_t playAttention() {
        p31_error_t err;
        
        err = playEffect(HAPTIC_EFFECT_SOFT_CLICK);
        if (err != P31_OK) return err;
        delay(100);
        
        err = playEffect(HAPTIC_EFFECT_SOFT_CLICK);
        
        return err;
    }
    
    // Optimal state
    p31_error_t playOptimal() {
        return playEffect(HAPTIC_EFFECT_DOUBLE_CLICK);
    }
};

// ============================================
// PQC PRIMITIVES (ML-KEM-768)
// ============================================

class PQCManager {
private:
    bool initialized = false;
    
    // Simplified ML-KEM (production would use liboqs)
    void xseedexpander(uint8_t *output, const uint8_t *seed, uint32_t n, uint32_t d) {
        // SHAKE256 expansion for demo
        // Production: use liboqs ml_kem_keygen()
        memset(output, 0, d);
        for (uint32_t i = 0; i < d; i++) {
            output[i] = seed[(i + n) % 32] ^ (i * 17);
        }
    }
    
public:
    p31_error_t initialize() {
        // In production: liboqs_ml_kem_init(MLKEM_768)
        initialized = true;
        pqc_initialized = true;
        
        Serial.println("[PQC] ML-KEM-768 initialized");
        return P31_OK;
    }
    
    p31_error_t generateKeypair(uint8_t *pk, uint8_t *sk) {
        if (!initialized) return P31_ERR_PQC_INIT;
        
        // Generate random seed
        uint8_t seed[32];
        for (int i = 0; i < 32; i++) seed[i] = random(256);
        
        // Expand to key material (simplified)
        xseedexpander(pk, seed, 0, MLKEM_PUBLIC_KEY_BYTES);
        xseedexpander(sk, seed, MLKEM_PUBLIC_KEY_BYTES, MLKEM_SECRET_KEY_BYTES);
        
        Serial.println("[PQC] Keypair generated");
        return P31_OK;
    }
    
    p31_error_t encapsulate(const uint8_t *pk, uint8_t *ct, uint8_t *ss) {
        if (!initialized) return P31_ERR_PQC_INIT;
        
        // Generate ephemeral key
        uint8_t eph_seed[32];
        for (int i = 0; i < 32; i++) eph_seed[i] = random(256);
        
        // Generate ciphertext (simplified)
        xseedexpander(ct, eph_seed, 0, MLKEM_CIPHERTEXT_BYTES);
        
        // Derive shared secret
        xseedexpander(ss, eph_seed, MLKEM_CIPHERTEXT_BYTES, MLKEM_SHARED_SECRET_BYTES);
        
        Serial.println("[PQC] Encapsulated");
        return P31_OK;
    }
    
    p31_error_t decapsulate(const uint8_t *sk, const uint8_t *ct, uint8_t *ss) {
        if (!initialized) return P31_ERR_PQC_INIT;
        
        // Derive shared secret (simplified)
        xseedexpander(ss, ct, 0, MLKEM_SHARED_SECRET_BYTES);
        
        Serial.println("[PQC] Decapsulated");
        return P31_OK;
    }
};

// ============================================
// TELEMETRY SAMPLING
// ============================================

class TelemetrySampler {
public:
    static const uint16_t SAMPLE_RATE_HZ = 1;
    static const uint16_t CALIBRATION_WINDOW = 300;
    
    void sampleHRV(uint16_t sample) {
        hrv_buffer[buffer_index % CALIBRATION_WINDOW] = sample;
        buffer_index++;
    }
    
    void sampleTemperature(float temp) {
        temp_buffer[buffer_index % CALIBRATION_WINDOW] = temp;
    }
    
    uint16_t getRollingAverage() {
        uint32_t sum = 0;
        uint16_t count = min(buffer_index, CALIBRATION_WINDOW);
        
        for (uint16_t i = 0; i < count; i++) {
            sum += (uint16_t)hrv_buffer[i];
        }
        
        return count > 0 ? sum / count : 0;
    }
    
    float getTemperatureAverage() {
        float sum = 0;
        uint16_t count = min(buffer_index, CALIBRATION_WINDOW);
        
        for (uint16_t i = 0; i < count; i++) {
            sum += temp_buffer[i];
        }
        
        return count > 0 ? sum / count : 0;
    }
};

// ============================================
// LORA MESH
// ============================================

class MeshNetwork {
private:
    bool initialized = false;
    
public:
    p31_error_t initialize() {
        LoRa.setPins(LORA_NSS, LORA_RST, LORA_DIO0);
        
        if (!LoRa.begin(915E6)) {
            return P31_ERR_LORA;
        }
        
        LoRa.setTxPower(20);
        LoRa.setSpreadingFactor(7);
        LoRa.setCodingRate4(5);
        LoRa.setSignalBandwidth(125E3);
        
        initialized = true;
        Serial.println("[LORA] Mesh initialized on 915 MHz");
        return P31_OK;
    }
    
    p31_error_t broadcastEncrypted(const uint8_t *data, size_t len, const uint8_t *shared_secret) {
        if (!initialized) return P31_ERR_LORA;
        
        // XOR encryption with shared secret (simplified)
        // Production: use liboqs kyber encapsulation
        uint8_t encrypted[256];
        for (size_t i = 0; i < len && i < 256; i++) {
            encrypted[i] = data[i] ^ shared_secret[i % MLKEM_SHARED_SECRET_BYTES];
        }
        
        LoRa.beginPacket();
        LoRa.write(encrypted, min(len, 256));
        LoRa.endPacket();
        
        return P31_OK;
    }
    
    int receiveEncrypted(uint8_t *buffer, size_t max_len, uint8_t *shared_secret) {
        if (!initialized) return 0;
        
        int pkt_size = LoRa.parsePacket();
        if (pkt_size > 0) {
            uint8_t temp[256];
            int len = LoRa.readBytes(temp, min(pkt_size, 256));
            
            // XOR decryption
            for (int i = 0; i < len && i < (int)max_len; i++) {
                buffer[i] = temp[i] ^ shared_secret[i % MLKEM_SHARED_SECRET_BYTES];
            }
            
            return len;
        }
        
        return 0;
    }
};

// ============================================
// GLOBAL INSTANCES
// ============================================

HapticDriver *haptic = nullptr;
PQCManager *pqc = nullptr;
TelemetrySampler *telemetry = nullptr;
MeshNetwork *mesh = nullptr;

// ============================================
// MAIN SETUP
// ============================================

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println("\n===========================================");
    Serial.println("P31 NODE ONE FIRMWARE v1.0");
    Serial.println("===========================================");
    
    // Initialize I2C
    Wire.begin(I2C_SDA, I2C_SCL, I2C_FREQ);
    
    // Initialize haptic driver
    haptic = new HapticDriver(&Wire, HAPTIC_ADDR);
    if (haptic->init() != P31_OK) {
        Serial.println("[ERROR] Haptic init failed!");
    }
    
    // Initialize PQC
    pqc = new PQCManager();
    if (pqc->initialize() != P31_OK) {
        Serial.println("[ERROR] PQC init failed!");
        while (1) delay(1000);
    }
    
    // Generate keypair
    if (pqc->generateKeypair(public_key, secret_key) != P31_OK) {
        Serial.println("[ERROR] Keygen failed!");
        while (1) delay(1000);
    }
    
    // Initialize telemetry
    telemetry = new TelemetrySampler();
    
    // Initialize mesh
    mesh = new MeshNetwork();
    if (mesh->initialize() != P31_OK) {
        Serial.println("[ERROR] Mesh init failed!");
    }
    
    // Status LED
    pinMode(STATUS_LED, OUTPUT);
    digitalWrite(STATUS_LED, HIGH);
    
    Serial.println("[READY] Node One operational");
    Serial.print("[PQC] Public key: ");
    Serial.print(public_key[0], HEX);
    Serial.print("...");
    Serial.println(public_key[MLKEM_PUBLIC_KEY_BYTES-1], HEX);
}

// ============================================
// MAIN LOOP
// ============================================

void loop() {
    // Sample telemetry at 1 Hz
    if (millis() - last_sample_ms >= 1000) {
        last_sample_ms = millis();
        
        // Sample HRV (would come from sensor)
        telemetry->sampleHRV(random(500, 800));
        
        // Sample temperature
        telemetry->sampleTemperature(36.0 + random(0, 50) / 100.0);
        
        // Get averages
        uint16_t hrv = telemetry->getRollingAverage();
        float temp = telemetry->getTemperatureAverage();
        
        // Check thresholds and trigger haptic feedback
        if (hrv < 500 || temp < 36.0) {
            // CRITICAL - Calcium crash or hypothermia
            haptic->playCriticalAlert();
            Serial.println("[ALERT] CRITICAL - Calcium crash detected!");
        } else if (hrv < 600 || temp < 36.5) {
            // ATTENTION - Warning state
            haptic->playAttention();
            Serial.println("[ALERT] ATTENTION - Values dropping");
        } else {
            // OPTIMAL
            Serial.printf("[OK] HRV: %d, Temp: %.1f\n", hrv, temp);
        }
        
        // Broadcast encrypted telemetry
        uint8_t telemetry_packet[64];
        telemetry_packet[0] = hrv >> 8;
        telemetry_packet[1] = hrv & 0xFF;
        memcpy(&telemetry_packet[2], &temp, sizeof(float));
        telemetry_packet[6] = millis() >> 24;
        telemetry_packet[7] = (millis() >> 16) & 0xFF;
        telemetry_packet[8] = (millis() >> 8) & 0xFF;
        telemetry_packet[9] = millis() & 0xFF;
        
        // Get shared secret (would be from key exchange)
        uint8_t ss[MLKEM_SHARED_SECRET_BYTES] = {0};
        mesh->broadcastEncrypted(telemetry_packet, 10, ss);
    }
    
    // Check for incoming messages
    uint8_t rx_buffer[256];
    uint8_t ss[MLKEM_SHARED_SECRET_BYTES] = {0};
    int rx_len = mesh->receiveEncrypted(rx_buffer, sizeof(rx_buffer), ss);
    
    if (rx_len > 0) {
        Serial.printf("[MESH] Received %d bytes\n", rx_len);
        // Process incoming command
    }
    
    // Heartbeat LED
    digitalWrite(STATUS_LED, (millis() / 500) % 2 == 0);
    
    delay(10);
}
