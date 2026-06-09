/**
 * ESP32 BLE Proxy Network - Sovereign BLE Beacon
 * 
 * Phase 3 Implementation for Spaceship Earth
 * 
 * Creates iBeacon advertisements with zone-specific UUIDs for RSSI triangulation
 * Uses NimBLE-Arduino library for minimal power consumption
 * 
 * Zone Configuration:
 * - Dad Zone: 12345678-1234-5678-1234-56789abcdef0
 * - Bash Zone: 12345678-1234-5678-1234-56789abcdef1  
 * - Kitchen:   12345678-1234-5678-1234-56789abcdef2
 */

#include <NimBLEDevice.h>
#include <NimBLEAdvertising.h>

// Zone Configuration - Change this for each ESP32
#define ZONE_ID 1  // 1 = Dad Zone, 2 = Bash Zone, 3 = Kitchen

// Zone-specific UUIDs (must match WCD-SE03 specification)
const char* ZONE_UUIDS[] = {
  "12345678-1234-5678-1234-56789abcdef0",  // Dad Zone (Ordered/Quiet)
  "12345678-1234-5678-1234-56789abcdef1",  // Bash Zone (High Kinetic)
  "12345678-1234-5678-1234-56789abcdef2"   // Kitchen (Utility/Fluid)
};

// iBeacon constants
#define BEACON_MAJOR 1000
#define BEACON_MINOR 1
#define BEACON_TX_POWER -59  // TX Power at 1 meter

// Advertising configuration
#define ADVERTISING_INTERVAL 100  // ms
#define DEVICE_NAME "SpaceshipEarth_Beacon"

// Global variables
NimBLEAdvertising* pAdvertising;
bool advertisingStarted = false;

/**
 * Convert UUID string to byte array for iBeacon
 */
void uuidStringToBytes(const char* uuidStr, uint8_t* bytes) {
  // Remove hyphens and convert hex string to bytes
  int byteIndex = 0;
  for (int i = 0; i < 36; i++) {
    if (uuidStr[i] == '-') continue;
    
    char hexChar = uuidStr[i];
    uint8_t value;
    
    if (hexChar >= '0' && hexChar <= '9') {
      value = hexChar - '0';
    } else if (hexChar >= 'a' && hexChar <= 'f') {
      value = hexChar - 'a' + 10;
    } else if (hexChar >= 'A' && hexChar <= 'F') {
      value = hexChar - 'A' + 10;
    } else {
      value = 0;
    }
    
    // Pack two hex characters into one byte
    if (i % 2 == 0) {
      bytes[byteIndex] = value << 4;
    } else {
      bytes[byteIndex] |= value;
      byteIndex++;
    }
  }
}

/**
 * Create iBeacon advertisement data
 */
void setupBeaconAdvertisement() {
  // Get the UUID for this zone
  const char* zoneUUID = ZONE_UUIDS[ZONE_ID - 1];
  
  // Convert UUID string to bytes
  uint8_t uuidBytes[16];
  uuidStringToBytes(zoneUUID, uuidBytes);
  
  // Create iBeacon advertisement data
  // iBeacon format: [Type][Length][UUID][Major][Minor][TX Power]
  uint8_t beaconData[25];
  int index = 0;
  
  // iBeacon prefix
  beaconData[index++] = 0x4C;  // Apple Company ID (MSB)
  beaconData[index++] = 0x00;  // Apple Company ID (LSB)
  beaconData[index++] = 0x02;  // iBeacon type
  beaconData[index++] = 0x15;  // iBeacon length
  
  // UUID (16 bytes)
  for (int i = 0; i < 16; i++) {
    beaconData[index++] = uuidBytes[i];
  }
  
  // Major (2 bytes, big endian)
  beaconData[index++] = (BEACON_MAJOR >> 8) & 0xFF;
  beaconData[index++] = BEACON_MAJOR & 0xFF;
  
  // Minor (2 bytes, big endian)
  beaconData[index++] = (BEACON_MINOR >> 8) & 0xFF;
  beaconData[index++] = BEACON_MINOR & 0xFF;
  
  // TX Power (signed byte)
  beaconData[index++] = BEACON_TX_POWER;
  
  // Configure advertising
  NimBLEAdvertisementData advertisementData;
  advertisementData.setFlags(0x06);  // General discoverable, BR/EDR not supported
  
  // Set manufacturer data (iBeacon)
  advertisementData.setManufacturerData(std::string((char*)beaconData, 25));
  
  // Set device name
  advertisementData.setName(DEVICE_NAME);
  
  // Configure advertising
  pAdvertising = NimBLEDevice::getAdvertising();
  pAdvertising->setAdvertisementData(advertisementData);
  
  // Set advertising parameters
  pAdvertising->setMinInterval(ADVERTISING_INTERVAL * 8);  // Convert to 0.625ms units
  pAdvertising->setMaxInterval(ADVERTISING_INTERVAL * 8);
  pAdvertising->setScanResponse(false);
  
  // Set TX power for optimal range
  NimBLEDevice::setPower(ESP_PWR_LVL_P3);  // 3dBm TX power
}

/**
 * Setup function - runs once on startup
 */
void setup() {
  // Initialize serial communication
  Serial.begin(115200);
  while (!Serial) {
    delay(100);
  }
  
  Serial.println("\n=== Spaceship Earth BLE Proxy ===");
  Serial.print("Zone ID: ");
  Serial.println(ZONE_ID);
  Serial.print("Zone UUID: ");
  Serial.println(ZONE_UUIDS[ZONE_ID - 1]);
  Serial.println("Starting BLE beacon...");
  
  // Initialize NimBLE
  NimBLEDevice::init("");
  NimBLEDevice::setSecurityAuth(false, false, false);  // No security needed for broadcast
  
  // Setup beacon advertisement
  setupBeaconAdvertisement();
  
  // Start advertising
  NimBLEDevice::startAdvertising();
  advertisingStarted = true;
  
  Serial.println("BLE beacon started successfully!");
  Serial.println("Device will continuously broadcast iBeacon signal");
  Serial.println("Use chrome://flags/#enable-experimental-web-platform-features in Chrome");
  Serial.println();
}

/**
 * Main loop - minimal processing for power efficiency
 */
void loop() {
  // Minimal loop for power efficiency
  // NimBLE handles advertising automatically
  
  static unsigned long lastStatusTime = 0;
  unsigned long currentTime = millis();
  
  // Print status every 30 seconds
  if (currentTime - lastStatusTime > 30000) {
    lastStatusTime = currentTime;
    
    Serial.print("Beacon active - Zone: ");
    Serial.print(ZONE_ID);
    Serial.print(" - UUID: ");
    Serial.println(ZONE_UUIDS[ZONE_ID - 1]);
    Serial.print("RSSI threshold target: -60dBm for IMMEDIATE zone");
    Serial.println();
  }
  
  // Sleep for a short time to reduce power consumption
  delay(1000);
}

/**
 * Error handling for critical failures
 */
void handleError(const char* error) {
  Serial.print("ERROR: ");
  Serial.println(error);
  Serial.println("System will restart in 5 seconds...");
  delay(5000);
  ESP.restart();
}