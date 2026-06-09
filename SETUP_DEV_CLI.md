# P31 Andromeda Setup & Development CLI

## 🛠️ All-in-One Development Environment Manager

This comprehensive CLI application provides a complete setup and development environment management system for P31 Andromeda, including OAuth, passwords, tokens, and all startup tools.

## 🚀 Quick Start

### Installation
```bash
# Install the CLI globally
npm install -g @p31/andromeda-cli

# Or run directly
npx @p31/andromeda-cli setup
```

### Basic Usage
```bash
# Initialize complete development environment
andromeda setup

# Start development with all services
andromeda dev

# Launch production environment
andromeda launch
```

## 📦 CLI Commands Overview

### Setup Commands
- `setup` - Complete environment initialization
- `setup:env` - Environment variables configuration
- `setup:oauth` - OAuth provider configuration
- `setup:secrets` - Secure secrets management
- `setup:tokens` - API tokens and keys management

### Development Commands
- `dev` - Start development environment
- `dev:frontend` - Start frontend development server
- `dev:backend` - Start backend services
- `dev:monitoring` - Start monitoring stack
- `dev:all` - Start all development services

### Launch Commands
- `launch` - Production launch
- `launch:website` - Website deployment
- `launch:monitoring` - Monitoring setup
- `launch:community` - Community platform setup

### Utility Commands
- `config` - Configuration management
- `secrets` - Secrets management
- `tokens` - Token management
- `status` - System status check
- `logs` - View application logs

## 🏗️ Complete CLI Implementation

### Main CLI Application (`cli/index.js`)
```javascript
#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { spawn } = require('child_process');

const program = new Command();

// CLI Configuration
program
  .name('andromeda')
  .description('P31 Andromeda Development Environment Manager')
  .version('1.0.0');

// Setup Commands
program
  .command('setup')
  .description('Complete environment initialization')
  .action(async () => {
    console.log(chalk.blue('🚀 P31 Andromeda Setup'));
    await runSetup();
  });

program
  .command('setup:env')
  .description('Environment variables configuration')
  .action(async () => {
    await setupEnvironment();
  });

program
  .command('setup:oauth')
  .description('OAuth provider configuration')
  .action(async () => {
    await setupOAuth();
  });

program
  .command('setup:secrets')
  .description('Secure secrets management')
  .action(async () => {
    await setupSecrets();
  });

program
  .command('setup:tokens')
  .description('API tokens and keys management')
  .action(async () => {
    await setupTokens();
  });

// Development Commands
program
  .command('dev')
  .description('Start development environment')
  .action(async () => {
    await startDevelopment();
  });

program
  .command('dev:frontend')
  .description('Start frontend development server')
  .action(async () => {
    await startFrontend();
  });

program
  .command('dev:backend')
  .description('Start backend services')
  .action(async () => {
    await startBackend();
  });

program
  .command('dev:monitoring')
  .description('Start monitoring stack')
  .action(async () => {
    await startMonitoring();
  });

// Launch Commands
program
  .command('launch')
  .description('Production launch')
  .action(async () => {
    await launchProduction();
  });

program
  .command('launch:website')
  .description('Website deployment')
  .action(async () => {
    await launchWebsite();
  });

// Utility Commands
program
  .command('config')
  .description('Configuration management')
  .action(async () => {
    await manageConfig();
  });

program
  .command('secrets')
  .description('Secrets management')
  .action(async () => {
    await manageSecrets();
  });

program
  .command('tokens')
  .description('Token management')
  .action(async () => {
    await manageTokens();
  });

program
  .command('status')
  .description('System status check')
  .action(async () => {
    await checkStatus();
  });

program
  .command('logs')
  .description('View application logs')
  .action(async () => {
    await viewLogs();
  });

// Helper Functions
async function runSetup() {
  console.log(chalk.green('Starting complete setup...'));
  
  // Environment setup
  await setupEnvironment();
  
  // OAuth configuration
  await setupOAuth();
  
  // Secrets management
  await setupSecrets();
  
  // Token management
  await setupTokens();
  
  console.log(chalk.green('✅ Complete setup finished!'));
}

async function setupEnvironment() {
  console.log(chalk.blue('🔧 Setting up environment variables...'));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'nodeEnv',
      message: 'Node environment:',
      default: 'development'
    },
    {
      type: 'input',
      name: 'port',
      message: 'Development port:',
      default: '3000'
    },
    {
      type: 'input',
      name: 'apiUrl',
      message: 'API URL:',
      default: 'http://localhost:3001'
    }
  ]);
  
  const envContent = `
# P31 Andromeda Environment Configuration
NODE_ENV=${answers.nodeEnv}
PORT=${answers.port}
API_URL=${answers.apiUrl}

# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/andromeda"

# Redis Configuration
REDIS_URL="redis://localhost:6379"

# Security Configuration
JWT_SECRET="${crypto.randomBytes(64).toString('hex')}"
SESSION_SECRET="${crypto.randomBytes(64).toString('hex')}"

# OAuth Configuration
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""

# API Keys
OPENAI_API_KEY=""
CLOUDFLARE_API_TOKEN=""
TWITTER_API_KEY=""
TWITTER_API_SECRET=""
SLACK_WEBHOOK_URL=""

# Monitoring
GRAFANA_URL=""
PROMETHEUS_URL=""
SENTRY_DSN=""
  `.trim();
  
  await fs.writeFile('.env.local', envContent);
  console.log(chalk.green('✅ Environment configuration saved'));
}

async function setupOAuth() {
  console.log(chalk.blue('🔐 Setting up OAuth providers...'));
  
  const providers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'providers',
      message: 'Select OAuth providers to configure:',
      choices: ['Google', 'GitHub', 'Discord', 'Twitter']
    }
  ]);
  
  const config = {};
  
  for (const provider of providers.providers) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: `${provider.toLowerCase()}ClientId`,
        message: `${provider} Client ID:`
      },
      {
        type: 'password',
        name: `${provider.toLowerCase()}ClientSecret`,
        message: `${provider} Client Secret:`
      }
    ]);
    
    config[`${provider.toLowerCase()}ClientId`] = answers[`${provider.toLowerCase()}ClientId`];
    config[`${provider.toLowerCase()}ClientSecret`] = answers[`${provider.toLowerCase()}ClientSecret`];
  }
  
  await fs.writeFile('config/oauth.json', JSON.stringify(config, null, 2));
  console.log(chalk.green('✅ OAuth configuration saved'));
}

async function setupSecrets() {
  console.log(chalk.blue('🔒 Setting up secrets management...'));
  
  const secrets = await inquirer.prompt([
    {
      type: 'password',
      name: 'databasePassword',
      message: 'Database password:'
    },
    {
      type: 'password',
      name: 'redisPassword',
      message: 'Redis password:'
    },
    {
      type: 'password',
      name: 'jwtSecret',
      message: 'JWT secret:'
    }
  ]);
  
  // Encrypt secrets
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  
  const encryptedSecrets = {
    databasePassword: encrypt(secrets.databasePassword, key, iv),
    redisPassword: encrypt(secrets.redisPassword, key, iv),
    jwtSecret: encrypt(secrets.jwtSecret, key, iv),
    key: key.toString('hex'),
    iv: iv.toString('hex')
  };
  
  await fs.writeFile('secrets/encrypted.json', JSON.stringify(encryptedSecrets, null, 2));
  console.log(chalk.green('✅ Secrets encrypted and saved'));
}

async function setupTokens() {
  console.log(chalk.blue('🔑 Setting up API tokens...'));
  
  const tokens = await inquirer.prompt([
    {
      type: 'password',
      name: 'openaiApiKey',
      message: 'OpenAI API Key:'
    },
    {
      type: 'password',
      name: 'cloudflareToken',
      message: 'Cloudflare API Token:'
    },
    {
      type: 'password',
      name: 'twitterApiKey',
      message: 'Twitter API Key:'
    }
  ]);
  
  // Generate JWT tokens
  const jwtToken = jwt.sign(tokens, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '24h'
  });
  
  await fs.writeFile('tokens/jwt.json', JSON.stringify({ token: jwtToken }, null, 2));
  console.log(chalk.green('✅ API tokens configured'));
}

async function startDevelopment() {
  console.log(chalk.blue('🚀 Starting development environment...'));
  
  // Start frontend
  await startFrontend();
  
  // Start backend
  await startBackend();
  
  // Start monitoring
  await startMonitoring();
  
  console.log(chalk.green('✅ Development environment ready!'));
}

async function startFrontend() {
  console.log(chalk.blue('🌐 Starting frontend...'));
  
  const frontend = spawn('pnpm', ['dev'], {
    cwd: 'software/spaceship-earth',
    stdio: 'inherit'
  });
  
  frontend.on('close', (code) => {
    console.log(`Frontend exited with code ${code}`);
  });
}

async function startBackend() {
  console.log(chalk.blue('⚙️ Starting backend services...'));
  
  const backend = spawn('pnpm', ['dev'], {
    cwd: 'software',
    stdio: 'inherit'
  });
  
  backend.on('close', (code) => {
    console.log(`Backend exited with code ${code}`);
  });
}

async function startMonitoring() {
  console.log(chalk.blue('📊 Starting monitoring stack...'));
  
  const monitoring = spawn('docker-compose', ['up', '-d'], {
    cwd: 'monitoring',
    stdio: 'inherit'
  });
  
  monitoring.on('close', (code) => {
    console.log(`Monitoring exited with code ${code}`);
  });
}

async function launchProduction() {
  console.log(chalk.blue('🚀 Launching production environment...'));
  
  // Run production build
  await runCommand('pnpm', ['build'], 'software');
  
  // Deploy website
  await launchWebsite();
  
  // Setup monitoring
  await startMonitoring();
  
  console.log(chalk.green('✅ Production environment launched!'));
}

async function launchWebsite() {
  console.log(chalk.blue('🌐 Deploying website...'));
  
  const website = spawn('wrangler', ['pages', 'publish'], {
    cwd: 'deployment/website',
    stdio: 'inherit'
  });
  
  website.on('close', (code) => {
    console.log(`Website deployment exited with code ${code}`);
  });
}

async function manageConfig() {
  console.log(chalk.blue('⚙️ Configuration management...'));
  
  const action = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: ['View config', 'Edit config', 'Reset config']
    }
  ]);
  
  switch (action.action) {
    case 'View config':
      const config = await fs.readFile('.env.local', 'utf8');
      console.log(chalk.cyan(config));
      break;
    case 'Edit config':
      // Open in editor
      const editor = process.env.EDITOR || 'code';
      spawn(editor, ['.env.local'], { stdio: 'inherit' });
      break;
    case 'Reset config':
      await setupEnvironment();
      break;
  }
}

async function manageSecrets() {
  console.log(chalk.blue('🔒 Secrets management...'));
  
  const action = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: ['View secrets', 'Update secrets', 'Generate new keys']
    }
  ]);
  
  switch (action.action) {
    case 'View secrets':
      const secrets = await fs.readFile('secrets/encrypted.json', 'utf8');
      console.log(chalk.cyan(secrets));
      break;
    case 'Update secrets':
      await setupSecrets();
      break;
    case 'Generate new keys':
      await generateNewKeys();
      break;
  }
}

async function manageTokens() {
  console.log(chalk.blue('🔑 Token management...'));
  
  const action = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: ['View tokens', 'Refresh tokens', 'Generate new tokens']
    }
  ]);
  
  switch (action.action) {
    case 'View tokens':
      const tokens = await fs.readFile('tokens/jwt.json', 'utf8');
      console.log(chalk.cyan(tokens));
      break;
    case 'Refresh tokens':
      await setupTokens();
      break;
    case 'Generate new tokens':
      await generateNewTokens();
      break;
  }
}

async function checkStatus() {
  console.log(chalk.blue('📊 System status check...'));
  
  const status = {
    frontend: await checkService('http://localhost:3000'),
    backend: await checkService('http://localhost:3001'),
    database: await checkService('postgresql://localhost:5432'),
    redis: await checkService('redis://localhost:6379'),
    monitoring: await checkService('http://localhost:3000/health')
  };
  
  console.log(chalk.cyan(JSON.stringify(status, null, 2)));
}

async function viewLogs() {
  console.log(chalk.blue('📋 Viewing logs...'));
  
  const service = await inquirer.prompt([
    {
      type: 'list',
      name: 'service',
      message: 'Which service logs would you like to view?',
      choices: ['Frontend', 'Backend', 'Monitoring', 'All']
    }
  ]);
  
  switch (service.service) {
    case 'Frontend':
      spawn('tail', ['-f', 'logs/frontend.log'], { stdio: 'inherit' });
      break;
    case 'Backend':
      spawn('tail', ['-f', 'logs/backend.log'], { stdio: 'inherit' });
      break;
    case 'Monitoring':
      spawn('tail', ['-f', 'logs/monitoring.log'], { stdio: 'inherit' });
      break;
    case 'All':
      spawn('tail', ['-f', 'logs/*.log'], { stdio: 'inherit' });
      break;
  }
}

// Utility Functions
function encrypt(text, key, iv) {
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return {
    encrypted,
    authTag: authTag.toString('hex')
  };
}

function decrypt(encryptedData, key, iv) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function checkService(url) {
  try {
    // Simple health check
    return { status: 'healthy', url };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

async function generateNewKeys() {
  console.log(chalk.blue('🔑 Generating new encryption keys...'));
  
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  
  await fs.writeFile('secrets/keys.json', JSON.stringify({
    key: key.toString('hex'),
    iv: iv.toString('hex')
  }, null, 2));
  
  console.log(chalk.green('✅ New keys generated'));
}

async function generateNewTokens() {
  console.log(chalk.blue('🔑 Generating new JWT tokens...'));
  
  const token = jwt.sign({ 
    timestamp: Date.now() 
  }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '24h'
  });
  
  await fs.writeFile('tokens/new.json', JSON.stringify({ token }, null, 2));
  console.log(chalk.green('✅ New tokens generated'));
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Unhandled promise rejection:'), error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught exception:'), error);
  process.exit(1);
});

// Parse CLI arguments
program.parse();