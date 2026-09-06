import type { D1Database, R2Bucket } from './types';

/**
 * P31 Legal Document Versioning
 * 
 * Tamper-evident hash chain for court filings, ensuring document integrity
 * across the legal defense strategy.
 * 
 * @version 1.0.0
 * @date March 24, 2026
 */

export interface Env {
  LEGAL_D1: D1Database;
  LEGAL_R2: R2Bucket;
}

export interface DocumentChain {
  id: string;
  document_id: string;
  version: number;
  hash: string;
  previous_hash: string | null;
  metadata: Record<string, unknown>;
  created_at: number;
  created_by: string;
}

export interface Document {
  id: string;
  name: string;
  case_number: string | null;
  description: string | null;
  created_at: number;
  updated_at: number;
}

export interface DocumentUpload {
  name: string;
  caseNumber?: string;
  description?: string;
  content: string;
  uploadedBy?: string;
}

export interface VerificationResult {
  valid: boolean;
  documentId: string;
  versions: Array<{
    version: number;
    hash: string;
    valid: boolean;
  }>;
}

// D1 SQL Schema
/*
CREATE TABLE document_chain (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  hash TEXT NOT NULL,
  previous_hash TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  created_by TEXT NOT NULL
);

CREATE INDEX idx_document_chain_doc ON document_chain(document_id);
CREATE INDEX idx_document_chain_hash ON document_chain(hash);

CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  case_number TEXT,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
*/

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Route: POST /api/legal/upload
    if (pathParts[0] === 'api' && pathParts[1] === 'legal' && pathParts[2] === 'upload') {
      if (request.method === 'POST') {
        return this.handleUpload(request, env);
      }
    }

    // Route: GET /api/legal/document/{id}
    if (pathParts[0] === 'api' && pathParts[1] === 'legal' && pathParts[2] === 'document') {
      const documentId = pathParts[3];
      if (request.method === 'GET') {
        return this.handleGetDocument(documentId, env);
      }
    }

    // Route: GET /api/legal/verify/{id}
    if (pathParts[0] === 'api' && pathParts[1] === 'legal' && pathParts[2] === 'verify') {
      const documentId = pathParts[3];
      if (request.method === 'GET') {
        return this.handleVerify(documentId, env);
      }
    }

    // Route: GET /api/legal/history/{id}
    if (pathParts[0] === 'api' && pathParts[1] === 'legal' && pathParts[2] === 'history') {
      const documentId = pathParts[3];
      if (request.method === 'GET') {
        return this.handleHistory(documentId, env);
      }
    }

    // Route: GET /api/legal/list
    if (pathParts[0] === 'api' && pathParts[1] === 'legal' && pathParts[2] === 'list') {
      if (request.method === 'GET') {
        return this.handleList(env);
      }
    }

    return new Response('Not found', { status: 404 });
  },

  async handleUpload(request: Request, env: Env): Promise<Response> {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const metadataStr = formData.get('metadata') as string;

    const metadata: {
      documentId?: string;
      caseNumber?: string;
      description?: string;
      uploadedBy?: string;
    } = metadataStr ? JSON.parse(metadataStr) : {};

    if (!file) {
      return new Response('Missing file', { status: 400 });
    }

    // Read file content
    const content = await file.text();

    // Calculate hash
    const hash = await this.calculateHash(content);

    // Get previous hash
    const previousHash = await this.getLatestHash(metadata.documentId || '', env);

    // Generate document ID if not provided
    const documentId = metadata.documentId || crypto.randomUUID();
    const timestamp = Date.now();

    // Get version number
    const version = await this.getNextVersion(documentId, env);

    // Store in R2
    const key = `legal/${documentId}/v${version}.txt`;
    await env.LEGAL_R2.put(key, content, {
      httpMetadata: {
        contentType: 'text/plain',
      },
      customMetadata: {
        documentId,
        version: version.toString(),
        hash,
        previousHash: previousHash || '',
        uploadedAt: timestamp.toString(),
        uploadedBy: metadata.uploadedBy || 'unknown',
      },
    });

    // Also store as latest
    await env.LEGAL_R2.put(`legal/${documentId}/latest.txt`, content, {
      httpMetadata: {
        contentType: 'text/plain',
      },
      customMetadata: {
        documentId,
        version: version.toString(),
        hash,
        previousHash: previousHash || '',
        uploadedAt: timestamp.toString(),
      },
    });

    // Record in hash chain (D1)
    await env.LEGAL_D1.prepare(`
      INSERT INTO document_chain (id, document_id, version, hash, previous_hash, metadata, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      documentId,
      version,
      hash,
      previousHash,
      JSON.stringify(metadata),
      timestamp,
      metadata.uploadedBy || 'unknown'
    ).run();

    // Create or update document record
    await env.LEGAL_D1.prepare(`
      INSERT INTO documents (id, name, case_number, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        case_number = excluded.case_number,
        description = excluded.description,
        updated_at = excluded.updated_at
    `).bind(
      documentId,
      file.name,
      metadata.caseNumber || null,
      metadata.description || null,
      timestamp,
      timestamp
    ).run();

    return new Response(JSON.stringify({
      documentId,
      version,
      hash,
      previousHash,
      timestamp,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async handleGetDocument(documentId: string, env: Env): Promise<Response> {
    if (!documentId) {
      return new Response('Missing documentId', { status: 400 });
    }

    // Get latest version from R2
    const r2Object = await env.LEGAL_R2.get(`legal/${documentId}/latest.txt`);

    if (!r2Object) {
      return new Response('Document not found', { status: 404 });
    }

    const content = await r2Object.text();

    // Get document metadata
    const doc = await env.LEGAL_D1.prepare(`
      SELECT * FROM documents WHERE id = ?
    `).bind(documentId).first<Document>();

    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain',
        'X-Document-Id': documentId,
        'X-Version': r2Object.customMetadata?.version || '1',
        'X-Hash': r2Object.customMetadata?.contentHash || '',
        'X-Case-Number': doc?.case_number || '',
      },
    });
  },

  async handleVerify(documentId: string, env: Env): Promise<Response> {
    if (!documentId) {
      return new Response('Missing documentId', { status: 400 });
    }

    // Get all versions
    const versions = await env.LEGAL_D1.prepare(`
      SELECT * FROM document_chain 
      WHERE document_id = ? 
      ORDER BY version ASC
    `).bind(documentId).all<DocumentChain>();

    // Verify chain
    let previousHash: string | null = null;
    const verification: VerificationResult = {
      valid: true,
      documentId,
      versions: [],
    };

    for (const record of versions.results || []) {
      const valid = previousHash === null || record.previous_hash === previousHash;
      verification.versions.push({
        version: record.version,
        hash: record.hash,
        valid,
      });

      if (!valid) {
        verification.valid = false;
      }

      previousHash = record.hash;
    }

    return new Response(JSON.stringify(verification), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async handleHistory(documentId: string, env: Env): Promise<Response> {
    if (!documentId) {
      return new Response('Missing documentId', { status: 400 });
    }

    const versions = await env.LEGAL_D1.prepare(`
      SELECT * FROM document_chain 
      WHERE document_id = ? 
      ORDER BY version DESC
    `).bind(documentId).all<DocumentChain>();

    const doc = await env.LEGAL_D1.prepare(`
      SELECT * FROM documents WHERE id = ?
    `).bind(documentId).first<Document>();

    return new Response(JSON.stringify({
      document: doc,
      versions: versions.results || [],
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async handleList(env: Env): Promise<Response> {
    const docs = await env.LEGAL_D1.prepare(`
      SELECT d.*, dc.version as latest_version, dc.hash as latest_hash
      FROM documents d
      LEFT JOIN (
        SELECT document_id, version, hash
        FROM document_chain
        WHERE id IN (
          SELECT MAX(id) FROM document_chain GROUP BY document_id
        )
      ) dc ON d.id = dc.document_id
      ORDER BY d.updated_at DESC
    `).all<Document & { latest_version: number; latest_hash: string }>();

    return new Response(JSON.stringify({
      documents: docs.results || [],
      count: docs.results?.length || 0,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async calculateHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async getLatestHash(documentId: string, env: Env): Promise<string | null> {
    if (!documentId) return null;

    const result = await env.LEGAL_D1.prepare(`
      SELECT hash FROM document_chain 
      WHERE document_id = ? 
      ORDER BY version DESC 
      LIMIT 1
    `).bind(documentId).first<{ hash: string }>();

    return result?.hash || null;
  },

  async getNextVersion(documentId: string, env: Env): Promise<number> {
    if (!documentId) return 1;

    const result = await env.LEGAL_D1.prepare(`
      SELECT MAX(version) as max_version FROM document_chain WHERE document_id = ?
    `).bind(documentId).first<{ max_version: number }>();

    return (result?.max_version || 0) + 1;
  },
};
