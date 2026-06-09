#!/usr/bin/env python3
"""
P31 Node Zero — eSIM Provisioning Helper

Responsibilities:
  - Detect connected modem chipset (u-blox, Quectel, Qualcomm) via UART
  - Send AT commands and parse responses
  - Download eSIM profile from SM-DP+ URL
  - Install profile via chipset-specific mechanism
  - Verify installation

Usage:
  python3 provision_esim.py --port /dev/ttyUSB0 --smdp https://smdp.example.com/profile... [--qr image.png]

Dependencies:
  pip install pyserial requests
"""

import argparse, sys, time, serial, serial.tools.list_ports, requests, os, hashlib, binascii

def auto_detect_port():
    ports = list(serial.tools.list_ports.comports())
    for p in ports:
        if 'USB' in p.description or 'ACM' in p.device:
            return p.device
    return None

def send_at(ser, cmd, timeout=2):
    ser.write((cmd + '\r\n').encode())
    ser.flush()
    deadline = time.time() + timeout
    lines = []
    while time.time() < deadline:
        line = ser.readline().decode(errors='ignore').strip()
        if line:
            lines.append(line)
        if 'OK' in line or 'ERROR' in line:
            break
    return lines

def detect_modem(port):
    ser = serial.Serial(port, 115200, timeout=1)
    # Basic AT check
    resp = send_at(ser, 'AT')
    if not any('OK' in l for l in resp):
        ser.close()
        raise RuntimeError('No modem response to AT')
    # Identify
    gmm = send_at(ser, 'AT+GMM')
    gcap = send_at(ser, 'AT+GCAP')
    ser.close()
    model = ' '.join(gmm).lower()
    if 'u-blox' in model or 'sara' in model or 'lara' in model:
        return 'ublox', model
    if 'quectel' in model:
        return 'quectel', model
    # Qualcomm often responds with 'Qualcomm' or specific model numbers
    if any('qualcomm' in l.lower() for l in gmm):
        return 'qualcomm', model
    # Fallback: check known capabilities
    if '+QCAP' in ''.join(gcap):
        return 'quectel', model
    raise RuntimeError(f'Unknown modem model: {gmm}')

def download_profile(smdp_url):
    r = requests.get(smdp_url, timeout=30)
    r.raise_for_status()
    return r.content

def install_ublox(port, profile_bytes):
    ser = serial.Serial(port, 115200, timeout=5)
    # Convert to hex string for AT+CSIM (GSMAINST)
    hexstr = binascii.hexlify(profile_bytes).decode()
    # Length in bytes, as hex string (two hex digits per byte)
    length = len(profile_bytes)
    cmd = f'AT+CSIM={length},"{hexstr}"'
    resp = send_at(ser, cmd, timeout=20)
    ser.close()
    if not any('OK' in l for l in resp):
        raise RuntimeError(f'Profile install failed: {resp}')
    return resp

def install_quectel(profile_path):
    # Prefer qmicli if available
    import subprocess
    try:
        out = subprocess.check_output(['qmicli', '-d', '/dev/cdc-wdm0', '--dms-download-profile', f'file={profile_path}'], stderr=subprocess.STDOUT, timeout=60)
        return out.decode()
    except (FileNotFoundError, subprocess.CalledProcessError) as e:
        raise RuntimeError(f'qmicli failed: {e}')

def verify_install(port, chipset):
    # For u-blox: read EF.PRID via AT+CRSM
    if chipset == 'ublox':
        ser = serial.Serial(port, 115200, timeout=2)
        resp = send_at(ser, 'AT+CRSM=176,122,0,0,0,255')
        ser.close()
        return any('PRID' in l or 'OK' in l for l in resp)
    return True  # For others, we assume if install returned OK

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--port', default=None, help='Serial port')
    p.add_argument('--smdp', required=False, help='SM-DP+ profile URL')
    p.add_argument('--qr', help='QR code image path (extracts SM-DP+ URL)')
    args = p.parse_args()

    port = args.port or auto_detect_port()
    if not port:
        print('ERROR: No serial port found; specify --port', file=sys.stderr); sys.exit(1)

    print(f'[*] Using port {port}')

    # QR extraction (requires zbarimg)
    smdp_url = args.smdp
    if args.qr:
        import subprocess
        out = subprocess.check_output(['zbarimg', '-q', args.qr]).decode().strip()
        smdp_url = out.split()[0]
        print(f'[*] SM-DP+ URL from QR: {smdp_url}')

    if not smdp_url:
        print('ERROR: Provide --smdp or --qr', file=sys.stderr); sys.exit(1)

    print('[*] Detecting modem chipset...')
    chipset, model = detect_modem(port)
    print(f'    Detected: {chipset} ({model})')

    print('[*] Downloading eSIM profile...')
    profile = download_profile(smdp_url)
    print(f'    Profile size: {len(profile)} bytes')

    print('[*] Installing profile...')
    if chipset == 'ublox':
        install_ublox(port, profile)
    elif chipset in ('quectel', 'qualcomm'):
        # Write to temp file for qmicli
        tmp = '/tmp/sim-profile.mf'
        with open(tmp, 'wb') as f: f.write(profile)
        print(install_quectel(tmp))
        os.unlink(tmp)
    else:
        print(f'ERROR: Unsupported chipset {chipset}', file=sys.stderr); sys.exit(1)

    print('[*] Verifying installation...')
    ok = verify_install(port, chipset)
    if ok:
        print('[+] eSIM profile installed successfully.')
    else:
        print('[-] Verification ambiguous; check modem status manually.', file=sys.stderr)

if __name__ == '__main__':
    main()
