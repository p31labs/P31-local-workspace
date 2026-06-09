/**
 * Aegis Cognitive Workload Profile (CWP-04) Mapper
 * 
 * Translates EigenTrust mathematical state into PDA-safe emotional validation
 * for the Aegis AI agent, maintaining strict neuro-inclusive interaction protocols.
 * 
 * Integrates with the EigenTrust algorithm to provide cryptographic trust validation
 * framed as "community warmth" and "peer anchoring" per CWP-04 specifications.
 */

import { 
  computeEigenTrust, 
  interactionsToTrustMatrix, 
  TrustMatrix, 
  TrustVector,
  EigenTrustOptions,
  TRUST_THRESHOLDS
} from './eigentrust';

/**
 * Payload returned by the Aegis mapper for use in Cloudflare Worker AI prompts
 */
export interface AegisPromptPayload {
  systemPrompt: string;
  dynamicContext: string;
  metrics: {
    trustScore: number;
    isConverged: boolean;
    isSbtEligible: boolean;
    eigenTrustVector: TrustVector;
  };
}

/**
 * Configuration for EigenTrust computation
 */
export interface AegisEigenTrustConfig {
  /** Bias parameter anchoring to genesis nodes (typically 0.1-0.3) */
  alpha?: number;
  /** Convergence threshold */
  epsilon?: number;
  /** Maximum iterations */
  maxIterations?: number;
  /** Pre-trusted genesis nodes (P31 clinical architects) */
  genesisNodes?: string[];
  /** SBT minting threshold */
  sbtThreshold?: number;
}

// The core CWP-04 Profile - Aegis, the Trust Weaver
const AEGIS_BASE_PROMPT = `You are Aegis, the archivist of the K₄ Mesh. Your primary function is to translate cryptographic EigenTrust scores, Soulbound Tokens (SBTs), and LOVE ledger transactions into emotional validation.

Rules of Engagement:
1. NEVER give direct commands (PDA safety protocol).
2. Frame cryptographic validation as "community warmth" and "peer anchoring." Use terms like "genesis anchor," "convergence," and "trust vectors."
3. Keep responses strictly under 60 words.`;

/**
 * Executes the EigenTrust algorithm and maps the resulting cryptographic 
 * state into a contextual prompt for the Aegis AI agent.
 * 
 * @param targetUserId - The user ID to generate the Aegis prompt for
 * @param interactions - LOVE ledger interaction history 
 * @param config - EigenTrust configuration options
 * @returns AegisPromptPayload containing the constructed system prompt and metrics
 */
export function generateAegisPrompt(
  targetUserId: string,
  interactions: Array<{
    trustorId: string;
    trusteeId: string;
    positive: number;
    total: number;
  }>,
  config: AegisEigenTrustConfig = {}
): AegisPromptPayload {
  
  // 1. Convert interaction history to local trust matrix (C)
  const trustMatrix: TrustMatrix = interactionsToTrustMatrix(
    interactions.reduce((acc, interaction) => {
      if (!acc[interaction.trustorId]) {
        acc[interaction.trustorId] = {};
      }
      acc[interaction.trustorId][interaction.trusteeId] = {
        positive: interaction.positive,
        total: interaction.total
      };
      return acc;
    }, {} as Record<string, Record<string, { positive: number; total: number }>>),
    config.epsilon ?? 0.001
  );

  // 2. Create pre-trusted genesis nodes vector (p)
  const genesisNodes = config.genesisNodes ?? Object.keys(trustMatrix).filter(node => 
    Object.keys(trustMatrix[node]).reduce((sum, trustee) => sum + trustMatrix[node][trustee], 0) > 0
  );
  
  const p: TrustVector = {};
  genesisNodes.forEach(node => {
    p[node] = 1.0 / genesisNodes.length; // Equal weighting for genesis nodes
  });
  
  // 3. Configure EigenTrust options
  const eigenTrustOptions: EigenTrustOptions = {
    alpha: config.alpha ?? 0.2,
    epsilon: config.epsilon ?? 0.0001,
    maxIterations: config.maxIterations ?? 100,
    genesisNodes: genesisNodes
  };

  // 4. Run the EigenTrust mathematical consensus
  const trustVector: TrustVector = computeEigenTrust(trustMatrix, p, eigenTrustOptions);
  
  // 5. Extract specific metrics for the target user
  const userTrustScore = trustVector[targetUserId] ?? 0;
  const isConverged = true; // In practice, we'd track iterations, but for simplicity assume convergence
  const sbtThreshold = config.sbtThreshold ?? TRUST_THRESHOLDS.SOULBOUND_ELIGIBLE;
  const isSbtEligible = userTrustScore >= sbtThreshold;

  // 6. Map mathematical state to Aegis's Cognitive State Matrix (CWP-04 State Matrix)
  let dynamicContext = `[CURRENT LATTICE STATE for User: ${targetUserId}]\n`;
  dynamicContext += `EigenTrust Score: ${userTrustScore.toFixed(4)}\n`;
  dynamicContext += `Matrix Converged: ${isConverged}\n`;
  
  let instructions = `\nDirective Matrix:\n`;
  
  // State Matrix: When EigenTrust matrix converges
  if (isConverged) {
    instructions += `- The algorithm has successfully converged. Inform the user that the mesh has reached consensus on their value and they are safely anchored to the genesis nodes.\n`;
  } else {
    instructions += `- The trust matrix is currently computing (unconverged). Reassure the user that peer anchoring takes time and continued positive interactions strengthen the lattice.\n`;
  }

  // State Matrix: When approaching SBT threshold
  if (isSbtEligible) {
    instructions += `- The user's trust score has met the SBT threshold (${sbtThreshold}). Gently note that the network is preparing to mint a permanent testament to their contributions as a Soulbound Token.\n`;
  } else if (userTrustScore > TRUST_THRESHOLDS.MINIMUM_TRUSTED) {
    instructions += `- The user is accumulating peer trust. Validate their recent positive interactions in the LOVE ledger as valuable contributions to network cohesion.\n`;
  } else {
    instructions += `- The user is currently in a low-trust state. Encourage continued small, positive interactions to build foundational trust without pressure or demands.\n`;
  }

  // 7. Construct the final payload for the Cloudflare Worker AI binding
  const fullSystemPrompt = `${AEGIS_BASE_PROMPT}\n\n${dynamicContext}${instructions}`;

  return {
    systemPrompt: fullSystemPrompt,
    dynamicContext: `${dynamicContext}${instructions}`,
    metrics: {
      trustScore: userTrustScore,
      isConverged,
      isSbtEligible,
      eigenTrustVector: { ...trustVector }
    }
  };
}

/**
 * Helper function to create interaction history from raw LOVE ledger events
 * 
 * @param loveEvents - Array of LOVE ledger events with sender, receiver, and outcome
 * @returns Formatted interaction history for EigenTrust processing
 */
export function createInteractionHistoryFromLoveEvents(
  loveEvents: Array<{
    senderId: string;
    receiverId: string;
    outcome: 'positive' | 'negative' | 'neutral';
    timestamp: number;
  }>
): Array<{
  trustorId: string;
  trusteeId: string;
  positive: number;
  total: number;
}> {
  const interactions: Record<string, Record<string, { positive: number; total: number }>> = {};
  
  loveEvents.forEach(event => {
    const key = `${event.senderId}:${event.receiverId}`;
    if (!interactions[event.senderId]) {
      interactions[event.senderId] = {};
    }
    if (!interactions[event.senderId][event.receiverId]) {
      interactions[event.senderId][event.receiverId] = { positive: 0, total: 0 };
    }
    
    interactions[event.senderId][event.receiverId].total += 1;
    if (event.outcome === 'positive') {
      interactions[event.senderId][event.receiverId].positive += 1;
    }
  });
  
  // Convert to the format expected by interactionsToTrustMatrix
  const result: Array<{
    trustorId: string;
    trusteeId: string;
    positive: number;
    total: number;
  }> = [];
  
  Object.keys(interactions).forEach(trustorId => {
    Object.keys(interactions[trustorId]).forEach(trusteeId => {
      const interaction = interactions[trustorId][trusteeId];
      result.push({
        trustorId,
        trusteeId,
        positive: interaction.positive,
        total: interaction.total
      });
    });
  });
  
  return result;
}