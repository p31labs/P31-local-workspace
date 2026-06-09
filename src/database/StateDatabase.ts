/**
 * State Database Implementation
 * Implements database operations for the Abdication Protocol
 * Supports both SQLite (development) and PostgreSQL (production)
 */

import { createHash } from 'crypto';
import { IAbdicationProtocol, AbdicationResult, ArtifactTransferResult, Node, NodeStatus } from '../../interfaces/IAbdicationProtocol';

// Database interface for abstraction
export interface DatabaseAdapter {
  init(): Promise<void>;
  saveAbdication(result: AbdicationResult): Promise<void>;
  saveArtifactTransfer(result: ArtifactTransferResult): Promise<void>;
  updateNodeStatus(nodeId: string, status: NodeStatus): Promise<void>;
  getNode(nodeId: string): Promise<Node | null>;
  getAbdicationHistory(nodeId: string): Promise<AbdicationResult[]>;
  close(): Promise<void>;
}

/**
 * SQLite Database Adapter
 * Uses better-sqlite3 for synchronous operations
 */
export class SQLiteAdapter implements DatabaseAdapter {
  private db: any;
  private initialized = false;

  constructor(private dbPath: string = './abdication.db') {}

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const Database = (await import('better-sqlite3')).default;
      this.db = new Database(this.dbPath);

      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');

      // Create tables
      this.createTables();
      this.initialized = true;
    } catch (error) {
      console.error('[SQLiteAdapter] Failed to initialize database:', error);
      throw error;
    }
  }

  private createTables(): void {
    // Nodes table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS nodes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT NOT NULL,
        last_active DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Node artifacts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS node_artifacts (
        id TEXT PRIMARY KEY,
        node_id TEXT NOT NULL,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        encryption_key TEXT,
        last_modified DATETIME NOT NULL,
        FOREIGN KEY (node_id) REFERENCES nodes (id) ON DELETE CASCADE
      )
    `);

    // Abdication history table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS abdication_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id TEXT NOT NULL,
        node_id TEXT NOT NULL,
        success BOOLEAN NOT NULL,
        reason TEXT,
        timestamp DATETIME NOT NULL,
        next_steps TEXT,
        error TEXT,
        FOREIGN KEY (node_id) REFERENCES nodes (id)
      )
    `);

    // Artifact transfers table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS artifact_transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id TEXT NOT NULL,
        old_node_id TEXT NOT NULL,
        new_node_id TEXT NOT NULL,
        verification_hash TEXT NOT NULL,
        artifacts_transferred TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        FOREIGN KEY (old_node_id) REFERENCES nodes (id),
        FOREIGN KEY (new_node_id) REFERENCES nodes (id)
      )
    `);

    // Indexes for performance
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_abdication_node_id ON abdication_history(node_id)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_abdication_timestamp ON abdication_history(timestamp)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_artifacts_node_id ON node_artifacts(node_id)');
  }

  async saveAbdication(result: AbdicationResult): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO abdication_history (
        transaction_id, node_id, success, reason, timestamp, next_steps, error
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      result.transactionId,
      result.nodeId || 'unknown', // Add nodeId to AbdicationResult interface
      result.success,
      result.reason,
      result.timestamp.toISOString(),
      JSON.stringify(result.nextSteps),
      result.error || null
    );
  }

  async saveArtifactTransfer(result: ArtifactTransferResult): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO artifact_transfers (
        transaction_id, old_node_id, new_node_id, verification_hash, 
        artifacts_transferred, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      result.transactionId || 'unknown',
      result.oldNodeId || 'unknown',
      result.newNodeId || 'unknown',
      result.verificationHash,
      JSON.stringify(result.artifactsTransferred),
      result.timestamp.toISOString()
    );
  }

  async updateNodeStatus(nodeId: string, status: NodeStatus): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE nodes SET status = ?, last_active = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run(status, nodeId);
  }

  async getNode(nodeId: string): Promise<Node | null> {
    const stmt = this.db.prepare(`
      SELECT id, name, role, status, last_active as lastActive FROM nodes WHERE id = ?
    `);
    const row = stmt.get(nodeId);
    
    if (!row) return null;

    // Get artifacts for this node
    const artifactsStmt = this.db.prepare(`
      SELECT id, type, data, encryption_key as encryptionKey, last_modified as lastModified 
      FROM node_artifacts WHERE node_id = ?
    `);
    const artifacts = artifactsStmt.all(nodeId);

    return {
      ...row,
      artifacts: artifacts.map(a => ({
        ...a,
        data: JSON.parse(a.data),
        lastModified: new Date(a.lastModified)
      })),
      lastActive: new Date(row.lastActive)
    };
  }

  async getAbdicationHistory(nodeId: string): Promise<AbdicationResult[]> {
    const stmt = this.db.prepare(`
      SELECT transaction_id as transactionId, node_id as nodeId, success, reason, 
             timestamp, next_steps as nextSteps, error
      FROM abdication_history WHERE node_id = ? ORDER BY timestamp DESC
    `);
    
    const rows = stmt.all(nodeId);
    return rows.map(row => ({
      ...row,
      timestamp: new Date(row.timestamp),
      nextSteps: JSON.parse(row.nextSteps || '[]')
    }));
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
    }
  }
}

/**
 * PostgreSQL Database Adapter
 * Uses pg for asynchronous operations
 */
export class PostgreSQLAdapter implements DatabaseAdapter {
  private pool: any;
  private initialized = false;

  constructor(
    private connectionString: string = process.env.DATABASE_URL || ''
  ) {
    if (!connectionString) {
      throw new Error('PostgreSQL connection string is required');
    }
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const { Pool } = await import('pg');
      this.pool = new Pool({
        connectionString: this.connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      await this.createTables();
      this.initialized = true;
    } catch (error) {
      console.error('[PostgreSQLAdapter] Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Nodes table
      await client.query(`
        CREATE TABLE IF NOT EXISTS nodes (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          status TEXT NOT NULL,
          last_active TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Node artifacts table
      await client.query(`
        CREATE TABLE IF NOT EXISTS node_artifacts (
          id TEXT PRIMARY KEY,
          node_id TEXT NOT NULL,
          type TEXT NOT NULL,
          data JSONB NOT NULL,
          encryption_key TEXT,
          last_modified TIMESTAMP NOT NULL,
          FOREIGN KEY (node_id) REFERENCES nodes (id) ON DELETE CASCADE
        )
      `);

      // Abdication history table
      await client.query(`
        CREATE TABLE IF NOT EXISTS abdication_history (
          id SERIAL PRIMARY KEY,
          transaction_id TEXT NOT NULL,
          node_id TEXT NOT NULL,
          success BOOLEAN NOT NULL,
          reason TEXT,
          timestamp TIMESTAMP NOT NULL,
          next_steps JSONB,
          error TEXT,
          FOREIGN KEY (node_id) REFERENCES nodes (id)
        )
      `);

      // Artifact transfers table
      await client.query(`
        CREATE TABLE IF NOT EXISTS artifact_transfers (
          id SERIAL PRIMARY KEY,
          transaction_id TEXT NOT NULL,
          old_node_id TEXT NOT NULL,
          new_node_id TEXT NOT NULL,
          verification_hash TEXT NOT NULL,
          artifacts_transferred JSONB NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          FOREIGN KEY (old_node_id) REFERENCES nodes (id),
          FOREIGN KEY (new_node_id) REFERENCES nodes (id)
        )
      `);

      // Indexes for performance
      await client.query('CREATE INDEX IF NOT EXISTS idx_abdication_node_id ON abdication_history(node_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_abdication_timestamp ON abdication_history(timestamp)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_artifacts_node_id ON node_artifacts(node_id)');

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async saveAbdication(result: AbdicationResult): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        INSERT INTO abdication_history (
          transaction_id, node_id, success, reason, timestamp, next_steps, error
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        result.transactionId,
        result.nodeId || 'unknown',
        result.success,
        result.reason,
        result.timestamp,
        JSON.stringify(result.nextSteps),
        result.error || null
      ]);
    } finally {
      client.release();
    }
  }

  async saveArtifactTransfer(result: ArtifactTransferResult): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        INSERT INTO artifact_transfers (
          transaction_id, old_node_id, new_node_id, verification_hash, 
          artifacts_transferred, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        result.transactionId || 'unknown',
        result.oldNodeId || 'unknown',
        result.newNodeId || 'unknown',
        result.verificationHash,
        JSON.stringify(result.artifactsTransferred),
        result.timestamp
      ]);
    } finally {
      client.release();
    }
  }

  async updateNodeStatus(nodeId: string, status: NodeStatus): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(
        'UPDATE nodes SET status = $1, last_active = CURRENT_TIMESTAMP WHERE id = $2',
        [status, nodeId]
      );
    } finally {
      client.release();
    }
  }

  async getNode(nodeId: string): Promise<Node | null> {
    const client = await this.pool.connect();
    
    try {
      const nodeResult = await client.query(
        'SELECT id, name, role, status, last_active as "lastActive" FROM nodes WHERE id = $1',
        [nodeId]
      );

      if (nodeResult.rows.length === 0) return null;

      const node = nodeResult.rows[0];

      // Get artifacts for this node
      const artifactsResult = await client.query(
        'SELECT id, type, data, encryption_key as "encryptionKey", last_modified as "lastModified" FROM node_artifacts WHERE node_id = $1',
        [nodeId]
      );

      return {
        ...node,
        artifacts: artifactsResult.rows.map(a => ({
          ...a,
          lastModified: new Date(a.lastModified)
        })),
        lastActive: new Date(node.lastActive)
      };
    } finally {
      client.release();
    }
  }

  async getAbdicationHistory(nodeId: string): Promise<AbdicationResult[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT transaction_id as "transactionId", node_id as "nodeId", success, reason, 
               timestamp, next_steps as "nextSteps", error
        FROM abdication_history WHERE node_id = $1 ORDER BY timestamp DESC
      `, [nodeId]);

      return result.rows.map(row => ({
        ...row,
        nextSteps: JSON.parse(row.nextSteps || '[]')
      }));
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

/**
 * State Database Factory
 * Creates the appropriate database adapter based on environment
 */
export class StateDatabase {
  private adapter: DatabaseAdapter;

  constructor() {
    const usePostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgres');
    
    if (usePostgres) {
      this.adapter = new PostgreSQLAdapter(process.env.DATABASE_URL);
    } else {
      this.adapter = new SQLiteAdapter();
    }
  }

  async init(): Promise<void> {
    await this.adapter.init();
  }

  async saveAbdication(result: AbdicationResult): Promise<void> {
    await this.adapter.saveAbdication(result);
  }

  async saveArtifactTransfer(result: ArtifactTransferResult): Promise<void> {
    await this.adapter.saveArtifactTransfer(result);
  }

  async updateNodeStatus(nodeId: string, status: NodeStatus): Promise<void> {
    await this.adapter.updateNodeStatus(nodeId, status);
  }

  async getNode(nodeId: string): Promise<Node | null> {
    return await this.adapter.getNode(nodeId);
  }

  async getAbdicationHistory(nodeId: string): Promise<AbdicationResult[]> {
    return await this.adapter.getAbdicationHistory(nodeId);
  }

  async close(): Promise<void> {
    await this.adapter.close();
  }
}