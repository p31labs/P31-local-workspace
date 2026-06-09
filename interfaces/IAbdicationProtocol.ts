/**
 * Interface for Node Abdication Protocol
 * Defines the contract for gracefully stepping down from Node responsibilities
 * Reference: VS_CODE_WORKSPACE_SETUP.md lines 840-940
 */
export interface IAbdicationProtocol {
  /**
   * Initiates the abdication process for a Node
   * @param nodeId - Unique identifier of the Node stepping down
   * @param reason - Reason for abdication (health, term limit, personal choice)
   * @returns Promise resolving to abdication result
   */
  initiateAbdication(nodeId: string, reason: AbdicationReason): Promise<AbdicationResult>;

  /**
   * Transfers Node artifacts and responsibilities to successor
   * @param oldNode - Current Node stepping down
   * @param newNode - New Node taking over responsibilities
   * @returns Promise resolving to transfer result
   */
  transferArtifacts(oldNode: Node, newNode: Node): Promise<ArtifactTransferResult>;

  /**
   * Updates the Node registry with new status
   * @param nodeId - Identifier of Node to update
   * @param status - New status of the Node
   */
  updateNodeRegistry(nodeId: string, status: NodeStatus): Promise<void>;

  /**
   * Notifies the community of Node changes
   * @param announcement - Details of the abdication
   */
  notifyCommunity(announcement: AbdicationAnnouncement): Promise<void>;

  /**
   * Verifies that abdication process completed successfully
   * @param nodeId - Identifier of Node that abdicated
   * @returns Promise resolving to verification result
   */
  verifyAbdicationCompleteness(nodeId: string): Promise<boolean>;
}

/**
 * Types for Abdication Protocol
 */
export type AbdicationReason = 
  | 'health' 
  | 'term_limit' 
  | 'personal_choice' 
  | 'community_decision'
  | 'emergency';

export interface AbdicationResult {
  success: boolean;
  transactionId: string;
  nodeId?: string;
  reason?: AbdicationReason;
  timestamp: Date;
  nextSteps: string[];
  error?: string;
}

export interface ArtifactTransferResult {
  success: boolean;
  transactionId?: string;
  oldNodeId?: string;
  newNodeId?: string;
  artifactsTransferred: string[];
  verificationHash: string;
  timestamp: Date;
  error?: string;
}

export interface AbdicationAnnouncement {
  nodeId: string;
  reason: AbdicationReason;
  effectiveDate: Date;
  successor?: string;
  communityMessage: string;
  nextSteps: string[];
}

export interface Node {
  id: string;
  name: string;
  role: string;
  artifacts: Artifact[];
  status: NodeStatus;
  lastActive: Date;
}

export interface Artifact {
  id: string;
  type: string;
  data: any;
  encryptionKey?: string;
  lastModified: Date;
}

export type NodeStatus = 
    | 'active' 
    | 'stepping_down' 
    | 'retired' 
    | 'emergency_replacement';
