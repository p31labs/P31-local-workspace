/**
 * OpenAPI endpoint — serves the schema at /openapi.yaml
 * Uses auto-generated embedded spec from scripts/generate-openapi.ts
 */

import { OPENAPI_YAML } from './openapi.generated';

export async function handleOpenAPI(): Promise<Response> {
  return new Response(OPENAPI_YAML, {
    headers: {
      'Content-Type': 'application/yaml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
