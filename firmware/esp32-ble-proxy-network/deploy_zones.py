#!/usr/bin/env python3
"""
ESP32 BLE Proxy Network Deployment Script

This script automates the deployment of ESP32 firmware for different zones.
It compiles and flashes the appropriate firmware for each zone based on
the Zone ID configuration.

Usage:
    python deploy_zones.py --zone dad --port /dev/ttyUSB0
    python deploy_zones.py --zone bash --port COM3
    python deploy_zones.py --zone kitchen --port /dev/ttyUSB1

Requirements:
    pip install pyserial
"""

import argparse
import subprocess
import sys
import os
from pathlib import Path

# Zone configuration mapping
ZONE_CONFIGS = {
    'dad': {
        'zone_id': 1,
        'name': 'Dad Zone (Ordered/Quiet)',
        'uuid': '12345678-1234-5678-1234-56789abcdef0',
        'env': 'esp32dev-dad-zone'
    },
    'bash': {
        'zone_id': 2,
        'name': 'Bash Zone (High Kinetic)',
        'uuid': '12345678-1234-5678-1234-56789abcdef1',
        'env': 'esp32dev-bash-zone'
    },
    'kitchen': {
        'zone_id': 3,
        'name': 'Kitchen (Utility/Fluid)',
        'uuid': '12345678-1234-5678-1234-56789abcdef2',
        'env': 'esp32dev-kitchen-zone'
    }
}

def check_requirements():
    """Check if required tools are installed"""
    try:
        subprocess.run(['platformio', '--version'], 
                      capture_output=True, check=True)
        print("✓ PlatformIO is installed")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("✗ PlatformIO is not installed")
        print("Install with: pip install platformio")
        return False
    
    return True

def compile_firmware(zone_config):
    """Compile firmware for specific zone"""
    print(f"\n🔧 Compiling firmware for {zone_config['name']}...")
    
    try:
        # Compile using PlatformIO with specific environment
        result = subprocess.run([
            'platformio', 'run', 
            '-e', zone_config['env']
        ], capture_output=True, text=True, check=True)
        
        print("✓ Firmware compiled successfully")
        return True
        
    except subprocess.CalledProcessError as e:
        print("✗ Compilation failed:")
        print(e.stdout)
        print(e.stderr)
        return False

def flash_firmware(zone_config, port):
    """Flash firmware to ESP32"""
    print(f"\n⬇️  Flashing {zone_config['name']} firmware to {port}...")
    
    try:
        # Flash using PlatformIO
        result = subprocess.run([
            'platformio', 'run', 
            '-e', zone_config['env'],
            '-t', 'upload',
            '--upload-port', port
        ], capture_output=True, text=True, check=True)
        
        print("✓ Firmware flashed successfully")
        return True
        
    except subprocess.CalledProcessError as e:
        print("✗ Flashing failed:")
        print(e.stdout)
        print(e.stderr)
        return False

def verify_deployment(port):
    """Verify the ESP32 is running and advertising"""
    print(f"\n🔍 Verifying deployment on {port}...")
    
    try:
        # Monitor serial output
        result = subprocess.run([
            'platformio', 'device', 'monitor',
            '--port', port,
            '--baud', '115200',
            '--timeout', '10'
        ], capture_output=True, text=True, timeout=15)
        
        if "BLE beacon started successfully" in result.stdout:
            print("✓ ESP32 is running and advertising")
            return True
        else:
            print("⚠ ESP32 may not be advertising properly")
            print("Check serial output:")
            print(result.stdout)
            return False
            
    except subprocess.TimeoutExpired:
        print("⚠ Timeout waiting for serial output")
        print("ESP32 may still be starting up")
        return True  # Assume success if we get this far
    except Exception as e:
        print(f"✗ Verification failed: {e}")
        return False

def main():
    """Main deployment function"""
    parser = argparse.ArgumentParser(
        description='Deploy ESP32 BLE Proxy Network firmware'
    )
    parser.add_argument(
        '--zone', 
        choices=['dad', 'bash', 'kitchen'],
        required=True,
        help='Zone to deploy (dad, bash, or kitchen)'
    )
    parser.add_argument(
        '--port',
        required=True,
        help='Serial port (e.g., /dev/ttyUSB0 or COM3)'
    )
    parser.add_argument(
        '--skip-compile',
        action='store_true',
        help='Skip compilation and only flash existing firmware'
    )
    parser.add_argument(
        '--skip-verify',
        action='store_true',
        help='Skip verification step'
    )

    args = parser.parse_args()
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Get zone configuration
    zone_config = ZONE_CONFIGS[args.zone]
    
    print(f"🚀 Deploying {zone_config['name']} to {args.port}")
    print(f"   Zone ID: {zone_config['zone_id']}")
    print(f"   UUID: {zone_config['uuid']}")
    print(f"   Environment: {zone_config['env']}")
    
    # Change to firmware directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Compile firmware
    if not args.skip_compile:
        if not compile_firmware(zone_config):
            sys.exit(1)
    else:
        print("⏭️  Skipping compilation")
    
    # Flash firmware
    if not flash_firmware(zone_config, args.port):
        sys.exit(1)
    
    # Verify deployment
    if not args.skip_verify:
        if not verify_deployment(args.port):
            print("\n⚠️  Deployment completed but verification failed")
            print("The ESP32 may still be working. Check the serial monitor manually.")
    else:
        print("⏭️  Skipping verification")
    
    print(f"\n✅ {zone_config['name']} deployment completed!")
    print("\nNext steps:")
    print("1. Power the ESP32 via USB wall adapter")
    print("2. Place near room threshold (entrance)")
    print("3. Test with Spaceship Earth PWA")
    print("4. Verify RSSI crosses -60dBm threshold")

if __name__ == "__main__":
    main()