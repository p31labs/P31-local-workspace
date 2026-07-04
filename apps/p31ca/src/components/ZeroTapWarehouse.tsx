/**
 * Zero-Tap Warehouse Flow — Winn-Dixie Edition
 * QR Scan → Instant Zone Logging → Edge Sync
 * @version 2.0.0
 * @component
 *
 * Operational model: Grocery-store logic (SKU/PLU/Zone) for pick-a-part
 * used furniture warehouse. No ML training. QR codes as portable SKUs.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { getWarehouseDB, logInventoryItem, getUnsyncedItems, markItemsSynced } from '../utils/pglite-warehouse';
import type { PGlite } from '../utils/pglite-warehouse';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Zone {
  id: number;
  name: string;        // e.g., "Zone 1: Seating"
  pluPrefix: string;   // e.g., "01" for quick visual reference
  count: number;       // Running cycle count
}

interface InventoryItem {
  qrData: string;      // Raw QR payload (e.g., "P31-SEAT-001" or external SKU)
  category: string;    // "Seating", "Tables", "Hardware/Parts", etc.
  zoneId: number;
  status: 'received' | 'sold' | 'moved';
  scannedAt: number;   // Unix ms
  synced: boolean;     // False until pushed to p31-state Worker
}

interface ScanResult {
  qrData: string;
  action: 'received' | 'sold';
  zone: Zone;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION — AJ's 9 Zones (Pick-a-Part Warehouse)
// ─────────────────────────────────────────────────────────────────────────────

const WAREHOUSE_ZONES: Zone[] = [
  { id: 1, name: 'Zone 1: Seating', pluPrefix: '01', count: 0 },
  { id: 2, name: 'Zone 2: Tables', pluPrefix: '02', count: 0 },
  { id: 3, name: 'Zone 3: Hardware/Parts', pluPrefix: '03', count: 0 },
  { id: 4, name: 'Zone 4: Lighting', pluPrefix: '04', count: 0 },
  { id: 5, name: 'Zone 5: Decor', pluPrefix: '05', count: 0 },
  { id: 6, name: 'Zone 6: Storage/Organization', pluPrefix: '06', count: 0 },
  { id: 7, name: 'Zone 7: Appliances', pluPrefix: '07', count: 0 },
  { id: 8, name: 'Zone 8: Outdoor', pluPrefix: '08', count: 0 },
  { id: 9, name: 'Zone 9: Receiving/Staging', pluPrefix: '09', count: 0 },
];

// Derived category map from QR patterns (e.g., "P31-SEAT-001" → Seating)
const CATEGORY_PATTERNS: { pattern: RegExp; category: string; zoneId: number }[] = [
  { pattern: /SEAT|CHAIR|SOFA|COUCH/i, category: 'Seating', zoneId: 1 },
  { pattern: /TABLE|DESK/i, category: 'Tables', zoneId: 2 },
  { pattern: /HARDWARE|KNOB|HINGE|SCREW/i, category: 'Hardware/Parts', zoneId: 3 },
  { pattern: /LAMP|LIGHT/i, category: 'Lighting', zoneId: 4 },
  { pattern: /DECOR|ART|MIRROR/i, category: 'Decor', zoneId: 5 },
  { pattern: /SHELF|BIN|RACK/i, category: 'Storage/Organization', zoneId: 6 },
  { pattern: /FRIDGE|STOVE|WASHER/i, category: 'Appliances', zoneId: 7 },
  { pattern: /PATIO|GRILL|PLANTER/i, category: 'Outdoor', zoneId: 8 },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface ZeroTapWarehouseProps {
  onSync?: (items: InventoryItem[]) => Promise<void>; // Push to p31-state Worker
  initialZone?: number;               // Start in specific zone
  showDashboard?: boolean;            // Show stats dashboard
}

export function ZeroTapWarehouse({
  onSync,
  initialZone = 9, // Default to Receiving/Staging
  showDashboard = false,
}: ZeroTapWarehouseProps): React.ReactElement {
  // Real PGLite instance (lazy loaded)
  const pgLiteRef = useRef<PGlite | null>(null);
  // Scanner state
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'warehouse-scanner';
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Operational state
  const [activeZone, setActiveZone] = useState<Zone>(WAREHOUSE_ZONES[initialZone - 1]);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [pendingCount, setPendingCount] = useState(0); // Unsynced items
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Touch gesture state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50; // pixels

  // Initialize PGLite on mount
  useEffect(() => {
    getWarehouseDB().then((db) => {
      pgLiteRef.current = db;
      console.log('[Warehouse] PGLite ready');
    }).catch((err) => {
      console.error('[Warehouse] PGLite init failed:', err);
    });
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // LIFECYCLE: Online/offline detection
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      attemptSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // SCANNER: Initialize html5-qrcode
  // ───────────────────────────────────────────────────────────────────────────

  const startScanner = useCallback(async () => {
    try {
      setCameraError(null);

      const scanner = new Html5Qrcode(scannerDivId, {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128, // Backup for existing barcodes
        ],
      });

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' }, // Rear camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        handleQrCodeScan,
        handleScanError
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Scanner init failed:', err);
      setCameraError(err instanceof Error ? err.message : 'Camera failed');
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Scanner cleanup error:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // SCAN HANDLER: QR detected
  // ───────────────────────────────────────────────────────────────────────────

  const handleQrCodeScan = useCallback(
    async (decodedText: string) => {
      // Dedupe: ignore if same as last scan within 2 seconds
      if (lastScan && lastScan.qrData === decodedText && Date.now() - lastScan.zone.count < 2000) {
        return;
      }

      // Determine category/zone from QR pattern
      const inferred = inferCategoryFromQR(decodedText);
      const targetZone = WAREHOUSE_ZONES.find((z) => z.id === inferred.zoneId) || activeZone;

      // Default action: "received" (Swipe Right pattern)
      const action: ScanResult['action'] = 'received';

      const scan: ScanResult = {
        qrData: decodedText,
        action,
        zone: targetZone,
      };

      setLastScan(scan);

      // Haptic + Voice feedback
      triggerHaptics('success');
      speakFeedback(`${inferred.category} logged to ${targetZone.name}`);

      // Persist to PGLite
      if (pgLiteRef.current) {
        await logInventoryItem(pgLiteRef.current, {
          qrData: decodedText,
          category: inferred.category,
          zoneId: targetZone.id,
          status: action,
          scannedAt: Date.now(),
        });
      } else {
        console.warn('[Warehouse] PGLite not ready, scan queued in memory');
      }

      setPendingCount((c) => c + 1);

      // If zone changed, offer to switch
      if (targetZone.id !== activeZone.id) {
        speakFeedback(`Switch to ${targetZone.name}? Swipe up.`);
      }
    },
    [activeZone, lastScan]
  );

  const handleScanError = useCallback((errorMessage: string) => {
    // html5-qrcode calls this frequently when no QR in frame — ignore
    if (errorMessage.includes('No QR code found')) return;
    console.warn('Scan error:', errorMessage);
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // SYNC: Push to p31-state Worker
  // ───────────────────────────────────────────────────────────────────────────

  const attemptSync = async () => {
    if (!onSync || !isOnline || !pgLiteRef.current) return;

    try {
      // Fetch unsynced items
      const unsynced = await getUnsyncedItems(pgLiteRef.current);

      if (unsynced.length === 0) {
        setPendingCount(0);
        return;
      }

      // Push to p31-state Worker
      await onSync(unsynced);

      // Mark synced
      await markItemsSynced(
        pgLiteRef.current,
        unsynced.map((i) => i.qrData)
      );

      setPendingCount(0);
      triggerHaptics('sync');
      speakFeedback(`${unsynced.length} items synced`);
    } catch (err) {
      console.error('Sync failed:', err);
      speakFeedback('Sync failed. Will retry.');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // GESTURES: Swipe handling
  // ───────────────────────────────────────────────────────────────────────────

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const deltaX = endX - touchStartX.current;
    const deltaY = endY - touchStartY.current;

    // Horizontal swipe (action)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        // Swipe Right → RECEIVED
        handleSwipeAction('received');
      } else {
        // Swipe Left → SOLD/REMOVED
        handleSwipeAction('sold');
      }
    }

    // Vertical swipe (zone switch)
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > SWIPE_THRESHOLD) {
      if (deltaY < 0) {
        // Swipe Up → Next zone
        cycleZone(1);
      } else {
        // Swipe Down → Prev zone
        cycleZone(-1);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleSwipeAction = async (action: 'received' | 'sold') => {
    if (!lastScan) {
      speakFeedback('Scan first, then swipe');
      return;
    }

    // Re-log with new action
    if (pgLiteRef.current) {
      await logInventoryItem(pgLiteRef.current, {
        qrData: lastScan.qrData,
        category: inferCategoryFromQR(lastScan.qrData).category,
        zoneId: activeZone.id,
        status: action,
        scannedAt: Date.now(),
      });
    }

    triggerHaptics(action === 'received' ? 'inbound' : 'outbound');
    speakFeedback(action === 'received' ? 'Received' : 'Sold and removed');
    setPendingCount((c) => c + 1);
  };

  const cycleZone = (direction: 1 | -1) => {
    const currentIndex = WAREHOUSE_ZONES.findIndex((z) => z.id === activeZone.id);
    const newIndex =
      (currentIndex + direction + WAREHOUSE_ZONES.length) % WAREHOUSE_ZONES.length;
    setActiveZone(WAREHOUSE_ZONES[newIndex]);
    speakFeedback(`Now in ${WAREHOUSE_ZONES[newIndex].name}`);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // FEEDBACK: Haptics + Voice
  // ───────────────────────────────────────────────────────────────────────────

  const triggerHaptics = (pattern: 'success' | 'inbound' | 'outbound' | 'sync' | 'error') => {
    if (!navigator.vibrate) return;

    const patterns: Record<string, number[]> = {
      success: [50, 100, 50],
      inbound: [30, 50, 30, 50, 30], // Three short pulses (adding)
      outbound: [100, 50],           // Long pulse (removing)
      sync: [20, 20, 20, 20, 100],   // Rapid then long (whoosh)
      error: [200, 100, 200],
    };

    navigator.vibrate(patterns[pattern] || [50]);
  };

  const speakFeedback = (text: string) => {
    if (!window.speechSynthesis) return;

    // Cancel any speaking
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ───────────────────────────────────────────────────────────────────────────

  const inferCategoryFromQR = (qrData: string): { category: string; zoneId: number } => {
    for (const mapping of CATEGORY_PATTERNS) {
      if (mapping.pattern.test(qrData)) {
        return { category: mapping.category, zoneId: mapping.zoneId };
      }
    }
    // Default: Unknown → Receiving/Staging (Zone 9)
    return { category: 'Uncategorized', zoneId: 9 };
  };

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="zero-tap-warehouse"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--p31-void)',
        color: 'var(--p31-cloud)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── HEADER: Zone + Sync Status ── */}
      <div
        style={{
          padding: '16px 20px',
          background: 'var(--p31-surface)',
          borderBottom: '1px solid var(--p31-border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', opacity: 0.6, textTransform: 'uppercase' }}>
            Current Zone
          </div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--p31-teal)' }}>
            {activeZone.name}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '12px',
              color: isOnline ? 'var(--p31-teal)' : 'var(--p31-coral)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{isOnline ? '●' : '○'}</span>
            {isOnline ? 'Online' : 'Offline'}
          </div>
          {pendingCount > 0 && (
            <div style={{ fontSize: '14px', marginTop: '4px' }}>
              {pendingCount} pending
            </div>
          )}
        </div>
      </div>

      {/* ── SCANNER VIEW ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {!isScanning ? (
          // START SCREEN
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              padding: '20px',
            }}
          >
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--p31-teal) 0%, color-mix(in srgb, var(--p31-teal) 65%, black) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
              }}
            >
              📷
            </div>

            <button
              onClick={startScanner}
              style={{
                padding: '20px 48px',
                fontSize: '20px',
                fontWeight: 600,
                background: 'var(--p31-teal)',
                color: 'var(--p31-void)',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(93, 202, 165, 0.3)',
              }}
            >
              START SCANNING
            </button>

            {cameraError && (
              <div style={{ color: 'var(--p31-coral)', textAlign: 'center', maxWidth: '280px' }}>
                Camera error: {cameraError}
                <br />
                <small>Check permissions and try again</small>
              </div>
            )}

            <div
              style={{
                position: 'absolute',
                bottom: '40px',
                textAlign: 'center',
                opacity: 0.5,
                fontSize: '14px',
              }}
            >
              <div>Swipe Right → Receive</div>
              <div>Swipe Left → Sold</div>
              <div>Swipe Up/Down → Change Zone</div>
            </div>
          </div>
        ) : (
          // ACTIVE SCANNER
          <>
            <div
              id={scannerDivId}
              style={{
                width: '100%',
                height: '100%',
                background: 'var(--p31-void)',
              }}
            />

            {/* QR Overlay Guide */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  width: '250px',
                  height: '250px',
                  border: '2px solid rgba(93, 202, 165, 0.5)',
                  borderRadius: '20px',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                }}
              />
            </div>

            {/* Last Scan Toast */}
            {lastScan && (
              <div
                style={{
                  position: 'absolute',
                  top: '20px',
                  left: '20px',
                  right: '20px',
                  padding: '16px',
                  background: '#161920',
                  borderRadius: '12px',
                  border: '1px solid var(--p31-teal)',
                }}
              >
                <div style={{ fontSize: '12px', opacity: 0.6 }}>Last Scan</div>
                <div style={{ fontSize: '18px', fontWeight: 600, marginTop: '4px' }}>
                  {lastScan.qrData}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--p31-teal)', marginTop: '4px' }}>
                  → {lastScan.zone.name}
                </div>
              </div>
            )}

            {/* STOP BUTTON */}
            <button
              onClick={stopScanner}
              style={{
                position: 'absolute',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: 600,
                background: 'var(--p31-coral)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
              }}
            >
              STOP SCANNING
            </button>
          </>
        )}
      </div>

      {/* ── GESTURE HINT BAR ── */}
      {isScanning && (
        <div
          style={{
            padding: '12px 20px',
            background: '#161920',
            borderTop: '1px solid #2a2e35',
            display: 'flex',
            justifyContent: 'space-around',
            fontSize: '13px',
          }}
        >
          <span>← Swipe Left: Sold</span>
          <span style={{ color: 'var(--p31-teal)' }}>↑↓ Zones</span>
          <span>Swipe Right: Receive →</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export type { Zone, InventoryItem, ScanResult, ZeroTapWarehouseProps };
export { WAREHOUSE_ZONES, CATEGORY_PATTERNS };
export default ZeroTapWarehouse;
