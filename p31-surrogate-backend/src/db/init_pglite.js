import { PGlite } from '@electric-sql/pglite';

/**
 * P31 Surrogate Backend - PGLite Sovereign Vault Initialization
 * 
 * This module initializes the serverless, local-first WASM PostgreSQL database
 * with three-tier memory architecture: Episodic, Semantic, and Procedural.
 */

class SovereignVault {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🔧 Initializing P31 Sovereign Vault...');
      
      // Initialize serverless, local-first WASM PostgreSQL
      // Locked to IndexedDB for browser-only operation (Kenosis: April 4 displacement)
      this.db = new PGlite('idb://p31-sovereign-vault');
      
      // Enable pgvector for Semantic Memory
      await this.db.exec('CREATE EXTENSION IF NOT EXISTS vector;');
      
      // Initialize three-tier memory system
      await this.createMemoryTables();
      
      // Initialize Voltage Logs schema
      await this.createVoltageLogsSchema();
      
      // Initialize Scratchpad for self-evolving learning
      await this.createScratchpadSchema();
      
      this.isInitialized = true;
      console.log('✅ Sovereign Vault Initialized Successfully');
      
      return this.db;
    } catch (error) {
      console.error('❌ Failed to initialize Sovereign Vault:', error);
      throw error;
    }
  }

  async createMemoryTables() {
    console.log('🏗️  Creating Three-Tier Memory Architecture...');
    
    // Episodic Memory: Time-series event logging
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS episodic_memory (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        event_type TEXT NOT NULL,
        event_data JSONB,
        source_system TEXT,
        confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0)
      );
    `);

    // Semantic Memory: pgvector for high-dimensional embeddings
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS semantic_memory (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        embedding vector(384),
        content_hash TEXT UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_accessed TIMESTAMPTZ DEFAULT NOW(),
        access_count INTEGER DEFAULT 0
      );
    `);

    // Procedural Memory: Relational preference tables
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS procedural_preferences (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        data_type TEXT CHECK (data_type IN ('string', 'number', 'boolean', 'object', 'array')),
        last_modified TIMESTAMPTZ DEFAULT NOW(),
        version INTEGER DEFAULT 1
      );
    `);

    // Indexes for performance
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_episodic_timestamp ON episodic_memory(timestamp);
      CREATE INDEX IF NOT EXISTS idx_episodic_event_type ON episodic_memory(event_type);
      CREATE INDEX IF NOT EXISTS idx_semantic_embedding ON semantic_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
      CREATE INDEX IF NOT EXISTS idx_semantic_content_hash ON semantic_memory(content_hash);
      CREATE INDEX IF NOT EXISTS idx_procedural_key ON procedural_preferences(key);
    `);

    console.log('✅ Three-Tier Memory Architecture Created');
  }

  async createVoltageLogsSchema() {
    console.log('⚡ Creating Voltage Logs Schema...');
    
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS voltage_logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        voltage_level INTEGER CHECK (voltage_level >= 0 AND voltage_level <= 100),
        entropy_hash TEXT,
        source_device TEXT,
        biometric_data JSONB,
        context_metadata JSONB
      );
    `);

    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_voltage_timestamp ON voltage_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_voltage_level ON voltage_logs(voltage_level);
      CREATE INDEX IF NOT EXISTS idx_voltage_entropy ON voltage_logs(entropy_hash);
    `);

    console.log('✅ Voltage Logs Schema Created');
  }

  async createScratchpadSchema() {
    console.log('📝 Creating Self-Evolving Scratchpad Schema...');
    
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS scratchpad (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        error_type TEXT NOT NULL,
        error_description TEXT,
        corrective_action TEXT,
        lesson_learned TEXT,
        verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
        applied_to_register_p BOOLEAN DEFAULT FALSE,
        confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0)
      );
    `);

    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_scratchpad_timestamp ON scratchpad(timestamp);
      CREATE INDEX IF NOT EXISTS idx_scratchpad_error_type ON scratchpad(error_type);
      CREATE INDEX IF NOT EXISTS idx_scratchpad_status ON scratchpad(verification_status);
    `);

    console.log('✅ Self-Evolving Scratchpad Schema Created');
  }

  async storeEpisodicEvent(eventType, eventData, sourceSystem = 'surrogate', confidence = 1.0) {
    if (!this.isInitialized) throw new Error('Vault not initialized');
    
    return await this.db.exec(`
      INSERT INTO episodic_memory (event_type, event_data, source_system, confidence_score)
      VALUES ($1, $2, $3, $4)
    `, [eventType, JSON.stringify(eventData), sourceSystem, confidence]);
  }

  async storeSemanticMemory(content, embedding, contentHash) {
    if (!this.isInitialized) throw new Error('Vault not initialized');
    
    return await this.db.exec(`
      INSERT INTO semantic_memory (content, embedding, content_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (content_hash) DO UPDATE SET
        last_accessed = NOW(),
        access_count = semantic_memory.access_count + 1
    `, [content, embedding, contentHash]);
  }

  async storeProceduralPreference(key, value, dataType) {
    if (!this.isInitialized) throw new Error('Vault not initialized');
    
    return await this.db.exec(`
      INSERT INTO procedural_preferences (key, value, data_type, last_modified, version)
      VALUES ($1, $2, $3, NOW(), 1)
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        data_type = EXCLUDED.data_type,
        last_modified = NOW(),
        version = procedural_preferences.version + 1
    `, [key, JSON.stringify(value), dataType]);
  }

  async storeVoltageLog(voltageLevel, entropyHash, sourceDevice = 'node_one', biometricData = {}, contextMetadata = {}) {
    if (!this.isInitialized) throw new Error('Vault not initialized');
    
    return await this.db.exec(`
      INSERT INTO voltage_logs (voltage_level, entropy_hash, source_device, biometric_data, context_metadata)
      VALUES ($1, $2, $3, $4, $5)
    `, [voltageLevel, entropyHash, sourceDevice, JSON.stringify(biometricData), JSON.stringify(contextMetadata)]);
  }

  async addScratchpadEntry(errorType, errorDescription, correctiveAction, lessonLearned, confidence = 0.8) {
    if (!this.isInitialized) throw new Error('Vault not initialized');
    
    return await this.db.exec(`
      INSERT INTO scratchpad (error_type, error_description, corrective_action, lesson_learned, confidence_score)
      VALUES ($1, $2, $3, $4, $5)
    `, [errorType, errorDescription, correctiveAction, lessonLearned, confidence]);
  }

  async getScratchpadEntries(status = 'pending') {
    if (!this.isInitialized) throw new Error('Vault not initialized');
    
    const result = await this.db.query(`
      SELECT * FROM scratchpad 
      WHERE verification_status = $1 
      ORDER BY timestamp DESC
    `, [status]);
    
    return result.rows;
  }

  async verifyScratchpadEntry(entryId, status = 'verified') {
    if (!this.isInitialized) throw new Error('Vault not initialized');
    
    return await this.db.exec(`
      UPDATE scratchpad 
      SET verification_status = $1, applied_to_register_p = $2
      WHERE id = $3
    `, [status, status === 'verified', entryId]);
  }

  async close() {
    if (this.db) {
      await this.db.close();
      this.isInitialized = false;
      console.log('🔒 Sovereign Vault Closed');
    }
  }
}

// Export singleton instance
export const sovereignVault = new SovereignVault();

// Auto-initialize if running as main module
if (import.meta.url === `file://${process.argv[1]}`) {
  sovereignVault.initialize()
    .then(() => {
      console.log('🎯 PGLite Sovereign Vault Ready for Operations');
      console.log('📍 Database Path: idb://p31-sovereign-vault (IndexedDB)');
      console.log('📊 Memory Tiers: Episodic | Semantic | Procedural');
      console.log('⚡ Voltage Monitoring: Active');
      console.log('📝 Scratchpad: Self-Evolving');
      console.log('🔒 Storage: Browser-only, no filesystem dependency (Kenosis)');
    })
    .catch(error => {
      console.error('💥 Initialization Failed:', error);
      process.exit(1);
    });
}

export default sovereignVault;