# P31 Agent Engine

A comprehensive AI agent creation and management system built for the P31 Labs ecosystem. This engine provides a complete framework for creating personalized, interactive AI agents with advanced personality systems, skill trees, and deep integration with P31 services.

## Features

### 🧠 Advanced Personality System
- **Big Five Personality Traits**: Full implementation of the Big Five personality model
- **P31-Specific Traits**: Neurodiversity awareness, spoon sensitivity, technical aptitude
- **Dynamic Mood Management**: Real-time mood tracking and adaptation
- **Communication Style Adaptation**: Context-aware response generation
- **Learning and Adaptation**: Agents evolve based on user interactions

### 🌟 Progressive Skill Tree
- **7 Skill Categories**: Communication, Technical, Creative, Analytical, Social, Adaptive, Integration
- **Prerequisite System**: Logical skill progression with dependencies
- **Effect System**: Skills provide stat boosts, new abilities, and behavior changes
- **Training and Leveling**: Progressive skill development through use
- **P31 Integration Skills**: Deep ecosystem integration capabilities

### 🔗 P31 Ecosystem Integration
- **Spoons Economy**: Full integration with P31's energy management system
- **WebSocket Communication**: Real-time updates and notifications
- **Node Count Tracking**: Contribution tracking and rewards
- **Q-Suite Testing**: Automated compliance and quality assurance
- **Ko-Fi Monetization**: Premium features and support integration

### 🚀 Multi-Platform Deployment
- **Discord Bots**: Full Discord integration with slash commands and interactions
- **Web Applications**: Modern web interfaces with real-time updates
- **Mobile Apps**: Cross-platform mobile experiences
- **Desktop Applications**: Native desktop agent interfaces
- **API Services**: RESTful APIs for integration with external systems

### 📊 Advanced Monitoring
- **Real-time Analytics**: Live performance and usage metrics
- **Health Monitoring**: System health and error tracking
- **Scaling Configuration**: Auto-scaling based on demand
- **Alert System**: Configurable alerts for critical events
- **Comprehensive Logging**: Detailed logging for debugging and analysis

## Architecture

```
packages/agent-engine/
├── src/
│   ├── types.ts              # Core type definitions and schemas
│   ├── agent-engine.ts       # Main AgentEngine orchestrator
│   ├── personality.ts        # Personality and mood management
│   ├── skills.ts            # Skill tree and progression system
│   ├── integration.ts       # P31 ecosystem integrations
│   ├── deployment.ts        # Multi-platform deployment
│   └── index.ts             # Main exports
├── tests/                   # Comprehensive test suite
├── docs/                    # Detailed documentation
└── examples/               # Usage examples and demos
```

## Installation

```bash
# Install the agent engine package
pnpm add @p31labs/agent-engine

# Install peer dependencies
pnpm add zod uuid
```

## Quick Start

### Creating Your First Agent

```typescript
import { AgentEngine, AgentProfile } from '@p31labs/agent-engine';

// Create a basic agent profile
const profile: AgentProfile = {
  identity: {
    id: 'agent-1',
    name: 'Nova',
    displayName: 'Nova the Helper',
    description: 'Your friendly AI assistant',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0.0'
  },
  appearance: {
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    accentColor: '#ffc107',
    platformStyles: {
      discord: { status: 'online' },
      web: { widgetTheme: 'light', borderRadius: 8 },
      mobile: { iconStyle: 'minimal' },
      desktop: { windowStyle: 'standard' }
    }
  },
  personality: {
    // Big Five traits
    extraversion: 60,
    neuroticism: 30,
    openness: 80,
    agreeableness: 70,
    conscientiousness: 65,
    
    // P31-specific traits
    neurodiversityAwareness: 90,
    spoonSensitivity: 75,
    technicalAptitude: 70,
    creativity: 85,
    empathy: 80,
    
    // Behavioral modifiers
    learningRate: 50,
    adaptationSpeed: 40,
    emotionalRegulation: 60,
    communicationStyle: 'friendly',
    
    // Mood system
    currentMood: {
      type: 'calm',
      intensity: 50,
      duration: 300000,
      timestamp: new Date()
    },
    moodTriggers: [],
    moodModifiers: []
  },
  skills: {
    rootSkills: [],
    unlockedSkills: [],
    skillPoints: 0,
    totalSkillPoints: 0,
    skillProgress: {}
  },
  integration: {
    spoonsEconomy: { isEnabled: true, creationCost: 10, maintenanceCost: 2 },
    webSocket: { isEnabled: true, connectionUrl: 'wss://api.p31labs.org/ws' },
    nodeCount: { isEnabled: true, contributionWeight: 1.0 },
    qSuite: { isEnabled: true, automatedTesting: true },
    koFi: { isEnabled: true, monetizationEnabled: true }
  },
  deployment: {
    platforms: [
      { platform: 'discord', enabled: true },
      { platform: 'web', enabled: true }
    ],
    environments: [
      { environment: 'production', enabled: true }
    ],
    scaling: { autoScaling: true, maxInstances: 10 },
    monitoring: { enabled: true, metrics: ['cpu', 'memory', 'requests'] }
  },
  metadata: {
    creatorId: 'user-123',
    creationDate: new Date(),
    lastModified: new Date(),
    tags: ['assistant', 'helper'],
    visibility: 'public',
    version: '1.0.0',
    dependencies: []
  }
};

// Initialize the agent engine
const agent = new AgentEngine(profile);

// Process user input
const response = await agent.processInput("Hello! Can you help me with coding?");
console.log(response.response); // "I understand. Let me help you with that. 😊"

// Train a skill
const trainingResult = await agent.trainSkill('technical_basic', 60000);
console.log(`Skill progress: ${trainingResult.currentProgress}%`);

// Deploy the agent
const deploymentResult = await agent.deploy();
console.log('Deployment successful:', deploymentResult.success);
```

### Advanced Usage

```typescript
// Monitor agent health
const health = agent.getHealthStatus();
console.log(`Agent health: ${health.status}, Energy: ${health.energyLevel}%`);

// Get detailed statistics
const stats = agent.getStatistics();
console.log('Agent statistics:', stats);

// Update personality based on feedback
agent.updatePersonality({
  trait: 'empathy',
  value: 10, // Increase empathy by 10 points
  intensity: 75,
  context: 'User requested more empathetic responses'
});

// Use specific skills
const skillResult = await agent.useSkill('communication_empathy');
console.log('Skill result:', skillResult.result);

// Save and load agent state
const saveData = agent.saveState();
// ... later ...
agent.loadState(saveData);
```

## API Reference

### AgentEngine

The main orchestrator class that manages all agent components.

#### Methods

- `processInput(input: string, context?: any): Promise<AgentResponse>`
  - Process user input and generate responses
  - Returns: Response with mood, energy level, and timestamp

- `trainSkill(skillId: string, trainingTime: number): Promise<SkillTrainingResult>`
  - Train a specific skill for a given duration
  - Returns: Training progress and level-up status

- `useSkill(skillId: string): Promise<SkillUseResult>`
  - Execute a skill with cooldown management
  - Returns: Skill execution result

- `updatePersonality(feedback: PersonalityFeedback): void`
  - Update personality traits based on feedback
  - Modifies agent behavior and responses

- `deploy(): Promise<DeploymentResult>`
  - Deploy agent to all enabled platforms and environments
  - Returns: Deployment status and URLs

- `getHealthStatus(): AgentHealth`
  - Get current agent health and performance metrics
  - Returns: Health status, uptime, and error information

### PersonalityEngine

Manages the agent's personality, mood, and communication style.

#### Key Features

- **Mood Detection**: Analyzes user input for emotional indicators
- **Personality Adaptation**: Learns and adapts based on interactions
- **Response Generation**: Creates context-appropriate responses
- **Energy Management**: Tracks and manages agent energy levels

### SkillTreeEngine

Handles the agent's skill progression and abilities.

#### Key Features

- **Skill Categories**: 7 distinct skill types with unique effects
- **Prerequisites**: Logical skill progression system
- **Training System**: Progressive skill development
- **Effect System**: Skills provide stat boosts and new abilities

### P31IntegrationManager

Manages integration with P31 ecosystem services.

#### Integrations

- **Spoons Economy**: Energy management and cost tracking
- **WebSocket Communication**: Real-time updates and notifications
- **Node Count**: Contribution tracking and rewards
- **Q-Suite**: Automated testing and compliance
- **Ko-Fi**: Monetization and premium features

### DeploymentManager

Handles deployment to various platforms and environments.

#### Platforms

- **Discord**: Full bot integration with slash commands
- **Web**: Modern web applications with real-time updates
- **Mobile**: Cross-platform mobile experiences
- **Desktop**: Native desktop applications
- **API**: RESTful API services

## Configuration

### Environment Variables

```bash
# P31 API endpoints
P31_API_BASE_URL=https://api.p31labs.org
P31_WEBSOCKET_URL=wss://api.p31labs.org/ws

# Authentication
P31_API_KEY=your-api-key-here
DISCORD_BOT_TOKEN=your-discord-token

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/agent_engine

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Configuration Files

```yaml
# agent-config.yaml
agent:
  personality:
    learningRate: 50
    adaptationSpeed: 40
    emotionalRegulation: 60
  
  skills:
    autoUnlock: false
    trainingMultiplier: 1.0
  
  deployment:
    platforms:
      - discord
      - web
    environments:
      - production
      - staging
  
  monitoring:
    enabled: true
    metrics:
      - cpu
      - memory
      - requests
      - errors
```

## Testing

The agent engine includes comprehensive tests covering all major functionality:

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test personality
pnpm test skills
pnpm test integration

# Run tests with coverage
pnpm test:coverage

# Run performance tests
pnpm test:performance
```

## Examples

### Basic Agent Creation

```typescript
import { AgentEngine } from '@p31labs/agent-engine';

const agent = new AgentEngine({
  identity: { name: 'BasicBot', description: 'A simple assistant' },
  personality: { communicationStyle: 'friendly' },
  skills: { unlockedSkills: ['communication_basic'] }
});

const response = await agent.processInput('Hello!');
console.log(response.response); // "I understand. Let me help you with that."
```

### Discord Bot Integration

```typescript
import { Client, Intents } from 'discord.js';
import { AgentEngine } from '@p31labs/agent-engine';

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const agent = new AgentEngine(/* your profile */);

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  const response = await agent.processInput(message.content);
  await message.reply(response.response);
});

client.login(process.env.DISCORD_BOT_TOKEN);
```

### Web Application

```typescript
import express from 'express';
import { AgentEngine } from '@p31labs/agent-engine';

const app = express();
const agent = new AgentEngine(/* your profile */);

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  const response = await agent.processInput(message);
  res.json({ response: response.response, mood: response.mood });
});

app.listen(3000, () => console.log('Agent API running on port 3000'));
```

## Contributing

We welcome contributions to the P31 Agent Engine! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Install dependencies**: `pnpm install`
3. **Run tests**: `pnpm test` (must pass)
4. **Build the project**: `pnpm build` (must succeed)
5. **Submit a pull request** with a clear description

### Development Setup

```bash
# Clone the repository
git clone https://github.com/p31labs/andromeda.git
cd packages/agent-engine

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

### Code Style

- Use TypeScript for all new code
- Follow P31 Labs coding standards
- Include comprehensive tests for new features
- Update documentation for API changes
- Use meaningful variable and function names

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [docs/](docs/)
- **Examples**: [examples/](examples/)
- **Issues**: [GitHub Issues](https://github.com/p31labs/andromeda/issues)
- **Discord**: [P31 Labs Discord](https://discord.gg/p31labs)

## Roadmap

### Q1 2025
- [x] Core agent engine architecture
- [x] Personality and mood systems
- [x] Skill tree framework
- [x] P31 ecosystem integration
- [x] Multi-platform deployment

### Q2 2025
- [ ] Advanced AI integration
- [ ] Voice and speech capabilities
- [ ] Advanced analytics dashboard
- [ ] Community marketplace
- [ ] Mobile app development

### Q3 2025
- [ ] Enterprise features
- [ ] Advanced security features
- [ ] Multi-language support
- [ ] Advanced customization
- [ ] Performance optimization

### Q4 2025
- [ ] AI-powered creation assistant
- [ ] Advanced training system
- [ ] Community features
- [ ] Advanced monitoring
- [ ] Scalability improvements

## Acknowledgments

This project is part of the P31 Labs ecosystem and builds upon:
- [P31 Spoons Economy](https://github.com/p31labs/spoons-economy)
- [P31 Discord Bot](https://github.com/p31labs/discord-bot)
- [P31 Web Framework](https://github.com/p31labs/web-framework)
- [Q-Suite Testing](https://github.com/p31labs/q-suite)

Special thanks to the P31 Labs community for their support and feedback.