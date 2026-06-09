/r old mom**
 * Audit Trail Implementation
 * Provides immutable logging and verification for abdication operations
 */

import { createHash } from 'crypto';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  event: string;
  data: any;
  hash: string;
  previousHash: string;
}

export interface AuditVerification {
  valid: boolean;
  chainValid: boolean;
  eventsVerified: number;
  tamperedEvents: string[];
}

/**
 * Audit Trail Service
 * Implements an immutable, hash-chained audit log
 */
export class AuditTrail {
  private events: AuditEvent[] = [];
  private initialized = false;

  constructor(private dbPath: string = './audit.db') {}

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const Database = (await import('better-sqlite3')).default;
      const db = new Database(this.dbPath);

      // Enable foreign keys
      db.pragma('foreign_keys = ON');

      // Create audit table
      db.exec(`
        CREATE TABLE IF NOT EXISTS audit_log (
          id TEXT PRIMARY KEY,
          timestamp DATETIME NOT NULL,
          event TEXT NOT NULL,
          data TEXT NOT NULL,
          hash TEXT NOT NULL,
          previous_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create index for performance
      db.exec('CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp)');
      db.exec('CREATE INDEX IF NOT EXISTS idx_audit_event ON audit_log(event)');

      // Load existing events
      const stmt = db.prepare('SELECT * FROM audit_log ORDER BY timestamp ASC');
      const rows = stmt.all();
      
      this.events = rows.map(row => ({
        ...row,
        timestamp: new Date(row.timestamp),
        data: JSON.parse(row.data)
      }));

      db.close();
      this.initialized = true;
    } catch (error) {
      console.error('[AuditTrail] Failed to initialize audit trail:', error);
      throw error;
    }
  }

  /**
   * Log an event to the audit trail
   */
  async log(event: string, data: any): Promise<void> {
    const timestamp = new Date();
    const previousHash = this.events.length > 0 ? this.events[this.events.length - 1].hash : '0';
    const eventData = JSON.stringify(data);
    
    // Create hash of event data + previous hash + timestamp
    const hashInput = `${event}${eventData}${previousHash}${timestamp.toISOString()}`;
    const hash = createHash('sha256').update(hashInput).digest('hex');

    const auditEvent: AuditEvent = {
      id: createHash('sha256').update(`${event}${timestamp.toISOString()}`).digest('hex').substring(0, 16),
      timestamp,
      event,
      data,
      hash,
      previousHash
    };

    this.events.push(auditEvent);

    // Persist to database
    try {
      const Database = (await import('better-sqlite3')).default;
      const db = new Database(this.dbPath);
      
      const stmt = db.prepare(`
        INSERT INTO audit_log (id, timestamp, event, data, hash, previous_hash)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        auditEvent.id,
        auditEvent.timestamp.toISOString(),
        auditEvent.event,
        JSON.stringify(auditEvent.data),
        auditEvent.hash,
        auditEvent.previousHash
      );

      db.close();
    } catch (error) {
      console.error('[AuditTrail] Failed to persist audit event:', error);
      // Remove from memory if persistence failed
      this.events.pop();
      throw error;
    }
  }

  /**
   * Verify the integrity of the audit trail
   */
  async verify(transactionId: string): Promise<boolean> {
    const verification = await this.verifyChain();
    return verification.valid && verification.eventsVerified > 0;
  }

  /**
   * Verify the entire audit chain
   */
  async verifyChain(): Promise<AuditVerification> {
    const tamperedEvents: string[] = [];
    let chainValid = true;
    let eventsVerified = 0;

    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];
      const previousHash = i === 0 ? '0' : this.events[i - 1].hash;
      
      // Recalculate hash
      const hashInput = `${event.event}${JSON.stringify(event.data)}${previousHash}${event.timestamp.toISOString()}`;
      const expectedHash = createHash('sha256').update(hashInput).digest('hex');

      if (event.hash !== expectedHash) {
        chainValid = false;
        tamperedEvents.push(event.id);
      } else {
        eventsVerified++;
      }
    }

    return {
      valid: chainValid && tamperedEvents.length === 0,
      chainValid,
      eventsVerified,
      tamperedEvents
    };
  }

  /**
   * Get all events for a specific transaction
   */
  async getTransactionEvents(transactionId: string): Promise<AuditEvent[]> {
    return this.events.filter(event => 
      JSON.stringify(event.data).includes(transactionId)
    );
  }

  /**
   * Get events by type
   */
  async getEventsByType(eventType: string): Promise<AuditEvent[]> {
    return this.events.filter(event => event.event === eventType);
  }

  /**
   * Get events within a time range
   */
  async getEventsByTimeRange(startDate: Date, endDate: Date): Promise<AuditEvent[]> {
    return this.events.filter(event => 
      event.timestamp >= startDate && event.timestamp <= endDate
    );
  }

  /**
   * Export audit trail for external verification
   */
  async exportAuditTrail(): Promise<string> {
    const verification = await this.verifyChain();
    
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalEvents: this.events.length,
        verification: verification
      },
      events: this.events.map(event => ({
        ...event,
        timestamp: event.timestamp.toISOString()
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import audit trail from external source
   */
  async importAuditTrail(exportData: string): Promise<void> {
    const data = JSON.parse(exportData);
    
    if (!data.events || !Array.isArray(data.events)) {
      throw new Error('Invalid audit trail export format');
    }

    // Verify the imported chain
    const verification = await this.verifyImportedChain(data.events);
    if (!verification.valid) {
      throw new Error('Imported audit trail has integrity issues');
    }

    // Clear current events and import new ones
    this.events = data.events.map(event => ({
      ...event,
      timestamp: new Date(event.timestamp)
    }));

    // Persist to database
    try {
      const Database = (await import('better-sqlite3')).default;
      const db = new Database(this.dbPath);
      
      // Clear existing data
      db.exec('DELETE FROM audit_log');
      
      // Insert new events
      const stmt = db.prepare(`
        INSERT INTO audit_log (id, timestamp, event, data, hash, previous_hash)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const event of this.events) {
        stmt.run(
          event.id,
          event.timestamp.toISOString(),
          event.event,
          JSON.stringify(event.data),
          event.hash,
          event.previousHash
        );
      }

      db.close();
    } catch (error) {
      console.error('[AuditTrail] Failed to import audit trail:', error);
      throw error;
    }
  }

  private async verifyImportedChain(events: AuditEvent[]): Promise<AuditVerification> {
    const tamperedEvents: string[] = [];
    let chainValid = true;
    let eventsVerified = 0;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const previousHash = i === 0 ? '0' : events[i - 1].hash;
      
      // Recalculate hash
      const hashInput = `${event.event}${JSON.stringify(event.data)}${previousHash}${event.timestamp.toISOString()}`;
      const expectedHash = createHash('sha256').update(hashInput).digest('hex');

      if (event.hash !== expectedHash) {
        chainValid = false;
        tamperedEvents.push(event.id);
      } else {
        eventsVerified++;
      }
    }

    return {
      valid: chainValid && tamperedEvents.length === 0,
      chainValid,
      eventsVerified,
      tamperedEvents
    };
  }

  /**
   * Get audit statistics
   */
  async getStatistics(): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    timeRange: { start: Date; end: Date } | null;
  }> {
    const eventsByType: Record<string, number> = {};
    
    for (const event of this.events) {
      eventsByType[event.event] = (eventsByType[event.event] || 0) + 1;
    }

    const timeRange = this.events.length > 0 ? {
      start: this.events[0].timestamp,
      end: this.events[this.events.length - 1].timestamp
    } : null;

    return {
      totalEvents: this.events.length,
      eventsByType,
      timeRange
    };
  }
}

/**
 * Audit Trail Factory
 */
export function createAuditTrail(dbPath?: string): AuditTrail {
  return new AuditTrail(dbPath);
}