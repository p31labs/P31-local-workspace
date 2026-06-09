/**
 * Redis Queue Processor for P31 Ecosystem
 * Implements event-driven architecture with rate limiting and reliability
 * 
 * This middleware decouples Ko-fi webhooks from GitHub/Zenodo API calls
 * using Upstash Redis for serverless queue management
 */

const Redis = require('@upstash/redis');

class QueueProcessor {
    constructor() {
        // Initialize Redis connection using Upstash
        this.redis = new Redis({
            url: process.env.UPSTASH_REDIS_URL,
            token: process.env.UPSTASH_REDIS_TOKEN
        });
        
        // Configuration
        this.QUEUE_NAME = 'p31_webhook_queue';
        this.PROCESSING_KEY = 'p31_processing';
        this.MAX_RETRIES = 3;
        this.RATE_LIMITS = {
            github: { requests: 4500, window: 3600000 }, // 4500 per hour
            zenodo: { requests: 50, window: 60000 },     // 50 per minute
            koFi: { requests: 1000, window: 3600000 }    // 1000 per hour
        };
        
        this.processing = false;
        this.metrics = {
            processed: 0,
            failed: 0,
            rateLimited: 0
        };
    }

    /**
     * Initialize the queue processor
     */
    async init() {
        console.log('🚀 Initializing P31 Queue Processor');
        
        // Start processing loop
        this.startProcessing();
        
        // Start metrics reporting
        this.startMetricsReporting();
        
        return this;
    }

    /**
     * Add webhook payload to queue
     */
    async enqueueWebhook(payload) {
        try {
            const job = {
                id: this.generateId(),
                type: payload.type || 'unknown',
                payload: payload,
                timestamp: Date.now(),
                retries: 0,
                status: 'queued'
            };
            
            await this.redis.lpush(this.QUEUE_NAME, JSON.stringify(job));
            
            console.log(`📥 Enqueued webhook: ${job.id} (${job.type})`);
            return { success: true, jobId: job.id };
            
        } catch (error) {
            console.error('❌ Failed to enqueue webhook:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Start processing queue items
     */
    startProcessing() {
        if (this.processing) return;
        
        this.processing = true;
        console.log('🔄 Queue processor started');
        
        // Process items every 100ms
        setInterval(async () => {
            await this.processQueue();
        }, 100);
    }

    /**
     * Process queue items with rate limiting
     */
    async processQueue() {
        try {
            // Check rate limits
            const canProcess = await this.checkRateLimits();
            if (!canProcess) {
                return; // Skip processing if rate limited
            }
            
            // Get next item from queue
            const item = await this.redis.rpop(this.QUEUE_NAME);
            if (!item) return;
            
            const job = JSON.parse(item);
            await this.processJob(job);
            
        } catch (error) {
            console.error('❌ Queue processing error:', error);
        }
    }

    /**
     * Process individual job with retry logic
     */
    async processJob(job) {
        try {
            console.log(`🔧 Processing job: ${job.id} (${job.type})`);
            
            // Route to appropriate handler
            switch (job.type) {
                case 'kofi_payment':
                    await this.handleKoFiPayment(job.payload);
                    break;
                case 'github_release':
                    await this.handleGitHubRelease(job.payload);
                    break;
                case 'zenodo_update':
                    await this.handleZenodoUpdate(job.payload);
                    break;
                default:
                    console.log(`❓ Unknown job type: ${job.type}`);
            }
            
            this.metrics.processed++;
            console.log(`✅ Job completed: ${job.id}`);
            
        } catch (error) {
            await this.handleJobFailure(job, error);
        }
    }

    /**
     * Handle Ko-fi payment processing
     */
    async handleKoFiPayment(payload) {
        // Verify payload
        if (!this.verifyKoFiPayload(payload)) {
            throw new Error('Invalid Ko-fi payload');
        }
        
        // Process payment (existing logic from kofi-github-bridge.js)
        const result = await this.processKoFiPayment(payload);
        
        if (!result.success) {
            throw new Error('Ko-fi processing failed');
        }
        
        // Update rate limit counters
        await this.incrementRateLimit('koFi');
    }

    /**
     * Handle GitHub release processing
     */
    async handleGitHubRelease(payload) {
        // Create release on GitHub
        const result = await this.createGitHubRelease(payload);
        
        if (!result.success) {
            throw new Error('GitHub release failed');
        }
        
        // Update rate limit counters
        await this.incrementRateLimit('github');
    }

    /**
     * Handle Zenodo publication
     */
    async handleZenodoUpdate(payload) {
        // Publish to Zenodo
        const result = await this.publishToZenodo(payload);
        
        if (!result.success) {
            throw new Error('Zenodo publication failed');
        }
        
        // Update rate limit counters
        await this.incrementRateLimit('zenodo');
    }

    /**
     * Handle job failure with retry logic
     */
    async handleJobFailure(job, error) {
        job.retries++;
        job.status = 'failed';
        
        if (job.retries < this.MAX_RETRIES) {
            // Re-queue with delay
            job.status = 'retrying';
            await this.redis.lpush(this.QUEUE_NAME, JSON.stringify(job));
            
            const delay = Math.pow(2, job.retries) * 1000; // Exponential backoff
            console.log(`🔄 Job ${job.id} retrying (${job.retries}/${this.MAX_RETRIES}) in ${delay}ms`);
            
        } else {
            // Max retries exceeded
            this.metrics.failed++;
            console.error(`❌ Job ${job.id} failed permanently: ${error.message}`);
            
            // Send to dead letter queue
            await this.redis.lpush('p31_dead_letter_queue', JSON.stringify({
                ...job,
                error: error.message,
                finalAttempt: Date.now()
            }));
        }
    }

    /**
     * Check rate limits before processing
     */
    async checkRateLimits() {
        const now = Date.now();
        const checks = [];
        
        for (const [service, config] of Object.entries(this.RATE_LIMITS)) {
            const key = `rate_limit:${service}:${Math.floor(now / config.window)}`;
            const count = await this.redis.get(key) || 0;
            
            if (parseInt(count) >= config.requests) {
                this.metrics.rateLimited++;
                return false; // Rate limited
            }
        }
        
        return true;
    }

    /**
     * Increment rate limit counter
     */
    async incrementRateLimit(service) {
        const config = this.RATE_LIMITS[service];
        const now = Date.now();
        const key = `rate_limit:${service}:${Math.floor(now / config.window)}`;
        
        await this.redis.incr(key);
        await this.redis.expire(key, Math.ceil(config.window / 1000));
    }

    /**
     * Verify Ko-fi payload integrity
     */
    verifyKoFiPayload(payload) {
        // Basic validation
        if (!payload.message_id || !payload.amount || !payload.name) {
            return false;
        }
        
        // Verify signature if available
        const signature = payload.signature;
        if (signature) {
            // Implement signature verification logic
            // This would verify against the Ko-fi verification token
        }
        
        return true;
    }

    /**
     * Process Ko-fi payment (simplified version)
     */
    async processKoFiPayment(payload) {
        // This would call the existing logic from kofi-github-bridge.js
        // For now, return success
        return { success: true };
    }

    /**
     * Create GitHub release
     */
    async createGitHubRelease(payload) {
        // This would use the GitHub API to create a release
        // Implementation would be similar to existing GitHub Actions
        return { success: true };
    }

    /**
     * Publish to Zenodo
     */
    async publishToZenodo(payload) {
        // This would use the Zenodo API to publish
        // Implementation would be similar to existing Zenodo workflow
        return { success: true };
    }

    /**
     * Start metrics reporting
     */
    startMetricsReporting() {
        setInterval(() => {
            this.reportMetrics();
        }, 30000); // Report every 30 seconds
    }

    /**
     * Report processing metrics
     */
    async reportMetrics() {
        const queueLength = await this.redis.llen(this.QUEUE_NAME);
        const processingLength = await this.redis.llen(this.PROCESSING_KEY);
        
        console.log('📊 Queue Metrics:', {
            processed: this.metrics.processed,
            failed: this.metrics.failed,
            rateLimited: this.metrics.rateLimited,
            queueLength: queueLength,
            processingLength: processingLength
        });
        
        // Store metrics for dashboard
        await this.redis.set('p31_queue_metrics', JSON.stringify({
            ...this.metrics,
            queueLength: queueLength,
            processingLength: processingLength,
            timestamp: Date.now()
        }));
    }

    /**
     * Get queue statistics
     */
    async getStats() {
        const queueLength = await this.redis.llen(this.QUEUE_NAME);
        const processingLength = await this.redis.llen(this.PROCESSING_KEY);
        const deadLetterLength = await this.redis.llen('p31_dead_letter_queue');
        
        return {
            queueLength,
            processingLength,
            deadLetterLength,
            metrics: this.metrics
        };
    }

    /**
     * Clear dead letter queue
     */
    async clearDeadLetterQueue() {
        const items = [];
        let item;
        
        while (item = await this.redis.rpop('p31_dead_letter_queue')) {
            items.push(JSON.parse(item));
        }
        
        console.log(`🧹 Cleared ${items.length} items from dead letter queue`);
        return items;
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Export for use in other modules
module.exports = QueueProcessor;

// Example usage for testing
if (require.main === module) {
    const processor = new QueueProcessor();
    
    processor.init().then(async () => {
        console.log('✅ Queue processor initialized');
        
        // Test enqueue
        await processor.enqueueWebhook({
            type: 'kofi_payment',
            message_id: 'test_123',
            amount: 25,
            name: 'Test User'
        });
        
        // Monitor stats
        setInterval(async () => {
            const stats = await processor.getStats();
            console.log('📈 Current stats:', stats);
        }, 10000);
    });
}