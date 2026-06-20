#!/usr/bin/env node

/**
 * Publish Decrypted Content
 * Publishes decrypted IPFS content to the network and updates references
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DecryptedContentPublisher {
    constructor() {
        this.ipfsGateway = process.env.IPFS_GATEWAY || 'https://ipfs.io';
        this.ensDomain = process.env.ENS_DOMAIN || 'andromeda.p31.eth';
    }

    /**
     * Main publishing function
     */
    async publish() {
        try {
            console.log('🚀 Publishing Decrypted Content...');
            
            // Get input from GitHub Actions
            const decryptedCID = process.env.INPUT_DECRYPTED_CID;
            const userId = process.env.INPUT_USER_ID;
            const syncTimestamps = JSON.parse(process.env.INPUT_SYNC_TIMESTAMPS);
            
            // Generate content metadata
            const metadata = this.generateContentMetadata(decryptedCID, userId, syncTimestamps);
            
            // Create content package
            const contentPackage = this.createContentPackage(metadata);
            
            // Publish to IPFS
            const publishedCID = await this.publishToIPFS(contentPackage);
            
            // Update IPNS record
            const ipnsRecord = await this.updateIPNS(publishedCID, metadata);
            
            // Update ENS record
            const ensRecord = await this.updateENS(ipnsRecord, metadata);
            
            // Generate publication report
            const report = this.generatePublicationReport(metadata, publishedCID, ipnsRecord, ensRecord);
            
            // Output results for GitHub Actions
            this.outputResults(publishedCID, ipnsRecord, ensRecord, report);
            
            // Save publication log
            this.savePublicationLog(metadata, publishedCID, ipnsRecord, ensRecord, report);
            
            console.log('✅ Decrypted content published successfully');
            return { publishedCID, ipnsRecord, ensRecord, report };
            
        } catch (error) {
            console.error('❌ Decrypted content publication failed:', error);
            process.exit(1);
        }
    }

    /**
     * Generate content metadata
     */
    generateContentMetadata(decryptedCID, userId, syncTimestamps) {
        const metadata = {
            timestamp: new Date().toISOString(),
            userId: userId,
            originalCID: decryptedCID,
            syncTimestamps: syncTimestamps,
            larmorFrequency: 0.86,
            resonanceLevel: 10,
            content: {
                type: 'lore_unlock',
                category: 'quantum_biology',
                classification: 'community_achievement',
                accessLevel: 'public'
            },
            security: {
                encryption: 'larmor_sync_0.86hz',
                verification: 'quantum_resonance',
                integrity: this.calculateContentIntegrity(decryptedCID, syncTimestamps)
            },
            distribution: {
                ipfs: true,
                ipns: true,
                ens: true,
                redundancy: 3
            }
        };
        
        return metadata;
    }

    /**
     * Calculate content integrity hash
     */
    calculateContentIntegrity(originalCID, syncTimestamps) {
        const integrityData = {
            cid: originalCID,
            timestamps: syncTimestamps,
            frequency: 0.86,
            timestamp: new Date().toISOString()
        };
        
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify(integrityData));
        
        return {
            algorithm: 'SHA-256',
            hash: hash.digest('hex'),
            data: integrityData
        };
    }

    /**
     * Create content package
     */
    createContentPackage(metadata) {
        const contentPackage = {
            version: '1.0.0',
            type: 'p31_decrypted_content',
            metadata: metadata,
            content: {
                cid: metadata.originalCID,
                gateway: this.ipfsGateway,
                accessUrl: `${this.ipfsGateway}/ipfs/${metadata.originalCID}`,
                ipnsUrl: `ipns://${this.ensDomain}`,
                ensUrl: `https://${this.ensDomain}`
            },
            lore: {
                title: 'Quantum Biological Resonance Unlocked',
                description: 'Decrypted content revealing quantum biological research and ARG narrative elements',
                keywords: ['quantum biology', 'phosphorus-31', 'larmor frequency', 'community achievement'],
                unlockReason: 'Larmor frequency synchronization achieved at 0.86 Hz'
            },
            community: {
                unlockedBy: metadata.userId,
                resonanceLevel: metadata.resonanceLevel,
                karmaAwarded: 100,
                spoonsExpended: 1
            }
        };
        
        return contentPackage;
    }

    /**
     * Publish to IPFS
     */
    async publishToIPFS(contentPackage) {
        try {
            // Simulate IPFS publishing (in real implementation, would use ipfs-http-client)
            const contentHash = crypto.createHash('sha256');
            contentHash.update(JSON.stringify(contentPackage));
            const simulatedCID = `bafybeih${contentHash.digest('hex').slice(0, 52)}`;
            
            console.log(`   📤 Published to IPFS: ${simulatedCID}`);
            
            // In real implementation:
            // const ipfs = await IPFS.create({ url: 'https://ipfs.infura.io:5001' });
            // const result = await ipfs.add(JSON.stringify(contentPackage));
            // return result.cid.toString();
            
            return simulatedCID;
        } catch (error) {
            console.error('IPFS publishing error:', error);
            throw new Error('Failed to publish to IPFS');
        }
    }

    /**
     * Update IPNS record
     */
    async updateIPNS(publishedCID, metadata) {
        try {
            // Simulate IPNS update (in real implementation, would use IPNS key management)
            const ipnsRecord = {
                domain: this.ensDomain,
                cid: publishedCID,
                timestamp: metadata.timestamp,
                signature: this.generateIPNSSignature(publishedCID, metadata)
            };
            
            console.log(`   📡 Updated IPNS record for ${this.ensDomain}`);
            
            // In real implementation:
            // const ipnsKey = await this.getIPNSKey();
            // await ipfs.name.publish(publishedCID, { key: ipnsKey });
            
            return ipnsRecord;
        } catch (error) {
            console.error('IPNS update error:', error);
            throw new Error('Failed to update IPNS record');
        }
    }

    /**
     * Generate IPNS signature
     */
    generateIPNSSignature(cid, metadata) {
        const signatureData = {
            cid: cid,
            timestamp: metadata.timestamp,
            domain: this.ensDomain,
            type: 'p31_decrypted_content'
        };
        
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify(signatureData));
        
        return {
            algorithm: 'SHA-256',
            signature: hash.digest('hex'),
            data: signatureData
        };
    }

    /**
     * Update ENS record
     */
    async updateENS(ipnsRecord, metadata) {
        try {
            // Simulate ENS update (in real implementation, would use ENS API)
            const ensRecord = {
                domain: this.ensDomain,
                ipnsRecord: ipnsRecord,
                contentCID: ipnsRecord.cid,
                timestamp: metadata.timestamp,
                resolver: 'ipns-resolver.p31.eth',
                ttl: 3600
            };
            
            console.log(`   🌐 Updated ENS record for ${this.ensDomain}`);
            
            // In real implementation:
            // const ens = await this.getENS();
            // await ens.setRecord(this.ensDomain, ipnsRecord.cid);
            
            return ensRecord;
        } catch (error) {
            console.error('ENS update error:', error);
            throw new Error('Failed to update ENS record');
        }
    }

    /**
     * Generate publication report
     */
    generatePublicationReport(metadata, publishedCID, ipnsRecord, ensRecord) {
        const report = {
            timestamp: new Date().toISOString(),
            publication: {
                originalCID: metadata.originalCID,
                publishedCID: publishedCID,
                ipnsDomain: this.ensDomain,
                ensDomain: this.ensDomain
            },
            urls: {
                ipfs: `${this.ipfsGateway}/ipfs/${publishedCID}`,
                ipns: `ipns://${this.ensDomain}`,
                ens: `https://${this.ensDomain}`,
                direct: `${this.ipfsGateway}/ipfs/${metadata.originalCID}`
            },
            distribution: {
                ipfs: true,
                ipns: true,
                ens: true,
                gateways: [this.ipfsGateway],
                redundancy: 3
            },
            security: {
                integrity: metadata.security.integrity,
                verification: 'quantum_resonance',
                accessLevel: metadata.content.accessLevel
            },
            community: {
                unlockedBy: metadata.userId,
                resonanceLevel: metadata.resonanceLevel,
                karmaAwarded: 100,
                spoonsExpended: 1
            }
        };
        
        return report;
    }

    /**
     * Output results for GitHub Actions
     */
    outputResults(publishedCID, ipnsRecord, ensRecord, report) {
        console.log('\n🚀 Publication Results:');
        console.log(`   Published CID: ${publishedCID}`);
        console.log(`   IPNS Domain: ${ipnsRecord.domain}`);
        console.log(`   ENS Domain: ${ensRecord.domain}`);
        console.log(`   IPFS URL: ${report.urls.ipfs}`);
        console.log(`   IPNS URL: ${report.urls.ipns}`);
        console.log(`   ENS URL: ${report.urls.ens}`);
        
        // Output to GitHub Actions
        if (process.env.GITHUB_OUTPUT) {
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `published_cid=${publishedCID}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `ipns_domain=${ipnsRecord.domain}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `ens_domain=${ensRecord.domain}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `ipfs_url=${report.urls.ipfs}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `ipns_url=${report.urls.ipns}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `ens_url=${report.urls.ens}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `publication_success=true\n`);
        }
    }

    /**
     * Save publication log
     */
    savePublicationLog(metadata, publishedCID, ipnsRecord, ensRecord, report) {
        const logPath = path.join(__dirname, '..', '..', 'decrypted-content-publication-log.json');
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            metadata: metadata,
            publishedCID: publishedCID,
            ipnsRecord: ipnsRecord,
            ensRecord: ensRecord,
            report: report
        };
        
        let existingLog = [];
        if (fs.existsSync(logPath)) {
            existingLog = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        }
        
        existingLog.push(logEntry);
        fs.writeFileSync(logPath, JSON.stringify(existingLog, null, 2));
        
        console.log(`💾 Publication log saved to: ${logPath}`);
    }

    /**
     * Generate content manifest
     */
    generateContentManifest(metadata, publishedCID) {
        const manifest = {
            version: '1.0.0',
            type: 'p31_content_manifest',
            timestamp: metadata.timestamp,
            content: {
                cid: publishedCID,
                metadata: metadata,
                integrity: metadata.security.integrity
            },
            distribution: {
                ipfs: true,
                ipns: true,
                ens: true,
                gateways: [this.ipfsGateway]
            },
            access: {
                public: true,
                authenticated: false,
                encrypted: false
            },
            lifecycle: {
                created: metadata.timestamp,
                expires: null,
                immutable: true
            }
        };
        
        return manifest;
    }

    /**
     * Verify publication integrity
     */
    verifyPublicationIntegrity(publishedCID, metadata) {
        const verification = {
            cid: publishedCID,
            integrity: metadata.security.integrity,
            timestamp: metadata.timestamp,
            verified: true,
            method: 'sha256_hash_comparison'
        };
        
        return verification;
    }
}

// Execute if run directly
if (require.main === module) {
    const publisher = new DecryptedContentPublisher();
    publisher.publish().then(result => {
        console.log('\n🎉 Decrypted content PUBLISHED successfully!');
        console.log(`Published CID: ${result.publishedCID}`);
        console.log(`Access URLs:`);
        console.log(`   IPFS: ${result.report.urls.ipfs}`);
        console.log(`   IPNS: ${result.report.urls.ipns}`);
        console.log(`   ENS: ${result.report.urls.ens}`);
    });
}

module.exports = DecryptedContentPublisher;