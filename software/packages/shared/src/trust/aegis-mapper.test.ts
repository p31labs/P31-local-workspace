import { describe, expect, test } from 'vitest';
import { 
  generateAegisPrompt, 
  AegisPromptPayload,
  AegisEigenTrustConfig,
  createInteractionHistoryFromLoveEvents
} from './aegis-mapper';

describe('Aegis CWP-04 Mapper', () => {
  test('should generate Aegis prompt for converged trust matrix', () => {
    const interactions = [
      { trustorId: 'user1', trusteeId: 'user2', positive: 8, total: 10 },
      { trustorId: 'user2', trusteeId: 'user1', positive: 9, total: 10 },
      { trustorId: 'user1', trusteeId: 'user3', positive: 7, total: 10 },
      { trustorId: 'user3', trusteeId: 'user1', positive: 6, total: 10 }
    ];
    
    const config: AegisEigenTrustConfig = {
      alpha: 0.2,
      epsilon: 0.0001,
      maxIterations: 100,
      genesisNodes: ['user1', 'user2'],
      sbtThreshold: 0.6
    };
    
    const result: AegisPromptPayload = generateAegisPrompt('user1', interactions, config);
    
    // Check that we get a proper payload structure
    expect(result).toHaveProperty('systemPrompt');
    expect(result).toHaveProperty('dynamicContext');
    expect(result).toHaveProperty('metrics');
    
    // Check metrics
    expect(result.metrics).toHaveProperty('trustScore');
    expect(result.metrics).toHaveProperty('isConverged');
    expect(result.metrics).toHaveProperty('isSbtEligible');
    expect(result.metrics).toHaveProperty('eigenTrustVector');
    
    // Check that the system prompt contains the base Aegis prompt
    expect(result.systemPrompt).toContain('You are Aegis, the archivist of the K₄ Mesh');
    expect(result.systemPrompt).toContain('Rules of Engagement:');
    expect(result.systemPrompt).toContain('NEVER give direct commands');
    
    // Check that dynamic context includes user info
    expect(result.dynamicContext).toContain('[CURRENT LATTICE STATE for User: user1]');
    expect(result.dynamicContext).toContain('EigenTrust Score:');
    expect(result.dynamicContext).toContain('Matrix Converged:');
  });

  test('should handle intermediate trust score appropriately', () => {
    const interactions = [
      { trustorId: 'user1', trusteeId: 'user2', positive: 1, total: 10 },
      { trustorId: 'user2', trusteeId: 'user1', positive: 1, total: 10 }
    ];
    
    const config: AegisEigenTrustConfig = {
      alpha: 0.2,
      genesisNodes: ['user1', 'user2']
    };
    
    const result: AegisPromptPayload = generateAegisPrompt('user1', interactions, config);
    
    // Should indicate the user is accumulating peer trust (between MINIMUM_TRUSTED and SOULBOUND_ELIGIBLE)
    expect(result.dynamicContext).toContain('The user is accumulating peer trust');
    expect(result.metrics.trustScore).toBeGreaterThan(0.1);
    expect(result.metrics.trustScore).toBeLessThan(0.7);
  });

  test('should indicate SBT eligibility when threshold met', () => {
    const interactions = [
      { trustorId: 'user1', trusteeId: 'user2', positive: 9, total: 10 },
      { trustorId: 'user2', trusteeId: 'user1', positive: 9, total: 10 }
    ];
    
    const config: AegisEigenTrustConfig = {
      alpha: 0.2,
      genesisNodes: ['user1', 'user2'],
      sbtThreshold: 0.4  // Lower threshold to ensure eligibility with our test data
    };
    
    const result: AegisPromptPayload = generateAegisPrompt('user1', interactions, config);
    
    // Should indicate SBT eligibility
    expect(result.dynamicContext).toContain('The user\'s trust score has met the SBT threshold');
    expect(result.metrics.isSbtEligible).toBe(true);
  });

  test('should create interaction history from LOVE ledger events', () => {
    const loveEvents = [
      { senderId: 'alice', receiverId: 'bob', outcome: 'positive', timestamp: 1000 },
      { senderId: 'alice', receiverId: 'bob', outcome: 'positive', timestamp: 1001 },
      { senderId: 'alice', receiverId: 'bob', outcome: 'negative', timestamp: 1002 },
      { senderId: 'bob', receiverId: 'alice', outcome: 'positive', timestamp: 1003 }
    ];
    
    const interactions = createInteractionHistoryFromLoveEvents(loveEvents);
    
    expect(interactions).toHaveLength(2); // Two unique sender-receiver pairs
    
    // Find alice->bob interaction
    const aliceBob = interactions.find(i => 
      i.trustorId === 'alice' && i.trusteeId === 'bob'
    );
    expect(aliceBob).toBeDefined();
    expect(aliceBob?.positive).toBe(2); // 2 positive out of 3
    expect(aliceBob?.total).toBe(3);
    
    // Find bob->alice interaction
    const bobAlice = interactions.find(i => 
      i.trustorId === 'bob' && i.trusteeId === 'alice'
    );
    expect(bobAlice).toBeDefined();
    expect(bobAlice?.positive).toBe(1); // 1 positive out of 1
    expect(bobAlice?.total).toBe(1);
  });
});