/**
 * Minimal geohash encoding/decoding (base32, precision up to 8)
 * Used for 5‑character (~5 km) hand‑off region tagging.
 */

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export function encodeGeohash(lat: number, lon: number, precision: number = 5): string {
  let bits = 0;
  let bitsTotal = 0;
  let hash = '';

  let latMin = -90, latMax = 90;
  let lonMin = -180, lonMax = 180;

  while (hash.length < precision) {
    let bit: number;
    if (bitsTotal % 2 === 0) {
      // Even bit → longitude
      const lonMid = (lonMin + lonMax) / 2;
      if (lon >= lonMid) {
        bit = 1;
        lonMin = lonMid;
      } else {
        bit = 0;
        lonMax = lonMid;
      }
    } else {
      // Odd bit → latitude
      const latMid = (latMin + latMax) / 2;
      if (lat >= latMid) {
        bit = 1;
        latMin = latMid;
      } else {
        bit = 0;
        latMax = latMid;
      }
    }
    bits = (bits << 1) | bit;
    bitsTotal++;

    if (bitsTotal % 5 === 0) {
      hash += BASE32[bits];
      bits = 0;
    }
  }
  return hash;
}

export function decodeGeohash(hash: string): { lat: number; lon: number; latErr: number; lonErr: number } {
  let isEven = true;
  let latMin = -90, latMax = 90;
  let lonMin = -180, lonMax = 180;

  for (const ch of hash) {
    const idx = BASE32.indexOf(ch);
    if (idx === -1) throw new Error('Invalid geohash character');

    for (let n = 4; n >= 0; n--) {
      const bit = (idx >> n) & 1;
      if (isEven) {
        const lonMid = (lonMin + lonMax) / 2;
        if (bit === 1) lonMin = lonMid; else lonMax = lonMid;
      } else {
        const latMid = (latMin + latMax) / 2;
        if (bit === 1) latMin = latMid; else latMax = latMid;
      }
      isEven = !isEven;
    }
  }

  const lat = (latMin + latMax) / 2;
  const lon = (lonMin + lonMax) / 2;
  const latErr = latMax - latMin;
  const lonErr = lonMax - lonMin;

  return { lat, lon, latErr, lonErr };
}
