# Manual Dependency Setup Guide

## Overview
This guide provides manual installation instructions for the cryptographic finality dependencies that couldn't be automated due to Windows environment limitations.

## Required Dependencies

### 1. Foundry Suite (forge, cast)
**Purpose**: Smart contract deployment and interaction

**Manual Installation:**
1. Download from: https://github.com/foundry-rs/foundry/releases
2. Extract `forge.exe` and `cast.exe` to a directory in your PATH
3. Verify installation:
   ```cmd
   forge --version
   cast --version
   ```

### 2. jq (JSON Processor)
**Purpose**: JSON processing for deployment output

**Manual Installation:**
1. Download from: https://stedolan.github.io/jq/download/
2. Download `jq-win64.exe`
3. Rename to `jq.exe` and place in PATH directory
4. Verify installation:
   ```cmd
   jq --version
   ```

### 3. OpenSSL
**Purpose**: Cryptographic key generation

**Manual Installation:**
1. Download from: https://slproweb.com/products/Win32OpenSSL.html
2. Install Win64 OpenSSL v3.0 or later
3. Add OpenSSL bin directory to PATH
4. Verify installation:
   ```cmd
   openssl version
   ```

### 4. ESP-IDF with esptool.py
**Purpose**: ESP32-S3 programming and eFuse burning

**Manual Installation:**
1. Download ESP-IDF: https://docs.espressif.com/projects/esp-idf/en/latest/esp32/get-started/windows-setup.html
2. Install ESP-IDF v5.5.3
3. Add `esptool.py` to PATH
4. Verify installation:
   ```cmd
   esptool.py --version
   ```

## Alternative: Use WSL (Recommended)
If manual installation proves difficult, consider using Windows Subsystem for Linux:

1. Install WSL: `wsl --install`
2. Install Ubuntu from Microsoft Store
3. In WSL, run:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   source ~/.bashrc
   sudo apt-get install jq openssl python3-pip
   pip install esptool
   ```

## Verification
After manual installation, verify all dependencies:

```cmd
forge --version
cast --version
jq --version
openssl version
esptool.py --version
```

All commands should return version information without errors.

## Next Steps
Once dependencies are installed, you can:
1. Test smart contract compilation: `forge build`
2. Run the abdication ceremony: `bash scripts/abdicate.sh`
3. Test ESP32-S3 programming: `esptool.py --port COMx flash_id`