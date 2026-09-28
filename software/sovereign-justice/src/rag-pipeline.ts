// P31 Sovereign Justice — RAG Pipeline Worker
// Unified semantic search over legal, procedural, and restorative corpuses
// Uses Cloudflare Vectorize + D1 for hybrid search

interface Env {
  JUSTICE_D1: D1Database;
  JUSTICE_VECTORIZE: VectorizeIndex;
  AI: Ai;
}

interface RAGChunk {
  id: string;
  case_id: string | null;
  domain: string;
  document_name: string;
  chunk_index: number;
  raw_text: string;
  metadata: string;
  vector_id: string | null;
  created_at: string;
}

interface IngestRequest {
  caseId?: string;
  domain: 'legal' | 'procedural' | 'restorative';
  documentName: string;
  sourceUrl?: string;
  chunks: Array<{
    index: number;
    text: string;
    metadata?: Record<string, unknown>;
  }>;
}

interface QueryRequest {
  query: string;
  domain?: 'legal' | 'procedural' | 'restorative';
  caseId?: string;
  topK?: number;
}

const ALLOWED_ORIGINS = ['https://phos.p31ca.org', 'http://localhost:5173'];

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return {};
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

function json(body: unknown, status: number | Request = 200, request?: Request): Response {
  if (status instanceof Request) {
    request = status;
    status = 200;
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...(request ? corsHeaders(request) : {}) },
  });
}

function err(message: string, status: number, request?: Request): Response {
  return new Response(message, { status, headers: request ? corsHeaders(request) : {} });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (pathParts[0] === 'api' && pathParts[1] === 'rag') {
      if (pathParts[2] === 'ingest' && request.method === 'POST') {
        return this.handleIngest(request, env);
      }
      if (pathParts[2] === 'query' && request.method === 'POST') {
        return this.handleQuery(request, env);
      }
      if (pathParts[2] === 'documents' && request.method === 'GET') {
        return this.handleListDocuments(request, env);
      }
    }

    if (pathParts[0] === 'api' && pathParts[1] === 'health' && request.method === 'GET') {
      return json({ status: 'ok', service: 'rag-pipeline' }, request);
    }

    return err('Not found', 404, request);
  },

  async handleIngest(request: Request, env: Env): Promise<Response> {
    try {
      const body = await request.json() as IngestRequest;

      if (!body.domain || !body.documentName || !body.chunks?.length) {
        return err('Missing required fields: domain, documentName, chunks', 400, request);
      }

      const documentId = crypto.randomUUID();
      const results: Array<{ index: number; chunkId: string; vectorId: string | null }> = [];

      // 1. Register document
      await env.JUSTICE_D1.prepare(`
        INSERT INTO rag_documents (id, case_id, domain, document_name, chunk_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(documentId, body.caseId || null, body.domain, body.documentName, body.chunks.length).run();

      // 2. Process each chunk
      for (const chunk of body.chunks) {
        const chunkId = crypto.randomUUID();

        // Generate embedding via Workers AI
        let vectorId: string | null = null;
        try {
          const embedding = await env.AI.run(env.EMBEDDING_MODEL || '@cf/baai/bge-large-en-v1.5', {
            text: [chunk.text],
          });
          const raw = embedding.data[0];
          const vector = Array.isArray(raw) ? raw : (raw as { embedding: number[] }).embedding;

          // Insert into Vectorize
          const inserted = await env.JUSTICE_VECTORIZE.insert([{
            id: chunkId,
            values: vector,
            metadata: {
              domain: body.domain,
              caseId: body.caseId || '',
              documentName: body.documentName,
              chunkIndex: chunk.index,
            },
          }]);
          vectorId = chunkId;
        } catch (e) {
          console.log('Vectorize insert failed (may not be provisioned):', e);
        }

        // Insert chunk metadata into D1
        await env.JUSTICE_D1.prepare(`
          INSERT INTO rag_chunks (id, case_id, domain, document_name, chunk_index, raw_text, metadata, vector_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          chunkId,
          body.caseId || null,
          body.domain,
          body.documentName,
          chunk.index,
          chunk.text,
          JSON.stringify(chunk.metadata || {}),
          vectorId
        ).run();

        results.push({ index: chunk.index, chunkId, vectorId });
      }

      return json({
        success: true,
        documentId,
        domain: body.domain,
        documentName: body.documentName,
        chunksIngested: results.length,
        results,
      }, request);
    } catch (e) {
      console.error('Ingest error:', e);
      return err('Ingest failed: ' + (e instanceof Error ? e.message : String(e, request)), 500, request);
    }
  },

  async handleQuery(request: Request, env: Env): Promise<Response> {
    const body = await request.json() as QueryRequest;

    if (!body.query) {
      return err('Missing query', 400, request);
    }

    const topK = body.topK || 5;
    const queryId = crypto.randomUUID();
    const startTime = Date.now();

    // Generate query embedding
    let vectors: Array<{ id: string; score: number; metadata?: Record<string, unknown> }> = [];
    try {
      const embedding = await env.AI.run(env.EMBEDDING_MODEL || '@cf/baai/bge-large-en-v1.5', {
        text: [body.query],
      });
      const raw = embedding.data[0];
      const queryVector = Array.isArray(raw) ? raw : (raw as { embedding: number[] }).embedding;

      // Build metadata filter
      const filter: Record<string, string> = {};
      if (body.domain) filter.domain = body.domain;
      if (body.caseId) filter.caseId = body.caseId;

      // Query Vectorize
      const vectorResults = await env.JUSTICE_VECTORIZE.query(queryVector, {
        topK,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        returnMetadata: true,
      });
      vectors = vectorResults.matches || [];
    } catch (e) {
      console.log('Vectorize query failed (falling back to D1 search):', e);
    }

    // Fetch full chunks from D1
    let chunks: Array<RAGChunk & { score: number }> = [];

    if (vectors.length > 0) {
      const vectorIds = vectors.map(v => v.id);
      const placeholders = vectorIds.map(() => '?').join(',');
      const results = await env.JUSTICE_D1.prepare(`
        SELECT * FROM rag_chunks WHERE id IN (${placeholders})
      `).bind(...vectorIds).all<RAGChunk>();

      const chunkMap = new Map(results.results?.map(c => [c.id, c]) || []);
      const scoreMap = new Map(vectors.map(v => [v.id, v.score]));

      for (const vid of vectorIds) {
        const chunk = chunkMap.get(vid);
        const score = scoreMap.get(vid);
        if (chunk && score !== undefined) {
          chunks.push({ ...chunk, score });
        }
      }

      chunks.sort((a, b) => b.score - a.score);
    }

    // Fallback: D1 text search when Vectorize returns no results
    if (chunks.length === 0) {
      const terms = body.query.toLowerCase().split(/\s+/).filter(t => t.length > 3);
      if (terms.length > 0) {
        const conditions = terms.map(() => 'LOWER(raw_text) LIKE ?');
        const likeParams = terms.map(t => `%${t}%`);
        const params = [...likeParams];
        if (body.domain) params.push(body.domain);
        if (body.caseId) params.push(body.caseId);

        let sql = `SELECT * FROM rag_chunks WHERE ${conditions.join(' AND ')}`;
        if (body.domain) sql += ' AND domain = ?';
        if (body.caseId) sql += ' AND case_id = ?';
        sql += ' ORDER BY created_at DESC LIMIT ?';
        params.push(String(topK));

        const textResults = await env.JUSTICE_D1.prepare(sql).bind(...params).all<RAGChunk>();
        chunks = (textResults.results || []).map((c, i) => ({
          ...c,
          score: 1.0 - (i * 0.1), // Simple rank by position
        }));
      }
    }

    const latencyMs = Date.now() - startTime;

    // Log query
    await env.JUSTICE_D1.prepare(`
      INSERT INTO rag_queries (id, query_text, domain_filter, top_k, result_ids, result_count, latency_ms, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      queryId,
      body.query,
      body.domain || null,
      topK,
      JSON.stringify(chunks.map(c => c.id)),
      chunks.length,
      latencyMs
    ).run();

    return json({
      query: body.query,
      domain: body.domain || null,
      results: chunks.map(c => ({
        id: c.id,
        domain: c.domain,
        documentName: c.document_name,
        chunkIndex: c.chunk_index,
        text: c.raw_text,
        metadata: JSON.parse(c.metadata || '{}'), request,
        score: c.score,
        caseId: c.case_id,
      })),
      resultCount: chunks.length,
      latencyMs,
    });
  },

  async handleListDocuments(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');
    const caseId = url.searchParams.get('caseId');

    let query = 'SELECT * FROM rag_documents WHERE 1=1';
    const params: string[] = [];

    if (domain) {
      query += ' AND domain = ?';
      params.push(domain);
    }
    if (caseId) {
      query += ' AND case_id = ?';
      params.push(caseId);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const stmt = env.JUSTICE_D1.prepare(query);
    const bound = params.length > 0 ? stmt.bind(...params) : stmt;
    const result = await bound.all();

    return json({
      documents: result.results || [],
      count: result.results?.length || 0,
    }, request);
  },
};
