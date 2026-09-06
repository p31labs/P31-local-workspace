// ═══════════════════════════════════════════════════════
// @p31/shared — Integration Example
//
// Demonstrates how the four vectors (ZUI, Economy, Rules, BLE)
// work together in the Spaceship Earth system.
//
// This is a conceptual example showing the integration flow.
// ═══════════════════════════════════════════════════════

import {
  // ZUI
  useZUICameraStore,
  generateSierpinskiNodes,
  getOptimalSierpinskiDepth,
  
  // Rules Engine
  evaluateRules,
  createDefaultConstitution,
  addCreatorRule,
  CognitiveShield,
  defaultShieldConfig,
  
  // Economy
  useEconomyStore,
  
  // BLE
  SpaceshipBLEScanner,
  defaultBLEConfig,
  
  // Types
  ZoneEnergy,
  ZoneConfig,
  RuleTier,
  RuleOperator,
  RuleCondition,
  RuleAction,
  Rule,
  ZoneTransitionEvent,
  BeaconAdvertisement,
} from './index';

// Import LOVE_VALUES from economy store
import { LOVE_VALUES } from './economy/economyStore';

/**
 * Example integration showing how all four vectors work together.
 * This demonstrates the complete flow from BLE detection to
 * ZUI transition with rules evaluation and economy updates.
 */
export class SpaceshipEarthIntegration {
  private constitution = createDefaultConstitution();
  private cognitiveShield = new CognitiveShield(defaultShieldConfig);
  private bleScanner: SpaceshipBLEScanner | null = null;
  private isInitialized = false;

  /**
   * Initialize the complete Spaceship Earth system.
   */
  async initialize(): Promise<void> {
    // 1. Initialize ZUI with optimal depth for device
    const depth = getOptimalSierpinskiDepth();
    const nodes = generateSierpinskiNodes(depth);
    
    // Set up camera store with initial state
    useZUICameraStore.getState().setPerformanceFactor(0.8);
    
    // 2. Initialize Economy with morning assessment
    const economy = useEconomyStore.getState();
    economy._hydrate();
    
    // Run morning assessment (would be triggered by user)
    // TODO: Implement runMorningAssessment as part of spoon economy extension
    // useEconomyStore.getState().runMorningAssessment?.();
    console.log('Morning assessment would run here');

    // 3. Set up Rules Engine with Creator Rules
    this.setupCreatorRules();
    
    // 4. Initialize BLE Scanner (requires user gesture)
    // This would be called from a button click in the UI
    this.bleScanner = new SpaceshipBLEScanner(defaultBLEConfig);
    
    this.isInitialized = true;
    console.log('Spaceship Earth system initialized');
  }

  /**
   * Set up Creator Rules for different zones.
   */
  private setupCreatorRules(): void {
    // Add kinetic zone rule: require acknowledgment during quiet hours
    addCreatorRule(this.constitution, 'workshop', {
      name: 'Kinetic Zone Quiet Hours',
      description: 'Require acknowledgment during quiet hours in kinetic zones',
      conditions: [
        {
          field: 'time',
          operator: 'TIME_RANGE',
          value: [22, 7],
          description: '10PM–7AM'
        },
        {
          field: 'zoneEnergy',
          operator: 'EQUALS',
          value: 'kinetic',
          description: 'Kinetic zone'
        }
      ],
      conditionLogic: 'AND',
      action: {
        type: 'REQUIRE_ACK',
        message: 'Quiet hours active. Keep volume below conversational level in kinetic zones.'
      },
      priority: 150,
      createdBy: 'SYSTEM',
      enabled: true,
    });

    // Add spoon gate rule for still zones
    addCreatorRule(this.constitution, 'meditation', {
      name: 'Still Zone Spoon Gate',
      description: 'Require minimum spoons for still zone access',
      conditions: [
        {
          field: 'spoonBalance',
          operator: 'LESS_THAN',
          value: 3,
          description: 'Less than 3 spoons'
        }
      ],
      conditionLogic: 'AND',
      action: {
        type: 'DENY',
        message: 'Still zone requires minimum 3 spoons for proper focus.'
      },
      priority: 200,
      createdBy: 'SYSTEM',
      enabled: true,
    });
  }

  /**
   * Handle BLE zone transition event.
   * This is the main integration point where all systems interact.
   */
  async handleZoneTransition(event: ZoneTransitionEvent): Promise<void> {
    console.log('Zone transition detected:', event);

    // 1. Evaluate rules for the transition
    const economy = useEconomyStore.getState();
    const context = {
      time: Date.now(),
      spoonBalance: economy.spoons, // Using the runtime spoon level
      karma: economy.totalLove, // Using LOVE as karma equivalent
      zoneEnergy: event.toZone.energy,
      userId: event.userId,
      zoneId: event.toZone.id,
    };

    const result = evaluateRules(this.constitution, context, event.toZone.id);
    
    if (!result.allowed) {
      console.warn('Zone access denied:', result.deniedBy?.action?.message);
      // Show denial modal to user
      return;
    }

    // 2. Update economy (spoon cost for zone entry)
    if (event.energyDelta < 0) {
      // TODO: Implement spendSpoons as part of spoon economy extension
      // useEconomyStore.getState().spendSpoons?.(Math.abs(event.energyDelta));
      console.log(`Entering ${event.toZone.name} - spoon cost would be applied here`);
    }

    // 3. Update ZUI camera state
    const cameraStore = useZUICameraStore.getState();
    cameraStore.zoomToNode(event.toZone.id, 1); // Meso level

    // 4. Process acknowledgments if required
    if (result.requiredAcknowledgments.length > 0) {
      // Show acknowledgment modal
      console.log('Acknowledgments required:', result.requiredAcknowledgments);
    }

    // 5. Log the transition for telemetry
    console.log('Zone transition completed:', {
      from: event.fromZone.name,
      to: event.toZone.name,
      direction: event.direction,
      energyDelta: event.energyDelta,
      rulesMatched: result.matchedRules.length,
    });
  }

  /**
   * Handle message through Cognitive Shield.
   */
  async handleMessage(message: string): Promise<string> {
    const shielded = await this.cognitiveShield.shieldMessage(message);
    
    if (shielded.rewritten) {
      // Show both original and rewritten
      console.log('Message flagged for conflict. Showing both versions.');
      return shielded.rewritten;
    }
    
    return message;
  }

  /**
   * Start BLE scanning (requires user gesture).
   */
  async startBLEScanning(): Promise<void> {
    if (!this.bleScanner) {
      throw new Error('BLE Scanner not initialized');
    }

    try {
      await this.bleScanner.startScan(async (event) => {
        await this.handleZoneTransition(event);
      });
      console.log('BLE scanning started');
    } catch (error) {
      console.error('Failed to start BLE scanning:', error);
    }
  }

  /**
   * Stop BLE scanning.
   */
  async stopBLEScanning(): Promise<void> {
    if (this.bleScanner) {
      await this.bleScanner.stopScan();
      console.log('BLE scanning stopped');
    }
  }

  /**
   * Get system status for debugging.
   */
  getSystemStatus(): any {
    const economy = useEconomyStore.getState();
    const camera = useZUICameraStore.getState();
    const scanner = this.bleScanner?.getState();

    return {
      initialized: this.isInitialized,
      economy: {
        spoons: economy.spoons,
        karma: economy.totalLove,
      },
      camera: {
        level: camera.currentLevel,
        transitioning: camera.isTransitioning,
        performance: camera.performanceFactor,
      },
      ble: scanner || { isScanning: false },
      rules: {
        primeDirectives: this.constitution.primeDirectives.length,
        globalRules: this.constitution.globalRules.length,
        creatorRules: this.constitution.creatorRules.size,
      },
    };
  }
}

/**
 * Example usage:
 * 
 * const integration = new SpaceshipEarthIntegration();
 * await integration.initialize();
 * 
 * // User clicks to start BLE scanning
 * document.getElementById('start-ble').addEventListener('click', async () => {
 *   await integration.startBLEScanning();
 * });
 * 
 * // Check system status
 * console.log(integration.getSystemStatus());
 */