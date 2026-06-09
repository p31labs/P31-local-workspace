# P31 Andromeda CLI

## 🛠️ All-in-One Development Environment Manager

The P31 Andromeda CLI is a comprehensive command-line interface that provides complete setup and development environment management for the P31 Andromeda project, including OAuth, passwords, tokens, and all startup tools.

## 🚀 Quick Start

### Installation

#### Global Installation
```bash
npm install -g @p31/andromeda-cli
```

#### Local Installation
```bash
npm install @p31/andromeda-cli
npx andromeda setup
```

#### Direct Execution
```bash
npx @p31/andromeda-cli setup
```

### Basic Usage

```bash
# Complete environment setup
andromeda setup

# Start development environment
andromeda dev

# Launch production environment
andromeda launch

# View all commands
andromeda --help
```

## 📦 Commands Overview

### Setup Commands

#### `andromeda setup`
Complete environment initialization including:
- Environment variables configuration
- OAuth provider setup
- Secrets management
- API tokens and keys management

#### `andromeda setup:env`
Configure environment variables interactively:
```bash
andromeda setup:env
```

#### `andromeda setup:oauth`
Configure OAuth providers (Google, GitHub, Discord, Twitter):
```bash
andromeda setup:oauth
```

#### `andromeda setup:secrets`
Set up secure secrets management with encryption:
```bash
andromeda setup:secrets
```

#### `andromeda setup:tokens`
Configure API tokens and generate JWT tokens:
```bash
andromeda setup:tokens
```

### Development Commands

#### `andromeda dev`
Start complete development environment:
- Frontend development server
- Backend services
- Monitoring stack

#### `andromeda dev:frontend`
Start only the frontend development server:
```bash
andromeda dev:frontend
```

#### `andromeda dev:backend`
Start only the backend services:
```bash
andromeda dev:backend
```

#### `andromeda dev:monitoring`
Start only the monitoring stack:
```bash
andromeda dev:monitoring
```

### Launch Commands

#### `andromeda launch`
Complete production launch:
- Production build
- Website deployment
- Monitoring setup

#### `andromeda launch:website`
Deploy website to production:
```bash
andromeda launch:website
```

### Utility Commands

#### `andromeda config`
Configuration management:
```bash
andromeda config
# Options: View config, Edit config, Reset config
```

#### `andromeda secrets`
Secrets management:
```bash
andromeda secrets
# Options: View secrets, Update secrets, Generate new keys
```

#### `andromeda tokens`
Token management:
```bash
andromeda tokens
# Options: View tokens, Refresh tokens, Generate new tokens
```

#### `andromeda status`
System status check:
```bash
andromeda status
```

#### `andromeda logs`
View application logs:
```bash
andromeda logs
# Options: Frontend, Backend, Monitoring, All
```

## 🔧 Configuration

### Environment Variables

The CLI creates a comprehensive `.env.local` file with all necessary configuration:

```bash
# Basic Configuration
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3001

# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/andromeda"

# Security Configuration
JWT_SECRET="your-jwt-secret"
SESSION_SECRET="your-session-secret"

# OAuth Configuration
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# API Keys
OPENAI_API_KEY="your-openai-api-key"
CLOUDFLARE_API_TOKEN="your-cloudflare-token"
TWITTER_API_KEY="your-twitter-api-key"
```

### OAuth Providers

The CLI supports multiple OAuth providers:

- **Google OAuth**: For Google account integration
- **GitHub OAuth**: For GitHub authentication
- **Discord OAuth**: For Discord community integration
- **Twitter OAuth**: For Twitter authentication

### Secrets Management

All sensitive information is encrypted using AES-256-GCM:

```javascript
{
  "databasePassword": {
    "encrypted": "encrypted-data",
    "authTag": "auth-tag"
  },
  "redisPassword": {
    "encrypted": "encrypted-data", 
    "authTag": "auth-tag"
  },
  "jwtSecret": {
    "encrypted": "encrypted-data",
    "authTag": "auth-tag"
  }
}
```

### Token Management

JWT tokens are automatically generated and managed:

```javascript
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "issuedAt": "2026-03-24T00:00:00.000Z"
}
```

## 🏗️ Architecture

### CLI Structure

```
cli/
├── index.js              # Main CLI application
├── package.json          # CLI package configuration
├── README.md            # CLI documentation
├── config/              # Configuration files
│   └── default.json     # Default configuration
├── secrets/             # Encrypted secrets
│   ├── encrypted.json   # Encrypted secrets
│   └── keys.json        # Encryption keys
├── tokens/              # API tokens
│   ├── jwt.json         # JWT tokens
│   └── new.json         # New tokens
├── logs/                # Application logs
├── deployment/          # Deployment files
└── monitoring/          # Monitoring configuration
```

### Key Features

#### Interactive Setup
- Guided configuration process
- Environment-specific settings
- OAuth provider selection
- Secret encryption

#### Service Management
- Start/stop individual services
- Monitor service health
- View service logs
- Automatic service discovery

#### Security Management
- Encrypted secrets storage
- JWT token generation
- OAuth configuration
- Key rotation support

#### Development Tools
- Hot reload support
- Live monitoring
- Debug mode
- Performance profiling

## 🚀 Development

### Running in Development

```bash
# Clone the repository
git clone https://github.com/p31labs/andromeda.git
cd andromeda/cli

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Adding New Commands

1. Add command to `index.js`:
```javascript
program
  .command('new-command')
  .description('Description of new command')
  .action(async () => {
    await newCommandFunction();
  });
```

2. Implement the command function:
```javascript
async function newCommandFunction() {
  // Command implementation
}
```

### Custom Configuration

Create a custom configuration file:

```javascript
// config/custom.json
{
  "customSetting": "value",
  "services": {
    "customService": {
      "port": 8080,
      "path": "./custom-service"
    }
  }
}
```

## 🔒 Security

### Encryption
- AES-256-GCM encryption for all secrets
- Automatic key generation
- Secure key storage
- Key rotation support

### Authentication
- JWT token-based authentication
- OAuth provider integration
- Session management
- Rate limiting

### Best Practices
- Never commit secrets to version control
- Use environment-specific configurations
- Regular security audits
- Dependency vulnerability scanning

## 📊 Monitoring

### Health Checks
- Service availability monitoring
- Performance metrics
- Error tracking
- Resource usage

### Logging
- Structured logging
- Log rotation
- Error tracking
- Performance monitoring

### Metrics
- Response times
- Error rates
- Throughput
- Resource utilization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Documentation**: [P31 Andromeda Docs](https://docs.p31andromeda.com)
- **Issues**: [GitHub Issues](https://github.com/p31labs/andromeda/issues)
- **Community**: [Discord Community](https://discord.gg/p31andromeda)
- **Email**: support@p31andromeda.com

---

**P31 Andromeda CLI** - Making development environment management simple and secure.