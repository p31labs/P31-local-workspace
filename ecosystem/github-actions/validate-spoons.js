#!/usr/bin/env node

/**
 * Validate Spoons Expenditure
 * Ensures that contributors have properly spent Spoons from their ledger
 * for ion contributions to the Posner molecule
 */

const fs = require('fs');
const path = require('path');

class SpoonsValidator {
    constructor() {
        this.contributorsPath = path.join(__dirname, '..', '..', 'posner-contributors.json');
        this.gamificationPath = path.join(__dirname, '..', '..', 'ecosystem', 'gamification', 'dual-ledger-economy.js');
    }

    /**
     * Main validation function
     */
    async validate() {
        try {
            console.log('🥄 Validating Spoons Expenditure...');
            
            // Load data
            const contributors = this.loadContributors();
            
            // Validate spoons expenditure
            const validation = this.validateSpoonsExpenditure(contributors);
            
            // Generate validation report
            const report = this.generateValidationReport(validation);
            
            // Output results
            this.outputResults(validation, report);
            
            // Save validation log
            this.saveValidationLog(validation, report);
            
            return {
                valid: validation.valid,
                validation: validation,
                report: report
            };
            
        } catch (error) {
            console.error('❌ Spoons validation failed:', error);
            process.exit(1);
        }
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
     * Validate spoons expenditure
     */
    validateSpoonsExpenditure(contributors) {
        const validation = {
            valid: true,
            issues: [],
            users: {},
            summary: {
                totalContributors: 0,
                totalSpoonsRequired: 0,
                totalSpoonsSpent: 0,
                complianceRate: 0
            }
        };
        
        // Validate each contributor
        Object.entries(contributors.users).forEach(([userId, userData]) => {
            const userValidation = this.validateUserSpoons(userId, userData);
            validation.users[userId] = userValidation;
            
            // Update summary
            validation.summary.totalContributors++;
            validation.summary.totalSpoonsRequired += userValidation.spoonsRequired;
            validation.summary.totalSpoonsSpent += userValidation.spoonsSpent;
            
            // Check for issues
            if (!userValidation.valid) {
                validation.valid = false;
                validation.issues.push(...userValidation.issues);
            }
        });
        
        // Calculate compliance rate
        if (validation.summary.totalSpoonsRequired > 0) {
            validation.summary.complianceRate = Math.round(
                (validation.summary.totalSpoonsSpent / validation.summary.totalSpoonsRequired) * 100
            );
        }
        
        // Final validation check
        if (validation.summary.complianceRate < 100) {
            validation.valid = false;
            validation.issues.push(`Overall spoons compliance below 100%: ${validation.summary.complianceRate}%`);
        }
        
        return validation;
    }

    /**
     * Validate individual user spoons
     */
    validateUserSpoons(userId, userData) {
        const validation = {
            userId: userId,
            valid: true,
            issues: [],
            ionsContributed: 0,
            spoonsRequired: 0,
            spoonsSpent: 0,
            spoonsBalance: 0,
            compliance: 0
        };
        
        // Calculate total ions contributed
        const calciumContributed = userData.calciumContributed || 0;
        const phosphateContributed = userData.phosphateContributed || 0;
        validation.ionsContributed = calciumContributed + phosphateContributed;
        
        // Calculate spoons required (configurable rate)
        const spoonsPerIon = 10; // Configurable
        validation.spoonsRequired = validation.ionsContributed * spoonsPerIon;
        
        // Get spoons spent
        validation.spoonsSpent = userData.spoonsSpent || 0;
        
        // Get current spoons balance
        validation.spoonsBalance = userData.spoonsBalance || 100; // Default max
        
        // Calculate compliance
        if (validation.spoonsRequired > 0) {
            validation.compliance = Math.round((validation.spoonsSpent / validation.spoonsRequired) * 100);
        }
        
        // Validate compliance
        if (validation.compliance < 100) {
            validation.valid = false;
            validation.issues.push(`User ${userId} compliance: ${validation.compliance}% (${validation.spoonsSpent}/${validation.spoonsRequired} spoons)`);
        }
        
        // Check for suspicious patterns
        if (validation.ionsContributed > 0 && validation.spoonsSpent === 0) {
            validation.valid = false;
            validation.issues.push(`User ${userId} contributed ions without spending spoons`);
        }
        
        // Check spoons balance consistency
        const expectedBalance = 100 - validation.spoonsSpent; // Assuming starting balance of 100
        if (Math.abs(validation.spoonsBalance - expectedBalance) > 5) { // Allow small variance
            validation.issues.push(`User ${userId} spoons balance inconsistency: expected ~${expectedBalance}, got ${validation.spoonsBalance}`);
        }
        
        return validation;
    }

    /**
     * Generate validation report
     */
    generateValidationReport(validation) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                valid: validation.valid,
                totalIssues: validation.issues.length,
                complianceRate: validation.summary.complianceRate,
                totalContributors: validation.summary.totalContributors
            },
            details: {
                spoonsRequired: validation.summary.totalSpoonsRequired,
                spoonsSpent: validation.summary.totalSpoonsSpent,
                spoonsBalance: Object.values(validation.users).reduce((sum, user) => sum + user.spoonsBalance, 0),
                averageCompliance: Math.round(Object.values(validation.users).reduce((sum, user) => sum + user.compliance, 0) / Math.max(1, validation.summary.totalContributors))
            },
            users: Object.entries(validation.users).map(([userId, userValidation]) => ({
                userId: userId,
                ionsContributed: userValidation.ionsContributed,
                spoonsRequired: userValidation.spoonsRequired,
                spoonsSpent: userValidation.spoonsSpent,
                spoonsBalance: userValidation.spoonsBalance,
                compliance: userValidation.compliance,
                valid: userValidation.valid
            })),
            issues: validation.issues,
            recommendations: this.generateRecommendations(validation)
        };
        
        return report;
    }

    /**
     * Generate recommendations based on validation
     */
    generateRecommendations(validation) {
        const recommendations = [];
        
        if (!validation.valid) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Spoons Compliance',
                action: 'Ensure all contributors have spent required spoons for their ion contributions',
                current: `${validation.summary.complianceRate}%`,
                required: '100%'
            });
        }
        
        // Check for users with low compliance
        const lowComplianceUsers = Object.values(validation.users).filter(user => user.compliance < 100);
        if (lowComplianceUsers.length > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'User Compliance',
                action: `Address ${lowComplianceUsers.length} users with incomplete spoons expenditure`,
                affectedUsers: lowComplianceUsers.map(u => u.userId)
            });
        }
        
        // Check for balance inconsistencies
        const balanceIssues = validation.issues.filter(issue => issue.includes('balance inconsistency'));
        if (balanceIssues.length > 0) {
            recommendations.push({
                priority: 'LOW',
                category: 'Balance Verification',
                action: 'Review spoons balance calculations for consistency'
            });
        }
        
        return recommendations;
    }

    /**
     * Output validation results
     */
    outputResults(validation, report) {
        console.log('\n🥄 Spoons Validation Results:');
        console.log(`   Overall Status: ${validation.valid ? '✅ VALID' : '❌ INVALID'}`);
        console.log(`   Compliance Rate: ${validation.summary.complianceRate}%`);
        console.log(`   Contributors: ${validation.summary.totalContributors}`);
        console.log(`   Spoons Required: ${validation.summary.totalSpoonsRequired}`);
        console.log(`   Spoons Spent: ${validation.summary.totalSpoonsSpent}`);
        
        console.log('\n📊 User Compliance:');
        Object.entries(validation.users).forEach(([userId, userValidation]) => {
            const status = userValidation.valid ? '✅' : '❌';
            console.log(`   ${status} ${userId}: ${userValidation.compliance}% (${userValidation.spoonsSpent}/${userValidation.spoonsRequired})`);
        });
        
        if (validation.issues.length > 0) {
            console.log('\n⚠️ Issues Found:');
            validation.issues.forEach(issue => console.log(`   - ${issue}`));
        }
        
        // Output to GitHub Actions
        if (process.env.GITHUB_OUTPUT) {
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `spoons_valid=${validation.valid}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `spoons_compliance=${validation.summary.complianceRate}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `spoons_required=${validation.summary.totalSpoonsRequired}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `spoons_spent=${validation.summary.totalSpoonsSpent}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `contributors_compliant=${Object.values(validation.users).filter(u => u.valid).length}\n`);
        }
    }

    /**
     * Save validation log
     */
    saveValidationLog(validation, report) {
        const logPath = path.join(__dirname, '..', '..', 'spoons-validation-log.json');
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            validation: validation,
            report: report
        };
        
        let existingLog = [];
        if (fs.existsSync(logPath)) {
            existingLog = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        }
        
        existingLog.push(logEntry);
        fs.writeFileSync(logPath, JSON.stringify(existingLog, null, 2));
        
        console.log(`\n💾 Spoons validation log saved to: ${logPath}`);
    }

    /**
     * Generate spoons expenditure tracking
     */
    generateSpoonsTracking(contributors) {
        const tracking = {
            timestamp: new Date().toISOString(),
            users: Object.entries(contributors.users).map(([userId, userData]) => ({
                userId: userId,
                calciumContributed: userData.calciumContributed || 0,
                phosphateContributed: userData.phosphateContributed || 0,
                totalIons: (userData.calciumContributed || 0) + (userData.phosphateContributed || 0),
                spoonsSpent: userData.spoonsSpent || 0,
                spoonsBalance: userData.spoonsBalance || 100,
                lastContribution: userData.lastContribution
            })),
            summary: {
                totalUsers: Object.keys(contributors.users).length,
                totalIons: Object.values(contributors.users).reduce((sum, user) => sum + (user.calciumContributed || 0) + (user.phosphateContributed || 0), 0),
                totalSpoonsSpent: Object.values(contributors.users).reduce((sum, user) => sum + (user.spoonsSpent || 0), 0),
                averageSpoonsPerIon: 0 // Will be calculated
            }
        };
        
        // Calculate average spoons per ion
        const totalIons = tracking.summary.totalIons;
        const totalSpoons = tracking.summary.totalSpoonsSpent;
        tracking.summary.averageSpoonsPerIon = totalIons > 0 ? Math.round(totalSpoons / totalIons) : 0;
        
        return tracking;
    }
}

// Execute if run directly
if (require.main === module) {
    const validator = new SpoonsValidator();
    validator.validate().then(result => {
        if (result.valid) {
            console.log('\n🎉 Spoons validation PASSED!');
            console.log('All contributors have properly spent spoons for their contributions.');
        } else {
            console.log('\n⚠️ Spoons validation FAILED!');
            console.log('Some contributors have not spent the required spoons.');
        }
    });
}

module.exports = SpoonsValidator;