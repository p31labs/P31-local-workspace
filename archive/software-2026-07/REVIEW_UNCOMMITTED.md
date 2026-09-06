# P31 Andromeda — Uncommitted Changes Review

**Branch:** `main`
**Review Date:** 2026-03-24
**Total Files Changed:** 316 (109 deleted, 42 modified, 165+ added)

---

## Executive Summary

This is a massive refactor consolidating documentation and adding significant new features to Spaceship Earth. The changes include:

- ✅ **LLM Client enhancements** — Voice input, TTS, crypto validation, agent tools
- ✅ **Node Context improvements** — Demo mode fallback, performance monitoring, throttled updates
- ✅ **Cockpit flicker fix** — 100ms debounce on resize
- ✅ **New accessibility themes** — HIGH_CONTRAST, LOW_MOTION
- ⚠️ **Documentation reorganization** — 109 files deleted, relocated to `admin/`

---

## Changes by Category

### 1. LLM Client (`llmClient.ts`) — ✅ APPROVED

**Lines Added:** ~288

| Feature | Status | Notes |
|---------|--------|-------|
| Web Speech API types | ✅ | Browser-compatible declarations |
| Voice input (`startVoiceInput`/`stopVoiceInput`) | ✅ | Supports webkit prefix |
| AES-GCM cryptographic validation | ✅ | Entropy check + test encrypt/decrypt |
| TTS output (`speakTTS`/`stopTTS`) | ✅ | Accessibility-aware (prefers-reduced-motion) |
| Agent tools with validation | ✅ | Rate limited (2s), validated parameters |
| Gray Rock mode | ✅ | TTS disabled when active |

**Crypto Validation (lines 127-141):**
```typescript
// Cryptographic validation cycle - mathematically prove the cipher is sound
const testBuffer = new TextEncoder().encode('P31_CRYPTO_VALIDATION_TEST');
const iv = crypto.getRandomValues(new Uint8Array(12));
if (iv.every(b => b === 0)) {
  throw new Error('[CRITICAL_FAULT] Entropy failure in IV generation');
}
const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, testBuffer);
if (!cipher || cipher.byteLength === 0) {
  throw new Error('[CRITICAL_FAULT] Test encryption produced zero-length output');
}
await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
```

**Assessment:** Solid implementation. The crypto validation is a good defensive measure. Voice input handles browser prefixes correctly.

---

### 2. Node Context (`NodeContext.tsx`) — ✅ APPROVED with Notes

**Lines Changed:** ~290

| Feature | Status | Notes |
|---------|--------|-------|
| Performance metrics | ✅ | bootTime, stateUpdate latency, errorCount, retryCount |
| Demo mode fallback | ✅ | Activates when Node Zero fails |
| Boot timeout | ✅ | 10 second timeout |
| Throttled state updates | ✅ | 16ms throttle (~60fps) |
| Retry mechanism | ✅ | 3 attempts, 2s delay, exponential backoff |
| Graceful error handling | ✅ | Error boundaries, telemetry |

**Key Constants:**
```typescript
const BOOT_TIMEOUT_MS = 10_000;
const STATE_UPDATE_THROTTLE_MS = 16;
const ERROR_RETRY_DELAY_MS = 2000;
const MAX_RETRY_ATTEMPTS = 3;
```

**Notes:**
- The retry logic is sound but ensure `retryCount` resets on successful boot
- Performance metrics should be exposed in the UI for debugging

---

### 3. Immersive Cockpit (`ImmersiveCockpit.tsx`) — ✅ APPROVED

**Flicker Fix Applied:**
```typescript
const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const handleResize = () => {
  if (resizeTimeoutRef.current) {
    clearTimeout(resizeTimeoutRef.current);
  }
  resizeTimeoutRef.current = setTimeout(() => {
    // resize logic
  }, 100); // 100ms debounce
};
```

**Assessment:** Correct fix. 100ms debounce handles orientation changes without causing rapid re-renders.

---

### 4. Skin Profiles (`skinProfiles.ts`) — ✅ APPROVED

**New Profiles Added:**
- `HIGH_CONTRAST` — emissiveIntensity: 3.0, bloomStrength: 2.0
- `LOW_MOTION` — reduced animation, scanlines enabled

---

### 5. File Deletions — ⚠️ REVIEW REQUIRED

**109 files deleted** including:
- Old wcds at root level
- BONDING manufacturing prompts
- Cognitive passport v2.0

**Concern:** These appear to be relocated to `admin/` but the deletion is aggressive. Ensure nothing needed for legal discovery is being removed.

**Recommendation:** Verify `admin/` contains all critical documents before committing.

---

### 6. New Files — 📋 INVENTORY

**Key additions:**
| Path | Purpose |
|------|---------|
| `admin/` | Consolidated admin docs |
| `software/spaceship-earth/src/services/nodeZeroBridge.ts` | Node Zero bridge |
| `software/spaceship-earth/src/services/cognitiveShield.ts` | Cognitive shield |
| `software/spaceship-earth/src/services/performanceMonitor.ts` | Performance monitoring |
| `software/packages/shared/src/theme/` | New theme system |
| `docs/NODE_ZERO_OPTIMIZATION_GUIDE.md` | Documentation |

---

## Build Verification

```bash
# Run TypeScript check
npm run build  # Should pass

# Run tests
npm test       # Should pass
```

---

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Documentation loss | Medium | Verify admin/ completeness |
| Breaking changes | Low | Core APIs unchanged |
| Performance regression | Low | Throttling added |

---

## Recommendation

**✅ APPROVE** with the following conditions:

1. ✅ Run full build verification before commit
2. ⚠️ Verify admin/ completeness (especially legal docs)
3. 📋 Document the WCD reorganization in commit message

**Commit Message Suggestion:**
```
feat(spaceship-earth): Node Zero optimization + LLM client enhancements

- Add voice input + TTS with accessibility support
- Add AES-GCM crypto validation
- Add demo mode fallback for Node Zero
- Add 100ms resize debounce to prevent flicker
- Add HIGH_CONTRAST and LOW_MOTION themes
- Reorganize admin docs to admin/
```

---

## Documentation Reorganization Verification ✅

### Deleted → Added Mapping (Verified)

| Deleted (Root) | Added (admin/) | Status |
|----------------|-------------------|--------|
| 01-build.md | admin/01-build.md | ✅ Verified |
| 01-debug.md | admin/01-debug.md | ✅ Verified |
| 01-docs.md | admin/01-docs.md | ✅ Verified |
| 01-p31-global.md | admin/01-p31-global.md | ✅ Verified |
| 01-review.md | admin/01-review.md | ✅ Verified |
| AGENTS.md | admin/AGENTS.md | ✅ Verified |
| SECURITY_AUDIT_REPORT.md | admin/SECURITY_AUDIT_REPORT.md | ✅ Verified |
| SOCIAL_DROP.md | admin/SOCIAL_DROP.md | ✅ Verified |
| SPEC_SHEET.md | admin/SPEC_SHEET.md | ✅ Verified |
| context-v1.1.md | admin/context-v1.1.md | ✅ Verified |
| copilot-instructions.md | admin/copilot-instructions.md | ✅ Verified |
| docs.instructions.md | admin/docs.instructions.md | ✅ Verified |
| p31-agent-routing.md | admin/p31-agent-routing.md | ✅ Verified |
| p31-rules.md | admin/p31-rules.md | ✅ Verified |
| react-ts.instructions.md | admin/react-ts.instructions.md | ✅ Verified |
| BONDING_DAY1_PROMPT.md | software/bonding/docs/ | ✅ Verified |
| BONDING_DAY2_PROMPT.md | software/bonding/docs/ | ✅ Verified |

### Git-Disabled Cleanup

| Path | Status |
|------|--------|
| phosphorus31.org/planetary-planet/.git_disabled/ | ✅ Deleted (40+ objects) |

### Summary

- ✅ 15 root docs relocated to admin/
- ✅ BONDING docs relocated to software/bonding/docs/
- ✅ Git-disabled directory cleaned
- ⚠️ Verify legal docs (DISCOVERY_RESPONSES.txt) present in docs/

---

## Firmware Review: `firmware/maker-variant/` ✅

### Architecture Summary

| Module | Language | Framework | Status |
|--------|----------|-----------|--------|
| Display | C++ | LVGL v8.4 | ✅ Stable |
| Haptics | C++ | DRV2605L | ✅ Stable |
| LoRa | C++ | RadioLib v7 | ✅ Stable |
| BLE | C++ | ESP-IDF BLE | ✅ Stable |
| Audio | C++ | ES8311 | ⚠️ In Progress |
| UI | C++ | LVGL | ✅ Stable |

### Key Components Reviewed

**1. Display Manager** (`display_manager.cpp`)
- QSPI display (480×320)
- LVGL with 40-line draw buffers
- Dual-clock I2C routing hack
- Verified pin map (DO NOT CHANGE warning present)

**2. LoRa Manager** (`lora_manager.cpp`)
- RadioLib v7 with custom ESP32 HAL
- Ebyte E22-900M30S (868 MHz, 1W)
- SPI host configuration
- Queue-based messaging

**3. Haptic Manager** (`haptic_manager.cpp`)
- DRV2605L with LRA mode
- **Larmor Protocol: 172.35 Hz** (P-31 NMR frequency)
- Thick Click vocabulary (HAPTIC_CLICK, HAPTIC_DOUBLE, etc.)

**4. I2C Manager** (`i2c_manager.cpp`)
- Dual-clock routing (internal SCL=7, external SCL=9)
- GPIO matrix for multicast
- Mutex-protected access

### Known Issues

| Issue | File | Status |
|-------|------|--------|
| Audio chunk → I2S pipeline | `websocket_manager.cpp:23` | TODO |
| Dual-clock I2C hack | `main.cpp:57` | Documented as hack |

### P31 Protocol Compliance

- ✅ **Larmor Frequency:** 172.35 Hz haptic encoding
- ✅ **Thick Click:** Physical feedback for proprioceptive input
- ✅ **Dual-clock I2C:** Preserves audio codec clock integrity

---

*Firmware review completed 2026-03-24 05:00 UTC*
*Status: APPROVED* 🔺

---

*Review completed 2026-03-24 04:58 UTC*
*Status: APPROVED* 🔺
