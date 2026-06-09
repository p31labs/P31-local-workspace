#!/usr/bin/env node

/**
 * Log Larmor Event
 * Creates comprehensive audit trail for Larmor frequency synchronization events
 */

const fs = require('fs');
const path = require('path');

class LarmorEventLogger {
    constructor() {
        this.logPath = path.join(__dirname, '..', '..', 'larmor-event-log.json');
        this.auditPath = path.join(__dirname, '..', '..', 'larmor-audit-trail.json');
    }

    /**
     * Main logging function
     */
    async logEvent() {
        try {
            console.log('📝 Logging Larmor Event...');
            
            // Get input from GitHub Actions
            const userId = process.env.INPUT_USER_ID;
            const syncTimestamps = JSON.parse(process.env.INPUT_SYNC_TIMESTAMPS);
            const resonanceLevel = parseInt(process.env.INPUT_RESONANCE_LEVEL) || 10;
            const decryptedCID = process.env.INPUT_DECRYPTED_CID;
            const publishedCID = process.env.INPUT_PUBLISHED_CID;
            
            // Create event log entry
            const eventLog = this.createEventLog(userId, syncTimestamps, resonanceLevel, decryptedCID, publishedCID);
            
            // Generate audit trail entry
            const auditEntry = this.generateAuditEntry(eventLog);
            
            // Save event log
            this.saveEventLog(eventLog);
            
            // Save audit trail
            this.saveAuditTrail(auditEntry);
            
            // Generate compliance report
            const complianceReport = this.generateComplianceReport(eventLog);
            
            // Output results for GitHub Actions
            this.outputResults(eventLog, auditEntry, complianceReport);
            
            console.log('✅ Larmor event logged successfully');
            return { eventLog, auditEntry, complianceReport };
            
        } catch (error) {
            console.error('❌ Failed to log Larmor event:', error);
            process.exit(1);
        }
    }

    /**
     * Create event log entry
     */
    createEventLog(userId, syncTimestamps, resonanceLevel, decryptedCID, publishedCID) {
        const TARGET_INTERVAL = 1000 / 0.86; // ~1162.79 ms
        const TOLERANCE = 120; // ms tolerance
        
        // Calculate synchronization metrics
        const intervals = [];
        const deviations = [];
        let totalValid = 0;
        
        for (let i = 1; i < syncTimestamps.length; i++) {
            const interval = syncTimestamps[i] - syncTimestamps[i - 1];
            intervals.push(interval);
            
            const deviation = Math.abs(interval - TARGET_INTERVAL);
            deviations.push(deviation);
            
            if (deviation <= TOLERANCE) {
                totalValid++;
            }
        }
        
        const precision = Math.max(0, Math.round(100 - (deviations.reduce((a, b) => a + b, 0) / deviations.length / TOLERANCE) * 100));
        const consistency = Math.round((totalValid / intervals.length) * 100);
        
        const eventLog = {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            eventType: 'larmor_frequency_sync',
            user: {
                userId: userId,
                resonanceLevel: resonanceLevel,
                precision: precision,
                consistency: consistency
            },
            synchronization: {
                targetFrequency: 0.86,
                targetInterval: TARGET_INTERVAL,
                tolerance: TOLERANCE,
                totalAttempts: syncTimestamps.length,
                totalValid: totalValid,
                intervals: intervals,
                deviations: deviations,
                averageInterval: intervals.reduce((a, b) => a + b, 0) / intervals.length,
                averageDeviation: deviations.reduce((a, b) => a + b, 0) / deviations.length
            },
            content: {
                decryptedCID: decryptedCID,
                publishedCID: publishedCID,
                accessUrls: {
                    ipfs: `https://ipfs.io/ipfs/${publishedCID}`,
                    ipns: `ipns://andromeda.p31.eth`,
                    ens: `https://andromeda.p31.eth`
                }
            },
            rewards: {
                karmaAwarded: this.calculateKarmaAward(resonanceLevel),
                spoonsExpended: 1,
                achievements: this.determineAchievements(resonanceLevel, precision, consistency)
            },
            verification: {
                frequencyValid: Math.abs((1000 / (intervals.reduce((a, b) => a + b, 0) / intervals.length)) - 0.86) < 0.01,
                precisionValid: precision >= 80,
                resonanceValid: resonanceLevel >= 8,
                overallValid: resonanceLevel >= 8 && precision >= 80
            },
            security: {
                encryptionMethod: 'larmor_sync_0.86hz',
                verificationMethod: 'quantum_resonance',
                integrityHash: this.generateIntegrityHash(syncTimestamps, decryptedCID)
            }
        };
        
        return eventLog;
    }

    /**
     * Generate audit trail entry
     */
    generateAuditEntry(eventLog) {
        const auditEntry = {
            auditId: `audit_${eventLog.eventId}`,
            timestamp: eventLog.timestamp,
            eventReference: eventLog.eventId,
            auditType: 'larmor_frequency_sync',
            auditData: {
                user: eventLog.user,
                synchronization: {
                    frequency: eventLog.synchronization.targetFrequency,
                    precision: eventLog.user.precision,
                    consistency: eventLog.user.consistency,
                    quality: this.calculateQualityScore(eventLog.user.precision, eventLog.user.consistency, eventLog.user.resonanceLevel)
                },
                content: {
                    decrypted: !!eventLog.content.decryptedCID,
                    published: !!eventLog.content.publishedCID,
                    accessible: !!eventLog.content.accessUrls.ipfs
                },
                rewards: eventLog.rewards,
                verification: eventLog.verification
            },
            compliance: {
                frequencyCompliance: eventLog.verification.frequencyValid,
                precisionCompliance: eventLog.verification.precisionValid,
                resonanceCompliance: eventLog.verification.resonanceValid,
                overallCompliance: eventLog.verification.overallValid
            },
            signatures: {
                eventSignature: this.generateEventSignature(eventLog),
                auditSignature: this.generateAuditSignature(auditEntry)
            }
        };
        
        return auditEntry;
    }

    /**
     * Calculate quality score
     */
    calculateQualityScore(precision, consistency, resonanceLevel) {
        const quality = (precision * 0.4) + (consistency * 0.3) + (resonanceLevel * 10 * 0.3);
        return Math.round(quality);
    }

    /**
     * Determine achievements
     */
    determineAchievements(resonanceLevel, precision, consistency) {
        const achievements = [];
        
        if (resonanceLevel === 10) achievements.push('perfect_resonance');
        if (precision === 100) achievements.push('precision_master');
        if (consistency >= 90) achievements.push('consistency_champion');
        if (resonanceLevel >= 8 && precision >= 80) achievements.push('quantum_entangler');
        
        return achievements;
    }

    /**
     * Calculate karma award
     */
    calculateKarmaAward(resonanceLevel) {
        const baseKarma = 50;
        const resonanceBonus = resonanceLevel * 5;
        return baseKarma + resonanceBonus;
    }

    /**
     * Generate integrity hash
     */
    generateIntegrityHash(syncTimestamps, decryptedCID) {
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify({
            timestamps: syncTimestamps,
            cid: decryptedCID,
            frequency: 0.86,
            timestamp: new Date().toISOString()
        }));
        
        return hash.digest('hex');
    }

    /**
     * Generate event signature
     */
    generateEventSignature(eventLog) {
        const crypto = require('crypto');
        const signatureData = {
            eventId: eventLog.eventId,
            userId: eventLog.user.userId,
            timestamp: eventLog.timestamp,
            resonanceLevel: eventLog.user.resonanceLevel,
            precision: eventLog.user.precision
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
     * Generate audit signature
     */
    generateAuditSignature(auditEntry) {
        const crypto = require('crypto');
        const signatureData = {
            auditId: auditEntry.auditId,
            eventReference: auditEntry.eventReference,
            timestamp: auditEntry.timestamp,
            compliance: auditEntry.compliance
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
     * Generate unique event ID
     */
    generateEventId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `larmor_event_${timestamp}_${random}`;
    }

    /**
     * Save event log
     */
    saveEventLog(eventLog) {
        let existingLogs = [];
        
        if (fs.existsSync(this.logPath)) {
            existingLogs = JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
        }
        
        existingLogs.push(eventLog);
        fs.writeFileSync(this.logPath, JSON.stringify(existingLogs, null, 2));
        
        console.log(`💾 Larmor event log saved to: ${this.logPath}`);
    }

    /**
     * Save audit trail
     */
    saveAuditTrail(auditEntry) {
        let existingAudits = [];
        
        if (fs.existsSync(this.auditPath)) {
            existingAudits = JSON.parse(fs.readFileSync(this.auditPath, 'utf8'));
        }
        
        existingAudits.push(auditEntry);
        fs.writeFileSync(this.auditPath, JSON.stringify(existingAudits, null, 2));
        
        console.log(`💾 Larmor audit trail saved to: ${this.auditPath}`);
    }

    /**
     * Generate compliance report
     */
    generateComplianceReport(eventLog) {
        const complianceReport = {
            reportId: `compliance_${eventLog.eventId}`,
            timestamp: new Date().toISOString(),
            eventReference: eventLog.eventId,
            compliance: {
                frequency: {
                    compliant: eventLog.verification.frequencyValid,
                    target: 0.86,
                    achieved: 1000 / eventLog.synchronization.averageInterval,
                    deviation: Math.abs(0.86 - (1000 / eventLog.synchronization.averageInterval))
                },
                precision: {
                    compliant: eventLog.verification.precisionValid,
                    target: 80,
                    achieved: eventLog.user.precision,
                    deviation: eventLog.user.precision - 80
                },
                resonance: {
                    compliant: eventLog.verification.resonanceValid,
                    target: 8,
                    achieved: eventLog.user.resonanceLevel,
                    deviation: eventLog.user.resonanceLevel - 8
                }
            },
            overall: {
                compliant: eventLog.verification.overallValid,
                score: this.calculateQualityScore(eventLog.user.precision, eventLog.user.consistency, eventLog.user.resonanceLevel)
            },
            recommendations: this.generateRecommendations(eventLog)
        };
        
        return complianceReport;
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(eventLog) {
        const recommendations = [];
        
        if (!eventLog.verification.frequencyValid) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Frequency',
                action: 'Improve synchronization to target 0.86 Hz frequency'
            });
        }
        
        if (!eventLog.verification.precisionValid) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Precision',
                action: 'Increase timing precision to achieve 80%+ accuracy'
            });
        }
        
        if (!eventLog.verification.resonanceValid) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Resonance',
                action: 'Achieve resonance level 8 or higher for full compliance'
            });
        }
        
        return recommendations;
    }

    /**
     * Output results for GitHub Actions
     */
    outputResults(eventLog, auditEntry, complianceReport) {
        console.log('\n📝 Larmor Event Logging Results:');
        console.log(`   Event ID: ${eventLog.eventId}`);
        console.log(`   User: ${eventLog.user.userId}`);
        console.log(`   Resonance Level: ${eventLog.user.resonanceLevel}/10`);
        console.log(`   Precision: ${eventLog.user.precision}/100`);
        console.log(`   Consistency: ${eventLog.user.consistency}/100`);
        console.log(`   Compliance: ${complianceReport.overall.compliant ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   Quality Score: ${complianceReport.overall.score}/100`);
        
        // Output to GitHub Actions
        if (process.env.GITHUB_OUTPUT) {
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `event_id=${eventLog.eventId}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `compliance_status=${complianceReport.overall.compliant}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `quality_score=${complianceReport.overall.score}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `audit_id=${auditEntry.auditId}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `larmor_logging_complete=true\n`);
        }
    }

    /**
     * Generate summary statistics
     */
    generateSummaryStatistics() {
        if (!fs.existsSync(this.logPath)) {
            return { totalEvents: 0, averageResonance: 0, averagePrecision: 0, complianceRate: 0 };
        }
        
        const logs = JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
        
        const totalEvents = logs.length;
        const averageResonance = Math.round(logs.reduce((sum, log) => sum + log.user.resonanceLevel, 0) / totalEvents);
        const averagePrecision = Math.round(logs.reduce((sum, log) => sum + log.user.precision, 0) / totalEvents);
        const compliantEvents = logs.filter(log => log.verification.overallValid).length;
        const complianceRate = Math.round((compliantEvents / totalEvents) * 100);
        
        return {
            totalEvents,
            averageResonance,
            averagePrecision,
            complianceRate
        };
    }

    /**
     * Export audit data for external systems
     */
    exportAuditData(eventLog, auditEntry, complianceReport) {
        const exportData = {
            format: 'P31_Larmor_Audit_v1.0',
            timestamp: new Date().toISOString(),
            event: {
                id: eventLog.eventId,
                type: eventLog.eventType,
                user: eventLog.user
            },
            synchronization: eventLog.synchronization,
            content: eventLog.content,
            rewards: eventLog.rewards,
            verification: eventLog.verification,
            audit: auditEntry,
            compliance: complianceReport
        };
        
        const exportPath = path.join(__dirname, '..', '..', 'larmor-audit-export.json');
        fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
        
        console.log(`📤 Larmor audit data exported to: ${exportPath}`);
        return exportData;
    }
}

// Execute if run directly
if (require.main === module) {
    const logger = new LarmorEventLogger();
    logger.logEvent().then(result => {
        console.log('\n📝 Larmor event logged successfully!');
        console.log(`   Event ID: ${result.eventLog.eventId}`);
        console.log(`   User: ${result.eventLog.user.userId}`);
        console.log(`   Compliance: ${result.complianceReport.overall.compliant ? 'PASS' : 'FAIL'}`);
        console.log(`   Quality Score: ${result.complianceReport.overall.score}/100`);
    });
}

module.exports = LarmorEventLogger;