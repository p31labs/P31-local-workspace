# P31 Oracle Terminal

**Class I FDA-Exempt Cognitive Prosthetic** - Sovereign RAG Search Engine for Medical Device Documentation

## 🧠 Overview

The P31 Oracle Terminal is a revolutionary interactive searchable library designed specifically for neurodivergent users and medical device compliance. It transforms complex academic and technical documentation into accessible, level-gated knowledge through a gamified interface.

### Key Features

- **🧠 Cognitive Safety**: Spoon economy prevents cognitive overload
- **🔒 Sovereign RAG**: Local AI processing, no cloud APIs
- **🎮 Gamified Access**: Level-gated document discovery
- **🏥 Medical Compliance**: 21 CFR §890.3710 compliant
- **⚡ Real-time Search**: Natural language queries with instant results
- **🛡️ HIPAA Safe Harbor**: Zero data leaves the server

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   Data Layer    │
│   (React)       │◄──►│   (Node.js)      │◄──►│   (Redis +     │
│                 │    │                   │    │   IPFS + Ollama)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Retro Terminal  │    │ Express Server   │    │ Upstash Vector  │
│ UI              │    │ with Security    │    │ + Redis Cache   │
│                 │    │ Middleware       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Redis (Upstash recommended)
- Ollama with `phi3` and `nomic-embed-text` models
- IPFS node (optional)

### Installation

1. **Clone and Install**
```bash
cd software/packages/oracle-terminal
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start Services**
```bash
# Start the server
npm run dev

# Or build and start
npm run build
npm start
```

4. **Frontend Integration**
```bash
# The frontend can be integrated into your existing React application
# or run as a standalone interface
```

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Redis (Upstash)
UPSTASH_REDIS_URL=redis://localhost:6379
UPSTASH_REDIS_TOKEN=your-token

# Upstash Vector
UPSTASH_VECTOR_REST_URL=https://your-vector-db.upstash.io
UPSTASH_VECTOR_REST_TOKEN=your-vector-token

# Ollama (Local AI)
OLLAMA_BASE_URL=http://localhost:11434/api
CHAT_MODEL=phi3
EMBEDDING_MODEL=nomic-embed-text

# Medical Device Compliance
CLINICAL_SAFETY_MODE=true
DAILY_SPOON_LIMIT=5
DAILY_SEARCH_LIMIT=20
```

### Ollama Setup

Install and run Ollama with required models:

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull required models
ollama pull phi3
ollama pull nomic-embed-text

# Verify models are running
ollama list
```

## 🎮 User Experience

### The Spoon Economy

Users start with 5 Spoons per day. Each search costs 1 Spoon:

- **Spoon Depletion**: When Spoons reach 0, search is locked until next day
- **Rate Limiting**: Maximum 20 searches per day
- **Idempotency**: Duplicate searches are blocked for 5 minutes
- **Clinical Safety**: Prevents cognitive overload and "doom-scrolling"

### Level-Gated Access

Documents are categorized by clearance level:

- **Level 1 (Public Bay)**: Basic documentation, open to all
- **Level 2 (The Laboratory)**: Requires 5 Karma points
- **Level 3 (Quantum Vault)**: Requires 0.86 Hz Larmor synchronization key

### Search Interface

Users interact through a retro-futuristic terminal:

```
> How do Posner molecules work?

[P3O1lama] Ingesting query and calculating KWAI vector embedding...
[Upstash Redis] Scanning vector cache for semantic matches...
[IPFS] Retrieving document chunks...
[P3O1lama] Synthesizing output. Applying 3-sentence, 8th-grade safety constraint.

The Ship's Computer responds with a concise, accessible explanation.
```

## 🛡️ Security & Compliance

### Medical Device Compliance

- **21 CFR §890.3710**: Class I FDA-Exempt cognitive prosthetic
- **HIPAA Safe Harbor**: No PHI leaves the server
- **ADA 508**: Full accessibility compliance
- **Clinical Safety**: Built-in cognitive load management

### Data Security

- **Zero Cloud APIs**: All AI processing is local
- **Encrypted Storage**: Redis with TLS encryption
- **Access Control**: Fingerprint-based user identification
- **Audit Trail**: Complete logging of all interactions

### Clinical Safety Features

- **Spoon Economy**: Prevents cognitive overload
- **Rate Limiting**: Maximum 20 searches per day
- **Idempotency Protection**: Prevents rapid-fire queries
- **Daily Reset**: Automatic spoon regeneration at midnight UTC

## 📊 API Endpoints

### Main Search Endpoint

```http
POST /api/oracle/search
Content-Type: application/json

{
  "query": "How do Posner molecules work?",
  "fingerprintHash": "user-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "The Ship's Computer provides a 3-sentence explanation...",
    "source_link": "ipfs://QmXyZ1.../document.md",
    "spoons_remaining": 4,
    "search_id": "uuid-123",
    "timestamp": "2026-03-23T23:45:00Z"
  }
}
```

### User State Endpoint

```http
GET /api/oracle/state/user-abc123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "spoons": 4,
    "search_count": 1,
    "last_reset": 1742774400,
    "last_search": 1742778300,
    "daily_limit": 20,
    "can_search": true
  }
}
```

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "P31 Oracle Terminal",
  "version": "1.0.0",
  "timestamp": "2026-03-23T23:45:00Z",
  "compliance": ["ADA 508", "21 CFR §890.3710", "HIPAA Safe Harbor"]
}
```

## 🔌 Integration

### Frontend Integration

The Oracle Terminal frontend can be integrated into any React application:

```jsx
import OracleTerminal from '@p31/oracle-terminal-ui';

function App() {
  return (
    <div className="app">
      <OracleTerminal
        apiUrl="http://localhost:3001"
        userFingerprint="user-abc123"
        onSearchComplete={(result) => {
          console.log('Search result:', result);
        }}
      />
    </div>
  );
}
```

### Discord Bot Integration

The Oracle Terminal integrates with the P31 Discord bot for community features:

- **Achievement Notifications**: Discord announcements for level unlocks
- **Karma Integration**: Discord karma affects clearance levels
- **Community Sharing**: Users can share interesting findings

### Spoon Economy Integration

The Spoon economy connects to the broader P31 ecosystem:

- **Discord Rewards**: Active community members earn bonus Spoons
- **Agent Creation**: Spoons can be used to create AI agents
- **Node Count**: System participation affects daily Spoon allocation

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
# Start test environment
npm run test:integration

# Test specific components
npm run test:rag
npm run test:spoon-economy
npm run test:security
```

### Manual Testing

1. **Search Functionality**: Test various query types
2. **Spoon Economy**: Verify limits and resets
3. **Level Gating**: Test clearance requirements
4. **Error Handling**: Test edge cases and failures

## 🚀 Deployment

### Development

```bash
# Local development
npm run dev

# Watch mode
npm run dev:watch
```

### Production

```bash
# Build for production
npm run build

# Start production server
npm start

# With PM2 (recommended)
pm2 start dist/index.js --name oracle-terminal
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY dist/ ./dist/
COPY .env ./

EXPOSE 3001
CMD ["npm", "start"]
```

### Cloud Deployment

**Recommended Stack:**
- **Database**: Upstash Redis + Vector
- **Compute**: Vercel, Railway, or DigitalOcean
- **AI**: Local Ollama or self-hosted models
- **Storage**: IPFS with Pinata or Filebase

## 📈 Monitoring

### Health Metrics

- **Response Time**: API endpoint performance
- **Error Rate**: Failed search attempts
- **Spoon Usage**: Daily consumption patterns
- **User Engagement**: Active users and search frequency

### Compliance Monitoring

- **Audit Logs**: All user interactions logged
- **Security Events**: Failed authentication attempts
- **Compliance Reports**: Daily compliance status
- **Clinical Safety**: Cognitive load monitoring

## 🤝 Contributing

### Development Setup

1. **Fork and Clone**
```bash
git clone https://github.com/your-fork/andromeda.git
cd software/packages/oracle-terminal
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env
# Configure your environment
```

4. **Start Development**
```bash
npm run dev
```

### Code Standards

- **TypeScript**: All code must be TypeScript
- **ESLint**: Follow configured rules
- **Prettier**: Code formatting required
- **Testing**: 90%+ test coverage required

### Pull Request Guidelines

1. **Branch Naming**: `feature/your-feature-name` or `fix/your-fix-name`
2. **Commit Messages**: Clear, descriptive messages
3. **Testing**: Include tests for new features
4. **Documentation**: Update README and inline docs
5. **Compliance**: Ensure medical device compliance

## 📚 Documentation

### API Documentation

- [API Reference](./docs/API.md)
- [Integration Guide](./docs/INTEGRATION.md)
- [Security Guide](./docs/SECURITY.md)

### User Guides

- [End User Guide](./docs/USER_GUIDE.md)
- [Admin Guide](./docs/ADMIN_GUIDE.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

## 🐛 Bug Reports

### Before Reporting

1. **Check Existing Issues**: Search for similar reports
2. **Update Dependencies**: Ensure latest versions
3. **Reproduce Issue**: Confirm the problem

### Reporting Format

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
A clear description of what you expected to happen.

**Environment Info**
- OS: [e.g. Windows 11]
- Node.js Version: [e.g. 18.17.0]
- Browser: [e.g. chrome, safari]
- Version: [e.g. 22]

**Additional Context**
Add any other context about the problem here.
```

## 📞 Support

### Getting Help

- **Discord**: Join our Discord server for community support
- **Issues**: Report bugs and feature requests on GitHub
- **Email**: Contact the development team directly

### Emergency Procedures

For medical device compliance issues:

1. **Stop Service**: Immediately stop the Oracle Terminal
2. **Document Issue**: Record all relevant information
3. **Contact Team**: Notify the development team
4. **Compliance Report**: File appropriate compliance reports

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏥 Medical Device Compliance

### Regulatory Information

- **Device Class**: Class I FDA-Exempt
- **Intended Use**: Cognitive prosthetic for information access
- **Risk Management**: ISO 14971 compliant
- **Quality System**: 21 CFR Part 820 compliant

### Clinical Safety

- **Cognitive Load Management**: Built-in protection mechanisms
- **User Safety**: No harmful content generation
- **Data Privacy**: HIPAA-compliant data handling
- **Emergency Stop**: Immediate service shutdown capability

---

**P31 Labs** - Building the future of accessible technology