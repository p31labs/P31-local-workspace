#!/usr/bin/env node

/**
 * P31 Ecosystem Routing Verification System
 * Comprehensive verification of all data flows, API endpoints, and service connections
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class EcosystemRoutingVerifier {
    constructor() {
        this.routes = new Map();
        this.verificationResults = {
            dataFlows: {},
            apiEndpoints: {},
            serviceConnections: {},
            environmentConfig: {},
            overall: { status: 'unknown', issues: [], warnings: [] }
        };
    }

    /**
     * Run comprehensive routing verification
     */
    async verifyAllRoutes() {
        console.log('🛣️  P31 Ecosystem Routing Verification');
        console.log('=====================================\n');

        // Verify data flows between services
        await this.verifyDataFlows();
        
        // Verify API endpoints and their configurations
        await this.verifyAPIEndpoints();
        
        // Verify service connections and dependencies
        await this.verifyServiceConnections();
        
        // Verify environment configuration
        await this.verifyEnvironmentConfig();
        
        // Generate routing verification report
        this.generateRoutingReport();
    }

    /**
     * Verify data flows between ecosystem components
     */
    async verifyDataFlows() {
        console.log('🔄 Verifying Data Flows...');

        const dataFlows = [
            {
                name: 'Discord Bot → Redis (User Data)',
                source: 'ecosystem/discord/oracle-bot.js',
                target: 'Redis (Upstash)',
                data: ['user profiles', 'spoons', 'karma', 'contributions'],
                verification: () => this.verifyDiscordRedisFlow()
            },
            {
                name: 'Middleware → GitHub API (Webhooks)',
                source: 'ecosystem/middleware/kofi-github-bridge.js',
                target: 'GitHub API',
                data: ['Ko-fi payments', 'user registrations', 'node counts'],
                verification: () => this.verifyMiddlewareGitHubFlow()
            },
            {
                name: 'IPFS Manager → IPFS Gateway (Content)',
                source: 'ecosystem/ipfs/ipns-manager.js',
                target: 'IPFS Gateway',
                data: ['encrypted content', 'CIDs', 'IPNS records'],
                verification: () => this.verifyIPFSFlow()
            },
            {
                name: 'Analytics → Data Sources (Metrics)',
                source: 'ecosystem/analytics/dashboard.js',
                target: 'Multiple sources',
                data: ['community metrics', 'usage statistics', 'performance data'],
                verification: () => this.verifyAnalyticsFlow()
            },
            {
                name: 'Gamification → Redis (Achievements)',
                source: 'ecosystem/gamification/achievement-service.js',
                target: 'Redis',
                data: ['achievements', 'larmor syncs', 'progress tracking'],
                verification: () => this.verifyGamificationFlow()
            }
        ];

        for (const flow of dataFlows) {
            try {
                const result = await flow.verification();
                this.verificationResults.dataFlows[flow.name] = result;
                
                if (result.status === 'success') {
                    console.log(`  ✅ ${flow.name}: ${result.message}`);
                } else {
                    console.log(`  ❌ ${flow.name}: ${result.message}`);
                    this.verificationResults.overall.issues.push(`${flow.name}: ${result.message}`);
                }
            } catch (error) {
                this.verificationResults.dataFlows[flow.name] = {
                    status: 'error',
                    message: error.message
                };
                console.log(`  ❌ ${flow.name}: Error - ${error.message}`);
                this.verificationResults.overall.issues.push(`${flow.name}: ${error.message}`);
            }
        }
    }

    /**
     * Verify API endpoints and their configurations
     */
    async verifyAPIEndpoints() {
        console.log('\n🌐 Verifying API Endpoints...');

        const endpoints = [
            {
                name: 'Discord Bot Commands',
                file: 'ecosystem/discord/oracle-bot.js',
                endpoints: ['/status', '/contribute-ion', '/larmor-sync', '/verify-tetrahedron', '/leaderboard', '/profile'],
                verification: () => this.verifyDiscordCommands()
            },
            {
                name: 'GitHub Webhook Handlers',
                file: 'ecosystem/middleware/kofi-github-bridge.js',
                endpoints: ['POST /webhook/kofi', 'POST /webhook/github'],
                verification: () => this.verifyWebhookEndpoints()
            },
            {
                name: 'IPFS API Integration',
                file: 'ecosystem/ipfs/ipns-manager.js',
                endpoints: ['POST /ipfs/pin', 'GET /ipfs/status', 'POST /ipns/update'],
                verification: () => this.verifyIPFSAPI()
            },
            {
                name: 'Analytics Dashboard',
                file: 'ecosystem/analytics/dashboard.js',
                endpoints: ['GET /metrics', 'GET /leaderboard', 'GET /status'],
                verification: () => this.verifyAnalyticsAPI()
            }
        ];

        for (const endpoint of endpoints) {
            try {
                const result = await endpoint.verification();
                this.verificationResults.apiEndpoints[endpoint.name] = result;
                
                if (result.status === 'success') {
                    console.log(`  ✅ ${endpoint.name}: ${result.message}`);
                } else {
                    console.log(`  ❌ ${endpoint.name}: ${result.message}`);
                    this.verificationResults.overall.issues.push(`${endpoint.name}: ${result.message}`);
                }
            } catch (error) {
                this.verificationResults.apiEndpoints[endpoint.name] = {
                    status: 'error',
                    message: error.message
                };
                console.log(`  ❌ ${endpoint.name}: Error - ${error.message}`);
                this.verificationResults.overall.issues.push(`${endpoint.name}: ${error.message}`);
            }
        }
    }

    /**
     * Verify service connections and dependencies
     */
    async verifyServiceConnections() {
        console.log('\n🔗 Verifying Service Connections...');

        const connections = [
            {
                name: 'Discord Bot Dependencies',
                services: ['discord.js', 'ioredis', 'dotenv'],
                verification: () => this.verifyDiscordDependencies()
            },
            {
                name: 'Middleware Dependencies',
                services: ['axios', 'express', 'crypto'],
                verification: () => this.verifyMiddlewareDependencies()
            },
            {
                name: 'IPFS Dependencies',
                services: ['ipfs-http-client', 'ipns'],
                verification: () => this.verifyIPFSDependencies()
            },
            {
                name: 'Analytics Dependencies',
                services: ['chart.js', 'd3.js', 'redis'],
                verification: () => this.verifyAnalyticsDependencies()
            },
            {
                name: 'Gamification Dependencies',
                services: ['crypto', 'redis', 'math.js'],
                verification: () => this.verifyGamificationDependencies()
            }
        ];

        for (const connection of connections) {
            try {
                const result = await connection.verification();
                this.verificationResults.serviceConnections[connection.name] = result;
                
                if (result.status === 'success') {
                    console.log(`  ✅ ${connection.name}: ${result.message}`);
                } else {
                    console.log(`  ⚠️  ${connection.name}: ${result.message}`);
                    this.verificationResults.overall.warnings.push(`${connection.name}: ${result.message}`);
                }
            } catch (error) {
                this.verificationResults.serviceConnections[connection.name] = {
                    status: 'error',
                    message: error.message
                };
                console.log(`  ❌ ${connection.name}: Error - ${error.message}`);
                this.verificationResults.overall.issues.push(`${connection.name}: ${error.message}`);
            }
        }
    }

    /**
     * Verify environment configuration
     */
    async verifyEnvironmentConfig() {
        console.log('\n⚙️  Verifying Environment Configuration...');

        const envChecks = [
            {
                name: 'Discord Environment Variables',
                file: 'ecosystem/discord/.env',
                vars: ['DISCORD_BOT_TOKEN', 'DISCORD_CLIENT_ID', 'UPSTASH_REDIS_URL'],
                verification: () => this.verifyDiscordEnv()
            },
            {
                name: 'Middleware Environment Variables',
                file: 'ecosystem/middleware/.env',
                vars: ['GITHUB_TOKEN', 'GITHUB_REPO', 'KOFI_WEBHOOK_SECRET'],
                verification: () => this.verifyMiddlewareEnv()
            },
            {
                name: 'IPFS Environment Variables',
                file: 'ecosystem/ipfs/.env',
                vars: ['IPFS_API_URL', 'IPFS_API_TOKEN', 'IPNS_KEY'],
                verification: () => this.verifyIPFSEnv()
            },
            {
                name: 'Analytics Environment Variables',
                file: 'ecosystem/analytics/.env',
                vars: ['REDIS_URL', 'METRICS_API_KEY', 'DASHBOARD_SECRET'],
                verification: () => this.verifyAnalyticsEnv()
            }
        ];

        for (const check of envChecks) {
            try {
                const result = await check.verification();
                this.verificationResults.environmentConfig[check.name] = result;
                
                if (result.status === 'success') {
                    console.log(`  ✅ ${check.name}: ${result.message}`);
                } else {
                    console.log(`  ⚠️  ${check.name}: ${result.message}`);
                    this.verificationResults.overall.warnings.push(`${check.name}: ${result.message}`);
                }
            } catch (error) {
                this.verificationResults.environmentConfig[check.name] = {
                    status: 'error',
                    message: error.message
                };
                console.log(`  ❌ ${check.name}: Error - ${error.message}`);
                this.verificationResults.overall.issues.push(`${check.name}: ${error.message}`);
            }
        }
    }

    // Individual verification methods

    async verifyDiscordRedisFlow() {
        // Check if Discord bot has Redis connection code
        const botPath = path.join(__dirname, 'discord', 'oracle-bot.js');
        if (!fs.existsSync(botPath)) {
            return { status: 'failed', message: 'Discord bot file not found' };
        }

        const botContent = fs.readFileSync(botPath, 'utf8');
        const hasRedis = botContent.includes('Redis') && botContent.includes('UPSTASH_REDIS_URL');
        const hasUserData = botContent.includes('getUserData') && botContent.includes('updateUser');
        
        if (hasRedis && hasUserData) {
            return {
                status: 'success',
                message: 'Discord bot properly configured for Redis data flow',
                details: { redisConfigured: hasRedis, userDataFlow: hasUserData }
            };
        } else {
            return {
                status: 'failed',
                message: 'Discord bot missing Redis configuration or user data flow',
                details: { redisConfigured: hasRedis, userDataFlow: hasUserData }
            };
        }
    }

    async verifyMiddlewareGitHubFlow() {
        const middlewarePath = path.join(__dirname, 'middleware', 'kofi-github-bridge.js');
        if (!fs.existsSync(middlewarePath)) {
            return { status: 'failed', message: 'Middleware file not found' };
        }

        const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
        const hasGitHubAPI = middlewareContent.includes('github.com/api') || middlewareContent.includes('octokit');
        const hasKoFiWebhook = middlewareContent.includes('kofi') && middlewareContent.includes('webhook');
        const hasDataProcessing = middlewareContent.includes('processKofiPayment') || middlewareContent.includes('updateUserRegistry');
        
        if (hasGitHubAPI && hasKoFiWebhook && hasDataProcessing) {
            return {
                status: 'success',
                message: 'Middleware properly configured for GitHub API flow',
                details: { githubAPI: hasGitHubAPI, kofiWebhook: hasKoFiWebhook, dataProcessing: hasDataProcessing }
            };
        } else {
            return {
                status: 'failed',
                message: 'Middleware missing GitHub API or Ko-fi webhook configuration',
                details: { githubAPI: hasGitHubAPI, kofiWebhook: hasKoFiWebhook, dataProcessing: hasDataProcessing }
            };
        }
    }

    async verifyIPFSFlow() {
        const ipfsPath = path.join(__dirname, 'ipfs', 'ipns-manager.js');
        if (!fs.existsSync(ipfsPath)) {
            return { status: 'failed', message: 'IPFS manager file not found' };
        }

        const ipfsContent = fs.readFileSync(ipfsPath, 'utf8');
        const hasIPFSClient = ipfsContent.includes('ipfs-http-client') || ipfsContent.includes('ipfs.create');
        const hasIPNS = ipfsContent.includes('ipns') || ipfsContent.includes('IPNS');
        const hasContentPinning = ipfsContent.includes('pin') || ipfsContent.includes('add');
        
        if (hasIPFSClient && hasIPNS && hasContentPinning) {
            return {
                status: 'success',
                message: 'IPFS manager properly configured for content flow',
                details: { ipfsClient: hasIPFSClient, ipnsConfigured: hasIPNS, contentPinning: hasContentPinning }
            };
        } else {
            return {
                status: 'failed',
                message: 'IPFS manager missing IPFS client or IPNS configuration',
                details: { ipfsClient: hasIPFSClient, ipnsConfigured: hasIPNS, contentPinning: hasContentPinning }
            };
        }
    }

    async verifyAnalyticsFlow() {
        const analyticsPath = path.join(__dirname, 'analytics', 'dashboard.js');
        if (!fs.existsSync(analyticsPath)) {
            return { status: 'failed', message: 'Analytics dashboard file not found' };
        }

        const analyticsContent = fs.readFileSync(analyticsPath, 'utf8');
        const hasDataSources = analyticsContent.includes('Redis') || analyticsContent.includes('database');
        const hasMetrics = analyticsContent.includes('metrics') || analyticsContent.includes('statistics');
        const hasVisualization = analyticsContent.includes('chart') || analyticsContent.includes('dashboard');
        
        if (hasDataSources && hasMetrics && hasVisualization) {
            return {
                status: 'success',
                message: 'Analytics dashboard properly configured for data flow',
                details: { dataSources: hasDataSources, metrics: hasMetrics, visualization: hasVisualization }
            };
        } else {
            return {
                status: 'failed',
                message: 'Analytics dashboard missing data sources or visualization components',
                details: { dataSources: hasDataSources, metrics: hasMetrics, visualization: hasVisualization }
            };
        }
    }

    async verifyGamificationFlow() {
        const gamificationPath = path.join(__dirname, 'gamification', 'achievement-service.js');
        if (!fs.existsSync(gamificationPath)) {
            return { status: 'failed', message: 'Gamification service file not found' };
        }

        const gamificationContent = fs.readFileSync(gamificationPath, 'utf8');
        const hasAchievements = gamificationContent.includes('achievement') || gamificationContent.includes('badge');
        const hasLarmorSync = gamificationContent.includes('larmor') || gamificationContent.includes('frequency');
        const hasRedisStorage = gamificationContent.includes('Redis') || gamificationContent.includes('storage');
        
        if (hasAchievements && hasLarmorSync && hasRedisStorage) {
            return {
                status: 'success',
                message: 'Gamification service properly configured for achievement flow',
                details: { achievements: hasAchievements, larmorSync: hasLarmorSync, redisStorage: hasRedisStorage }
            };
        } else {
            return {
                status: 'failed',
                message: 'Gamification service missing achievements or Larmor sync components',
                details: { achievements: hasAchievements, larmorSync: hasLarmorSync, redisStorage: hasRedisStorage }
            };
        }
    }

    async verifyDiscordCommands() {
        const botPath = path.join(__dirname, 'discord', 'oracle-bot.js');
        if (!fs.existsSync(botPath)) {
            return { status: 'failed', message: 'Discord bot file not found' };
        }

        const botContent = fs.readFileSync(botPath, 'utf8');
        const commands = ['/status', '/contribute-ion', '/larmor-sync', '/verify-tetrahedron', '/leaderboard', '/profile'];
        const foundCommands = commands.filter(cmd => botContent.includes(cmd));
        
        if (foundCommands.length === commands.length) {
            return {
                status: 'success',
                message: `All ${commands.length} Discord commands properly configured`,
                details: { commands: foundCommands }
            };
        } else {
            return {
                status: 'failed',
                message: `Missing commands: ${commands.filter(cmd => !foundCommands.includes(cmd)).join(', ')}`,
                details: { foundCommands, missingCommands: commands.filter(cmd => !foundCommands.includes(cmd)) }
            };
        }
    }

    async verifyWebhookEndpoints() {
        const middlewarePath = path.join(__dirname, 'middleware', 'kofi-github-bridge.js');
        if (!fs.existsSync(middlewarePath)) {
            return { status: 'failed', message: 'Middleware file not found' };
        }

        const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
        const hasKoFiWebhook = middlewareContent.includes('/webhook/kofi') || middlewareContent.includes('kofi-webhook');
        const hasGitHubWebhook = middlewareContent.includes('/webhook/github') || middlewareContent.includes('github-webhook');
        const hasWebhookHandler = middlewareContent.includes('express') || middlewareContent.includes('app.post');
        
        if (hasKoFiWebhook && hasGitHubWebhook && hasWebhookHandler) {
            return {
                status: 'success',
                message: 'Webhook endpoints properly configured',
                details: { kofiWebhook: hasKoFiWebhook, githubWebhook: hasGitHubWebhook, handler: hasWebhookHandler }
            };
        } else {
            return {
                status: 'failed',
                message: 'Missing webhook endpoints or handlers',
                details: { kofiWebhook: hasKoFiWebhook, githubWebhook: hasGitHubWebhook, handler: hasWebhookHandler }
            };
        }
    }

    async verifyIPFSAPI() {
        const ipfsPath = path.join(__dirname, 'ipfs', 'ipns-manager.js');
        if (!fs.existsSync(ipfsPath)) {
            return { status: 'failed', message: 'IPFS manager file not found' };
        }

        const ipfsContent = fs.readFileSync(ipfsPath, 'utf8');
        const hasPinEndpoint = ipfsContent.includes('/ipfs/pin') || ipfsContent.includes('pin.add');
        const hasStatusEndpoint = ipfsContent.includes('/ipfs/status') || ipfsContent.includes('status');
        const hasIPNSUpdate = ipfsContent.includes('/ipns/update') || ipfsContent.includes('ipns.publish');
        
        if (hasPinEndpoint && hasStatusEndpoint && hasIPNSUpdate) {
            return {
                status: 'success',
                message: 'IPFS API endpoints properly configured',
                details: { pinEndpoint: hasPinEndpoint, statusEndpoint: hasStatusEndpoint, ipnsUpdate: hasIPNSUpdate }
            };
        } else {
            return {
                status: 'failed',
                message: 'Missing IPFS API endpoints',
                details: { pinEndpoint: hasPinEndpoint, statusEndpoint: hasStatusEndpoint, ipnsUpdate: hasIPNSUpdate }
            };
        }
    }

    async verifyAnalyticsAPI() {
        const analyticsPath = path.join(__dirname, 'analytics', 'dashboard.js');
        if (!fs.existsSync(analyticsPath)) {
            return { status: 'failed', message: 'Analytics dashboard file not found' };
        }

        const analyticsContent = fs.readFileSync(analyticsPath, 'utf8');
        const hasMetricsEndpoint = analyticsContent.includes('/metrics') || analyticsContent.includes('getMetrics');
        const hasLeaderboardEndpoint = analyticsContent.includes('/leaderboard') || analyticsContent.includes('getLeaderboard');
        const hasStatusEndpoint = analyticsContent.includes('/status') || analyticsContent.includes('getStatus');
        
        if (hasMetricsEndpoint && hasLeaderboardEndpoint && hasStatusEndpoint) {
            return {
                status: 'success',
                message: 'Analytics API endpoints properly configured',
                details: { metricsEndpoint: hasMetricsEndpoint, leaderboardEndpoint: hasLeaderboardEndpoint, statusEndpoint: hasStatusEndpoint }
            };
        } else {
            return {
                status: 'failed',
                message: 'Missing analytics API endpoints',
                details: { metricsEndpoint: hasMetricsEndpoint, leaderboardEndpoint: hasLeaderboardEndpoint, statusEndpoint: hasStatusEndpoint }
            };
        }
    }

    async verifyDiscordDependencies() {
        const packagePath = path.join(__dirname, 'discord', 'package.json');
        if (!fs.existsSync(packagePath)) {
            return { status: 'failed', message: 'Discord package.json not found' };
        }

        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const requiredDeps = ['discord.js', 'ioredis', 'dotenv'];
        const foundDeps = requiredDeps.filter(dep => pkg.dependencies && pkg.dependencies[dep]);
        
        if (foundDeps.length === requiredDeps.length) {
            return {
                status: 'success',
                message: 'All Discord dependencies properly configured',
                details: { dependencies: foundDeps }
            };
        } else {
            return {
                status: 'warning',
                message: `Missing dependencies: ${requiredDeps.filter(dep => !foundDeps.includes(dep)).join(', ')}`,
                details: { foundDependencies: foundDeps, missingDependencies: requiredDeps.filter(dep => !foundDeps.includes(dep)) }
            };
        }
    }

    async verifyMiddlewareDependencies() {
        const packagePath = path.join(__dirname, 'middleware', 'package.json');
        if (!fs.existsSync(packagePath)) {
            return { status: 'failed', message: 'Middleware package.json not found' };
        }

        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const requiredDeps = ['axios', 'express', 'crypto'];
        const foundDeps = requiredDeps.filter(dep => pkg.dependencies && pkg.dependencies[dep]);
        
        if (foundDeps.length === requiredDeps.length) {
            return {
                status: 'success',
                message: 'All middleware dependencies properly configured',
                details: { dependencies: foundDeps }
            };
        } else {
            return {
                status: 'warning',
                message: `Missing dependencies: ${requiredDeps.filter(dep => !foundDeps.includes(dep)).join(', ')}`,
                details: { foundDependencies: foundDeps, missingDependencies: requiredDeps.filter(dep => !foundDeps.includes(dep)) }
            };
        }
    }

    async verifyIPFSDependencies() {
        const packagePath = path.join(__dirname, 'ipfs', 'package.json');
        if (!fs.existsSync(packagePath)) {
            return { status: 'failed', message: 'IPFS package.json not found' };
        }

        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const requiredDeps = ['ipfs-http-client', 'ipns'];
        const foundDeps = requiredDeps.filter(dep => pkg.dependencies && pkg.dependencies[dep]);
        
        if (foundDeps.length === requiredDeps.length) {
            return {
                status: 'success',
                message: 'All IPFS dependencies properly configured',
                details: { dependencies: foundDeps }
            };
        } else {
            return {
                status: 'warning',
                message: `Missing dependencies: ${requiredDeps.filter(dep => !foundDeps.includes(dep)).join(', ')}`,
                details: { foundDependencies: foundDeps, missingDependencies: requiredDeps.filter(dep => !foundDeps.includes(dep)) }
            };
        }
    }

    async verifyAnalyticsDependencies() {
        const packagePath = path.join(__dirname, 'analytics', 'package.json');
        if (!fs.existsSync(packagePath)) {
            return { status: 'failed', message: 'Analytics package.json not found' };
        }

        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const requiredDeps = ['chart.js', 'd3.js', 'redis'];
        const foundDeps = requiredDeps.filter(dep => pkg.dependencies && pkg.dependencies[dep]);
        
        if (foundDeps.length === requiredDeps.length) {
            return {
                status: 'success',
                message: 'All analytics dependencies properly configured',
                details: { dependencies: foundDeps }
            };
        } else {
            return {
                status: 'warning',
                message: `Missing dependencies: ${requiredDeps.filter(dep => !foundDeps.includes(dep)).join(', ')}`,
                details: { foundDependencies: foundDeps, missingDependencies: requiredDeps.filter(dep => !foundDeps.includes(dep)) }
            };
        }
    }

    async verifyGamificationDependencies() {
        const packagePath = path.join(__dirname, 'gamification', 'package.json');
        if (!fs.existsSync(packagePath)) {
            return { status: 'failed', message: 'Gamification package.json not found' };
        }

        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const requiredDeps = ['crypto', 'redis', 'math.js'];
        const foundDeps = requiredDeps.filter(dep => pkg.dependencies && pkg.dependencies[dep]);
        
        if (foundDeps.length === requiredDeps.length) {
            return {
                status: 'success',
                message: 'All gamification dependencies properly configured',
                details: { dependencies: foundDeps }
            };
        } else {
            return {
                status: 'warning',
                message: `Missing dependencies: ${requiredDeps.filter(dep => !foundDeps.includes(dep)).join(', ')}`,
                details: { foundDependencies: foundDeps, missingDependencies: requiredDeps.filter(dep => !foundDeps.includes(dep)) }
            };
        }
    }

    async verifyDiscordEnv() {
        const envPath = path.join(__dirname, 'discord', '.env');
        if (!fs.existsSync(envPath)) {
            return { status: 'failed', message: 'Discord .env file not found' };
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const requiredVars = ['DISCORD_BOT_TOKEN', 'DISCORD_CLIENT_ID', 'UPSTASH_REDIS_URL'];
        const foundVars = requiredVars.filter(varName => envContent.includes(varName));
        
        if (foundVars.length === requiredVars.length) {
            return {
                status: 'success',
                message: 'All Discord environment variables properly configured',
                details: { variables: foundVars }
            };
        } else {
            return {
                status: 'failed',
                message: `Missing environment variables: ${requiredVars.filter(varName => !foundVars.includes(varName)).join(', ')}`,
                details: { foundVariables: foundVars, missingVariables: requiredVars.filter(varName => !foundVars.includes(varName)) }
            };
        }
    }

    async verifyMiddlewareEnv() {
        const envPath = path.join(__dirname, 'middleware', '.env');
        if (!fs.existsSync(envPath)) {
            return { status: 'warning', message: 'Middleware .env file not found (may use system env)' };
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const requiredVars = ['GITHUB_TOKEN', 'GITHUB_REPO', 'KOFI_WEBHOOK_SECRET'];
        const foundVars = requiredVars.filter(varName => envContent.includes(varName));
        
        if (foundVars.length === requiredVars.length) {
            return {
                status: 'success',
                message: 'All middleware environment variables properly configured',
                details: { variables: foundVars }
            };
        } else {
            return {
                status: 'warning',
                message: `Missing environment variables: ${requiredVars.filter(varName => !foundVars.includes(varName)).join(', ')}`,
                details: { foundVariables: foundVars, missingVariables: requiredVars.filter(varName => !foundVars.includes(varName)) }
            };
        }
    }

    async verifyIPFSEnv() {
        const envPath = path.join(__dirname, 'ipfs', '.env');
        if (!fs.existsSync(envPath)) {
            return { status: 'warning', message: 'IPFS .env file not found (may use system env)' };
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const requiredVars = ['IPFS_API_URL', 'IPFS_API_TOKEN', 'IPNS_KEY'];
        const foundVars = requiredVars.filter(varName => envContent.includes(varName));
        
        if (foundVars.length === requiredVars.length) {
            return {
                status: 'success',
                message: 'All IPFS environment variables properly configured',
                details: { variables: foundVars }
            };
        } else {
            return {
                status: 'warning',
                message: `Missing environment variables: ${requiredVars.filter(varName => !foundVars.includes(varName)).join(', ')}`,
                details: { foundVariables: foundVars, missingVariables: requiredVars.filter(varName => !foundVars.includes(varName)) }
            };
        }
    }

    async verifyAnalyticsEnv() {
        const envPath = path.join(__dirname, 'analytics', '.env');
        if (!fs.existsSync(envPath)) {
            return { status: 'warning', message: 'Analytics .env file not found (may use system env)' };
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const requiredVars = ['REDIS_URL', 'METRICS_API_KEY', 'DASHBOARD_SECRET'];
        const foundVars = requiredVars.filter(varName => envContent.includes(varName));
        
        if (foundVars.length === requiredVars.length) {
            return {
                status: 'success',
                message: 'All analytics environment variables properly configured',
                details: { variables: foundVars }
            };
        } else {
            return {
                status: 'warning',
                message: `Missing environment variables: ${requiredVars.filter(varName => !foundVars.includes(varName)).join(', ')}`,
                details: { foundVariables: foundVars, missingVariables: requiredVars.filter(varName => !foundVars.includes(varName)) }
            };
        }
    }

    /**
     * Generate comprehensive routing verification report
     */
    generateRoutingReport() {
        console.log('\n📊 Routing Verification Report');
        console.log('===============================');

        // Calculate overall status
        const hasIssues = this.verificationResults.overall.issues.length > 0;
        const hasWarnings = this.verificationResults.overall.warnings.length > 0;

        if (hasIssues) {
            this.verificationResults.overall.status = 'failed';
        } else if (hasWarnings) {
            this.verificationResults.overall.status = 'warning';
        } else {
            this.verificationResults.overall.status = 'success';
        }

        console.log(`\n🎯 Overall Status: ${this.getStatusEmoji(this.verificationResults.overall.status)} ${this.verificationResults.overall.status.toUpperCase()}`);

        if (this.verificationResults.overall.issues.length > 0) {
            console.log('\n❌ Critical Issues:');
            this.verificationResults.overall.issues.forEach(issue => console.log(`   • ${issue}`));
        }

        if (this.verificationResults.overall.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            this.verificationResults.overall.warnings.forEach(warning => console.log(`   • ${warning}`));
        }

        // Data flow status summary
        console.log('\n🔄 Data Flow Status:');
        Object.entries(this.verificationResults.dataFlows).forEach(([name, result]) => {
            console.log(`   ${this.getStatusEmoji(result.status)} ${name}: ${result.status}`);
        });

        // API endpoint status summary
        console.log('\n🌐 API Endpoint Status:');
        Object.entries(this.verificationResults.apiEndpoints).forEach(([name, result]) => {
            console.log(`   ${this.getStatusEmoji(result.status)} ${name}: ${result.status}`);
        });

        // Service connection status summary
        console.log('\n🔗 Service Connection Status:');
        Object.entries(this.verificationResults.serviceConnections).forEach(([name, result]) => {
            console.log(`   ${this.getStatusEmoji(result.status)} ${name}: ${result.status}`);
        });

        // Environment configuration status summary
        console.log('\n⚙️  Environment Configuration Status:');
        Object.entries(this.verificationResults.environmentConfig).forEach(([name, result]) => {
            console.log(`   ${this.getStatusEmoji(result.status)} ${name}: ${result.status}`);
        });

        // Save detailed report
        const reportPath = path.join(__dirname, 'routing-verification-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.verificationResults, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);

        // Save summary report
        const summaryPath = path.join(__dirname, 'routing-verification-summary.md');
        const summary = this.generateRoutingSummaryMarkdown();
        fs.writeFileSync(summaryPath, summary);
        console.log(`📄 Summary report saved to: ${summaryPath}`);
    }

    /**
     * Generate routing verification summary markdown
     */
    generateRoutingSummaryMarkdown() {
        const timestamp = new Date().toISOString();
        const status = this.verificationResults.overall.status;
        const issuesCount = this.verificationResults.overall.issues.length;
        const warningsCount = this.verificationResults.overall.warnings.length;

        return `# P31 Ecosystem Routing Verification Report

**Generated:** ${timestamp}
**Overall Status:** ${status.toUpperCase()}
**Issues:** ${issuesCount}
**Warnings:** ${warningsCount}

## Data Flow Status

${Object.entries(this.verificationResults.dataFlows).map(([name, result]) => 
    `- ${this.getStatusEmoji(result.status)} **${name}**: ${result.status}`
).join('\n')}

## API Endpoint Status

${Object.entries(this.verificationResults.apiEndpoints).map(([name, result]) => 
    `- ${this.getStatusEmoji(result.status)} **${name}**: ${result.status}`
).join('\n')}

## Service Connection Status

${Object.entries(this.verificationResults.serviceConnections).map(([name, result]) => 
    `- ${this.getStatusEmoji(result.status)} **${name}**: ${result.status}`
).join('\n')}

## Environment Configuration Status

${Object.entries(this.verificationResults.environmentConfig).map(([name, result]) => 
    `- ${this.getStatusEmoji(result.status)} **${name}**: ${result.status}`
).join('\n')}

## Issues

${this.verificationResults.overall.issues.length > 0 ? 
    this.verificationResults.overall.issues.map(issue => `- ❌ ${issue}`).join('\n') : 
    '- None'
}

## Warnings

${this.verificationResults.overall.warnings.length > 0 ? 
    this.verificationResults.overall.warnings.map(warning => `- ⚠️  ${warning}`).join('\n') : 
    '- None'
}

## Routing Recommendations

${this.generateRoutingRecommendations()}
`;
    }

    /**
     * Generate routing recommendations based on verification results
     */
    generateRoutingRecommendations() {
        const recommendations = [];

        if (this.verificationResults.overall.issues.length > 0) {
            recommendations.push('🚨 **CRITICAL**: Address all routing issues before proceeding with deployment.');
        }

        if (this.verificationResults.overall.warnings.length > 0) {
            recommendations.push('⚠️  **WARNING**: Review and address routing warnings for optimal performance.');
        }

        // Check for specific routing issues
        const dataFlowIssues = Object.values(this.verificationResults.dataFlows).filter(r => r.status !== 'success');
        if (dataFlowIssues.length > 0) {
            recommendations.push('🔄 **DATA FLOWS**: Verify data flow configurations between services.');
        }

        const apiIssues = Object.values(this.verificationResults.apiEndpoints).filter(r => r.status !== 'success');
        if (apiIssues.length > 0) {
            recommendations.push('🌐 **API ENDPOINTS**: Check API endpoint configurations and accessibility.');
        }

        const envIssues = Object.values(this.verificationResults.environmentConfig).filter(r => r.status !== 'success');
        if (envIssues.length > 0) {
            recommendations.push('⚙️  **ENVIRONMENT**: Set up all required environment variables for proper routing.');
        }

        if (recommendations.length === 0) {
            recommendations.push('✅ All routing configurations are optimal. Ready for deployment.');
        }

        return recommendations.join('\n');
    }

    /**
     * Get emoji for status
     */
    getStatusEmoji(status) {
        switch (status) {
            case 'success': return '✅';
            case 'warning': return '⚠️ ';
            case 'failed': return '❌';
            case 'error': return '💥';
            default: return '❓';
        }
    }
}

// Run the routing verification if this script is executed directly
if (require.main === module) {
    const verifier = new EcosystemRoutingVerifier();
    verifier.verifyAllRoutes().catch(console.error);
}

module.exports = EcosystemRoutingVerifier;