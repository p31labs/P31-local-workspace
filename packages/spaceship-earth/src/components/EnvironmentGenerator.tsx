import React, { useState, useCallback, useMemo } from 'react';
import { Copy, Check, ExternalLink, Shield, Code, Database, Key, Lock, Terminal } from 'lucide-react';

type EnvCategory = 'database' | 'api_keys' | 'auth' | 'security' | 'app_config' | 'services' | 'dev';
type Framework = 'nodejs' | 'python' | 'java' | 'go' | 'ruby';
type Environment = 'development' | 'staging' | 'production';

interface EnvVariable {
  key: string;
  description: string;
  example: string;
  required: boolean;
  category: EnvCategory;
  validation?: RegExp;
  format?: 'url' | 'boolean' | 'number' | 'string' | 'json';
  minLength?: number;
  maxLength?: number;
  getUrl?: string;
  getLabel?: string;
}

interface EcosystemPreset {
  name: string;
  icon: string;
  description: string;
  variables: EnvVariable[];
  files: { name: string; language: Framework; content: string }[];
}

const ENV_CATEGORIES: Record<EnvCategory, { label: string; icon: React.ReactNode; color: string }> = {
  database: { label: 'Database', icon: <Database size={16} />, color: 'text-blue-400' },
  api_keys: { label: 'API Keys', icon: <Key size={16} />, color: 'text-yellow-400' },
  auth: { label: 'Authentication', icon: <Lock size={16} />, color: 'text-green-400' },
  security: { label: 'Security', icon: <Shield size={16} />, color: 'text-red-400' },
  app_config: { label: 'App Config', icon: <Code size={16} />, color: 'text-purple-400' },
  services: { label: 'Services', icon: <Terminal size={16} />, color: 'text-cyan-400' },
  dev: { label: 'Development', icon: <Code size={16} />, color: 'text-gray-400' },
};

const ECOSYSTEM_PRESETS: Record<string, EcosystemPreset> = {
  bonding: {
    name: 'BONDING Game',
    icon: '⚛️',
    description: 'Multiplayer molecular bonding game with Three.js and Cloudflare Workers',
    variables: [
      { key: 'VITE_RELAY_URL', description: 'Cloudflare Worker relay endpoint', example: 'https://bonding-relay.your-account.workers.dev', required: true, category: 'services', format: 'url', getUrl: 'https://dash.cloudflare.com', getLabel: 'Cloudflare Dashboard' },
      { key: 'VITE_KV_NAMESPACE_ID', description: 'Cloudflare KV namespace for game state', example: 'abc123def456', required: true, category: 'services', getUrl: 'https://dash.cloudflare.com', getLabel: 'Workers & Pages > KV' },
      { key: 'VITE_TURNSTILE_SITE_KEY', description: 'Cloudflare Turnstile site key for bot protection', example: '0x4AAAAAA...', required: false, category: 'security', getUrl: 'https://dash.cloudflare.com', getLabel: 'Turnstile' },
      { key: 'VITE_ANALYTICS_ID', description: 'Cloudflare Web Analytics site tag', example: '123456789abcdef', required: false, category: 'services' },
    ],
    files: [
      { name: '.env', language: 'nodejs', content: '# BONDING Game Environment\nVITE_RELAY_URL=https://bonding-relay.your-account.workers.dev\nVITE_KV_NAMESPACE_ID=your-kv-namespace-id\nVITE_TURNSTILE_SITE_KEY=your-turnstile-site-key\nVITE_ANALYTICS_ID=your-analytics-id' },
    ],
  },
  spaceship_earth: {
    name: 'Spaceship Earth',
    icon: '🚀',
    description: 'Sovereign Mesh interface with WebGPU and cognitive shielding',
    variables: [
      { key: 'VITE_NODE_ZERO_URL', description: 'Node Zero mesh endpoint', example: 'wss://node-zero.local:8080', required: true, category: 'services', format: 'url' },
      { key: 'VITE_SOVREIGN_KEY', description: 'Sovereign identity private key', example: '0x...', required: true, category: 'security', minLength: 64 },
      { key: 'VITE_TELEMETRY_ENDPOINT', description: 'Telemetry collection endpoint', example: 'https://telemetry.p31.workers.dev', required: false, category: 'services', format: 'url' },
      { key: 'VITE_COGNITIVE_SHIELD_ENABLED', description: 'Enable cognitive shield', example: 'true', required: false, category: 'security', format: 'boolean' },
    ],
    files: [
      { name: '.env', language: 'nodejs', content: '# Spaceship Earth Environment\nVITE_NODE_ZERO_URL=wss://node-zero.local:8080\nVITE_SOVREIGN_KEY=your-sovereign-private-key\nVITE_TELEMETRY_ENDPOINT=https://telemetry.p31.workers.dev\nVITE_COGNITIVE_SHIELD_ENABLED=true' },
    ],
  },
  donate_api: {
    name: 'Donate API',
    icon: '💎',
    description: 'Stripe Checkout integration via Cloudflare Worker',
    variables: [
      { key: 'STRIPE_SECRET_KEY', description: 'Stripe API secret key (test/live)', example: 'sk_test_... or sk_live_...', required: true, category: 'api_keys', minLength: 20, getUrl: 'https://dashboard.stripe.com/apikeys', getLabel: 'Stripe Dashboard' },
      { key: 'STRIPE_PUBLISHABLE_KEY', description: 'Stripe publishable key', example: 'pk_test_... or pk_live_...', required: true, category: 'api_keys', minLength: 20, getUrl: 'https://dashboard.stripe.com/apikeys', getLabel: 'Stripe Dashboard' },
      { key: 'STRIPE_WEBHOOK_SECRET', description: 'Stripe webhook endpoint secret', example: 'whsec_...', required: true, category: 'security', minLength: 20 },
      { key: 'ALLOWED_ORIGINS', description: 'Comma-separated list of allowed CORS origins', example: 'https://phosphorus31.org,https://www.phosphorus31.org', required: true, category: 'security', format: 'url' },
      { key: 'SUCCESS_URL', description: 'Redirect URL after successful donation', example: 'https://phosphorus31.org/thank-you', required: true, category: 'app_config', format: 'url' },
      { key: 'CANCEL_URL', description: 'Redirect URL if donation cancelled', example: 'https://phosphorus31.org/donate', required: true, category: 'app_config', format: 'url' },
    ],
    files: [
      { name: '.env', language: 'nodejs', content: '# Donate API Environment\nSTRIPE_SECRET_KEY=sk_test_your_stripe_secret_key\nSTRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key\nSTRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret\nALLOWED_ORIGINS=https://phosphorus31.org,https://www.phosphorus31.org\nSUCCESS_URL=https://phosphorus31.org/thank-you\nCANCEL_URL=https://phosphorus31.org/donate' },
      { name: 'wrangler.toml', language: 'nodejs', content: 'name = "donate-api"\nmain = "src/worker.ts"\ncompatibility_date = "2024-01-01"\n\n[vars]\nSTRIPE_PUBLISHABLE_KEY = "pk_test_..."\nSUCCESS_URL = "https://phosphorus31.org/thank-you"\nCANCEL_URL = "https://phosphorus31.org/donate"\n\n[[env.production]]\nname = "donate-api-prod"' },
    ],
  },
  discord_bot: {
    name: 'Discord Bot',
    icon: '🤖',
    description: 'P31 Discord Bot for cognitive assistance and Spoon economy integration',
    variables: [
      { key: 'DISCORD_TOKEN', description: 'Discord bot token for authentication', example: 'your_discord_bot_token', required: true, category: 'api_keys', minLength: 50, getUrl: 'https://discord.com/developers/applications', getLabel: 'Discord Developer Portal' },
      { key: 'BOT_PREFIX', description: 'Command prefix for the bot', example: 'p31', required: true, category: 'app_config' },
      { key: 'BONDING_API_URL', description: 'API endpoint for BONDING game integration', example: 'https://bonding.p31ca.org/api', required: true, category: 'services', format: 'url' },
      { key: 'NODE_ONE_API_URL', description: 'API endpoint for Node One hardware', example: 'http://localhost:3001/api', required: false, category: 'services', format: 'url' },
      { key: 'SPOON_API_URL', description: 'API endpoint for Spoon economy', example: 'https://phosphorus31.org/api/spoons', required: false, category: 'services', format: 'url' },
      { key: 'TELEMETRY_API_URL', description: 'Telemetry collection endpoint', example: '', required: false, category: 'services', format: 'url' },
      { key: 'NODE_ONE_STATUS_URL', description: 'Status endpoint for Node One hardware', example: 'http://localhost:3001/status', required: false, category: 'services', format: 'url' },
      { key: 'RESPONSE_TIMEOUT_MS', description: 'API response timeout in milliseconds', example: '5000', required: false, category: 'app_config', format: 'number' },
      { key: 'BONDING_CHANNEL_ID', description: 'Discord channel ID for BONDING commands', example: '', required: false, category: 'app_config' },
      { key: 'NODE_ONE_CHANNEL_ID', description: 'Discord channel ID for Node One commands', example: '', required: false, category: 'app_config' },
      { key: 'ANNOUNCEMENTS_CHANNEL_ID', description: 'Discord channel ID for announcements', example: '', required: false, category: 'app_config' },
      { key: 'ENABLE_FAWN_DETECTION', description: 'Enable fawn response detection for cognitive safety', example: 'true', required: false, category: 'security', format: 'boolean' },
      { key: 'MAX_SPOON_DISPLAY', description: 'Maximum number of spoons to display in embed', example: '12', required: false, category: 'app_config', format: 'number' },
      { key: 'NODE_ONE_WEBHOOK_PORT', description: 'Port for Node One webhook server', example: '3000', required: false, category: 'services', format: 'number' },
    ],
    files: [
      { name: '.env', language: 'nodejs', content: '# Discord Bot Environment\nDISCORD_TOKEN=your_discord_bot_token\nBOT_PREFIX=p31\nBONDING_API_URL=https://bonding.p31ca.org/api\nNODE_ONE_API_URL=http://localhost:3001/api\nSPOON_API_URL=https://phosphorus31.org/api/spoons\nTELEMETRY_API_URL=\nNODE_ONE_STATUS_URL=http://localhost:3001/status\nRESPONSE_TIMEOUT_MS=5000\nBONDING_CHANNEL_ID=\nNODE_ONE_CHANNEL_ID=\nANNOUNCEMENTS_CHANNEL_ID=\nENABLE_FAWN_DETECTION=true\nMAX_SPOON_DISPLAY=12\nNODE_ONE_WEBHOOK_PORT=3000' },
    ],
  },
  nodejs: {
    name: 'Node.js / Express',
    icon: '🟢',
    description: 'Generic Node.js application with Express server',
    variables: [
      { key: 'NODE_ENV', description: 'Application environment mode', example: 'development', required: true, category: 'app_config' },
      { key: 'PORT', description: 'Server port number', example: '3000', required: true, category: 'app_config', format: 'number' },
      { key: 'DATABASE_URL', description: 'PostgreSQL connection string', example: 'postgresql://user:pass@localhost:5432/dbname', required: true, category: 'database', format: 'url' },
      { key: 'REDIS_URL', description: 'Redis connection string', example: 'redis://localhost:6379', required: false, category: 'database', format: 'url' },
      { key: 'JWT_SECRET', description: 'Secret key for JWT signing', example: 'your-super-secret-jwt-key-min-32-chars', required: true, category: 'auth', minLength: 32 },
      { key: 'JWT_EXPIRES_IN', description: 'JWT expiration time', example: '7d', required: false, category: 'auth' },
      { key: 'BCRYPT_ROUNDS', description: 'Number of bcrypt hashing rounds', example: '12', required: false, category: 'security', format: 'number' },
      { key: 'CORS_ORIGIN', description: 'Allowed CORS origin(s)', example: 'http://localhost:5173', required: true, category: 'security', format: 'url' },
      { key: 'RATE_LIMIT_WINDOW_MS', description: 'Rate limit window in milliseconds', example: '900000', required: false, category: 'security', format: 'number' },
      { key: 'RATE_LIMIT_MAX', description: 'Max requests per window', example: '100', required: false, category: 'security', format: 'number' },
      { key: 'LOG_LEVEL', description: 'Winston/Pino log level', example: 'debug', required: false, category: 'dev' },
      { key: 'API_KEY', description: 'Internal API authentication key', example: 'sk_live_...', required: false, category: 'api_keys', minLength: 20 },
    ],
    files: [
      { name: '.env', language: 'nodejs', content: '# Node.js Application Environment\nNODE_ENV=development\nPORT=3000\n\n# Database\nDATABASE_URL=postgresql://user:password@localhost:5432/myapp\nREDIS_URL=redis://localhost:6379\n\n# Authentication\nJWT_SECRET=your-super-secret-jwt-key-min-32-chars-long\nJWT_EXPIRES_IN=7d\nBCRYPT_ROUNDS=12\n\n# Security\nCORS_ORIGIN=http://localhost:5173\nRATE_LIMIT_WINDOW_MS=900000\nRATE_LIMIT_MAX=100\n\n# Development\nLOG_LEVEL=debug\nAPI_KEY=your-internal-api-key' },
    ],
  },
  python: {
    name: 'Python / Django',
    icon: '🐍',
    description: 'Python application with Django or FastAPI',
    variables: [
      { key: 'DJANGO_SETTINGS_MODULE', description: 'Django settings module path', example: 'myapp.settings.development', required: true, category: 'app_config' },
      { key: 'SECRET_KEY', description: 'Django secret key (use get_random_secret_key)', example: 'django-insecure-...', required: true, category: 'security', minLength: 50 },
      { key: 'DEBUG', description: 'Enable debug mode', example: 'True', required: true, category: 'dev', format: 'boolean' },
      { key: 'ALLOWED_HOSTS', description: 'Comma-separated allowed hosts', example: 'localhost,127.0.0.1', required: true, category: 'security' },
      { key: 'DATABASE_URL', description: 'PostgreSQL connection string', example: 'postgres://user:pass@localhost:5432/dbname', required: true, category: 'database', format: 'url' },
      { key: 'REDIS_URL', description: 'Redis connection string', example: 'redis://localhost:6379/0', required: false, category: 'database', format: 'url' },
      { key: 'CELERY_BROKER_URL', description: 'Celery message broker URL', example: 'redis://localhost:6379/0', required: false, category: 'services', format: 'url' },
      { key: 'EMAIL_BACKEND', description: 'Django email backend', example: 'django.core.mail.backends.smtp.EmailBackend', required: false, category: 'services' },
      { key: 'AWS_ACCESS_KEY_ID', description: 'AWS access key for S3', example: 'AKIA...', required: false, category: 'api_keys', getUrl: 'https://console.aws.amazon.com/iam', getLabel: 'AWS IAM' },
      { key: 'AWS_SECRET_ACCESS_KEY', description: 'AWS secret key', example: '...', required: false, category: 'api_keys' },
      { key: 'SENTRY_DSN', description: 'Sentry error tracking DSN', example: 'https://...', required: false, category: 'services', format: 'url' },
    ],
    files: [
      { name: '.env', language: 'python', content: '# Python/Django Environment\nDJANGO_SETTINGS_MODULE=myapp.settings.development\nSECRET_KEY=your-django-secret-key-here-minimum-50-characters-long-for-security\nDEBUG=True\nALLOWED_HOSTS=localhost,127.0.0.1,.localhost\n\n# Database\nDATABASE_URL=postgres://user:password@localhost:5432/myapp\nREDIS_URL=redis://localhost:6379/0\n\n# Task Queue\nCELERY_BROKER_URL=redis://localhost:6379/0\n\n# Email\nEMAIL_BACKEND=django.core.mail.backends.console.EmailBackend\n\n# AWS (optional)\nAWS_ACCESS_KEY_ID=your-aws-access-key\nAWS_SECRET_ACCESS_KEY=your-aws-secret-key\n\n# Monitoring\nSENTRY_DSN=https://your-sentry-dsn' },
    ],
  },
  java: {
    name: 'Java / Spring Boot',
    icon: '☕',
    description: 'Spring Boot application with typical Java stack',
    variables: [
      { key: 'SPRING_PROFILES_ACTIVE', description: 'Active Spring profiles', example: 'dev', required: true, category: 'app_config' },
      { key: 'SERVER_PORT', description: 'Server port', example: '8080', required: true, category: 'app_config', format: 'number' },
      { key: 'SPRING_DATASOURCE_URL', description: 'JDBC database URL', example: 'jdbc:postgresql://localhost:5432/mydb', required: true, category: 'database', format: 'url' },
      { key: 'SPRING_DATASOURCE_USERNAME', description: 'Database username', example: 'postgres', required: true, category: 'database' },
      { key: 'SPRING_DATASOURCE_PASSWORD', description: 'Database password', example: 'secret', required: true, category: 'database', minLength: 8 },
      { key: 'SPRING_JPA_HIBERNATE_DDL_AUTO', description: 'Hibernate DDL strategy', example: 'update', required: false, category: 'database' },
      { key: 'JWT_SECRET', description: 'JWT signing secret', example: 'your-secret-key-min-256-bits', required: true, category: 'auth', minLength: 32 },
      { key: 'JWT_EXPIRATION', description: 'JWT expiration in milliseconds', example: '86400000', required: false, category: 'auth', format: 'number' },
      { key: 'LOGGING_LEVEL_ROOT', description: 'Root logging level', example: 'INFO', required: false, category: 'dev' },
      { key: 'SPRING_REDIS_HOST', description: 'Redis server host', example: 'localhost', required: false, category: 'services' },
      { key: 'SPRING_REDIS_PORT', description: 'Redis server port', example: '6379', required: false, category: 'services', format: 'number' },
    ],
    files: [
      { name: '.env', language: 'java', content: '# Spring Boot Environment\nSPRING_PROFILES_ACTIVE=dev\nSERVER_PORT=8080\n\n# Database\nSPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/mydb\nSPRING_DATASOURCE_USERNAME=postgres\nSPRING_DATASOURCE_PASSWORD=your-database-password\nSPRING_JPA_HIBERNATE_DDL_AUTO=update\n\n# JWT\nJWT_SECRET=your-super-secret-jwt-key-min-32-characters\nJWT_EXPIRATION=86400000\n\n# Cache\nSPRING_REDIS_HOST=localhost\nSPRING_REDIS_PORT=6379\n\n# Logging\nLOGGING_LEVEL_ROOT=INFO' },
    ],
  },
  go: {
    name: 'Go / Gin',
    icon: '🐹',
    description: 'Go application with Gin framework',
    variables: [
      { key: 'APP_ENV', description: 'Application environment', example: 'development', required: true, category: 'app_config' },
      { key: 'PORT', description: 'Server port', example: '8080', required: true, category: 'app_config', format: 'number' },
      { key: 'DB_HOST', description: 'Database host', example: 'localhost', required: true, category: 'database' },
      { key: 'DB_PORT', description: 'Database port', example: '5432', required: true, category: 'database', format: 'number' },
      { key: 'DB_USER', description: 'Database user', example: 'postgres', required: true, category: 'database' },
      { key: 'DB_PASSWORD', description: 'Database password', example: 'secret', required: true, category: 'database', minLength: 8 },
      { key: 'DB_NAME', description: 'Database name', example: 'myapp', required: true, category: 'database' },
      { key: 'DB_SSL_MODE', description: 'PostgreSQL SSL mode', example: 'disable', required: false, category: 'database' },
      { key: 'JWT_SECRET', description: 'JWT secret key', example: 'your-secret-key', required: true, category: 'auth', minLength: 32 },
      { key: 'JWT_EXPIRY_HOURS', description: 'JWT expiry in hours', example: '24', required: false, category: 'auth', format: 'number' },
      { key: 'REDIS_ADDR', description: 'Redis address', example: 'localhost:6379', required: false, category: 'services' },
      { key: 'REDIS_PASSWORD', description: 'Redis password', example: '', required: false, category: 'services' },
      { key: 'GIN_MODE', description: 'Gin framework mode', example: 'debug', required: false, category: 'dev' },
    ],
    files: [
      { name: '.env', language: 'go', content: '# Go Application Environment\nAPP_ENV=development\nPORT=8080\n\n# Database\nDB_HOST=localhost\nDB_PORT=5432\nDB_USER=postgres\nDB_PASSWORD=your-database-password\nDB_NAME=myapp\nDB_SSL_MODE=disable\n\n# JWT\nJWT_SECRET=your-super-secret-jwt-key-min-32-characters\nJWT_EXPIRY_HOURS=24\n\n# Redis\nREDIS_ADDR=localhost:6379\nREDIS_PASSWORD=\n\n# Gin\nGIN_MODE=debug' },
    ],
  },
  ruby: {
    name: 'Ruby / Rails',
    icon: '💎',
    description: 'Ruby on Rails application',
    variables: [
      { key: 'RAILS_ENV', description: 'Rails environment', example: 'development', required: true, category: 'app_config' },
      { key: 'RACK_ENV', description: 'Rack environment', example: 'development', required: false, category: 'app_config' },
      { key: 'PORT', description: 'Server port', example: '3000', required: true, category: 'app_config', format: 'number' },
      { key: 'DATABASE_URL', description: 'Database URL', example: 'postgres://user:pass@localhost/myapp_development', required: true, category: 'database', format: 'url' },
      { key: 'SECRET_KEY_BASE', description: 'Rails secret key base', example: '...', required: true, category: 'security', minLength: 64 },
      { key: 'RAILS_MASTER_KEY', description: 'Rails master key for credentials', example: '...', required: false, category: 'security', minLength: 32 },
      { key: 'REDIS_URL', description: 'Redis URL', example: 'redis://localhost:6379/0', required: false, category: 'database', format: 'url' },
      { key: 'RAILS_LOG_TO_STDOUT', description: 'Log to stdout', example: 'true', required: false, category: 'dev', format: 'boolean' },
      { key: 'RAILS_SERVE_STATIC_FILES', description: 'Serve static files', example: 'true', required: false, category: 'dev', format: 'boolean' },
      { key: 'SMTP_ADDRESS', description: 'SMTP server address', example: 'smtp.gmail.com', required: false, category: 'services' },
      { key: 'SMTP_PORT', description: 'SMTP port', example: '587', required: false, category: 'services', format: 'number' },
      { key: 'SMTP_USERNAME', description: 'SMTP username', example: 'user@gmail.com', required: false, category: 'services' },
      { key: 'SMTP_PASSWORD', description: 'SMTP password', example: '...', required: false, category: 'services' },
    ],
    files: [
      { name: '.env', language: 'ruby', content: '# Ruby on Rails Environment\nRAILS_ENV=development\nRACK_ENV=development\nPORT=3000\n\n# Database\nDATABASE_URL=postgres://user:password@localhost/myapp_development\nSECRET_KEY_BASE=your-rails-secret-key-base-minimum-64-characters-for-encryption\nRAILS_MASTER_KEY=your-master-key-for-credentials\nREDIS_URL=redis://localhost:6379/0\n\n# Development\nRAILS_LOG_TO_STDOUT=true\nRAILS_SERVE_STATIC_FILES=true\n\n# Email\nSMTP_ADDRESS=smtp.gmail.com\nSMTP_PORT=587\nSMTP_USERNAME=your-email@gmail.com\nSMTP_PASSWORD=your-email-password' },
    ],
  },
};

const FRAMEWORK_SPECIFIC_VARS: Record<Framework, EnvVariable[]> = {
  nodejs: [
    { key: 'NPM_TOKEN', description: 'NPM auth token for private packages', example: 'npm_...', required: false, category: 'api_keys' },
    { key: 'YARN_TOKEN', description: 'Yarn auth token', example: '...', required: false, category: 'api_keys' },
  ],
  python: [
    { key: 'PYTHONPATH', description: 'Python module search path', example: '/app:/app/src', required: false, category: 'dev' },
    { key: 'PIP_INDEX_URL', description: 'Custom PyPI index URL', example: 'https://pypi.org/simple', required: false, category: 'dev', format: 'url' },
  ],
  java: [
    { key: 'JAVA_OPTS', description: 'JVM options', example: '-Xmx512m -XX:+UseG1GC', required: false, category: 'dev' },
    { key: 'MAVEN_OPTS', description: 'Maven options', example: '-Xmx1024m', required: false, category: 'dev' },
  ],
  go: [
    { key: 'GOPROXY', description: 'Go module proxy', example: 'https://proxy.golang.org,direct', required: false, category: 'dev', format: 'url' },
    { key: 'GO_ENV', description: 'Go environment', example: 'development', required: false, category: 'dev' },
  ],
  ruby: [
    { key: 'BUNDLE_PATH', description: 'Bundler install path', example: 'vendor/bundle', required: false, category: 'dev' },
    { key: 'GEM_HOME', description: 'Gem installation directory', example: '/usr/local/bundle', required: false, category: 'dev' },
  ],
};

export function EnvironmentGenerator() {
  const [selectedEcosystem, setSelectedEcosystem] = useState<string>('');
  const [selectedFramework, setSelectedFramework] = useState<Framework>('nodejs');
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>('development');
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'env' | 'github' | 'docker'>('env');
  const [showOptional, setShowOptional] = useState(true);

  const currentPreset = selectedEcosystem ? ECOSYSTEM_PRESETS[selectedEcosystem] : null;

  const allVariables = useMemo(() => {
    const vars: EnvVariable[] = [];
    if (currentPreset) {
      vars.push(...currentPreset.variables);
    }
    vars.push(...FRAMEWORK_SPECIFIC_VARS[selectedFramework]);
    return vars;
  }, [currentPreset, selectedFramework]);

  const groupedVariables = useMemo(() => {
    const groups: Record<EnvCategory, EnvVariable[]> = {
      database: [],
      api_keys: [],
      auth: [],
      security: [],
      app_config: [],
      services: [],
      dev: [],
    };
    allVariables.forEach(v => {
      if (showOptional || v.required) {
        groups[v.category].push(v);
      }
    });
    return groups;
  }, [allVariables, showOptional]);

  const validateValue = useCallback((variable: EnvVariable, value: string): string | null => {
    if (variable.required && !value) {
      return 'This field is required';
    }
    if (value && variable.minLength && value.length < variable.minLength) {
      return `Minimum ${variable.minLength} characters required`;
    }
    if (value && variable.format === 'url') {
      try {
        new URL(value);
      } catch {
        return 'Invalid URL format';
      }
    }
    if (value && variable.format === 'number' && isNaN(Number(value))) {
      return 'Must be a number';
    }
    if (value && variable.format === 'boolean' && !['true', 'false', '1', '0'].includes(value.toLowerCase())) {
      return 'Must be true/false, 1, or 0';
    }
    return null;
  }, []);

  const generateEnvContent = useCallback((): string => {
    const lines: string[] = [];
    lines.push(`# ${currentPreset?.name || selectedFramework.toUpperCase()} Environment`);
    lines.push(`# Environment: ${selectedEnvironment}`);
    lines.push(`# Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('#######################################');
    lines.push('# SECURITY WARNING:');
    lines.push('# - Never commit .env files to git');
    lines.push('# - Add .env to .gitignore');
    lines.push('# - Rotate leaked credentials immediately');
    lines.push('#######################################');
    lines.push('');

    Object.entries(groupedVariables).forEach(([category, vars]) => {
      if (vars.length === 0) return;
      lines.push(`# ${ENV_CATEGORIES[category as EnvCategory].label}`);
      lines.push('#' + '='.repeat(40));
      vars.forEach(v => {
        const value = values[v.key] || '';
        lines.push(`# ${v.description}`);
        if (v.required) {
          lines.push(`# REQUIRED`);
        } else {
          lines.push(`# Optional`);
        }
        lines.push(`${v.key}=${value || v.example}`);
        lines.push('');
      });
    });

    return lines.join('\n');
  }, [groupedVariables, values, currentPreset, selectedFramework, selectedEnvironment]);

  const generateGitHubCommands = useCallback((): string => {
    const commands: string[] = [];
    commands.push('# GitHub Actions Secrets Setup Commands');
    commands.push('# Run these in your terminal after setting up your repository');
    commands.push('');

    Object.values(groupedVariables).flat().forEach(v => {
      if (v.required && values[v.key]) {
        commands.push(`gh secret set ${v.key} --body "${values[v.key]}"`);
      }
    });

    return commands.join('\n');
  }, [groupedVariables, values]);

  const generateDockerEnv = useCallback((): string => {
    const lines: string[] = [];
    lines.push('# Docker Environment');
    lines.push('# Copy to docker-compose.yml or use with --env-file');
    lines.push('');

    Object.values(groupedVariables).flat().forEach(v => {
      const value = values[v.key] || v.example;
      lines.push(`${v.key}=${value}`);
    });

    return lines.join('\n');
  }, [groupedVariables, values]);

  const handleCopy = useCallback((content: string, label: string) => {
    navigator.clipboard.writeText(content);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const getContent = () => {
    switch (activeTab) {
      case 'env':
        return generateEnvContent();
      case 'github':
        return generateGitHubCommands();
      case 'docker':
        return generateDockerEnv();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Code className="text-white" size={24} />
            </div>
            <h1 className="text-3xl font-bold">P31 Environment Generator</h1>
          </div>
          <p className="text-gray-400">Zero-friction environment variable configuration</p>
        </div>

        {/* Configuration Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left: Selection */}
          <div className="space-y-6">
            {/* Ecosystem Selector */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-3">Ecosystem</label>
              <select
                value={selectedEcosystem}
                onChange={(e) => {
                  setSelectedEcosystem(e.target.value);
                  setValues({});
                }}
                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Select ecosystem...</option>
                <optgroup label="P31 Ecosystem">
                  <option value="bonding">⚛️ BONDING Game</option>
                  <option value="spaceship_earth">🚀 Spaceship Earth</option>
                  <option value="donate_api">💎 Donate API</option>
                  <option value="discord_bot">🤖 Discord Bot</option>
                </optgroup>
                <optgroup label="Generic Frameworks">
                  <option value="nodejs">🟢 Node.js / Express</option>
                  <option value="python">🐍 Python / Django</option>
                  <option value="java">☕ Java / Spring Boot</option>
                  <option value="go">🐹 Go / Gin</option>
                  <option value="ruby">💎 Ruby / Rails</option>
                </optgroup>
              </select>
              {currentPreset && (
                <p className="text-xs text-gray-400 mt-2">{currentPreset.description}</p>
              )}
            </div>

            {/* Framework Selector */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-3">Framework</label>
              <select
                value={selectedFramework}
                onChange={(e) => setSelectedFramework(e.target.value as Framework)}
                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="nodejs">Node.js / Express</option>
                <option value="python">Python / Django / FastAPI</option>
                <option value="java">Java / Spring Boot</option>
                <option value="go">Go / Gin</option>
                <option value="ruby">Ruby / Rails</option>
              </select>
            </div>

            {/* Environment Selector */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-3">Environment</label>
              <div className="flex gap-2">
                {(['development', 'staging', 'production'] as Environment[]).map((env) => (
                  <button
                    key={env}
                    onClick={() => setSelectedEnvironment(env)}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedEnvironment === env
                        ? env === 'production'
                          ? 'bg-red-600 text-white'
                          : 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {env.charAt(0).toUpperCase() + env.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOptional}
                  onChange={(e) => setShowOptional(e.target.checked)}
                  className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">Show optional variables</span>
              </label>
            </div>
          </div>

          {/* Middle: Variable Inputs */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Environment Variables</h2>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto space-y-6">
              {Object.entries(groupedVariables).map(([category, vars]) => {
                if (vars.length === 0) return null;
                const catInfo = ENV_CATEGORIES[category as EnvCategory];
                return (
                  <div key={category}>
                    <div className={`flex items-center gap-2 mb-3 ${catInfo.color}`}>
                      {catInfo.icon}
                      <span className="font-medium">{catInfo.label}</span>
                    </div>
                    <div className="space-y-3">
                      {vars.map((v) => {
                        const error = validateValue(v, values[v.key] || '');
                        return (
                          <div key={v.key} className="bg-gray-900 rounded-md p-3 border border-gray-700">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <code className="text-sm font-mono text-blue-400">{v.key}</code>
                                {v.required && (
                                  <span className="ml-2 text-xs text-red-400 font-medium">REQUIRED</span>
                                )}
                              </div>
                              {v.getUrl && (
                                <a
                                  href={v.getUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                                >
                                  {v.getLabel || 'Get Key'}
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mb-2">{v.description}</p>
                            <input
                              type="text"
                              value={values[v.key] || ''}
                              onChange={(e) => setValues({ ...values, [v.key]: e.target.value })}
                              placeholder={v.example}
                              className={`w-full bg-gray-800 border rounded-md px-3 py-2 text-sm font-mono ${
                                error && values[v.key]
                                  ? 'border-red-500 text-red-300'
                                  : 'border-gray-600 focus:border-blue-500'
                              }`}
                            />
                            {error && values[v.key] && (
                              <p className="text-xs text-red-400 mt-1">{error}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {Object.values(groupedVariables).flat().length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  Select an ecosystem to generate environment variables
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Output Panel */}
        {selectedEcosystem && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex gap-1">
                {(['env', 'github', 'docker'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {tab === 'env' && '.env File'}
                    {tab === 'github' && 'GitHub CLI'}
                    {tab === 'docker' && 'Docker'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleCopy(getContent(), 'content')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium transition-colors"
              >
                {copied === 'content' ? (
                  <>
                    <Check size={16} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="p-4 bg-gray-900 overflow-x-auto">
              <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
                {getContent()}
              </pre>
            </div>
          </div>
        )}

        {/* Security Footer */}
        <div className="mt-8 p-4 bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-700/50 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-red-300 mb-1">Security Best Practices</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Never commit <code>.env</code> files to version control - add them to <code>.gitignore</code></li>
                <li>• Rotate any credentials immediately if accidentally exposed</li>
                <li>• Use environment-specific secrets (never reuse production keys in dev)</li>
                <li>• Consider using a secrets manager (HashiCorp Vault, AWS Secrets Manager, 1Password)</li>
                <li>• Enable branch protection rules requiring reviews before deployment</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnvironmentGenerator;
