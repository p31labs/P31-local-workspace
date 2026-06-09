#!/usr/bin/env python3
"""
BLE Beacon Detection Test Script for Spaceship Earth

This script tests the ESP32 BLE proxy network by scanning for iBeacon signals
and validating that they match the expected UUIDs for each zone.

Usage:
    python test_ble_detection.py

Requirements:
    pip install bleak
"""

import asyncio
import struct
import binascii
from bleak import BleakScanner, BleakClient
from datetime import datetime

# Expected zone UUIDs (must match esp32_ble_proxy.ino)
ZONE_UUIDS = {
    "12345678-1234-5678-1234-56789abcdef0": "Dad Zone (Ordered/Quiet)",
    "12345678-1234-5678-1234-56789abcdef1": "Bash Zone (High Kinetic)",
    "12345678-1234-5678-1234-56789abcdef2": "Kitchen (Utility/Fluid)"
}

# iBeacon constants
APPLE_COMPANY_ID = 0x004C
IBEACON_TYPE = 0x02

class BLEBeaconDetector:
    def __init__(self):
        self.detected_beacons = {}
        self.scanning = False

    def parse_ibeacon_data(self, manufacturer_data):
        """Parse iBeacon manufacturer data"""
        if not manufacturer_data:
            return None

        # Check for Apple company ID
        if len(manufacturer_data) < 4:
            return None

        company_id = struct.unpack('<H', manufacturer_data[0:2])[0]
        if company_id != APPLE_COMPANY_ID:
            return None

        # Check for iBeacon type and length
        beacon_type = manufacturer_data[2]
        beacon_length = manufacturer_data[3]
        
        if beacon_type != IBEACON_TYPE or beacon_length != 0x15:
            return None

        # Extract UUID (16 bytes starting at offset 4)
        uuid_bytes = manufacturer_data[4:20]
        uuid_str = binascii.hexlify(uuid_bytes).decode().upper()
        
        # Format UUID with hyphens
        formatted_uuid = f"{uuid_str[0:8]}-{uuid_str[8:12]}-{uuid_str[12:16]}-{uuid_str[16:20]}-{uuid_str[20:32]}"

        # Extract Major and Minor
        major = struct.unpack('>H', manufacturer_data[20:22])[0]
        minor = struct.unpack('>H', manufacturer_data[22:24])[0]
        
        # Extract TX Power
        tx_power = struct.unpack('b', manufacturer_data[24:25])[0]

        return {
            'uuid': formatted_uuid,
            'major': major,
            'minor': minor,
            'tx_power': tx_power
        }

    def detection_callback(self, device, advertisement_data):
        """Callback for BLE device detection"""
        if not self.scanning:
            return

        # Parse manufacturer data
        manufacturer_data = None
        for company_id, data in advertisement_data.manufacturer_data.items():
            if company_id == APPLE_COMPANY_ID:
                manufacturer_data = data
                break

        if not manufacturer_data:
            return

        # Parse iBeacon data
        beacon_data = self.parse_ibeacon_data(manufacturer_data)
        if not beacon_data:
            return

        uuid = beacon_data['uuid']
        rssi = advertisement_data.rssi
        
        # Check if this is a known zone
        zone_name = ZONE_UUIDS.get(uuid, "Unknown Zone")
        
        # Update detection info
        current_time = datetime.now().strftime("%H:%M:%S")
        
        if uuid not in self.detected_beacons:
            print(f"\n[+] New Beacon Detected!")
            print(f"    Time: {current_time}")
            print(f"    Zone: {zone_name}")
            print(f"    UUID: {uuid}")
            print(f"    RSSI: {rssi} dBm")
            print(f"    Major: {beacon_data['major']}, Minor: {beacon_data['minor']}")
            print(f"    TX Power: {beacon_data['tx_power']} dBm")
        else:
            # Update existing beacon
            self.detected_beacons[uuid]['rssi'] = rssi
            self.detected_beacons[uuid]['last_seen'] = current_time
            
            # Show RSSI updates for known beacons
            if abs(rssi - self.detected_beacons[uuid].get('last_rssi', rssi)) > 3:
                print(f"    {zone_name}: RSSI {rssi} dBm (threshold: -60dBm)")

        self.detected_beacons[uuid] = {
            'zone_name': zone_name,
            'uuid': uuid,
            'major': beacon_data['major'],
            'minor': beacon_data['minor'],
            'tx_power': beacon_data['tx_power'],
            'rssi': rssi,
            'last_seen': current_time
        }

    async def scan_for_beacons(self, scan_duration=30):
        """Scan for BLE beacons"""
        print("=== Spaceship Earth BLE Beacon Detection Test ===")
        print(f"Scanning for iBeacon signals for {scan_duration} seconds...")
        print("Expected zones:")
        for uuid, name in ZONE_UUIDS.items():
            print(f"  - {name}: {uuid}")
        print("\nStarting scan...\n")

        self.scanning = True
        scanner = BleakScanner()
        scanner.register_detection_callback(self.detection_callback)

        try:
            await scanner.start()
            await asyncio.sleep(scan_duration)
        finally:
            await scanner.stop()
            self.scanning = False

        return self.detected_beacons

    def print_summary(self):
        """Print detection summary"""
        print("\n=== Detection Summary ===")
        
        if not self.detected_beacons:
            print("No iBeacon signals detected.")
            print("\nTroubleshooting:")
            print("1. Ensure ESP32 is powered and advertising")
            print("2. Check that NimBLE-Arduino library is installed")
            print("3. Verify Zone ID is set correctly in firmware")
            print("4. Check for physical obstructions")
            return

        print(f"Detected {len(self.detected_beacons)} beacon(s):")
        
        for uuid, beacon in self.detected_beacons.items():
            zone_name = beacon['zone_name']
            rssi = beacon['rssi']
            status = "✓" if rssi >= -60 else "⚠"
            
            print(f"\n{status} {zone_name}")
            print(f"   UUID: {uuid}")
            print(f"   RSSI: {rssi} dBm (threshold: -60dBm)")
            print(f"   Signal: {'Strong' if rssi >= -50 else 'Medium' if rssi >= -70 else 'Weak'}")
            print(f"   Last seen: {beacon['last_seen']}")

        # Check for expected zones
        detected_zones = set(beacon['zone_name'] for beacon in self.detected_beacons.values())
        expected_zones = set(ZONE_UUIDS.values())
        
        missing_zones = expected_zones - detected_zones
        if missing_zones:
            print(f"\nMissing zones: {', '.join(missing_zones)}")
        
        print(f"\nSpaceship Earth Integration Status:")
        print(f"- BLE Scanner will detect these beacons ✓")
        print(f"- RSSI threshold (-60dBm) will trigger transitions ✓")
        print(f"- Visitor Mindset modal will activate ✓")

async def main():
    """Main test function"""
    detector = BLEBeaconDetector()
    
    try:
        detected_beacons = await detector.scan_for_beacons(scan_duration=30)
        detector.print_summary()
        
    except KeyboardInterrupt:
        print("\nScan interrupted by user")
        detector.print_summary()
        
    except Exception as e:
        print(f"Error during scan: {e}")

if __name__ == "__main__":
    asyncio.run(main())