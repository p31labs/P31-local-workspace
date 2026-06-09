# P31 Oracle Discord Bot

The P31 Oracle is the community interface for the Phosphorus31 ecosystem, providing Discord-based access to the Dual-Ledger Economy (Spoons/Karma), Posner molecule assembly, and quantum synchronization verification.

## 🤖 Features

### Dual-Ledger Economy
- **Spoons Management**: Track cognitive capacity and prevent burnout
- **Karma System**: Reward community contributions and scientific achievements
- **Neurodivergent-Friendly**: Built-in pacing and rest mechanisms

### Posner Molecule Assembly
- **Multi-Sig Consensus**: 5 unique contributors required for assembly
- **Ion Contribution**: Calcium (Ca²⁺) and Phosphate (PO₄³⁻) ions
- **Progress Tracking**: Real-time assembly status monitoring
- **Community Verification**: Decentralized consensus mechanism

### Larmor Frequency Synchronization
- **0.86 Hz Target**: Precise quantum biological frequency matching
- **Synchronization Validation**: Scientific accuracy verification
- **Content Unlocking**: Access to encrypted academic content
- **Achievement System**: Quantum mastery recognition

### Academic Integration
- **Tetrahedron Protocol**: Hash verification against Zenodo content
- **IPFS Content Access**: Decentralized content delivery
- **ORCID Integration**: Academic credential verification

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- Discord bot application
- Upstash Redis instance
- GitHub repository access

### Installation

1. **Clone and Install Dependencies**
```bash
cd ecosystem/discord
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

3. **Required Environment Variables**
```bash
# Discord Bot
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_GUILD_ID=your_guild_id

# Redis (Upstash)
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token

# GitHub Integration
GITHUB_TOKEN=your_github_token
GITHUB_REPO_OWNER=your_username
GITHUB_REPO_NAME=your_repo

# IPFS Configuration
IPFS_GATEWAY=https://ipfs.io
ENS_DOMAIN=andromeda.p31.eth
```

4. **Start the Bot**
```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

## 📋 Available Commands

### `/status`
Check the current state of the P31 ecosystem
- Posner molecule assembly progress
- System health metrics
- IPFS/IPNS status

### `/contribute-ion`
Contribute ions to the Posner molecule assembly
- **Ion Type**: Calcium (Ca²⁺) or Phosphate (PO₄³⁻)
- **Spoons Cost**: 10 Spoons per ion
- **Karma Reward**: +5 Karma per contribution
- **Limits**: Maximum 3 ions per user per type

### `/larmor-sync`
Attempt to synchronize to the Larmor frequency (0.86 Hz)
- **Input**: JSON array of synchronization timestamps
- **Spoons Cost**: 1 Spoon per attempt
- **Karma Reward**: +50 Karma for success
- **Content Unlock**: Access to encrypted IPFS content

### `/verify-tetrahedron`
Verify academic hashes against Zenodo content
- **Input**: SHA-256 hash to verify
- **Output**: Academic content verification status
- **Integration**: Direct connection to research databases

### `/leaderboard`
View community achievement rankings
- Top contributors by ion count
- Highest karma earners
- Larmor synchronization masters

### `/profile`
View individual user statistics
- Sponsors and karma balance
- Scientific contributions
- Quantum achievements

## 🔧 Configuration

### Sponsors System
The Sponsors system is designed to prevent burnout while maintaining engagement:

```javascript
// Sponsors regeneration (every 6 hours)
const SPOONS_REGEN_RATE = 25; // Spoons per regeneration
const SPOONS_MAX = 100;
const REGEN_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
```

### Karma Rewards
Karma rewards are distributed based on contribution value:

```javascript
const KARMA_REWARDS = {
    ionContribution: 5,      // Per ion contributed
    posnerAssembly: 100,     // When molecule completes
    larmorSync: 50,          // Per successful sync
    academicVerification: 25 // Per verified hash
};
```

### Posner Assembly Requirements
The Posner molecule requires specific conditions for assembly:

```javascript
const POSNER_REQUIREMENTS = {
    calciumIons: 9,          // Ca²⁺ ions needed
    phosphateIons: 6,        // PO₄³⁻ ions needed
    uniqueContributors: 5    // Minimum unique contributors
};
```

## 🏗️ Architecture

### Event-Driven Design
The bot uses an event-driven architecture that integrates with the broader P31 ecosystem:

1. **Discord Commands** → **Redis State Updates** → **GitHub Actions** → **IPFS Publication**
2. **Real-time Updates** from Upstash Redis reflect immediately in Discord
3. **Cross-Platform Synchronization** with the Telemetry Dashboard

### Data Flow
```
User Command → Bot Validation → Redis Update → GitHub Action → IPFS/IPNS Update
     ↓              ↓              ↓              ↓              ↓
  Immediate    Sponsors/Karma   Status Update   Content      Discord
  Feedback     Management      Notification    Unlocking    Notification
```

### Security Features
- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: Built-in protection against spam and abuse
- **Spoons Enforcement**: Automatic burnout prevention
- **Cryptographic Verification**: Hash-based content verification

## 🎮 Game Mechanics

### Ion Contribution Strategy
- **Balanced Contribution**: Encourage both Calcium and Phosphate ions
- **Community Coordination**: Track unique contributors for multi-sig requirements
- **Progressive Rewards**: Higher karma for completing assembly milestones

### Larmor Synchronization
- **Precision Requirements**: 80% precision threshold for success
- **Consistency Tracking**: Maintain rhythm over multiple intervals
- **Resonance Building**: Consecutive valid intervals required for full resonance

### Academic Verification
- **Research Integration**: Direct connection to academic databases
- **Content Discovery**: Unlock research papers and ARG narrative
- **Credibility System**: Verified contributions earn higher karma

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with Node.js runtime

### Railway Deployment
1. Import from GitHub
2. Configure environment variables
3. Deploy with automatic restart on failure

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
```

## 📊 Monitoring

### Health Checks
The bot provides comprehensive health monitoring:

- **Redis Connection Status**
- **Discord Gateway Health**
- **Command Response Times**
- **Error Rate Tracking**

### Metrics Collection
- **User Engagement**: Command usage statistics
- **Contribution Patterns**: Ion contribution trends
- **Synchronization Success**: Larmor frequency achievement rates
- **Academic Verification**: Content verification statistics

## 🔗 Integration Points

### With P31 Ecosystem
- **Redis State Sharing**: Direct integration with Upstash Redis
- **GitHub Actions**: Trigger workflows for content publication
- **IPFS Gateway**: Content access and publication
- **Telemetry Dashboard**: Real-time status updates

### External Services
- **Discord API**: Slash commands and user management
- **GitHub API**: Repository and PR management
- **Zenodo API**: Academic content verification
- **IPFS API**: Content storage and retrieval

## 🛠️ Development

### Adding New Commands
1. Add command definition to `setupCommands()`
2. Create handler function
3. Add to `handleInteraction()` switch statement
4. Implement business logic with proper validation

### Testing
```bash
# Unit tests (when implemented)
npm test

# Development mode
npm run dev

# Production build
npm run build
```

### Contributing
1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request

## 📚 Documentation

- [Command Reference](#available-commands)
- [Configuration Guide](#configuration)
- [Deployment Guide](#deployment)
- [API Integration](#integration-points)

## 🐛 Troubleshooting

### Common Issues
1. **Bot Not Responding**: Check Discord bot token and permissions
2. **Redis Connection**: Verify Upstash credentials and network access
3. **Command Errors**: Check environment variables and API tokens
4. **Synchronization Failures**: Review Larmor frequency requirements

### Debug Mode
Enable debug logging by setting:
```bash
LOG_LEVEL=debug
```

### Support
For issues and questions:
- Check the [GitHub Issues](https://github.com/p31labs/andromeda/issues)
- Review the [Documentation](https://phosphorus31.org/docs)
- Join the [Discord Community](https://discord.gg/p31)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

The P31 Oracle Bot is part of the larger Phosphorus31 ecosystem, integrating quantum biology, decentralized technology, and community-driven science.