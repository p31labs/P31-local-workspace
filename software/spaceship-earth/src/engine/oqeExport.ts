/**
 * @file oqeExport.ts — Objective Quality Evidence (OQE) Export Engine
 * 
 * Daubert-standard export of immutable local IndexedDB telemetry.
 * Generates cryptographically verifiable JSON for legal/medical evidence.
 * 
 * Features:
 * - IndexedDB query for genesis-telemetry arrays
 * - SHA-256 hashing via crypto.subtle
 * - Blob download with timestamp
 * - Chain of custody metadata
 * 
 * CWP-JITTERBUG-13: The Vault (Daubert-Standard OQE Export)
 */

export interface OQEExportMetadata {
  exportId: string;
  timestamp: string;          // ISO 8601
  operatorDidKey: string;
  hashAlgorithm: 'SHA-256';
  payloadHash: string;        // Hex digest
  recordCount: number;
  timeRange: {
    earliest: number;         // Unix ms
    latest: number;           // Unix ms
  };
  version: string;
}

export interface OQERecord {
  id: string;
  type: 'telemetry' | 'mesh' | 'somatic' | 'care' | 'system';
  timestamp: number;
  data: Record<string, unknown>;
  signature?: string;        // If signed
}

export interface OQEExport {
  metadata: OQEExportMetadata;
  records: OQERecord[];
}

/**
 * Generate unique export ID
 */
function generateExportId(): string {
  return `P31_OQE_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Open IndexedDB and retrieve all records from specified stores
 * 
 * @param dbName - Database name (default: 'yjs-spaceship-earth-state')
 * @param storeNames - Array of store names to export
 * @returns Array of all records
 */
async function queryIndexedDB(
  dbName: string = 'yjs-spaceship-earth-state',
  storeNames: string[] = ['genesis-telemetry', 'spaceship-earth-state']
): Promise<OQERecord[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    
    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    
    request.onsuccess = async () => {
      const db = request.result;
      const allRecords: OQERecord[] = [];
      
      try {
        for (const storeName of storeNames) {
          if (!db.objectStoreNames.contains(storeName)) continue;
          
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          
          const getAllRequest = store.getAll();
          
          await new Promise<void>((res, rej) => {
            getAllRequest.onsuccess = () => {
              const records = getAllRequest.result || [];
              
              // Transform Yjs records to OQE format
              for (const record of records) {
                allRecords.push({
                  id: record.id || generateExportId(),
                  type: record.type || 'telemetry',
                  timestamp: record.timestamp || Date.now(),
                  data: record.data || record,
                  signature: record.signature,
                });
              }
              res();
            };
            getAllRequest.onerror = () => rej(new Error(`Failed to read ${storeName}`));
          });
        }
        
        db.close();
        resolve(allRecords);
      } catch (err) {
        db.close();
        reject(err);
      }
    };
    
    // Create schema if doesn't exist
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      for (const name of storeNames) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id' });
        }
      }
    };
  });
}

/**
 * Calculate SHA-256 hash of data and return hex string
 * 
 * @param data - Object to hash
 * @returns Hex digest string
 */
export async function calculateHash(data: unknown): Promise<string> {
  const encoder = new TextEncoder();
  const jsonString = JSON.stringify(data);
  const dataBuffer = encoder.encode(jsonString);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate OQE export with cryptographic verification
 * 
 * @param operatorDidKey - Operator's DID key for chain of custody
 * @returns OQEExport object with metadata and records
 */
export async function generateOQEExport(operatorDidKey: string): Promise<OQEExport> {
  // Query IndexedDB for all records
  const records = await queryIndexedDB();
  
  if (records.length === 0) {
    // Return empty export if no records
    return {
      metadata: {
        exportId: generateExportId(),
        timestamp: new Date().toISOString(),
        operatorDidKey,
        hashAlgorithm: 'SHA-256',
        payloadHash: await calculateHash({}),
        recordCount: 0,
        timeRange: { earliest: Date.now(), latest: Date.now() },
        version: '1.0.0',
      },
      records: [],
    };
  }
  
  // Sort by timestamp
  records.sort((a, b) => a.timestamp - b.timestamp);
  
  // Calculate time range
  const timeRange = {
    earliest: records[0].timestamp,
    latest: records[records.length - 1].timestamp,
  };
  
  // Calculate payload hash
  const payloadHash = await calculateHash({ records, metadata: { timeRange } });
  
  const exportData: OQEExport = {
    metadata: {
      exportId: generateExportId(),
      timestamp: new Date().toISOString(),
      operatorDidKey,
      hashAlgorithm: 'SHA-256',
      payloadHash,
      recordCount: records.length,
      timeRange,
      version: '1.0.0',
    },
    records,
  };
  
  return exportData;
}

/**
 * Download OQE export as JSON file
 * 
 * @param exportData - OQE export object
 * @param filename - Optional custom filename (default: auto-generated)
 */
export function downloadOQEExport(exportData: OQEExport, filename?: string): void {
  const timestamp = exportData.metadata.timestamp.replace(/[:.]/g, '-').slice(0, 19);
  const finalFilename = filename || `P31_OQE_Export_${timestamp}.json`;
  
  // Pretty-print JSON for readability
  const jsonString = JSON.stringify(exportData, null, 2);
  
  // Create blob and trigger download
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Complete export workflow: query, hash, download
 * 
 * @param operatorDidKey - Operator's DID key
 * @returns Final filename
 */
export async function exportOQE(operatorDidKey: string): Promise<string> {
  const exportData = await generateOQEExport(operatorDidKey);
  
  const timestamp = exportData.metadata.timestamp.replace(/[:.]/g, '-').slice(0, 19);
  const filename = `P31_OQE_Export_${timestamp}.json`;
  
  downloadOQEExport(exportData, filename);
  
  console.log(`[OQE] Exported ${exportData.metadata.recordCount} records, hash: ${exportData.metadata.payloadHash.slice(0, 16)}...`);
  
  return filename;
}

/**
 * Verify integrity of previously exported OQE file
 * 
 * @param jsonString - JSON string from file
 * @returns true if hash matches, false otherwise
 */
export async function verifyOQEExport(jsonString: string): Promise<boolean> {
  try {
    const exportData: OQEExport = JSON.parse(jsonString);
    
    if (!exportData.metadata || !exportData.records) {
      return false;
    }
    
    const storedHash = exportData.metadata.payloadHash;
    const calculatedHash = await calculateHash({ 
      records: exportData.records, 
      metadata: { timeRange: exportData.metadata.timeRange } 
    });
    
    return storedHash === calculatedHash;
  } catch {
    return false;
  }
}