# Spaceship Earth Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the Spaceship Earth PWA to production and configuring the Node Zero embedded display system.

## Prerequisites

### System Requirements
- Node.js 18+ with npm
- Git access to the repository
- Access to p31ca.org hosting environment
- ESP32 development environment for Node Zero

### Dependencies
```bash
# Install missing type definitions
npm install --save-dev @webgpu/types @types/web-bluetooth

# Install production dependencies
npm install
```

## 1. PWA Deployment to p31ca.org

### 1.1 Build the Application
```bash
cd software/spaceship-earth
npm run build
```

### 1.2 Verify Build Success
- Check `dist/` directory contains built files
- Verify no TypeScript compilation errors
- Run production build tests:
```bash
npm test
```

### 1.3 Deploy to Production
```bash
# Deploy using your preferred method (Netlify, Vercel, etc.)
# Example for Netlify:
npm install -g netlify-cli
netlify deploy --prod

# Example for direct server deployment:
scp -r dist/* user@p31ca.org:/var/www/spaceship-earth/
```

### 1.4 Post-Deployment Verification
- Visit https://p31ca.org/spaceship-earth
- Verify PWA installation prompt appears
- Test WebGPU functionality in supported browsers
- Confirm BLE permissions are requested

## 2. Node Zero Display Configuration

### 2.1 Flash Display Firmware
```bash
cd firmware/maker-variant
idf.py set-target esp32s3
idf.py build
idf.py flash
```

### 2.2 Configure Display Settings
The display configuration is now optimized for Node Zero:

**Key Settings Applied:**
- QSPI interface enabled
- RGB565 color format with proper byte swapping
- Color inversion corrected for Node Zero displays
- 480x480 resolution support

### 2.3 Verify Display Operation
1. Power on Node Zero
2. Check for proper boot sequence
3. Verify display shows correct colors (no inversion)
4. Test touch responsiveness

## 3. Environment Configuration

### 3.1 Production Environment Variables
Create `.env.production`:
```bash
VITE_API_URL=https://api.p31ca.org
VITE_WEBSOCKET_URL=wss://api.p31ca.org/ws
VITE_BLE_ENABLED=true
VITE_WEBGPU_ENABLED=true
```

### 3.2 Service Worker Configuration
The PWA includes automatic service worker registration for offline functionality:
- Caches core application files
- Provides offline fallback
- Handles background sync for economy data

### 3.3 Security Headers
Ensure your web server includes these headers:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

## 4. Testing Checklist

### 4.1 Functional Testing
- [ ] PWA installs successfully on mobile devices
- [ ] WebGPU rules engine loads and functions
- [ ] BLE scanning works (if supported)
- [ ] Camera controls respond correctly
- [ ] Economy system tracks spoons and LOVE
- [ ] Rules engine enforces zone restrictions

### 4.2 Performance Testing
- [ ] 60fps maintained in ZUI navigation
- [ ] Mobile performance acceptable on Android tablets
- [ ] Memory usage stable during extended use
- [ ] Battery consumption reasonable

### 4.3 Cross-Browser Testing
- [ ] Chrome (WebGPU support)
- [ ] Edge (WebGPU support)
- [ ] Firefox (WebGPU support)
- [ ] Safari (CPU fallback)

## 5. Troubleshooting

### 5.1 Common Issues

**WebGPU Not Available:**
- Check browser supports WebGPU (Chrome 113+, Edge 113+)
- Verify `navigator.gpu` is available
- CPU fallback should activate automatically

**BLE Not Working:**
- Ensure HTTPS is used (required for Web Bluetooth)
- Check browser supports Web Bluetooth API
- Verify user grants Bluetooth permissions

**Display Issues on Node Zero:**
- Confirm firmware is flashed with latest configuration
- Check power supply provides adequate current
- Verify display cable connections

**Performance Issues:**
- Reduce Sierpinski depth on low-end devices
- Enable performance monitoring in debug mode
- Check for memory leaks in long sessions

### 5.2 Debug Mode
Enable debug mode by adding `?debug=true` to URL:
- Shows performance metrics
- Displays WebGPU status
- Logs rule evaluation results
- Shows BLE connection status

## 6. Maintenance

### 6.1 Regular Updates
- Monitor WebGPU browser support updates
- Update type definitions as needed
- Test with new browser versions

### 6.2 Monitoring
- Monitor PWA performance metrics
- Track user engagement with economy system
- Watch for rule engine violations or conflicts

### 6.3 Backup and Recovery
- Backup IndexedDB data regularly
- Maintain version control of configuration files
- Document any custom zone rules or modifications

## 7. Support Contacts

For deployment issues:
- **WebGPU Issues**: Check browser compatibility and fallback behavior
- **BLE Issues**: Verify HTTPS and permissions
- **Display Issues**: Refer to Node Zero documentation
- **General Support**: Review implementation summary and WCD documentation

## Next Steps

1. Complete deployment following this guide
2. Conduct user testing with target audience
3. Monitor performance and user feedback
4. Iterate on any issues discovered during testing

The system is now ready for production deployment with comprehensive fallback mechanisms and performance optimizations in place.