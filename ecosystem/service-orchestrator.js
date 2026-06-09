#!/usr/bin/env node

/**
 * P31 Ecosystem Service Orchestrator
 * Centralized service management and orchestration for the entire P31 ecosystem
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const https = require('https');

class EcosystemOrchestrator {
    constructor() {
        this.services = new Map();
        this.status = new Map();
        this.config = this.loadConfiguration();
    }

    /**
     * Load ecosystem configuration
     */
    loadConfiguration() {
        const configPath = path.join(__dirname, 'orchestrator-config.json');
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        
        return {
            services: {
                'discord-bot': {
                    path: 'discord',
                    script: 'oracle-bot.js',
                    port: 3000,
                    dependencies: [],
                    autoStart: true,
                    healthCheck: '/status'
                },
                'middleware': {
                    path: 'middleware',
                    script: 'kofi-github-bridge.js',
                    port: 3001,
                    dependencies: ['discord-bot'],
                    autoStart: true,
                    healthCheck: '/health'
                },
                'ipfs-manager': {
                    path: 'ipfs',
                    script: 'ipns-manager.js',
                    port: 3002,
                    dependencies: [],
                    autoStart: true,
                    healthCheck: '/status'
                },
                'analytics': {
                    path: 'analytics',
                    script: 'dashboard.js',
                    port: 3003,
                    dependencies: ['discord-bot', 'middleware'],
                    autoStart: true,
                    healthCheck: '/metrics'
                },
                'gamification': {
                    path: 'gamification',
                    script: 'achievement-service.js',
                    port: 3004,
                    dependencies: ['discord-bot'],
                    autoStart: true,
                    healthCheck: '/achievements'
                }
            },
            orchestration: {
                startupOrder: ['discord-bot', 'middleware', 'ipfs-manager', 'analytics', 'gamification'],
                shutdownOrder: ['gamification', 'analytics', 'ipfs-manager', 'middleware', 'discord-bot'],
                healthCheckInterval: 30000,
                restartAttempts: 3,
                restartDelay: 5000
            }
        };
    }

    /**
     * Start all services
     */
    async startAllServices() {
        console.log('🚀 Starting P31 Ecosystem Services...');
        console.log('=====================================\n');

        const startupOrder = this.config.orchestration.startupOrder;
        
        for (const serviceName of startupOrder) {
            try {
                await this.startService(serviceName);
                console.log(`✅ ${serviceName}: Started successfully`);
            } catch (error) {
                console.error(`❌ ${serviceName}: Failed to start - ${error.message}`);
                this.status.set(serviceName, { status: 'failed', error: error.message });
            }
        }

        // Wait for all services to be healthy
        await this.waitForAllServices();
        console.log('\n🎉 All services started successfully!');
    }

    /**
     * Start a specific service
     */
    async startService(serviceName) {
        const serviceConfig = this.config.services[serviceName];
        if (!serviceConfig) {
            throw new Error(`Service ${serviceName} not found in configuration`);
        }

        // Check dependencies
        for (const dep of serviceConfig.dependencies) {
            if (!this.isServiceHealthy(dep)) {
                throw new Error(`Dependency ${dep} is not healthy`);
            }
        }

        const servicePath = path.join(__dirname, serviceConfig.path);
        const scriptPath = path.join(servicePath, serviceConfig.script);
        
        if (!fs.existsSync(scriptPath)) {
            throw new Error(`Service script not found: ${scriptPath}`);
        }

        // Install dependencies if package.json exists
        const packagePath = path.join(servicePath, 'package.json');
        if (fs.existsSync(packagePath)) {
            await this.installDependencies(servicePath);
        }

        // Start the service
        const child = spawn('node', [scriptPath], {
            cwd: servicePath,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, NODE_ENV: 'production' }
        });

        this.services.set(serviceName, child);
        this.status.set(serviceName, {
            status: 'starting',
            pid: child.pid,
            startTime: new Date(),
            port: serviceConfig.port
        });

        // Set up service monitoring
        this.setupServiceMonitoring(serviceName, child, serviceConfig);

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (this.isServiceHealthy(serviceName)) {
                    resolve();
                } else {
                    reject(new Error('Service failed to become healthy'));
                }
            }, 10000);
        });
    }

    /**
     * Stop all services
     */
    async stopAllServices() {
        console.log('🛑 Stopping P31 Ecosystem Services...');
        console.log('=====================================\n');

        const shutdownOrder = this.config.orchestration.shutdownOrder;
        
        for (const serviceName of shutdownOrder) {
            try {
                await this.stopService(serviceName);
                console.log(`✅ ${serviceName}: Stopped successfully`);
            } catch (error) {
                console.error(`❌ ${serviceName}: Failed to stop - ${error.message}`);
            }
        }

        console.log('\n👋 All services stopped successfully!');
    }

    /**
     * Stop a specific service
     */
    async stopService(serviceName) {
        const child = this.services.get(serviceName);
        if (!child) {
            throw new Error(`Service ${serviceName} is not running`);
        }

        return new Promise((resolve, reject) => {
            child.on('exit', (code) => {
                this.services.delete(serviceName);
                this.status.delete(serviceName);
                resolve();
            });

            child.on('error', (error) => {
                reject(error);
            });

            child.kill('SIGTERM');
            
            // Force kill after 5 seconds if graceful shutdown fails
            setTimeout(() => {
                if (!child.killed) {
                    child.kill('SIGKILL');
                }
            }, 5000);
        });
    }

    /**
     * Install service dependencies
     */
    async installDependencies(servicePath) {
        return new Promise((resolve, reject) => {
            exec('npm install', { cwd: servicePath }, (error, stdout, stderr) => {
                if (error) {
                    console.warn(`⚠️  ${path.basename(servicePath)}: npm install failed`);
                    resolve(); // Don't fail the entire startup for dependency issues
                } else {
                    console.log(`📦 ${path.basename(servicePath)}: Dependencies installed`);
                    resolve();
                }
            });
        });
    }

    /**
     * Set up service monitoring
     */
    setupServiceMonitoring(serviceName, child, serviceConfig) {
        const healthCheckUrl = `http://localhost:${serviceConfig.port}${serviceConfig.healthCheck}`;
        const interval = this.config.orchestration.healthCheckInterval;

        const monitor = setInterval(async () => {
            try {
                const isHealthy = await this.performHealthCheck(healthCheckUrl);
                const currentStatus = this.status.get(serviceName);
                
                if (isHealthy) {
                    if (currentStatus.status !== 'healthy') {
                        console.log(`💚 ${serviceName}: Health check passed`);
                        this.status.set(serviceName, { ...currentStatus, status: 'healthy' });
                    }
                } else {
                    if (currentStatus.status !== 'unhealthy') {
                        console.log(`💔 ${serviceName}: Health check failed`);
                        this.status.set(serviceName, { ...currentStatus, status: 'unhealthy' });
                    }
                }
            } catch (error) {
                const currentStatus = this.status.get(serviceName);
                if (currentStatus.status !== 'error') {
                    console.log(`💥 ${serviceName}: Health check error - ${error.message}`);
                    this.status.set(serviceName, { ...currentStatus, status: 'error', error: error.message });
                }
            }
        }, interval);

        // Store monitor reference for cleanup
        this.status.get(serviceName).monitor = monitor;

        // Handle service exit
        child.on('exit', (code) => {
            const monitor = this.status.get(serviceName)?.monitor;
            if (monitor) clearInterval(monitor);
        });
    }

    /**
     * Perform health check
     */
    performHealthCheck(url) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname,
                method: 'GET',
                timeout: 5000
            };

            const req = https.request(options, (res) => {
                resolve(res.statusCode >= 200 && res.statusCode < 300);
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Health check timeout'));
            });

            req.end();
        });
    }

    /**
     * Check if service is healthy
     */
    isServiceHealthy(serviceName) {
        const status = this.status.get(serviceName);
        return status && status.status === 'healthy';
    }

    /**
     * Wait for all services to be healthy
     */
    async waitForAllServices() {
        const maxWaitTime = 60000;
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
            const allHealthy = this.config.orchestration.startupOrder.every(serviceName => 
                this.isServiceHealthy(serviceName)
            );

            if (allHealthy) {
                return;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        throw new Error('Timeout waiting for services to become healthy');
    }

    /**
     * Get service status
     */
    getServiceStatus() {
        const status = {};
        for (const [serviceName, serviceStatus] of this.status) {
            status[serviceName] = {
                ...serviceStatus,
                uptime: serviceStatus.startTime ? Date.now() - serviceStatus.startTime.getTime() : 0
            };
        }
        return status;
    }

    /**
     * Restart a service
     */
    async restartService(serviceName) {
        console.log(`🔄 Restarting ${serviceName}...`);
        await this.stopService(serviceName);
        await this.startService(serviceName);
        console.log(`✅ ${serviceName}: Restarted successfully`);
    }

    /**
     * Generate ecosystem status report
     */
    generateStatusReport() {
        const status = this.getServiceStatus();
        const report = {
            timestamp: new Date().toISOString(),
            services: status,
            summary: {
                total: Object.keys(status).length,
                healthy: Object.values(status).filter(s => s.status === 'healthy').length,
                starting: Object.values(status).filter(s => s.status === 'starting').length,
                unhealthy: Object.values(status).filter(s => s.status === 'unhealthy').length,
                error: Object.values(status).filter(s => s.status === 'error').length
            }
        };

        const reportPath = path.join(__dirname, 'ecosystem-status.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📄 Status report saved to: ${reportPath}`);

        return report;
    }

    /**
     * Save configuration
     */
    saveConfiguration() {
        const configPath = path.join(__dirname, 'orchestrator-config.json');
        fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
        console.log(`⚙️  Configuration saved to: ${configPath}`);
    }
}

// CLI interface
if (require.main === module) {
    const orchestrator = new EcosystemOrchestrator();

    const command = process.argv[2];

    switch (command) {
        case 'start':
            orchestrator.startAllServices().catch(console.error);
            break;
        case 'stop':
            orchestrator.stopAllServices().catch(console.error);
            break;
        case 'restart':
            const serviceName = process.argv[3];
            if (serviceName) {
                orchestrator.restartService(serviceName).catch(console.error);
            } else {
                orchestrator.stopAllServices()
                    .then(() => orchestrator.startAllServices())
                    .catch(console.error);
            }
            break;
        case 'status':
            const status = orchestrator.generateStatusReport();
            console.log('\n📊 Ecosystem Status:');
            console.log(`Total Services: ${status.summary.total}`);
            console.log(`Healthy: ${status.summary.healthy}`);
            console.log(`Starting: ${status.summary.starting}`);
            console.log(`Unhealthy: ${status.summary.unhealthy}`);
            console.log(`Error: ${status.summary.error}`);
            break;
        case 'save-config':
            orchestrator.saveConfiguration();
            break;
        default:
            console.log('Usage:');
            console.log('  node service-orchestrator.js start          - Start all services');
            console.log('  node service-orchestrator.js stop           - Stop all services');
            console.log('  node service-orchestrator.js restart [name] - Restart all services or specific service');
            console.log('  node service-orchestrator.js status         - Show service status');
            console.log('  node service-orchestrator.js save-config    - Save current configuration');
            break;
    }
}

module.exports = EcosystemOrchestrator;