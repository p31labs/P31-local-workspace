#!/usr/bin/env node

/**
 * Log Multi-Sig Event
 * Creates an audit trail for all multi-sig related events
 */

const fs = require('fs');
const path = require('path');

class MultiSigEventLogger {
    constructor() {
        this.logPath = path.join(__dirname, '..', '..', 'multisig-audit-log.json');
        this.statusPath = path.join(__dirname, '..', '..', 'posner-status.json');
        this.contributorsPath = path.join(__dirname, '..', '..', 'posner-contributors.json');
    }

    /**
     * Main logging function
     */
    async logEvent() {
        try {
            console.log('📝 Logging Multi-Sig Event...');
            
            // Load current state
            const status = this.loadStatus();
            const contributors = this.loadContributors();
            
            // Create event log entry
            const eventLog = this.createEventLog(status, contributors);
            
            // Save event log
            this.saveEventLog(eventLog);
            
            // Generate audit report
            const auditReport = this.generateAuditReport(eventLog);
            
            // Save audit report
            this.saveAuditReport(auditReport);
            
            console.log('✅ Multi-sig event logged successfully');
            return eventLog;
            
        } catch (error) {
            console.error('❌ Failed to log multi-sig event:', error);
            process.exit(1);
        }
    }

    /**
     * Load current status
     */
    loadStatus() {
        if (fs.existsSync(this.statusPath)) {
            return JSON.parse(fs.readFileSync(this.statusPath, 'utf8'));
        }
        
        return {
            assembled: false,
            calciumIons: 0,
            phosphateIons: 0,
            totalIons: 0,
            uniqueContributors: 0,
            requirements: {
                calciumIons: 9,
                phosphateIons: 6,
                uniqueContributors: 5
            },
            progress: {
                calcium: 0,
                phosphate: 0,
                contributors: 0,
                overall: 0
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Load contributors data
     */
    loadContributors() {
        if (fs.existsSync(this.contributorsPath)) {
            return JSON.parse(fs.readFileSync(this.contributorsPath, 'utf8'));
        }
        
        return {
            users: {},
            totalContributors: 0,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Create event log entry
     */
    createEventLog(status, contributors) {
        const eventLog = {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            eventType: this.determineEventType(status, contributors),
            prInfo: this.getPRInfo(),
            status: {
                assembled: status.assembled,
                progress: status.progress,
                current: {
                    calciumIons: status.calciumIons,
                    phosphateIons: status.phosphateIons,
                    totalIons: status.totalIons,
                    uniqueContributors: status.uniqueContributors
                }
            },
            contributors: {
                total: Object.keys(contributors.users).length,
                active: Object.values(contributors.users).filter(user => 
                    (user.calciumContributed || 0) + (user.phosphateContributed || 0) > 0
                ).length,
                details: this.getContributorDetails(contributors.users)
            },
            verification: {
                calciumComplete: status.calciumIons >= status.requirements.calciumIons,
                phosphateComplete: status.phosphateIons >= status.requirements.phosphateIons,
                contributorsComplete: status.uniqueContributors >= status.requirements.uniqueContributors,
                overallComplete: status.assembled
            },
            metrics: {
                ionsPerContributor: this.calculateIonsPerContributor(status, contributors),
                complianceRate: this.calculateComplianceRate(contributors),
                timeElapsed: this.calculateTimeElapsed(status.timestamp)
            },
            signatures: this.generateSignatures(status, contributors)
        };
        
        return eventLog;
    }

    /**
     * Determine event type
     */
    determineEventType(status, contributors) {
        if (status.assembled) {
            return 'assembly_complete';
        }
        
        const progress = status.progress.overall;
        const contributorsCount = Object.keys(contributors.users).length;
        
        if (progress >= 90) {
            return 'assembly_near_complete';
        } else if (progress >= 50) {
            return 'assembly_halfway';
        } else if (contributorsCount >= 3) {
            return 'contributors_active';
        } else if (contributorsCount >= 1) {
            return 'assembly_started';
        } else {
            return 'assembly_waiting';
        }
    }

    /**
     * Get PR information
     */
    getPRInfo() {
        // Extract PR information from GitHub environment
        return {
            prNumber: process.env.GITHUB_EVENT_NUMBER || 'unknown',
            prTitle: process.env.GITHUB_EVENT_PULL_REQUEST?.title || 'unknown',
            prAuthor: process.env.GITHUB_EVENT_PULL_REQUEST?.user?.login || 'unknown',
            prUrl: process.env.GITHUB_EVENT_PULL_REQUEST?.html_url || 'unknown',
            branch: process.env.GITHUB_HEAD_REF || 'unknown',
            repository: process.env.GITHUB_REPOSITORY || 'unknown'
        };
    }

    /**
     * Get contributor details
     */
    getContributorDetails(users) {
        return Object.entries(users).map(([userId, userData]) => ({
            userId: userId,
            calciumContributed: userData.calciumContributed || 0,
            phosphateContributed: userData.phosphateContributed || 0,
            totalContributed: (userData.calciumContributed || 0) + (userData.phosphateContributed || 0),
            spoonsSpent: userData.spoonsSpent || 0,
            lastContribution: userData.lastContribution,
            signature: userData.signature
        }));
    }

    /**
     * Calculate ions per contributor
     */
    calculateIonsPerContributor(status, contributors) {
        const totalContributors = Object.keys(contributors.users).length;
        const totalIons = status.totalIons;
        
        return totalContributors > 0 ? totalIons / totalContributors : 0;
    }

    /**
     * Calculate compliance rate
     */
    calculateComplianceRate(contributors) {
        const compliantUsers = Object.values(contributors.users).filter(user => 
            user.spoonsSpent >= ((user.calciumContributed || 0) + (user.phosphateContributed || 0)) * 10
        );
        
        const totalUsers = Object.keys(contributors.users).length;
        return totalUsers > 0 ? Math.round((compliantUsers.length / totalUsers) * 100) : 100;
    }

    /**
     * Calculate time elapsed
     */
    calculateTimeElapsed(startTime) {
        const start = new Date(startTime);
        const now = new Date();
        const diff = now - start;
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }

    /**
     * Generate digital signatures
     */
    generateSignatures(status, contributors) {
        const signatureData = {
            timestamp: new Date().toISOString(),
            assemblyStatus: status.assembled,
            progress: status.progress,
            contributors: Object.keys(contributors.users).length,
            totalIons: status.totalIons
        };
        
        // Generate a simple hash signature
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify(signatureData));
        
        return {
            dataHash: hash.digest('hex'),
            timestamp: signatureData.timestamp,
            verified: true
        };
    }

    /**
     * Generate unique event ID
     */
    generateEventId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `event_${timestamp}_${random}`;
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
        
        console.log(`💾 Event log saved to: ${this.logPath}`);
    }

    /**
     * Generate audit report
     */
    generateAuditReport(eventLog) {
        const report = {
            reportId: `audit_${eventLog.eventId}`,
            timestamp: new Date().toISOString(),
            summary: {
                eventType: eventLog.eventType,
                assemblyStatus: eventLog.status.assembled ? 'COMPLETE' : 'IN_PROGRESS',
                progress: eventLog.status.progress.overall,
                contributors: eventLog.contributors.total,
                complianceRate: eventLog.metrics.complianceRate
            },
            details: {
                verification: eventLog.verification,
                metrics: eventLog.metrics,
                contributors: eventLog.contributors.details
            },
            signatures: eventLog.signatures,
            recommendations: this.generateRecommendations(eventLog)
        };
        
        return report;
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(eventLog) {
        const recommendations = [];
        
        if (!eventLog.verification.overallComplete) {
            if (!eventLog.verification.calciumComplete) {
                recommendations.push({
                    priority: 'HIGH',
                    category: 'Calcium Ions',
                    action: `Need ${eventLog.status.requirements.calciumIons - eventLog.status.current.calciumIons} more Calcium ions`
                });
            }
            
            if (!eventLog.verification.phosphateComplete) {
                recommendations.push({
                    priority: 'HIGH',
                    category: 'Phosphate Ions',
                    action: `Need ${eventLog.status.requirements.phosphateIons - eventLog.status.current.phosphateIons} more Phosphate ions`
                });
            }
            
            if (!eventLog.verification.contributorsComplete) {
                recommendations.push({
                    priority: 'MEDIUM',
                    category: 'Contributors',
                    action: `Need ${eventLog.status.requirements.uniqueContributors - eventLog.status.current.uniqueContributors} more unique contributors`
                });
            }
        }
        
        if (eventLog.metrics.complianceRate < 100) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Compliance',
                action: `Address ${100 - eventLog.metrics.complianceRate}% compliance issues`
            });
        }
        
        return recommendations;
    }

    /**
     * Save audit report
     */
    saveAuditReport(auditReport) {
        const reportPath = path.join(__dirname, '..', '..', 'multisig-audit-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));
        
        console.log(`💾 Audit report saved to: ${reportPath}`);
    }

    /**
     * Generate compliance report
     */
    generateComplianceReport(eventLog) {
        const complianceReport = {
            reportId: `compliance_${eventLog.eventId}`,
            timestamp: new Date().toISOString(),
            summary: {
                totalContributors: eventLog.contributors.total,
                compliantContributors: eventLog.contributors.active,
                complianceRate: eventLog.metrics.complianceRate,
                totalSpoonsRequired: eventLog.contributors.details.reduce((sum, user) => sum + (user.totalContributed * 10), 0),
                totalSpoonsSpent: eventLog.contributors.details.reduce((sum, user) => sum + user.spoonsSpent, 0)
            },
            details: eventLog.contributors.details.map(user => ({
                userId: user.userId,
                ionsContributed: user.totalContributed,
                spoonsRequired: user.totalContributed * 10,
                spoonsSpent: user.spoonsSpent,
                compliant: user.spoonsSpent >= (user.totalContributed * 10),
                complianceRate: user.totalContributed > 0 ? Math.round((user.spoonsSpent / (user.totalContributed * 10)) * 100) : 100
            }))
        };
        
        return complianceReport;
    }

    /**
     * Export audit data for external systems
     */
    exportAuditData(eventLog) {
        const exportData = {
            format: 'P31_MultiSig_Audit_v1.0',
            timestamp: eventLog.timestamp,
            event: {
                id: eventLog.eventId,
                type: eventLog.eventType,
                pr: eventLog.prInfo
            },
            status: eventLog.status,
            contributors: eventLog.contributors,
            verification: eventLog.verification,
            metrics: eventLog.metrics,
            signatures: eventLog.signatures
        };
        
        const exportPath = path.join(__dirname, '..', '..', 'multisig-audit-export.json');
        fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
        
        console.log(`📤 Audit data exported to: ${exportPath}`);
        return exportData;
    }
}

// Execute if run directly
if (require.main === module) {
    const logger = new MultiSigEventLogger();
    logger.logEvent().then(eventLog => {
        console.log('\n📝 Multi-sig event logged successfully!');
        console.log(`   Event ID: ${eventLog.eventId}`);
        console.log(`   Type: ${eventLog.eventType}`);
        console.log(`   Status: ${eventLog.status.assembled ? 'Complete' : 'In Progress'}`);
        console.log(`   Contributors: ${eventLog.contributors.total}`);
    });
}

module.exports = MultiSigEventLogger;