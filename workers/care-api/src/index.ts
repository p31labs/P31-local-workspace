export interface Env {
  CAPITAL_DB: D1Database;
  CAPITAL_KV: KVNamespace;
  PQC_SESSION: KVNamespace;
  EVENTS_QUEUE: Queue;
  TURNSTILE_SECRET_KEY?: string;
  ENVIRONMENT: string;
  LOVE_SBT_ADDRESS?: string;
  PROOF_OF_CARE_ADDRESS?: string;
}

import {
  hybridKeygen,
  hybridDecapsulate,
  verifyHybridSignature,
  bytesToHex,
  hexToBytes,
} from './lib/pqc';

const RATE_LIMIT_WINDOW = 60;
const RATE_LIMIT_MAX = 10;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Turnstile-Token',
      'Access-Control-Max-Age': '86400',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      if (path.startsWith('/care/') && method === 'POST') {
        const turnstileToken = request.headers.get('X-Turnstile-Token');
        const turnstileResult = await verifyTurnstile(turnstileToken, request.headers.get('CF-Connecting-IP') || undefined, env.TURNSTILE_SECRET_KEY);
        if (!turnstileResult.success) {
          return new Response(JSON.stringify({ error: 'Turnstile verification failed', codes: turnstileResult.error_codes }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      if (path === '/care/sync' && method === 'POST') {
        const body = (await request.json()) as any;
        const publicKeyHex = body.publicKeyHex as string;
        if (!publicKeyHex || typeof publicKeyHex !== 'string' || publicKeyHex.length < 32) {
          return new Response(JSON.stringify({ error: 'Invalid publicKeyHex' }), {
            status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const now = Math.floor(Date.now() / 1000);

        const timestamp = body.timestamp as number;
        if (typeof timestamp !== 'number') {
          return new Response(JSON.stringify({ error: 'Missing timestamp' }), {
            status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        if (timestamp < now - 300 || timestamp > now + 60) {
          return new Response(JSON.stringify({ error: 'Timestamp out of range' }), {
            status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const signature = body.signature as string;
        if (!signature) {
          return new Response(JSON.stringify({ error: 'Missing signature' }), {
            status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        if (body.mlDsaPublicKey && body.mlDsaSignature && body.payload) {
          try {
            const messageHex = typeof body.payload === 'string'
              ? body.payload
              : bytesToHex(new TextEncoder().encode(JSON.stringify(body.payload)));
            const mlDsaValid = verifyHybridSignature(
              body.mlDsaPublicKey,
              messageHex,
              body.mlDsaSignature
            );
            if (!mlDsaValid) {
              return new Response(JSON.stringify({ error: 'PQC signature verification failed' }), {
                status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders }
              });
            }
          } catch (e) {
            console.error('[pqc] ML-DSA-65 verification error:', e);
            return new Response(JSON.stringify({ error: 'PQC signature verification error' }), {
              status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }
        }

        if (body.payload.nonce) {
          const nonceUsed = await env.CAPITAL_DB.prepare(
            'SELECT nonce FROM care_nonces WHERE nonce = ? AND expires_at > ?'
          ).bind(body.payload.nonce, now).first<{ nonce: string }>();
          if (nonceUsed) {
            return new Response(JSON.stringify({ error: 'Nonce already used' }), {
              status: 409, headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }
        }

        const rateKey = `rate:${publicKeyHex}:${Math.floor(now / RATE_LIMIT_WINDOW)}`;
        const recentHits = (await env.CAPITAL_KV.get(rateKey)) || '0';
        const hitCount = parseInt(recentHits, 10);
        if (hitCount >= RATE_LIMIT_MAX) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(RATE_LIMIT_WINDOW),
              ...corsHeaders,
            },
          });
        }

        await ensureIdentity(env, publicKeyHex);
        let currentState = await getCareState(env, publicKeyHex);
        if (!currentState) {
          currentState = {
            biometricScore: 0.1, bondScore: 0.1, ledgerScore: 0.1, confidence: 0, lastTimestamp: now
          };
        }

        const { ReputationEngine, createInitialMetrics } = await import('./lib/reputationEngine');
        const engine = new ReputationEngine();
        const update: any = {};
        if (body.payload.biometricScore !== undefined) update.biometricDelta = body.payload.biometricScore;
        if (body.payload.bondScore !== undefined) update.bondDelta = body.payload.bondScore;
        if (body.payload.ledgerBump !== undefined) update.ledgerBump = body.payload.ledgerBump;

        const result = engine.computeCompositeScore(currentState, update, now);
        const countKey = `count:${publicKeyHex}`;
        let interactionCount = parseInt(await env.CAPITAL_KV.get(countKey) || '0', 10);
        interactionCount += 1;
        const updatedMetrics = {
          ...result.updatedMetrics,
          confidence: engine.computeConfidence(interactionCount),
        };
        const composite = result.composite;

        const telemetryId = body.payload.id || crypto.randomUUID();
        const nonce = body.payload.nonce || crypto.randomUUID();

        const insertTelemetry = env.CAPITAL_DB.prepare(
          `INSERT INTO care_telemetry (id, public_key_hex, biometric_score, bond_score, ledger_score, composite_score, timestamp, signature_hex, nonce) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(telemetryId, publicKeyHex, updatedMetrics.biometricScore, updatedMetrics.bondScore, updatedMetrics.ledgerScore, composite, now, signature, nonce);

        const upsertState = env.CAPITAL_DB.prepare(
          `INSERT OR REPLACE INTO care_state (public_key_hex, biometric_score, bond_score, ledger_score, composite_score, confidence, last_update) VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(publicKeyHex, updatedMetrics.biometricScore, updatedMetrics.bondScore, updatedMetrics.ledgerScore, composite, updatedMetrics.confidence, now);

        const insertNonce = env.CAPITAL_DB.prepare(
          `INSERT INTO care_nonces (nonce, public_key_hex, expires_at) VALUES (?, ?, ?)`
        ).bind(nonce, publicKeyHex, now + 3600);

        const batchResults = await env.CAPITAL_DB.batch([insertTelemetry, upsertState, insertNonce]);
        if (batchResults.some((r: any) => !r.success)) {
          throw new Error('D1 batch transaction failed');
        }

        ctx.waitUntil(
          (async () => {
            await Promise.all([
              env.CAPITAL_KV.put(rateKey, String(hitCount + 1), { expirationTtl: RATE_LIMIT_WINDOW }),
              env.CAPITAL_KV.put(countKey, String(interactionCount), { expirationTtl: 86400 * 30 }),
              (env.EVENTS_QUEUE as any).send({
                type: 'care_score_alert',
                payload: { publicKeyHex, composite, timestamp: now },
                timestamp: now,
                priority: 'normal',
              }),
            ]);
          })()
        );

        const response: CareSyncResponse = { success: true, composite, metrics: updatedMetrics, message: 'Care score synced' };
        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      if (path === '/care/state' && method === 'GET') {
        const publicKeyHex = url.searchParams.get('publicKey');
        if (!publicKeyHex) {
          return new Response(JSON.stringify({ error: 'publicKey parameter required' }), {
            status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const state = await getCareState(env, publicKeyHex);
        if (!state) {
          return new Response(JSON.stringify({ error: 'Identity not found' }), {
            status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const now = Math.floor(Date.now() / 1000);
        const { ReputationEngine } = await import('./lib/reputationEngine');
        const engine = new ReputationEngine();
        const decayed = engine.getDecayedScores(state, now);
        const composite = engine.computeCompositeScore(decayed, {}, now).composite;

        const response: CareStateResponse = {
          publicKeyHex,
          current: state,
          decayed,
          composite,
          timestamp: now,
        };
        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      if (path === '/care/rewards' && method === 'GET') {
        const publicKeyHex = url.searchParams.get('publicKey');
        if (!publicKeyHex) {
          return new Response(JSON.stringify({ error: 'publicKey parameter required' }), {
            status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const state = await getCareState(env, publicKeyHex);
        if (!state) {
          return new Response(JSON.stringify({ error: 'Identity not found' }), {
            status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const now = Math.floor(Date.now() / 1000);
        const { ReputationEngine } = await import('./lib/reputationEngine');
        const engine = new ReputationEngine();
        const decayed = engine.getDecayedScores(state, now);
        const computed = engine.computeCompositeScore(decayed, {}, now);
        const score = computed.composite;
        const scoreScaled = score * 1e18;

        const CARE_THRESHOLD = 0.5e18;
        const projectedLevel = Math.floor(scoreScaled / CARE_THRESHOLD);
        const nextThresholdAt = (projectedLevel + 1) * CARE_THRESHOLD;
        const potentialReward = scoreScaled >= CARE_THRESHOLD ? 100 : 0;

        const countKey = `count:${publicKeyHex}`;
        const interactionCount = parseInt(await env.CAPITAL_KV.get(countKey) || '0', 10);
        const confidence = engine.computeConfidence(interactionCount);

        const response: RewardProjection = {
          publicKeyHex,
          currentScore: score,
          projectedSBTLevel: projectedLevel,
          careThreshold: CARE_THRESHOLD / 1e18,
          nextThresholdAt: nextThresholdAt / 1e18,
          potentialLOVEReward: potentialReward,
          rewardCooldownRemaining: 0,
          existingSBTCount: 0,
        };

        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      if (path === '/health' && method === 'GET') {
        return new Response(JSON.stringify({
          status: 'ok',
          service: 'care-api',
          environment: env.ENVIRONMENT || 'production',
          timestamp: Date.now(),
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      if (path === '/pqc/session' && method === 'POST') {
        const body = (await request.json()) as any;
        const publicKeyHex = body.publicKeyHex as string;
        if (!publicKeyHex || typeof publicKeyHex !== 'string' || publicKeyHex.length < 32) {
          return new Response(JSON.stringify({ error: 'Invalid publicKeyHex' }), {
            status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const clientEncapsKey = body.encapsulatedKey as string;
        if (!clientEncapsKey || typeof clientEncapsKey !== 'string') {
          return new Response(JSON.stringify({ error: 'Missing encapsulatedKey' }), {
            status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const sessionId = crypto.randomUUID();
        const sessionExpiry = Math.floor(Date.now() / 1000) + 3600;

        const keypair = await hybridKeygen();
        const sessionData = {
          serverPublicKey: bytesToHex(keypair.mlkemPublicKey),
          serverPrivateKey: bytesToHex(keypair.mlkemSecretKey),
          eccPublicKeyRaw: bytesToHex(keypair.eccPublicKeyRaw),
          eccPrivateKeyPkcs8: bytesToHex(keypair.eccPrivateKeyPkcs8),
          clientEncapsulatedKey: clientEncapsKey,
          publicKeyHex,
          createdAt: sessionExpiry,
          expiresAt: sessionExpiry + 3600,
        };

        await env.PQC_SESSION.put(sessionId, JSON.stringify(sessionData), {
          expirationTtl: 3600,
        });

        const response = {
          sessionId,
          serverPublicKey: sessionData.serverPublicKey,
          eccPublicKeyRaw: sessionData.eccPublicKeyRaw,
          expiresAt: sessionData.expiresAt,
        };

        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    } catch (error: any) {
      console.error('[care-api] Error:', error);
      return new Response(JSON.stringify({ error: processError(error) }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  },
};

async function verifyTurnstile(token: string | null, remoteip: string | undefined, secretKey: string | undefined): Promise<{ success: boolean; code?: string; error_codes?: string[] }> {
  if (!token) return { success: false, code: 'missing_token' };
  if (!secretKey) {
    console.warn('[turnstile] No TURNSTILE_SECRET_KEY configured — skipping verification');
    return { success: true };
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    formData.append('remoteip', remoteip || 'unknown');

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const result: any = await response.json();
    return { success: result.success === true, code: result['error-codes']?.[0], error_codes: result['error-codes'] };
  } catch (error) {
    console.error('[turnstile] Verification error:', error);
    return { success: false, code: 'verification_error' };
  }
}

async function ensureIdentity(env: Env, publicKeyHex: string): Promise<void> {
  const existing = await env.CAPITAL_DB.prepare('SELECT public_key_hex FROM identities WHERE public_key_hex = ?').bind(publicKeyHex).first<{ public_key_hex: string }>();
  if (!existing) {
    await env.CAPITAL_DB.prepare('INSERT INTO identities (public_key_hex, created_at) VALUES (?, ?)').bind(publicKeyHex, Math.floor(Date.now() / 1000)).run();
  }
}

async function getCareState(env: Env, publicKeyHex: string): Promise<CareMetrics | null> {
  const result = await env.CAPITAL_DB.prepare(
    `SELECT biometric_score, bond_score, ledger_score, composite_score, confidence, last_update FROM care_state WHERE public_key_hex = ?`
  ).bind(publicKeyHex).first<{
    biometric_score: number;
    bond_score: number;
    ledger_score: number;
    composite_score: number;
    confidence: number;
    last_update: number;
  }>();
  if (!result) return null;
  return {
    biometricScore: result.biometric_score,
    bondScore: result.bond_score,
    ledgerScore: result.ledger_score,
    confidence: result.confidence,
    lastTimestamp: result.last_update,
  };
}

function processError(error: any): string {
  if (error.message) return error.message;
  return 'Internal server error';
}
