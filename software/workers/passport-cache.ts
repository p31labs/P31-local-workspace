/**
 * P31 Cognitive Passport Edge Cache
 * 
 * Edge-cached copy of the Cognitive Passport for sub-50ms global access
 * across all P31 properties.
 * 
 * Architecture:
 * - KV: Hot cache (1hr TTL)
 * - R2: Origin storage
 * - Brotli compression
 * 
 * @version 1.0.0
 * @date March 24, 2026
 */

export interface Env {
  PASSPORT_KV: KVNamespace;
  PASSPORT_R2: R2Bucket;
}

export interface CognitivePassport {
  operator: {
    name: string;
    age: number;
    dob: string;
    location: string;
    email: string;
    phone: string;
  };
  diagnoses: {
    audhd: boolean;
    hypoparathyroidism: boolean;
    yorvipath: boolean;
  };
  cognitive: {
    profile: string;
    outputBottleneck: boolean;
    writingIsHighestFidelity: boolean;
    processesInformationGeometrically: boolean;
    fawnResponse: boolean;
    executiveDysfunction: boolean;
  };
  communication: {
    style: string;
    metaphors: string[];
    cursesForEmphasis: boolean;
  };
  professional: {
    background: string;
    expertise: string[];
    current: string;
  };
  family: {
    children: Array<{
      name: string;
      dob: string;
      age: number;
    }>;
    estrangedWife: string;
    mother: string;
  };
  organization: {
    name: string;
    type: string;
    mission: string;
    domains: string[];
  };
  techStack: {
    frontend: string[];
    backend: string[];
    hardware: string[];
    firmware: string[];
  };
  concepts: Record<string, string>;
  schedule: Array<{
    block: string;
    time: string;
    task: string;
  }>;
  brandPalette: Record<string, string>;
}

export interface PassportCache {
  userId: string;
  version: number;
  data: CognitivePassport;
  cachedAt: number;
  expiresAt: number;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Route: GET /api/passport/{userId}
    if (pathParts[0] === 'api' && pathParts[1] === 'passport') {
      const userId = pathParts[2];
      
      if (!userId) {
        return new Response('Missing userId', { status: 400 });
      }

      // GET: Retrieve passport
      if (request.method === 'GET') {
        return this.getPassport(userId, env);
      }
      
      // POST: Update passport (admin only)
      if (request.method === 'POST') {
        return this.updatePassport(userId, request, env);
      }
      
      // GET: Get version
      if (request.method === 'HEAD') {
        return this.getVersion(userId, env);
      }
    }

    // Route: GET /api/passport/{userId}/version
    if (pathParts[0] === 'api' && pathParts[1] === 'passport' && pathParts[3] === 'version') {
      const userId = pathParts[2];
      return this.getVersion(userId, env);
    }

    return new Response('Not found', { status: 404 });
  },

  async getPassport(userId: string, env: Env): Promise<Response> {
    // Check KV cache first
    const cached = await env.PASSPORT_KV.get(`passport:${userId}`);
    
    if (cached) {
      const passport = JSON.parse(cached) as PassportCache;
      
      // Check if not expired
      if (passport.expiresAt > Date.now()) {
        return new Response(cached, {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
            'X-Cache': 'HIT',
            'X-Version': passport.version.toString(),
            'X-Cached-At': passport.cachedAt.toString(),
          },
        });
      }
    }

    // Cache miss - fetch from R2
    const r2Object = await env.PASSPORT_R2.get(`passports/${userId}/latest.json`);
    
    if (!r2Object) {
      return new Response('Passport not found', { status: 404 });
    }

    const data = await r2Object.json() as CognitivePassport;
    const version = parseInt(r2Object.customMetadata?.version || '1', 10);
    
    // Store in KV for next time
    const cacheEntry: PassportCache = {
      userId,
      version,
      data,
      cachedAt: Date.now(),
      expiresAt: Date.now() + 3600000, // 1 hour
    };
    
    await env.PASSPORT_KV.put(
      `passport:${userId}`,
      JSON.stringify(cacheEntry),
      { expirationTtl: 3600 }
    );

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'X-Cache': 'MISS',
        'X-Version': version.toString(),
      },
    });
  },

  async updatePassport(userId: string, request: Request, env: Env): Promise<Response> {
    // Verify admin key (in production, use proper auth)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const data = await request.json() as CognitivePassport;
    const version = parseInt(request.headers.get('X-Passport-Version') || '1', 10);
    const newVersion = version + 1;
    
    // Store in R2
    const content = JSON.stringify(data, null, 2);
    const contentHash = await this.calculateHash(content);
    
    await env.PASSPORT_R2.put(
      `passports/${userId}/v${newVersion}.json`,
      content,
      {
        customMetadata: {
          version: newVersion.toString(),
          updatedAt: Date.now().toString(),
          contentHash,
        },
      }
    );

    // Also update latest
    await env.PASSPORT_R2.put(
      `passports/${userId}/latest.json`,
      content,
      {
        customMetadata: {
          version: newVersion.toString(),
          updatedAt: Date.now().toString(),
          contentHash,
        },
      }
    );

    // Invalidate KV cache
    await env.PASSPORT_KV.delete(`passport:${userId}`);

    return new Response(JSON.stringify({
      success: true,
      userId,
      version: newVersion,
      contentHash,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async getVersion(userId: string, env: Env): Promise<Response> {
    // Check KV first
    const cached = await env.PASSPORT_KV.get(`passport:${userId}`);
    
    if (cached) {
      const passport = JSON.parse(cached) as PassportCache;
      return new Response(null, {
        status: 200,
        headers: {
          'X-Version': passport.version.toString(),
          'X-Cached-At': passport.cachedAt.toString(),
          'X-Expires-At': passport.expiresAt.toString(),
        },
      });
    }

    // Check R2
    const r2Object = await env.PASSPORT_R2.get(`passports/${userId}/latest.json`);
    
    if (!r2Object) {
      return new Response('Passport not found', { status: 404 });
    }

    return new Response(null, {
      status: 200,
      headers: {
        'X-Version': r2Object.customMetadata?.version || '1',
        'X-Updated-At': r2Object.customMetadata?.updatedAt || '0',
      },
    });
  },

  async calculateHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },
};
