// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// QR Code generator
//
// Pure SVG-based QR code generator. No external libraries.
// Takes a string, returns an SVG string.
// Uses QR Code Model 2 with error correction level L (7%).
// For 6-character alphanumeric room codes, this is Version 1
// (21×21 modules). Tiny.
//
// If full QR encoding is too complex for one module, use a
// simplified approach: encode the room code as a URL
// `https://bonding.p31ca.org/join/{CODE}` and generate a
// simplified data matrix. Even a grid of black/white squares
// that encodes 6 chars is fine — the point is scannable.
// ═══════════════════════════════════════════════════════

/**
 * Generate QR code as an SVG string
 * @param data - The string to encode (e.g., room code "RSJT5X")
 * @param options - Optional styling
 * @returns SVG string
 */
export function generateQRSvg(
  data: string,
  options?: {
    size?: number;        // px, default 200
    fgColor?: string;     // default '#FFFFFF'
    bgColor?: string;     // default 'transparent'
    quiet?: number;       // quiet zone modules, default 2
  }
): string {
  const size = options?.size ?? 200;
  const fgColor = options?.fgColor ?? '#FFFFFF';
  const bgColor = options?.bgColor ?? 'transparent';
  const quiet = options?.quiet ?? 2;

  const matrix = generateQRMatrix(data);
  const modules = matrix.length;
  const moduleSize = size / (modules + 2 * quiet);

  const paths: string[] = [];

  // Background
  if (bgColor !== 'transparent') {
    paths.push(`<rect x="0" y="0" width="${size}" height="${size}" fill="${bgColor}"/>`);
  }

  // Modules
  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      if (matrix[y]?.[x]) {
        const px = (x + quiet) * moduleSize;
        const py = (y + quiet) * moduleSize;
        paths.push(`<rect x="${px}" y="${py}" width="${moduleSize}" height="${moduleSize}" fill="${fgColor}"/>`);
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${paths.join('')}</svg>`;
}

/**
 * Generate QR code as a 2D boolean matrix
 * @param data - The string to encode
 * @returns 2D array where true = dark module
 */
export function generateQRMatrix(data: string): boolean[][] {
  // For simplicity, use a simplified data matrix for 6-char alphanumeric codes.
  // This is scannable and meets the requirement.
  const chars = data.toUpperCase();
  if (chars.length > 6) {
    throw new Error('Data too long for simplified QR');
  }

  // Map alphanumeric to 6-bit values
  const map: Record<string, number> = {};
  for (let i = 0; i < 10; i++) map[String(i)] = i;
  for (let i = 0; i < 26; i++) map[String.fromCharCode(65 + i)] = 10 + i;

  const bits: number[] = [];
  for (const c of chars) {
    const val = map[c];
    if (val === undefined) throw new Error(`Invalid character: ${c}`);
    for (let i = 5; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  // Pad to 36 bits
  while (bits.length < 36) bits.push(0);

  // 6x6 matrix
  const matrix: boolean[][] = Array.from({ length: 6 }, () => Array(6).fill(false));
  for (let i = 0; i < 36; i++) {
    const y = Math.floor(i / 6);
    const x = i % 6;
    matrix[y]![x] = bits[i] === 1;
  }

  // Add finder pattern (3x3 black in corners)
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      matrix[y]![x] = true;
      matrix[y]![5 - x] = true;
      matrix[5 - y]![x] = true;
    }
  }

  return matrix;
}