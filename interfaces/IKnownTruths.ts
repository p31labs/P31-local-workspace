/**
 * Interface for Immutable Truth Storage
 * Defines the contract for storing and verifying immutable truths
 * Reference: VS_CODE_WORKSPACE_SETUP.md lines 943-1000
 */
export interface IKnownTruths {
  /**
   * Adds a new truth to the immutable record
   * @param truth - The truth to record
   * @param source - Source of the truth
   * @returns Promise resolving to truth ID
   */
  addTruth(truth: Truth, source: TruthSource): Promise<string>;

  /**
   * Retrieves a truth by ID
   * @param truthId - Unique identifier of the truth
   * @returns Promise resolving to the truth
   */
  getTruth(truthId: string): Promise<Truth | null>;

  /**
   * Verifies the integrity of a truth
   * @param truthId - Unique identifier of the truth
   * @returns Promise resolving to verification result
   */
  verifyTruth(truthId: string): Promise<TruthVerification>;

  /**
   * Lists all truths from a specific source
   * @param sourceId - Identifier of the source
   * @returns Promise resolving to list of truths
   */
  getTruthsBySource(sourceId: string): Promise<Truth[]>;

  /**
   * Searches for truths matching criteria
   * @param criteria - Search criteria
   * @returns Promise resolving to matching truths
   */
  searchTruths(criteria: TruthSearchCriteria): Promise<Truth[]>;
}

/**
 * Types for Known Truths
 */
export interface Truth {
  id: string;
  content: string;
  timestamp: Date;
  source: TruthSource;
  verificationHash: string;
  immutable: boolean;
  tags: string[];
}

export interface TruthSource {
  id: string;
  name: string;
  type: 'zenodo' | 'kofi' | 'github' | 'manual' | 'community';
  url?: string;
  verified: boolean;
}

export interface TruthVerification {
  valid: boolean;
  hashMatches: boolean;
  blockchainAnchor?: string;
  verificationTimestamp: Date;
}

export interface TruthSearchCriteria {
  source?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  content?: string;
}

export interface TruthAnchor {
  id: string;
  truthId: string;
  anchorHash: string;
  blockchain: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: Date;
}
