#!/usr/bin/env python3
"""
P31 Andromeda - Cryptographic Finality Dependencies Installer
============================================================

This script installs all required dependencies for executing the cryptographic
kenosis protocol and Phase 3 Closed Delta transition.

Required Dependencies:
1. Foundry Suite (forge, cast) - Smart contract deployment
2. jq - JSON processor for deployment output
3. OpenSSL - Cryptographic key generation
4. ESP-IDF with esptool.py - ESP32-S3 programming and eFuse burning
"""

import os
import sys
import subprocess
import urllib.request
import zipfile
import tarfile
import shutil
from pathlib import Path

def print_header(title):
    """Print a formatted header."""
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")

def print_step(step, description):
    """Print a formatted step."""
    print(f"\n[STEP {step}] {description}")
    print("-" * 50)

def run_command(cmd, description=""):
    """Run a command and handle errors."""
    try:
        print(f"Running: {cmd}")
        result = subprocess.run(cmd, shell=True, check=True, 
                              capture_output=True, text=True)
        if result.stdout:
            print(f"Output: {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"ERROR: {description}")
        print(f"Command failed: {cmd}")
        print(f"Error: {e.stderr}")
        return False

def check_windows():
    """Check if running on Windows."""
    return os.name == 'nt'

def install_foundry():
    """Install Foundry suite for smart contract deployment."""
    print_step("1", "Installing Foundry Suite (forge, cast)")
    
    if check_windows():
        print("Windows detected. Installing Foundry via Windows installer...")
        
        # Download Foundry installer for Windows
        foundry_url = "https://github.com/foundry-rs/foundry/releases/download/v0.2.0/foundry-windows-x64.zip"
        installer_path = "foundry-windows-x64.zip"
        
        try:
            print(f"Downloading Foundry from {foundry_url}")
            urllib.request.urlretrieve(foundry_url, installer_path)
            print("Download complete.")
            
            # Extract to a temporary directory
            extract_dir = "foundry_temp"
            with zipfile.ZipFile(installer_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
            
            # Copy forge.exe and cast.exe to system PATH location
            system_path = os.environ.get('USERPROFILE', '') + "\\AppData\\Local\\Microsoft\\WindowsApps"
            if not os.path.exists(system_path):
                system_path = os.environ.get('WINDIR', '') + "\\System32"
            
            forge_exe = os.path.join(extract_dir, "forge.exe")
            cast_exe = os.path.join(extract_dir, "cast.exe")
            
            if os.path.exists(forge_exe):
                shutil.copy2(forge_exe, system_path)
                print(f"Copied forge.exe to {system_path}")
            
            if os.path.exists(cast_exe):
                shutil.copy2(cast_exe, system_path)
                print(f"Copied cast.exe to {system_path}")
            
            # Clean up
            os.remove(installer_path)
            shutil.rmtree(extract_dir)
            
            print("Foundry installation complete!")
            return True
            
        except Exception as e:
            print(f"Failed to install Foundry: {e}")
            return False
    else:
        print("Linux/macOS detected. Please run: curl -L https://foundry.paradigm.xyz | bash")
        return False

def install_jq():
    """Install jq for JSON processing."""
    print_step("2", "Installing jq (JSON processor)")
    
    if check_windows():
        print("Windows detected. Installing jq via Chocolatey...")
        
        # Try to install via Chocolatey
        if run_command("choco install jq -y", "Installing jq via Chocolatey"):
            return True
        
        print("Chocolatey not available. Downloading jq manually...")
        
        # Download jq for Windows
        jq_url = "https://github.com/stedolan/jq/releases/latest/download/jq-win64.exe"
        jq_path = "jq.exe"
        
        try:
            print(f"Downloading jq from {jq_url}")
            urllib.request.urlretrieve(jq_url, jq_path)
            
            # Copy to system PATH
            system_path = os.environ.get('USERPROFILE', '') + "\\AppData\\Local\\Microsoft\\WindowsApps"
            shutil.copy2(jq_path, system_path)
            os.remove(jq_path)
            
            print("jq installation complete!")
            return True
            
        except Exception as e:
            print(f"Failed to install jq: {e}")
            return False
    else:
        print("Linux/macOS detected. Please run: sudo apt-get install jq")
        return False

def install_openssl():
    """Install OpenSSL for cryptographic operations."""
    print_step("3", "Installing OpenSSL")
    
    if check_windows():
        print("Windows detected. OpenSSL is typically pre-installed on Windows.")
        print("Checking if OpenSSL is available...")
        
        if run_command("openssl version", "Checking OpenSSL availability"):
            print("OpenSSL is already available!")
            return True
        else:
            print("OpenSSL not found. Please install OpenSSL for Windows.")
            print("Download from: https://slproweb.com/products/Win32OpenSSL.html")
            return False
    else:
        print("Linux/macOS detected. Please run: sudo apt-get install openssl")
        return False

def install_esp_idf():
    """Install ESP-IDF with esptool.py for ESP32-S3 programming."""
    print_step("4", "Installing ESP-IDF (esptool.py)")
    
    if check_windows():
        print("Windows detected. Installing ESP-IDF...")
        
        # Download ESP-IDF installer
        esp_idf_url = "https://github.com/espressif/esp-idf/releases/download/v5.5.3/esp-idf-v5.5.3-windows-x64.zip"
        installer_path = "esp-idf-windows-x64.zip"
        
        try:
            print(f"Downloading ESP-IDF from {esp_idf_url}")
            urllib.request.urlretrieve(esp_idf_url, installer_path)
            
            # Extract to a temporary directory
            extract_dir = "esp-idf-temp"
            with zipfile.ZipFile(installer_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
            
            # Copy esptool.py to system PATH
            esptool_path = os.path.join(extract_dir, "esp-idf", "components", "esptool_py", "esptool.py")
            if os.path.exists(esptool_path):
                system_path = os.environ.get('USERPROFILE', '') + "\\AppData\\Local\\Microsoft\\WindowsApps"
                shutil.copy2(esptool_path, system_path)
                print(f"Copied esptool.py to {system_path}")
            
            # Clean up
            os.remove(installer_path)
            shutil.rmtree(extract_dir)
            
            print("ESP-IDF installation complete!")
            return True
            
        except Exception as e:
            print(f"Failed to install ESP-IDF: {e}")
            return False
    else:
        print("Linux/macOS detected. Please run: pip install esptool")
        return False

def verify_installation():
    """Verify all dependencies are installed correctly."""
    print_step("5", "Verifying Installation")
    
    dependencies = [
        ("forge", "Foundry suite for smart contract deployment"),
        ("cast", "Foundry CLI for contract interactions"),
        ("jq", "JSON processor for deployment output"),
        ("openssl", "Cryptographic key generation"),
        ("esptool.py", "ESP32-S3 programming and eFuse burning")
    ]
    
    all_good = True
    
    for cmd, description in dependencies:
        print(f"Checking {cmd}...")
        if run_command(f"{cmd} --version", f"Verifying {cmd}"):
            print(f"✓ {cmd} is working correctly")
        else:
            print(f"✗ {cmd} is not available or not working")
            all_good = False
    
    return all_good

def main():
    """Main installation function."""
    print_header("P31 ANDROMEDA - CRYPTOGRAPHIC FINALITY DEPENDENCIES INSTALLER")
    
    print("\nThis script will install all required dependencies for:")
    print("• Smart contract deployment (Foundry: forge, cast)")
    print("• JSON processing (jq)")
    print("• Cryptographic operations (OpenSSL)")
    print("• ESP32-S3 programming (ESP-IDF: esptool.py)")
    
    if not check_windows():
        print("\n⚠️  WARNING: This script is optimized for Windows.")
        print("   For Linux/macOS, please install dependencies manually:")
        print("   • Foundry: curl -L https://foundry.paradigm.xyz | bash")
        print("   • jq: sudo apt-get install jq")
        print("   • OpenSSL: sudo apt-get install openssl")
        print("   • ESP-IDF: pip install esptool")
        response = input("\nContinue with Windows-specific installation? (y/N): ")
        if response.lower() != 'y':
            sys.exit(0)
    
    # Install dependencies
    results = []
    
    results.append(install_foundry())
    results.append(install_jq())
    results.append(install_openssl())
    results.append(install_esp_idf())
    
    # Verify installation
    verification_passed = verify_installation()
    
    # Summary
    print_header("INSTALLATION SUMMARY")
    
    if all(results) and verification_passed:
        print("🎉 ALL DEPENDENCIES INSTALLED SUCCESSFULLY!")
        print("\nThe cryptographic finality protocol is now ready to execute.")
        print("You can run the abdication ceremony with: bash scripts/abdicate.sh")
    else:
        print("❌ SOME DEPENDENCIES FAILED TO INSTALL")
        print("\nPlease check the error messages above and install manually:")
        print("• Foundry: https://book.getfoundry.sh/getting-started/installation")
        print("• jq: https://stedolan.github.io/jq/download/")
        print("• OpenSSL: https://slproweb.com/products/Win32OpenSSL.html")
        print("• ESP-IDF: https://docs.espressif.com/projects/esp-idf/en/latest/esp32/get-started/index.html")
    
    print(f"\nInstallation results: {sum(results)}/{len(results)} successful")
    print(f"Verification: {'PASSED' if verification_passed else 'FAILED'}")

if __name__ == "__main__":
    main()