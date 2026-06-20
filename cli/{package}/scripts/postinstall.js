#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 P31 Andromeda CLI Post-Installation Setup');

// Create necessary directories
const directories = [
  'config',
  'secrets',
  'tokens',
  'logs',
  'deployment',
  'monitoring'
];

directories.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Create default configuration files
const defaultConfig = {
  version: '1.0.0',
  environment: 'development',
  services: {
    frontend: {
      port: 3000,
      path: 'software/spaceship-earth'
    },
    backend: {
      port: 3001,
      path: 'software'
    },
    monitoring: {
      port: 3002,
      path: 'monitoring'
    }
  },
  oauth: {
    providers: ['google', 'github', 'discord'],
    callbackUrl: 'http://localhost:3000/auth/callback'
  },
  secrets: {
    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16
    }
  }
};

fs.writeFileSync(
  path.join(__dirname, '..', 'config', 'default.json'),
  JSON.stringify(defaultConfig, null, 2)
);

// Create .gitignore for CLI
const gitignore = `
# CLI-specific ignores
node_modules/
.env.local
.env.production
secrets/encrypted.json
tokens/jwt.json
logs/*.log
dist/
coverage/
.DS_Store
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`;

fs.writeFileSync(path.join(__dirname, '..', '.gitignore'), gitignore);

// Make CLI executable
const cliPath = path.join(__dirname, '..', 'index.js');
try {
  fs.chmodSync(cliPath, '755');
  console.log('✅ CLI executable permissions set');
} catch (error) {
  console.log('⚠️ Could not set executable permissions (Windows)');
}

console.log('✅ P31 Andromeda CLI setup complete!');
console.log('');
console.log('🚀 Quick Start:');
console.log('  andromeda setup    # Complete environment setup');
console.log('  andromeda dev      # Start development environment');
console.log('  andromeda launch   # Launch production environment');
console.log('');
console.log('📚 For more commands, run: andromeda --help');