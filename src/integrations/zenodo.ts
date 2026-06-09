/**
 * Zenodo API Integration
 * Handles DOI verification and truth storage for the Known Truths system
 */

import { IKnownTruths, Truth, TruthSource, TruthVerification, TruthSearchCriteria } from '../../interfaces/IKnownTruths';
import { createHash } from 'crypto';

export interface ZenodoRecord {
  id: number;
  doi: string;
  metadata: {
    title: string;
    creators: Array<{
      name: string;
      affiliation?: string;
      orcid?: string;
    }>;
    publication_date: string;
    description?: string;
    keywords?: string[];
    communities?: Array<{
      id: string;
      title: string;
    }>;
    version?: string;
  };
  links: {
    doi: string;
    badge: string;
  };
}

export interface ZenodoSearchResponse {
  hits: {
    total: number;
    hits: ZenodoRecord[];
  };
  aggregations?: {
    communities?: Record<string, number>;
    years?: Record<string, number>;
  };
}

/**
 * Zenodo API Client
 */
export class ZenodoClient {
  private baseUrl = 'https://zenodo.org/api';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ZENODO_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Zenodo API key is required. Set ZENODO_API_KEY environment variable.');
    }
  }

  /**
   * Search for records in P31 Labs community
   */
  async searchRecords(
    query?: string, 
    page: number = 1, 
    size: number = 100,
    communities: string[] = ['p31labs']
  ): Promise<ZenodoSearchResponse> {
    const params = new URLSearchParams({
      q: query || '',
      page: page.toString(),
      size: size.toString(),
      sort: 'mostrecent',
      all_versions: 'false'
    });

    // Add community filters
    if (communities.length > 0) {
      communities.forEach(community => {
        params.append('communities', community);
      });
    }

    const url = `${this.baseUrl}/records?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Zenodo API error: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get a specific record by ID
   */
  async getRecord(recordId: number): Promise<ZenodoRecord> {
    const url = `${this.baseUrl}/records/${recordId}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Zenodo API error: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get records by DOI
   */
  async getRecordByDOI(doi: string): Promise<ZenodoRecord> {
    const response = await this.searchRecords(`doi:${doi}`);
    
    if (response.hits.total === 0) {
      throw new Error(`No record found for DOI: ${doi}`);
    }

    return response.hits.hits[0];
  }

  /**
   * Get all records from P31 Labs community
   */
  async getAllP31Records(): Promise<ZenodoRecord[]> {
    const allRecords: ZenodoRecord[] = [];
    let page = 1;
    const pageSize = 100;

    while (true) {
      const response = await this.searchRecords('', page, pageSize);
      
      if (response.hits.hits.length === 0) {
        break;
      }

      allRecords.push(...response.hits.hits);
      
      if (response.hits.hits.length < pageSize) {
        break;
      }

      page++;
    }

    return allRecords;
  }

  /**
   * Verify a DOI exists and is valid
   */
  async verifyDOI(doi: string): Promise<boolean> {
    try {
      await this.getRecordByDOI(doi);
      return true;
    } catch (error) {
      console.warn(`DOI verification failed for ${doi}:`, error);
      return false;
    }
  }

  /**
   * Get records by publication date range
   */
  async getRecordsByDateRange(startDate: Date, endDate: Date): Promise<ZenodoRecord[]> {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const query = `publication_date:[${startDateStr} TO ${endDateStr}]`;
    const response = await this.searchRecords(query);
    
    return response.hits.hits;
  }

  /**
   * Get records by keyword
   */
  async getRecordsByKeyword(keyword: string): Promise<ZenodoRecord[]> {
    const query = `keywords:"${keyword}"`;
    const response = await this.searchRecords(query);
    
    return response.hits.hits;
  }
}

/**
 * Known Truths Implementation with Zenodo Integration
 */
export class KnownTruths implements IKnownTruths {
  private zenodoClient: ZenodoClient;
  private truths: Map<string, Truth> = new Map();
  private initialized = false;

  constructor(zenodoApiKey?: string) {
    this.zenodoClient = new ZenodoClient(zenodoApiKey);
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load existing truths from database or cache
      await this.loadExistingTruths();
      
      // Sync with Zenodo to get latest records
      await this.syncWithZenodo();
      
      this.initialized = true;
    } catch (error) {
      console.error('[KnownTruths] Failed to initialize:', error);
      throw error;
    }
  }

  private async loadExistingTruths(): Promise<void> {
    // TODO: Load from database
    // For now, we'll sync with Zenodo on initialization
  }

  private async syncWithZenodo(): Promise<void> {
    try {
      const records = await this.zenodoClient.getAllP31Records();
      
      for (const record of records) {
        const truthId = `zenodo_${record.id}`;
        
        if (!this.truths.has(truthId)) {
          const truth: Truth = {
            id: truthId,
            content: this.formatRecordContent(record),
            timestamp: new Date(record.metadata.publication_date),
            source: {
              id: record.doi,
              name: 'Zenodo',
              type: 'zenodo',
              url: record.links.doi,
              verified: true
            },
            verificationHash: this.calculateVerificationHash(record),
            immutable: true,
            tags: this.extractTags(record)
          };

          this.truths.set(truthId, truth);
        }
      }
    } catch (error) {
      console.error('[KnownTruths] Failed to sync with Zenodo:', error);
    }
  }

  private formatRecordContent(record: ZenodoRecord): string {
    const creators = record.metadata.creators.map(c => c.name).join(', ');
    const description = record.metadata.description || '';
    const keywords = record.metadata.keywords ? ` Keywords: ${record.metadata.keywords.join(', ')}` : '';
    
    return `${record.metadata.title}\nby ${creators}\nDOI: ${record.doi}\nPublished: ${record.metadata.publication_date}${keywords}\n\n${description}`;
  }

  private calculateVerificationHash(record: ZenodoRecord): string {
    const content = JSON.stringify({
      id: record.id,
      doi: record.doi,
      title: record.metadata.title,
      creators: record.metadata.creators,
      publication_date: record.metadata.publication_date
    });
    
    return createHash('sha256').update(content).digest('hex');
  }

  private extractTags(record: ZenodoRecord): string[] {
    const tags: string[] = [];
    
    if (record.metadata.keywords) {
      tags.push(...record.metadata.keywords);
    }
    
    if (record.metadata.communities) {
      tags.push(...record.metadata.communities.map(c => c.id));
    }
    
    tags.push('zenodo', 'p31labs', record.metadata.version || 'latest');
    
    return [...new Set(tags)]; // Remove duplicates
  }

  async addTruth(truth: Truth, source: TruthSource): Promise<string> {
    const truthId = truth.id || `truth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newTruth: Truth = {
      ...truth,
      id: truthId,
      source,
      verificationHash: this.calculateTruthHash(truth),
      timestamp: truth.timestamp || new Date(),
      immutable: true
    };

    this.truths.set(truthId, newTruth);
    
    // TODO: Persist to database
    // TODO: Optionally create Zenodo record
    
    return truthId;
  }

  async getTruth(truthId: string): Promise<Truth | null> {
    return this.truths.get(truthId) || null;
  }

  async verifyTruth(truthId: string): Promise<TruthVerification> {
    const truth = this.truths.get(truthId);
    
    if (!truth) {
      return {
        valid: false,
        hashMatches: false,
        verificationTimestamp: new Date()
      };
    }

    const expectedHash = this.calculateTruthHash(truth);
    const hashMatches = truth.verificationHash === expectedHash;
    
    // For Zenodo sources, verify the DOI still exists
    let blockchainAnchor: string | undefined;
    if (truth.source.type === 'zenodo') {
      const isValidDOI = await this.zenodoClient.verifyDOI(truth.source.id);
      if (!isValidDOI) {
        return {
          valid: false,
          hashMatches,
          verificationTimestamp: new Date()
        };
      }
    }

    return {
      valid: hashMatches,
      hashMatches,
      blockchainAnchor,
      verificationTimestamp: new Date()
    };
  }

  async getTruthsBySource(sourceId: string): Promise<Truth[]> {
    return Array.from(this.truths.values()).filter(truth => 
      truth.source.id === sourceId
    );
  }

  async searchTruths(criteria: TruthSearchCriteria): Promise<Truth[]> {
    let results = Array.from(this.truths.values());

    if (criteria.source) {
      results = results.filter(truth => truth.source.id === criteria.source);
    }

    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(truth => 
        criteria.tags!.some(tag => truth.tags.includes(tag))
      );
    }

    if (criteria.dateRange) {
      results = results.filter(truth => 
        truth.timestamp >= criteria.dateRange!.start && 
        truth.timestamp <= criteria.dateRange!.end
      );
    }

    if (criteria.content) {
      const searchLower = criteria.content.toLowerCase();
      results = results.filter(truth => 
        truth.content.toLowerCase().includes(searchLower)
      );
    }

    return results;
  }

  /**
   * Get all Zenodo records as truths
   */
  async getZenodoTruths(): Promise<Truth[]> {
    return Array.from(this.truths.values()).filter(truth => 
      truth.source.type === 'zenodo'
    );
  }

  /**
   * Refresh truths from Zenodo
   */
  async refreshFromZenodo(): Promise<void> {
    await this.syncWithZenodo();
  }

  /**
   * Get statistics about stored truths
   */
  getStatistics(): {
    totalTruths: number;
    bySource: Record<string, number>;
    byTag: Record<string, number>;
  } {
    const bySource: Record<string, number> = {};
    const byTag: Record<string, number> = {};

    for (const truth of this.truths.values()) {
      bySource[truth.source.type] = (bySource[truth.source.type] || 0) + 1;
      
      for (const tag of truth.tags) {
        byTag[tag] = (byTag[tag] || 0) + 1;
      }
    }

    return {
      totalTruths: this.truths.size,
      bySource,
      byTag
    };
  }

  private calculateTruthHash(truth: Truth): string {
    const content = JSON.stringify({
      id: truth.id,
      content: truth.content,
      timestamp: truth.timestamp,
      source: truth.source,
      tags: truth.tags
    });
    
    return createHash('sha256').update(content).digest('hex');
  }
}

/**
 * Factory function
 */
export function createKnownTruths(zenodoApiKey?: string): KnownTruths {
  return new KnownTruths(zenodoApiKey);
}