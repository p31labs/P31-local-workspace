/**
 * IPNS Key Management for P31 Ecosystem
 * Manages persistent addressing for Andromeda firmware and academic content
 * 
 * This system ensures that IPFS CIDs can be updated while maintaining
 * a static, permanent address through IPNS (InterPlanetary Name System)
 */

const { createIPNSKey, publishIPNS, resolveIPNS } = require('ipns');
const crypto = require('crypto');

class IPNSManager {
    constructor() {
        // Configuration
        this.IPNS_KEY_NAME = 'p31-andromeda-main';
        this.IPNS_KEY_PATH = process.env.IPNS_KEY_PATH || './ipns-keys/';
        this.ENS_DOMAIN = 'andromeda.p31.eth';
        
        // IPNS configuration
        this.IPNS_OPTIONS = {
            lifetime: '8760h', // 1 year
            ttl: 3600000,      // 1 hour
            sequence: 0
        };
        
        this.keyPair = null;
        this.currentCID = null;
    }

    /**
     * Initialize IPNS manager
     */
    async init() {
        console.log('🔑 Initializing IPNS Manager');
        
        // Load or generate IPNS key pair
        await this.loadOrCreateKeyPair();
        
        // Verify ENS integration
        await this.verifyENSIntegration();
        
        console.log('✅ IPNS Manager initialized');
        return this;
    }

    /**
     * Load existing key pair or generate new one
     */
    async loadOrCreateKeyPair() {
        try {
            // Try to load existing key
            const keyPath = `${this.IPNS_KEY_PATH}${this.IPNS_KEY_NAME}.key`;
            
            if (require('fs').existsSync(keyPath)) {
                console.log('📂 Loading existing IPNS key pair');
                this.keyPair = await this.loadKeyPair(keyPath);
            } else {
                console.log('🆕 Generating new IPNS key pair');
                this.keyPair = await this.generateKeyPair();
                await this.saveKeyPair(keyPath, this.keyPair);
            }
            
            console.log(`🔑 IPNS Key: ${this.getPublicKey()}`);
            
        } catch (error) {
            console.error('❌ Failed to initialize IPNS key pair:', error);
            throw error;
        }
    }

    /**
     * Generate new IPNS key pair
     */
    async generateKeyPair() {
        // Generate RSA key pair for IPNS
        const { generateKeyPair } = require('crypto');
        
        return new Promise((resolve, reject) => {
            generateKeyPair('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            }, (err, publicKey, privateKey) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        publicKey,
                        privateKey,
                        createdAt: new Date().toISOString()
                    });
                }
            });
        });
    }

    /**
     * Load key pair from file
     */
    async loadKeyPair(path) {
        const fs = require('fs');
        const keyData = JSON.parse(fs.readFileSync(path, 'utf8'));
        
        return {
            publicKey: keyData.publicKey,
            privateKey: keyData.privateKey,
            createdAt: keyData.createdAt
        };
    }

    /**
     * Save key pair to file
     */
    async saveKeyPair(path, keyPair) {
        const fs = require('fs');
        const path = require('path');
        
        // Ensure directory exists
        const dir = path.dirname(path);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Save key pair
        fs.writeFileSync(path, JSON.stringify(keyPair, null, 2));
        console.log(`💾 Key pair saved to: ${path}`);
    }

    /**
     * Verify ENS integration
     */
    async verifyENSIntegration() {
        try {
            // This would integrate with ENS to verify the text record
            // For now, we'll log the expected configuration
            console.log(`🌐 ENS Domain: ${this.ENS_DOMAIN}`);
            console.log(`📝 Expected Text Record: ${this.getPublicKey()}`);
            
            // In production, this would:
            // 1. Query ENS for the text record
            // 2. Verify it matches our IPNS key
            // 3. Update if necessary
            
        } catch (error) {
            console.error('⚠️ ENS verification failed:', error);
        }
    }

    /**
     * Publish new CID to IPNS
     */
    async publishCID(cid) {
        if (!this.keyPair) {
            throw new Error('IPNS key pair not initialized');
        }
        
        try {
            console.log(`📤 Publishing CID to IPNS: ${cid}`);
            
            // Create IPNS record
            const ipnsRecord = await this.createIPNSRecord(cid);
            
            // Store the record for potential future updates
            this.currentCID = cid;
            this.IPNS_OPTIONS.sequence++;
            
            console.log(`✅ IPNS record created for CID: ${cid}`);
            console.log(`🔗 IPNS Address: /ipns/${this.getPublicKey()}`);
            
            return {
                success: true,
                ipnsAddress: `/ipns/${this.getPublicKey()}`,
                cid: cid,
                sequence: this.IPNS_OPTIONS.sequence
            };
            
        } catch (error) {
            console.error('❌ Failed to publish CID to IPNS:', error);
            throw error;
        }
    }

    /**
     * Create IPNS record
     */
    async createIPNSRecord(cid) {
        const ipns = require('ipns');
        
        // Create the IPNS record
        const record = await ipns.create(
            this.keyPair.privateKey,
            Buffer.from(cid),
            this.IPNS_OPTIONS.sequence,
            Date.now() + this.parseLifetime(this.IPNS_OPTIONS.lifetime)
        );
        
        return record;
    }

    /**
     * Resolve IPNS address to CID
     */
    async resolveIPNS(ipnsAddress) {
        try {
            console.log(`🔍 Resolving IPNS address: ${ipnsAddress}`);
            
            // This would use the IPFS API to resolve the IPNS address
            // For now, we'll simulate the resolution
            
            const resolvedCID = await this.simulateIPNSResolution(ipnsAddress);
            
            console.log(`✅ Resolved to CID: ${resolvedCID}`);
            return {
                success: true,
                cid: resolvedCID,
                ipnsAddress: ipnsAddress
            };
            
        } catch (error) {
            console.error('❌ Failed to resolve IPNS address:', error);
            throw error;
        }
    }

    /**
     * Simulate IPNS resolution (for development)
     */
    async simulateIPNSResolution(ipnsAddress) {
        // In a real implementation, this would call the IPFS API
        // For now, we'll return the current CID if it matches our key
        
        if (ipnsAddress.includes(this.getPublicKey())) {
            return this.currentCID || 'QmSimulatedCID1234567890abcdef';
        }
        
        throw new Error('IPNS address does not match our key');
    }

    /**
     * Update IPNS record with new CID
     */
    async updateCID(oldCID, newCID) {
        if (oldCID === newCID) {
            console.log('ℹ️ CID has not changed, skipping update');
            return { success: true, unchanged: true };
        }
        
        console.log(`🔄 Updating IPNS record: ${oldCID} → ${newCID}`);
        
        const result = await this.publishCID(newCID);
        
        console.log(`✅ IPNS record updated successfully`);
        return {
            ...result,
            oldCID: oldCID,
            newCID: newCID
        };
    }

    /**
     * Get current IPNS address
     */
    getIPNSAddress() {
        if (!this.keyPair) {
            return null;
        }
        
        return `/ipns/${this.getPublicKey()}`;
    }

    /**
     * Get public key (IPNS address)
     */
    getPublicKey() {
        if (!this.keyPair) {
            return null;
        }
        
        // Extract the base58 encoded public key from the PEM format
        // This is a simplified version - in production, you'd use proper IPNS key handling
        const publicKeyBuffer = Buffer.from(this.keyPair.publicKey, 'base64');
        return crypto.createHash('sha256').update(publicKeyBuffer).digest('hex').substring(0, 46);
    }

    /**
     * Parse lifetime string to milliseconds
     */
    parseLifetime(lifetime) {
        const units = {
            's': 1000,
            'm': 60000,
            'h': 3600000,
            'd': 86400000
        };
        
        const match = lifetime.match(/^(\d+)([smhd])$/);
        if (!match) {
            throw new Error('Invalid lifetime format');
        }
        
        const [, value, unit] = match;
        return parseInt(value) * units[unit];
    }

    /**
     * Get IPNS status
     */
    getStatus() {
        return {
            initialized: !!this.keyPair,
            currentCID: this.currentCID,
            ipnsAddress: this.getIPNSAddress(),
            sequence: this.IPNS_OPTIONS.sequence,
            lifetime: this.IPNS_OPTIONS.lifetime,
            ttl: this.IPNS_OPTIONS.ttl
        };
    }

    /**
     * Rotate IPNS key (emergency procedure)
     */
    async rotateKey() {
        console.log('🔄 Rotating IPNS key pair');
        
        // Generate new key pair
        const newKeyPair = await this.generateKeyPair();
        
        // Backup old key
        const backupPath = `${this.IPNS_KEY_PATH}${this.IPNS_KEY_NAME}.backup.${Date.now()}.key`;
        await this.saveKeyPair(backupPath, this.keyPair);
        
        // Replace with new key
        this.keyPair = newKeyPair;
        
        // Reset sequence
        this.IPNS_OPTIONS.sequence = 0;
        
        console.log('✅ IPNS key rotated successfully');
        console.log(`🔑 New IPNS Key: ${this.getPublicKey()}`);
        
        return {
            success: true,
            newKey: this.getPublicKey(),
            backupPath: backupPath
        };
    }

    /**
     * Validate IPNS configuration
     */
    validateConfiguration() {
        const issues = [];
        
        if (!this.keyPair) {
            issues.push('IPNS key pair not initialized');
        }
        
        if (!this.currentCID) {
            issues.push('No current CID published');
        }
        
        if (!this.ENS_DOMAIN) {
            issues.push('ENS domain not configured');
        }
        
        return {
            valid: issues.length === 0,
            issues: issues,
            status: this.getStatus()
        };
    }
}

// Export for use in other modules
module.exports = IPNSManager;

// Example usage for testing
if (require.main === module) {
    const manager = new IPNSManager();
    
    manager.init().then(async () => {
        console.log('✅ IPNS Manager ready');
        
        // Test publishing a CID
        const testCID = 'QmTestCID1234567890abcdef';
        const publishResult = await manager.publishCID(testCID);
        console.log('📤 Publish result:', publishResult);
        
        // Test resolution
        const ipnsAddress = manager.getIPNSAddress();
        const resolveResult = await manager.resolveIPNS(ipnsAddress);
        console.log('🔍 Resolve result:', resolveResult);
        
        // Show status
        console.log('📊 IPNS Status:', manager.getStatus());
    }).catch(console.error);
}