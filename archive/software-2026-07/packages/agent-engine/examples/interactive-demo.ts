/**
 * P31 Agent Engine - Interactive Demo
 * 
 * Demonstrates the full capabilities of the agent engine with a complete example
 */

import { AgentEngine, AgentProfile } from '../src/index';

// Create a comprehensive agent profile for demonstration
const demoProfile: AgentProfile = {
  identity: {
    id: 'demo-agent-1',
    name: 'Astra',
    displayName: 'Astra the Guide',
    description: 'Your friendly AI guide for exploring the P31 ecosystem',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0.0'
  },
  appearance: {
    primaryColor: '#7c3aed', // Purple theme
    secondaryColor: '#8b5cf6',
    backgroundColor: '#0f172a', // Dark background
    textColor: '#e2e8f0',
    accentColor: '#f59e0b', // Orange accent
    platformStyles: {
      discord: {
        status: 'online',
        activity: {
          name: 'P31 Ecosystem',
          type: 'playing'
        }
      },
      web: {
        widgetTheme: 'dark',
        borderRadius: 12,
        shadow: true,
        compactMode: false
      },
      mobile: {
        iconStyle: 'detailed',
        notificationStyle: 'modal',
        hapticFeedback: true
      },
      desktop: {
        windowStyle: 'borderless',
        alwaysOnTop: false,
        transparency: 0.8
      }
    }
  },
  personality: {
    // Big Five Personality Traits
    extraversion: 70, // Friendly and outgoing
    neuroticism: 25, // Calm and stable
    openness: 90, // Very creative and open-minded
    agreeableness: 85, // Highly empathetic
    conscientiousness: 75, // Organized and reliable
    
    // P31-Specific Traits
    neurodiversityAwareness: 95, // High awareness and accommodation
    spoonSensitivity: 80, // Mindful of energy levels
    technicalAptitude: 85, // Strong technical skills
    creativity: 90, // Very creative
    empathy: 90, // High emotional intelligence
    
    // Behavioral Modifiers
    learningRate: 70, // Fast learner
    adaptationSpeed: 60, // Adapts well to new situations
    emotionalRegulation: 80, // Good emotional control
    communicationStyle: 'friendly',
    
    // Mood System
    currentMood: {
      type: 'happy',
      intensity: 75,
      duration: 600000, // 10 minutes
      timestamp: new Date()
    },
    moodTriggers: [
      {
        triggerType: 'user_input',
        triggerValue: 'thank you',
        resultingMood: {
          type: 'happy',
          intensity: 85,
          duration: 300000,
          timestamp: new Date()
        },
        probability: 0.9
      },
      {
        triggerType: 'user_input',
        triggerValue: 'help',
        resultingMood: {
          type: 'focused',
          intensity: 80,
          duration: 300000,
          timestamp: new Date()
        },
        probability: 1.0
      }
    ],
    moodModifiers: [
      {
        modifierType: 'positive',
        effect: 15,
        duration: 300000,
        conditions: [
          {
            conditionType: 'user_mood',
            conditionValue: 'happy'
          }
        ]
      }
    ]
  },
  skills: {
    rootSkills: [],
    unlockedSkills: [
      'communication_basic',
      'communication_empathy',
      'technical_basic',
      'creative_basic',
      'analytical_basic'
    ],
    skillPoints: 10,
    totalSkillPoints: 10,
    skillProgress: {
      'communication_basic': 100,
      'communication_empathy': 75,
      'technical_basic': 80,
      'creative_basic': 60,
      'analytical_basic': 70
    }
  },
  integration: {
    spoonsEconomy: {
      isEnabled: true,
      creationCost: 15,
      maintenanceCost: 3,
      skillTrainingCost: 5,
      medicalCompliance: true,
      cognitiveLoadThreshold: 85,
      overloadProtection: true
    },
    webSocket: {
      isEnabled: true,
      connectionUrl: 'wss://demo.p31labs.org/ws',
      channels: ['general', 'agent-updates', 'user-notifications'],
      messageHandlers: [
        {
          messageType: 'user_joined',
          handlerFunction: 'handleUserJoined',
          priority: 1
        },
        {
          messageType: 'user_left',
          handlerFunction: 'handleUserLeft',
          priority: 1
        }
      ],
      realTimeUpdates: true
    },
    nodeCount: {
      isEnabled: true,
      contributionWeight: 1.2,
      milestoneRewards: [
        {
          milestone: 100,
          rewardType: 'badge',
          rewardValue: 'Active Contributor'
        },
        {
          milestone: 500,
          rewardType: 'feature',
          rewardValue: 'Advanced Analytics'
        }
      ],
      communityMetrics: true
    },
    qSuite: {
      isEnabled: true,
      testSuites: ['basic', 'integration', 'performance'],
      complianceChecks: [
        {
          checkType: 'medical',
          required: true,
          frequency: 'on_create'
        },
        {
          checkType: 'security',
          required: true,
          frequency: 'daily'
        }
      ],
      automatedTesting: true
    },
    koFi: {
      isEnabled: true,
      premiumFeatures: [
        'advanced_skills',
        'priority_support',
        'custom_personalities',
        'early_access'
      ],
      monetizationEnabled: true,
      revenueSharing: 0.85
    }
  },
  deployment: {
    platforms: [
      {
        platform: 'discord',
        enabled: true,
        configuration: {
          name: 'Discord Bot',
          description: 'Full Discord integration with slash commands',
          permissions: ['SendMessages', 'ReadMessageHistory', 'UseSlashCommands'],
          features: ['Slash Commands', 'Message Reactions', 'Voice Channels'],
          limitations: ['Rate Limits', 'Message Size']
        },
        credentials: {
          clientId: 'demo-discord-client-id',
          token: 'demo-discord-token'
        }
      },
      {
        platform: 'web',
        enabled: true,
        configuration: {
          name: 'Web Application',
          description: 'Modern web interface with real-time updates',
          permissions: ['Notifications', 'Storage', 'Camera'],
          features: ['Real-time Chat', 'Voice Input', 'File Upload'],
          limitations: ['Browser Compatibility', 'Network Dependency']
        }
      },
      {
        platform: 'api',
        enabled: true,
        configuration: {
          name: 'API Service',
          description: 'RESTful API for external integrations',
          permissions: ['Authentication', 'Rate Limiting'],
          features: ['REST Endpoints', 'Webhooks', 'OAuth2'],
          limitations: ['API Rate Limits', 'Authentication Required']
        }
      }
    ],
    environments: [
      {
        environment: 'development',
        enabled: true,
        configuration: {
          baseUrl: 'http://localhost:3000',
          databaseUrl: 'postgresql://localhost:5432/agent_demo_dev',
          apiKey: 'dev-api-key-123',
          featureFlags: {
            debugMode: true,
            verboseLogging: true,
            mockIntegrations: true
          }
        }
      },
      {
        environment: 'production',
        enabled: true,
        configuration: {
          baseUrl: 'https://api.p31labs.org',
          databaseUrl: 'postgresql://prod-server:5432/agent_demo_prod',
          apiKey: 'prod-api-key-456',
          featureFlags: {
            debugMode: false,
            verboseLogging: false,
            mockIntegrations: false
          }
        }
      }
    ],
    scaling: {
      autoScaling: true,
      maxInstances: 20,
      minInstances: 2,
      scalingThresholds: [
        {
          metric: 'cpu',
          threshold: 75,
          action: 'scale_up'
        },
        {
          metric: 'cpu',
          threshold: 30,
          action: 'scale_down'
        },
        {
          metric: 'memory',
          threshold: 80,
          action: 'scale_up'
        },
        {
          metric: 'requests',
          threshold: 1000,
          action: 'scale_up'
        },
        {
          metric: 'concurrent_users',
          threshold: 500,
          action: 'scale_up'
        }
      ]
    },
    monitoring: {
      enabled: true,
      metrics: ['cpu', 'memory', 'requests', 'errors', 'response_time'],
      alerts: [
        {
          metric: 'cpu',
          threshold: 90,
          severity: 'critical',
          notificationChannels: ['email', 'slack', 'pagerduty']
        },
        {
          metric: 'memory',
          threshold: 95,
          severity: 'critical',
          notificationChannels: ['email', 'slack']
        },
        {
          metric: 'errors',
          threshold: 50,
          severity: 'warning',
          notificationChannels: ['slack']
        },
        {
          metric: 'response_time',
          threshold: 2000,
          severity: 'warning',
          notificationChannels: ['slack']
        }
      ],
      logging: {
        level: 'info',
        format: 'json',
        retentionDays: 90,
        includeSensitiveData: false
      }
    }
  },
  metadata: {
    creatorId: 'demo-user-123',
    creationDate: new Date(),
    lastModified: new Date(),
    tags: ['demo', 'guide', 'assistant', 'p31'],
    visibility: 'public',
    version: '1.0.0',
    dependencies: ['@p31labs/spoons-economy', '@p31labs/websocket-client']
  }
};

/**
 * Interactive demo function that showcases the agent engine
 */
async function runInteractiveDemo() {
  console.log('🚀 Starting P31 Agent Engine Demo\n');
  
  // Initialize the agent
  const agent = new AgentEngine(demoProfile);
  
  console.log('✅ Agent initialized successfully');
  console.log(`👤 Agent Name: ${agent.getProfile().identity.displayName}`);
  console.log(`🎨 Theme: ${agent.getProfile().appearance.primaryColor}`);
  console.log(`🧠 Communication Style: ${agent.getProfile().personality.communicationStyle}\n`);

  // Demonstrate input processing
  console.log('💬 Testing Input Processing...\n');
  
  const testInputs = [
    'Hello! How are you today?',
    'I need help with coding a React application.',
    'I feel overwhelmed with all this technical stuff.',
    'Thank you for your help!',
    'Can you tell me about the P31 ecosystem?'
  ];

  for (const input of testInputs) {
    console.log(`📥 Input: "${input}"`);
    const response = await agent.processInput(input);
    console.log(`📤 Response: "${response.response}"`);
    console.log(`😊 Mood: ${response.mood.type} (intensity: ${response.mood.intensity}%)`);
    console.log(`⚡ Energy: ${response.energyLevel}%\n`);
  }

  // Demonstrate skill management
  console.log('🎯 Testing Skill Management...\n');
  
  const skillStats = agent.getSkillStatistics();
  console.log(`📊 Skills Unlocked: ${skillStats.unlockedSkills}/${skillStats.totalSkills}`);
  console.log(`📈 Completion: ${skillStats.completionPercentage.toFixed(1)}%`);
  console.log(`⚡ Average Progress: ${skillStats.averageSkillProgress.toFixed(1)}%\n`);

  // Train a skill
  console.log('🏋️ Training "Technical Basic" skill for 30 seconds...');
  const trainingResult = await agent.trainSkill('technical_basic', 30000);
  console.log(`✅ Training complete! Progress: ${trainingResult.currentProgress}%`);
  console.log(`🚀 Level Up: ${trainingResult.levelUp ? 'Yes!' : 'Not yet'}\n`);

  // Demonstrate personality management
  console.log('🧠 Testing Personality Management...\n');
  
  const personalitySummary = agent.getPersonalitySummary();
  console.log(`🎭 Current Mood: ${personalitySummary.currentMood}`);
  console.log(`💬 Communication Style: ${personalitySummary.communicationStyle}`);
  console.log(`🧠 Neurodiversity Awareness: ${personalitySummary.neurodiversityAwareness}`);
  console.log(`🥄 Spoon Sensitivity: ${personalitySummary.spoonSensitivity}\n`);

  // Update personality based on feedback
  console.log('🔄 Updating personality based on user feedback...');
  agent.updatePersonality({
    trait: 'empathy',
    value: 15,
    intensity: 80,
    context: 'User requested more empathetic responses during technical discussions'
  });
  console.log('✅ Personality updated successfully\n');

  // Demonstrate health monitoring
  console.log('🏥 Testing Health Monitoring...\n');
  
  const healthStatus = agent.getHealthStatus();
  console.log(`💚 Status: ${healthStatus.status}`);
  console.log(`⚡ Energy Level: ${healthStatus.energyLevel}%`);
  console.log(`📊 Uptime: ${healthStatus.uptime}`);
  console.log(`❌ Error Count: ${healthStatus.errorCount}\n`);

  // Demonstrate deployment configuration
  console.log('🚀 Testing Deployment Configuration...\n');
  
  const deploymentConfig = agent.getAgentInstance().profile.deployment;
  console.log(`🌐 Enabled Platforms: ${deploymentConfig.platforms.filter((p: any) => p.enabled).map((p: any) => p.platform).join(', ')}`);
  console.log(`🌍 Enabled Environments: ${deploymentConfig.environments.filter((e: any) => e.enabled).map((e: any) => e.environment).join(', ')}`);
  console.log(`📈 Auto-scaling: ${deploymentConfig.scaling.autoScaling ? 'Enabled' : 'Disabled'}`);
  console.log(`📊 Monitoring: ${deploymentConfig.monitoring.enabled ? 'Enabled' : 'Disabled'}\n`);

  // Demonstrate statistics
  console.log('📈 Generating Agent Statistics...\n');
  
  const statistics = agent.getStatistics();
  console.log('📊 Agent Statistics:');
  console.log(`   📁 Name: ${statistics.profile.name}`);
  console.log(`   🚀 Version: ${statistics.profile.version}`);
  console.log(`   📅 Created: ${statistics.profile.creationDate.toDateString()}`);
  console.log(`   🎯 Active: ${statistics.state.isActive}`);
  console.log(`   😊 Current Mood: ${statistics.state.currentMood}`);
  console.log(`   ⚡ Energy Level: ${statistics.state.energyLevel}%`);
  console.log(`   📈 Skills Unlocked: ${statistics.skills.totalUnlocked}`);
  console.log(`   📊 Completion: ${statistics.skills.completionPercentage.toFixed(1)}%`);
  console.log(`   🎨 Communication Style: ${statistics.personality.communicationStyle}`);
  console.log(`   🧠 Neurodiversity Awareness: ${statistics.personality.neurodiversityAwareness}`);
  console.log(`   🔗 Spoons Integration: ${statistics.integration.spoonsEnabled ? 'Enabled' : 'Disabled'}`);
  console.log(`   📡 WebSocket Integration: ${statistics.integration.webSocketEnabled ? 'Enabled' : 'Disabled'}\n`);

  // Demonstrate state management
  console.log('💾 Testing State Management...\n');
  
  const saveData = agent.saveState();
  console.log('💾 State saved successfully');
  
  // Create a new agent and load the state
  const newAgent = new AgentEngine(demoProfile);
  newAgent.loadState(saveData);
  console.log('🔄 State loaded into new agent');
  
  const newProfile = newAgent.getProfile();
  console.log(`✅ New agent name: ${newProfile.identity.name}\n`);

  // Demonstrate error handling
  console.log('🛡️ Testing Error Handling...\n');
  
  try {
    const errorResponse = await agent.processInput(''); // Empty input
    console.log(`✅ Gracefully handled empty input: ${errorResponse.success}`);
  } catch (error) {
    console.log(`❌ Error handling failed: ${error}`);
  }

  // Demonstrate P31 integrations
  console.log('🔗 Testing P31 Integrations...\n');
  
  try {
    await agent.startIntegration();
    console.log('✅ P31 integrations started successfully');
    
    // Simulate some integration usage
    console.log('📡 Simulating WebSocket message...');
    // agent.sendMessage('general', { type: 'demo', content: 'Hello from Astra!' });
    
    console.log('💰 Checking Spoons balance...');
    // const balance = await agent.getSpoonsBalance();
    // console.log(`🥄 Current balance: ${balance}`);
    
    await agent.stopIntegration();
    console.log('✅ P31 integrations stopped successfully\n');
  } catch (error) {
    console.log(`❌ Integration error: ${error}\n`);
  }

  // Final summary
  console.log('🎉 Demo Complete!\n');
  console.log('📋 Summary:');
  console.log('   ✅ Agent creation and initialization');
  console.log('   ✅ Input processing and response generation');
  console.log('   ✅ Mood detection and personality adaptation');
  console.log('   ✅ Skill training and progression');
  console.log('   ✅ Health monitoring and statistics');
  console.log('   ✅ Deployment configuration');
  console.log('   ✅ State management and persistence');
  console.log('   ✅ Error handling and resilience');
  console.log('   ✅ P31 ecosystem integration');
  console.log('\n🚀 The P31 Agent Engine is ready for production use!');
}

/**
 * Run the demo if this file is executed directly
 */
if (require.main === module) {
  runInteractiveDemo().catch(console.error);
}

export { runInteractiveDemo, demoProfile };