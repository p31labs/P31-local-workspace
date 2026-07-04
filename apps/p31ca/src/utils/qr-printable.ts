/**
 * QR Code Sticker Generator — Thermal Label Print-Ready
 * 2" × 1" labels (standard thermal printer)
 * @module
 */

import { WAREHOUSE_ZONES, Zone } from '../components/ZeroTapWarehouse';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const LABEL_WIDTH_MM = 50;   // 2 inches
const LABEL_HEIGHT_MM = 25;  // 1 inch
const QR_SIZE_MM = 20;
const DPI = 203; // Standard thermal printer DPI

export interface QRSticker {
  qrData: string;
  zone: Zone;
  category: string;
  humanReadable: string; // e.g., "SEAT-001"
  pluCode: string;       // e.g., "01-SEAT-001"
}

// ─────────────────────────────────────────────────────────────────────────────
// STICKER BATCH GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate sticker data for a category
 * Creates sequential QR codes with PLU prefixes
 */
export function generateStickerBatch(
  zoneId: number,
  category: string,
  prefix: string,
  startNum: number = 1,
  count: number = 100
): QRSticker[] {
  const zone = WAREHOUSE_ZONES.find((z) => z.id === zoneId);
  if (!zone) throw new Error(`Zone ${zoneId} not found`);

  return Array.from({ length: count }, (_, i) => {
    const num = startNum + i;
    const paddedNum = String(num).padStart(3, '0');
    const humanReadable = `${prefix}-${paddedNum}`;
    const pluCode = `${zone.pluPrefix}-${prefix}-${paddedNum}`;
    const qrData = `P31-${prefix}-${paddedNum}`;

    return {
      qrData,
      zone,
      category,
      humanReadable,
      pluCode,
    };
  });
}

/**
 * Predefined batches for AJ's warehouse
 */
export const WAREHOUSE_BATCHES: { name: string; zoneId: number; category: string; prefix: string; count: number }[] = [
  { name: 'Seating', zoneId: 1, category: 'Seating', prefix: 'SEAT', count: 200 },
  { name: 'Tables', zoneId: 2, category: 'Tables', prefix: 'TABLE', count: 150 },
  { name: 'Hardware', zoneId: 3, category: 'Hardware/Parts', prefix: 'HW', count: 300 },
  { name: 'Lighting', zoneId: 4, category: 'Lighting', prefix: 'LAMP', count: 100 },
  { name: 'Decor', zoneId: 5, category: 'Decor', prefix: 'DECOR', count: 150 },
  { name: 'Storage', zoneId: 6, category: 'Storage/Organization', prefix: 'STOR', count: 100 },
  { name: 'Appliances', zoneId: 7, category: 'Appliances', prefix: 'APP', count: 50 },
  { name: 'Outdoor', zoneId: 8, category: 'Outdoor', prefix: 'OUT', count: 75 },
  { name: 'Receiving', zoneId: 9, category: 'Uncategorized', prefix: 'NEW', count: 100 },
];

// ─────────────────────────────────────────────────────────────────────────────
// HTML PRINTABLE PAGE GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate print-ready HTML page for thermal printer
 * Uses CSS @media print for exact label sizing
 */
export function generatePrintableHTML(stickers: QRSticker[]): string {
  const stickerHTML = stickers
    .map((s, i) => createStickerHTML(s, i))
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>P31 Warehouse Labels — ${stickers[0]?.zone.name || 'Print'}</title>
  <style>
    @page {
      size: ${LABEL_WIDTH_MM}mm ${LABEL_HEIGHT_MM}mm;
      margin: 0;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Courier New', monospace;
      font-size: 8pt;
      line-height: 1.1;
      background: white;
    }
    
    .sticker {
      width: ${LABEL_WIDTH_MM}mm;
      height: ${LABEL_HEIGHT_MM}mm;
      padding: 2mm;
      border: 0.5pt solid #ccc;
      display: flex;
      align-items: center;
      gap: 2mm;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .sticker:not(:last-child) {
      border-bottom: 0.5pt dashed #ddd;
    }
    
    .qr-section {
      flex-shrink: 0;
    }
    
    .qr-code {
      width: ${QR_SIZE_MM}mm;
      height: ${QR_SIZE_MM}mm;
    }
    
    .info-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .plu-code {
      font-size: 10pt;
      font-weight: bold;
      color: #000;
      letter-spacing: 0.5pt;
    }
    
    .category {
      font-size: 7pt;
      color: #666;
      text-transform: uppercase;
      margin-top: 1mm;
    }
    
    .zone-pill {
      display: inline-block;
      background: #000;
      color: white;
      padding: 0.5mm 2mm;
      font-size: 6pt;
      font-weight: bold;
      margin-top: 1mm;
      width: fit-content;
    }
    
    .qr-data {
      font-size: 5pt;
      color: #999;
      margin-top: 1mm;
      word-break: break-all;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .no-print {
        display: none !important;
      }
    }
    
    /* Screen preview styles */
    @media screen {
      body {
        background: #f5f5f5;
        padding: 20px;
      }
      
      .sticker {
        background: white;
        margin-bottom: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .preview-controls {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 1000;
      }
      
      .preview-controls button {
        padding: 10px 20px;
        background: #5DCAA5;
        color: #0f1115;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
      }
      
      .preview-controls button:hover {
        background: #4aa884;
      }
    }
  </style>
</head>
<body>
  <div class="preview-controls no-print">
    <button onclick="window.print()">🖨️ Print Labels</button>
    <p style="margin-top: 10px; font-size: 12px; color: #666;">
      ${stickers.length} labels ready<br>
      Printer: 2" × 1" thermal labels
    </p>
  </div>
  
  ${stickerHTML}
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <script>
    // Generate QR codes after DOM loads
    document.addEventListener('DOMContentLoaded', function() {
      const qrContainers = document.querySelectorAll('.qr-code');
      
      qrContainers.forEach(function(container) {
        const qrData = container.dataset.qr;
        if (qrData && window.QRCode) {
          new QRCode(container, {
            text: qrData,
            width: ${QR_SIZE_MM * 4},
            height: ${QR_SIZE_MM * 4},
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
          });
        }
      });
    });
  </script>
</body>
</html>
  `.trim();
}

function createStickerHTML(sticker: QRSticker, index: number): string {
  return `
  <div class="sticker" data-index="${index}">
    <div class="qr-section">
      <div class="qr-code" data-qr="${sticker.qrData}"></div>
    </div>
    <div class="info-section">
      <div class="plu-code">${sticker.pluCode}</div>
      <div class="category">${sticker.category}</div>
      <div class="zone-pill">${sticker.zone.pluPrefix}</div>
      <div class="qr-data">${sticker.qrData}</div>
    </div>
  </div>
  `.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF GENERATION (Browser-compatible)
// Uses jsPDF or falls back to print dialog
// ─────────────────────────────────────────────────────────────────────────────

export async function downloadLabelsPDF(
  stickers: QRSticker[],
  filename: string = 'p31-warehouse-labels'
): Promise<void> {
  const html = generatePrintableHTML(stickers);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  // Open in new window for print
  const printWindow = window.open(url, '_blank', 'width=400,height=600');

  if (!printWindow) {
    // Fallback: download HTML file
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI / SERVER-SIDE BATCH GENERATOR
// For pre-generating all warehouse stickers
// ─────────────────────────────────────────────────────────────────────────────

export function generateAllWarehouseStickers(): QRSticker[] {
  const all: QRSticker[] = [];

  for (const batch of WAREHOUSE_BATCHES) {
    const stickers = generateStickerBatch(
      batch.zoneId,
      batch.category,
      batch.prefix,
      1,
      batch.count
    );
    all.push(...stickers);
  }

  return all;
}

/**
 * Export sticker data as CSV (for thermal printer software import)
 */
export function exportStickersCSV(stickers: QRSticker[]): string {
  const headers = ['QR Data', 'PLU Code', 'Zone', 'Category', 'Human Readable'];

  const rows = stickers.map((s) => [
    s.qrData,
    s.pluCode,
    s.zone.name,
    s.category,
    s.humanReadable,
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// SOVEREIGN IDENTITY QR ENVELOPE
// Printable QR for the Delta Runway Ignition
// ─────────────────────────────────────────────────────────────────────────────

export interface SovereignQRSticker {
  type: 'sovereign-identity';
  publicKey: string;
  alias: string;
  genesisHash: string;
  vertex: string;
  recoveryUrl: string;
}

export function generateSovereignQRPayload(sticker: SovereignQRSticker): string {
  const payload = {
    v: 'p31.sovereign/1.0.0',
    pk: sticker.publicKey,
    alias: sticker.alias,
    vertex: sticker.vertex,
    gh: sticker.genesisHash,
    r: sticker.recoveryUrl,
  };
  return JSON.stringify(payload);
}

export function generateSovereignPrintableHTML(sticker: SovereignQRSticker): string {
  const qrData = generateSovereignQRPayload(sticker);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sovereign Envelope — ${sticker.alias}</title>
  <style>
    @page { size: 50mm 30mm; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 7pt;
      line-height: 1.2;
      background: white;
      padding: 3mm;
    }
    .envelope {
      width: 44mm;
      height: 24mm;
      display: flex;
      align-items: center;
      gap: 2mm;
      border: 0.5pt solid #000;
      page-break-inside: avoid;
    }
    .qr-code {
      width: 20mm;
      height: 20mm;
      flex-shrink: 0;
    }
    .info {
      flex: 1;
      overflow: hidden;
    }
    .alias { font-size: 8pt; font-weight: bold; }
    .vertex { font-size: 6pt; text-transform: uppercase; margin-top: 1mm; }
    .pubkey { font-size: 5pt; word-break: break-all; margin-top: 1mm; opacity: 0.7; }
    @media print {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  </style>
</head>
<body>
  <div class="envelope">
    <div class="qr-code" data-qr="${qrData}"></div>
    <div class="info">
      <div class="alias">${sticker.alias}</div>
      <div class="vertex">${sticker.vertex}</div>
      <div class="pubkey">${sticker.publicKey.slice(0, 16)}...</div>
    </div>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const qr = document.querySelector('.qr-code');
      if (qr && window.QRCode && qr.dataset.qr) {
        new QRCode(qr, {
          text: qr.dataset.qr,
          width: 80,
          height: 80,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      }
    });
  </script>
</body>
</html>`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export {
  LABEL_WIDTH_MM,
  LABEL_HEIGHT_MM,
  QR_SIZE_MM,
  DPI,
};
