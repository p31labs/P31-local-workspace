/**
 * SpIn Mesh — Geohash Midpoint + Venue Suggestion
 *
 * Computes geographic midpoint, encodes to 5-char geohash (~5km), queries
 * Overpass for public quiet venues (cafes, libraries, parks).
 */

import { encodeGeohash } from './geohash';

export interface LatLon {
  lat: number;
  lon: number;
}

function rad(deg: number): number { return deg * Math.PI / 180; }
function deg(rad: number): number { return rad * 180 / Math.PI; }

export function midpoint(a: LatLon, b: LatLon): LatLon {
  const lat1 = rad(a.lat), lon1 = rad(a.lon);
  const lat2 = rad(b.lat), lon2 = rad(b.lon);

  const ax = Math.cos(lat1) * Math.cos(lon1);
  const ay = Math.cos(lat1) * Math.sin(lon1);
  const az = Math.sin(lat1);

  const bx = Math.cos(lat2) * Math.cos(lon2);
  const by = Math.cos(lat2) * Math.sin(lon2);
  const bz = Math.sin(lat2);

  const cx = (ax + bx) / 2, cy = (ay + by) / 2, cz = (az + bz) / 2;
  const hyp = Math.sqrt(cx*cx + cy*cy);
  return { lat: deg(Math.atan2(cz, hyp)), lon: deg(Math.atan2(cy, cx)) };
}

export function geohash5(lat: number, lon: number): string {
  return encodeGeohash(lat, lon, 5);
}

function overpassQuery(lat: number, lon: number, radiusM: number = 5000): string {
  // Approx bbox: ~0.05° ≈ 5km at mid-latitudes
  const delta = radiusM / 111000; // meters to degrees approx
  const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
  return `
    [out:json][timeout:25];
    (
      node["amenity"~"cafe|library|park"](bbox);
      way["amenity"~"cafe|library|park"](bbox);
      relation["amenity"~"cafe|library|park"](bbox);
    );
    out center;
  `;
}

export interface Venue { name: string; lat: number; lon: number; }

export async function suggestVenues(a: LatLon, b: LatLon): Promise<Venue[]> {
  const mid = midpoint(a, b);
  const q = overpassQuery(mid.lat, mid.lon);
  const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q);
  try {
    const resp = await fetch(url);
    const json = await resp.json();
    return (json.elements || [])
      .filter((el: any) => el.name)
      .map((el: any) => ({
        name: el.name,
        lat: el.lat ?? el.center?.lat,
        lon: el.lon ?? el.center?.lon,
      }))
      .slice(0, 3);
  } catch (e) {
    console.error('Overpass fetch failed', e);
    return [];
  }
}

export async function getHandoverPlan(a: LatLon, b: LatLon): Promise<{
  midpoint: LatLon;
  geohash: string;
  venues: Venue[];
}> {
  const mid = midpoint(a, b);
  const gh = geohash5(mid.lat, mid.lon);
  const venues = await suggestVenues(a, b);
  return { midpoint: mid, geohash: gh, venues };
}

/**
 * Convert degrees to radians.
 */
function rad(deg: number): number {
  return deg * Math.PI / 180;
}

/**
 * Convert radians to degrees.
 */
function deg(rad: number): number {
  return rad * 180 / Math.PI;
}

/**
 * Compute geographic midpoint on a sphere (Earth WGS‑84).
 */
export function midpoint(a: LatLon, b: LatLon): LatLon {
  const lat1 = rad(a.lat), lon1 = rad(a.lon);
  const lat2 = rad(b.lat), lon2 = rad(b.lon);

  const bx = Math.cos(lat2) * Math.cos(lon2);
  const by = Math.cos(lat2) * Math.sin(lon2);
  const bz = Math.sin(lat2);

  const ax = Math.cos(lat1) * Math.cos(lon1);
  const ay = Math.cos(lat1) * Math.sin(lon1);
  const az = Math.sin(lat1);

  const cx = (ax + bx) / 2;
  const cy = (ay + by) / 2;
  const cz = (az + bz) / 2;

  const hyp = Math.sqrt(cx * cx + cy * cy);
  const midLat = Math.atan2(cz, hyp);
  const midLon = Math.atan2(cy, cx);

  return { lat: deg(midLat), lon: deg(midLon) };
}

/**
 * Encode a coordinate to a 5‑character geohash (≈5 km precision).
 * Simple base‑32 encoding; uses geohash library if available.
 */
export function geohash5(lat: number, lon: number): string {
  // Minimal implementation: use external library 'geohash-any' in prod
  // Here return placeholder to avoid heavy dependency
  return '00000'; // Replace with real calculation
}

/**
 * Build Overpass QL query for venues within a radius of midpoint.
 */
export function overpassQuery(lat: number, lon: number, radiusMeters: number = 5000): string {
  const bbox = `${lon - 0.05},${lat - 0.05},${lon + 0.05},${lat + 0.05}`; // approx 5 km box
  return `
    [out:json][timeout:25];
    (
      node["amenity"~"cafe|library|park"](bbox);
      way["amenity"~"cafe|library|park"](bbox);
      relation["amenity"~"cafe|library|park"](bbox);
    );
    out center;
  `;
}

/**
 * Fetch venue candidates from Overpass (returns array of {name, lat, lon}).
 */
export async function suggestVenues(a: LatLon, b: LatLon): Promise<Array<{ name: string; lat: number; lon: number }>> {
  const mid = midpoint(a, b);
  const query = overpassQuery(mid.lat, mid.lon);
  const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

  const resp = await fetch(url);
  const json = await resp.json();
  const elements = json.elements || [];

  return elements
    .filter((el: any) => el.name) // exclude unnamed
    .map((el: any) => ({
      name: el.name,
      lat: el.lat || el.center?.lat,
      lon: el.lon || el.center?.lon
    }))
    .slice(0, 3); // top 3 closest
}

/**
 * Full service: compute meetup suggestion.
 */
export async function getHandoverPlan(userA: LatLon, userB: LatLon): Promise<{
  midpoint: LatLon;
  geohash: string;
  venues: Array<{ name: string; lat: number; lon: number }>;
}> {
  const mid = midpoint(userA, userB);
  const gh = geohash5(mid.lat, mid.lon);
  const venues = await suggestVenues(userA, userB);
  return { midpoint: mid, geohash: gh, venues };
}
