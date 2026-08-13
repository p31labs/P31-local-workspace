/**
 * @file engine/hapiConnector.ts — HDX Humanitarian API (HAPI) connector
 *
 * Fetches standardized humanitarian indicators for visualization on the dome.
 * Docs: https://hapi.humdata.org/
 */

import type { NormalizedDataPoint, DataConnector } from './dataConnectors';

const HAPI_BASE = 'https://hapi.humdata.org/api/v2';

function latLonToHash(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

export function createHapiConnector(
  theme: string = 'food-security',
  countryCode?: string,
): DataConnector {
  const id = `hapi-${theme}${countryCode ? `-${countryCode}` : ''}`;

  return {
    id,
    name: `HDX HAPI — ${theme}${countryCode ? ` (${countryCode})` : ''}`,
    description: `Humanitarian indicator: ${theme}`,
    target: 'face',

    async fetch(): Promise<NormalizedDataPoint[]> {
      const url = new URL(`${HAPI_BASE}/${theme}`);
      url.searchParams.set('app_identifier', 'spaceship-earth');
      if (countryCode) {
        url.searchParams.set('location_code', countryCode);
      }
      url.searchParams.set('limit', '100');

      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`HAPI request failed: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      const results = Array.isArray(json?.data) ? json.data : [];

      const points: NormalizedDataPoint[] = [];

      for (const row of results) {
        const location = row?.location || row?.admin1_name || row?.adm1_name;
        const lat = row?.lat ?? row?.latitude;
        const lon = row?.lon ?? row?.longitude;
        const value = typeof row?.value === 'number' ? row.value : Number(row?.value);
        const label = row?.location_name || row?.admin1_name || row?.adm1_name || location || id;

        if (lat === undefined || lon === undefined || Number.isNaN(value)) {
          continue;
        }

        points.push({
          id: latLonToHash(lat, lon),
          location: { lat, lon },
          value,
          label,
          timestamp: row?.date ? new Date(row.date).getTime() : undefined,
          metadata: {
            source: 'hdx-hapi',
            theme,
            countryCode,
            raw: row,
          },
        });
      }

      return points;
    },
  };
}
