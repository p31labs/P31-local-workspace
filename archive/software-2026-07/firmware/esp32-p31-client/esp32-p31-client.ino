/*
 * P31 ESP32 Client — Device Mesh Endpoint
 * P31 Labs, Inc. | EIN 42-1888158 | AGPL-3.0
 *
 * Arduino C++ firmware for ESP32 family microcontrollers.
 * Connects to the P31 Device Mesh via WebSocket to Shadow Bridge.
 * Sends sensor telemetry → Genesis Gate → SHA-256 hash chain.
 * Receives OTA firmware updates via R2 presigned URLs.
 *
 * Hardware requirements:
 *   - ESP32 (any variant: ESP32-S3, ESP32-C3, etc.)
 *   - WiFi connectivity
 *   - Optional: BME280 (temp/humidity/pressure), PMS5003 (air quality),
 *     MAX30102 (heart rate), MPU6050 (accelerometer/gyro)
 *
 * Memory: <200KB RAM usage, <1.5MB flash (with all sensors)
 *
 * Setup:
 *   1. Install Arduino IDE + ESP32 board support
 *   2. Install libraries: WiFi, WebSockets_Generic, ArduinoJson, Adafruit_BME280
 *   3. Create secrets.h with WIFI_SSID, WIFI_PASS, DEVICE_ID, FAMILY_ID
 *   4. Upload to ESP32
 */

#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// ── Configuration ──────────────────────────────────────────────────
#include "secrets.h"

#ifndef WIFI_SSID
#define WIFI_SSID "P31-Mesh"
#endif
#ifndef WIFI_PASS
#define WIFI_PASS "p31labs"
#endif
#ifndef DEVICE_ID
#define DEVICE_ID "esp32_node_001"
#endif
#ifndef FAMILY_ID
#define FAMILY_ID "did:p31:family:default"
#endif

const char* SHADOW_BRIDGE_HOST = "shadow-bridge.trimtab-signal.workers.dev";
const int SHADOW_BRIDGE_PORT = 443;
const char* SHADOW_BRIDGE_PATH = "/device/ws";
const int HEARTBEAT_INTERVAL_MS = 30000;  // 30 seconds
const int TELEMETRY_INTERVAL_MS = 60000;  // 60 seconds

// ── Globals ─────────────────────────────────────────────────────────
WebSocketsClient webSocket;
unsigned long lastHeartbeat = 0;
unsigned long lastTelemetry = 0;
unsigned long uptime = 0;
bool registered = false;
String deviceName = String(DEVICE_ID);

// ── Sensor data (fill in if you have sensors connected) ───────────
struct SensorData {
  float temperature = 0;
  float humidity = 0;
  float pressure = 0;
  int airQuality = 0;
  int heartRate = 0;
  float batteryVoltage = 3.3;
  int wifiRSSI = 0;
  float accelX = 0, accelY = 0, accelZ = 0;
  unsigned long freeHeap = ESP.getFreeHeap();
};

SensorData sensor;

// ── Forward declarations ────────────────────────────────────────────
void registerDevice();
void sendHeartbeat();
void sendTelemetry();
void readSensors();
void onWebSocketEvent(WStype_t type, uint8_t *payload, size_t length);

// ── Setup ───────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\nP31 ESP32 Client v1.0.0");
  Serial.println("Device Mesh Endpoint | P31 Labs, Inc. | EIN 42-1888158");

  // WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nWiFi failed. Entering deep sleep for 60s.");
    esp_sleep_enable_timer_wakeup(60 * 1000000);
    esp_deep_sleep_start();
    return;
  }

  Serial.println("\nWiFi connected. IP: " + WiFi.localIP().toString());
  Serial.println("RSSI: " + String(WiFi.RSSI()) + " dBm");

  // WebSocket
  webSocket.beginSSL(SHADOW_BRIDGE_HOST, SHADOW_BRIDGE_PORT, SHADOW_BRIDGE_PATH);
  webSocket.onEvent(onWebSocketEvent);
  webSocket.setReconnectInterval(5000);
  Serial.println("WebSocket connecting to " + String(SHADOW_BRIDGE_HOST));
}

// ── Loop ────────────────────────────────────────────────────────────
void loop() {
  webSocket.loop();
  unsigned long now = millis();

  if (now - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeat = now;
    if (registered) sendHeartbeat();
  }

  if (now - lastTelemetry >= TELEMETRY_INTERVAL_MS) {
    lastTelemetry = now;
    readSensors();
    if (registered) sendTelemetry();
  }
}

// ── WebSocket Event Handler ─────────────────────────────────────────
void onWebSocketEvent(WStype_t type, uint8_t *payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      Serial.println("WebSocket connected to Shadow Bridge");
      registerDevice();
      break;

    case WStype_TEXT: {
      StaticJsonDocument<512> doc;
      DeserializationError err = deserializeJson(doc, payload, length);
      if (!err) {
        const char* msgType = doc["type"];
        if (strcmp(msgType, "register_ok") == 0) {
          registered = true;
          Serial.println("Device registered successfully");
        } else if (strcmp(msgType, "ota_update") == 0) {
          const char* url = doc["url"];
          Serial.println("OTA update available: " + String(url));
          // OTA flow: download firmware.bin from R2 presigned URL, apply update
          // ESPhttpUpdate.update(client, url);
        } else if (strcmp(msgType, "command") == 0) {
          const char* cmd = doc["command"];
          Serial.println("Command received: " + String(cmd));
          if (strcmp(cmd, "restart") == 0) ESP.restart();
          if (strcmp(cmd, "deep_sleep") == 0) {
            int secs = doc["seconds"] | 60;
            esp_sleep_enable_timer_wakeup(secs * 1000000ULL);
            esp_deep_sleep_start();
          }
        }
      }
      break;
    }

    case WStype_DISCONNECTED:
      Serial.println("WebSocket disconnected. Reconnecting...");
      registered = false;
      break;

    case WStype_ERROR:
      Serial.println("WebSocket error");
      break;
  }
}

// ── Register Device ─────────────────────────────────────────────────
void registerDevice() {
  StaticJsonDocument<256> doc;
  doc["type"] = "device_register";
  doc["deviceId"] = DEVICE_ID;
  doc["familyId"] = FAMILY_ID;
  doc["deviceType"] = "esp32";
  doc["name"] = deviceName;
  doc["ip"] = WiFi.localIP().toString();
  doc["os"] = "esp32-arduino";
  doc["firmwareVersion"] = "1.0.0";
  doc["meshIp"] = WiFi.localIP().toString();

  JsonArray caps = doc.createNestedArray("capabilities");
  caps.add("wifi"); caps.add("ble"); caps.add("sensors");

  JsonArray sensorTypes = doc.createNestedArray("sensorTypes");
  sensorTypes.add("temperature"); sensorTypes.add("humidity");
  sensorTypes.add("wifi_rssi"); sensorTypes.add("battery");
  sensorTypes.add("free_heap");

  String payload;
  serializeJson(doc, payload);
  webSocket.sendTXT(payload);

  Serial.println("Registration sent for " + deviceName);
}

// ── Heartbeat ───────────────────────────────────────────────────────
void sendHeartbeat() {
  StaticJsonDocument<128> doc;
  doc["type"] = "device_heartbeat";
  doc["deviceId"] = DEVICE_ID;
  doc["batteryLevel"] = sensor.batteryVoltage * 30; // 3.3V → ~100%
  doc["uptime"] = millis() / 1000;
  doc["freeHeap"] = ESP.getFreeHeap();

  String payload;
  serializeJson(doc, payload);
  webSocket.sendTXT(payload);
}

// ── Telemetry ───────────────────────────────────────────────────────
void sendTelemetry() {
  StaticJsonDocument<384> doc;
  doc["type"] = "device_telemetry";
  doc["deviceId"] = DEVICE_ID;

  JsonObject data = doc.createNestedObject("data");
  data["temperature"] = sensor.temperature;
  data["humidity"] = sensor.humidity;
  data["pressure"] = sensor.pressure;
  data["air_quality"] = sensor.airQuality;
  data["heart_rate"] = sensor.heartRate;
  data["battery_voltage"] = sensor.batteryVoltage;
  data["wifi_rssi"] = sensor.wifiRSSI;
  data["accel_x"] = sensor.accelX;
  data["accel_y"] = sensor.accelY;
  data["accel_z"] = sensor.accelZ;
  data["free_heap"] = sensor.freeHeap;
  data["uptime_seconds"] = millis() / 1000;

  String payload;
  serializeJson(doc, payload);
  webSocket.sendTXT(payload);

  Serial.println("Telemetry sent | Temp: " + String(sensor.temperature) +
                 "°C | RSSI: " + String(sensor.wifiRSSI) + "dBm | Heap: " +
                 String(sensor.freeHeap) + "B");
}

// ── Read Sensors ────────────────────────────────────────────────────
void readSensors() {
  sensor.wifiRSSI = WiFi.RSSI();
  sensor.freeHeap = ESP.getFreeHeap();

  // BME280 — Temperature, Humidity, Pressure
  // Adafruit_BME280 bme;
  // if (bme.begin(0x76)) {
  //   sensor.temperature = bme.readTemperature();
  //   sensor.humidity = bme.readHumidity();
  //   sensor.pressure = bme.readPressure() / 100.0;
  // }

  // PMS5003 — Air Quality
  // sensor.airQuality = pms.readPM25();

  // MAX30102 — Heart Rate
  // sensor.heartRate = max30102.getHeartRate();

  // MPU6050 — Accelerometer
  // sensor.accelX = mpu.getAccX();
  // sensor.accelY = mpu.getAccY();
  // sensor.accelZ = mpu.getAccZ();

  // Battery voltage (via ADC)
  sensor.batteryVoltage = analogRead(34) * (3.3 / 4095.0) * 2; // Voltage divider
}
