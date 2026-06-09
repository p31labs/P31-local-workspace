#!/usr/bin/env node

/**
 * Check Ion Contributions
 * Validates that required ions have been properly contributed to the Posner molecule
 */

const fs = require('fs');
const path = require('path');

class IonContributionChecker {
    constructor() {
        this.posnerDataPath = path.join(__dirname, '..', '..', 'posner-molecule.json');
        this.contributorsPath = path.join(__dirname, '..', '..', 'posner-contributors.json');
    }

    /**
     * Main execution function
     */
    async checkContributions() {
        try {
            console.log('🧪 Checking Ion Contributions...');
            
            // Load data
            const posnerData = this.loadPosnerData();
            const contributors = this.loadContributors();
            
            // Validate contributions
            const validation = this.validateContributions(posnerData, contributors);
            
            // Generate contribution report
            const report = this.generateContributionReport(validation);
            
            // Output results
            this.outputResults(validation, report);
            
            // Save contribution log
            this.saveContributionLog(validation, report);
            
            return {
                valid: validation.valid,
                validation: validation,
                report: report
            };
            
        } catch (error) {
            console.error('❌ Ion contribution check failed:', error);
            process.exit(1);
        }
    }

    /**
     * Load posner molecule data
     */
    loadPosnerData() {
        if (fs.existsSync(this.posnerDataPath)) {
            return JSON.parse(fs.readFileSync(this.posnerDataPath, 'utf8'));
        }
        
        return {
            calciumIons: [],
            phosphateIons: [],
            assemblyStarted: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
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
     * Validate ion contributions
     */
    validateContributions(posnerData, contributors) {
        const validation = {
            valid: true,
            issues: [],
            calcium: this.validateCalciumContributions(posnerData.calciumIons, contributors),
            phosphate: this.validatePhosphateContributions(posnerData.phosphateIons, contributors),
            overall: this.validateOverallContributions(posnerData, contributors)
        };
        
        // Check for issues
        if (validation.calcium.missing > 0) {
            validation.issues.push(`Missing ${validation.calcium.missing} Calcium ions`);
            validation.valid = false;
        }
        
        if (validation.phosphate.missing > 0) {
            validation.issues.push(`Missing ${validation.phosphate.missing} Phosphate ions`);
            validation.valid = false;
        }
        
        if (validation.overall.contributors < 5) {
            validation.issues.push(`Insufficient contributors: ${validation.overall.contributors}/5`);
            validation.valid = false;
        }
        
        return validation;
    }

    /**
     * Validate Calcium ion contributions
     */
    validateCalciumContributions(calciumIons, contributors) {
        const requiredCalcium = 9;
        const currentCalcium = calciumIons.length;
        const missing = Math.max(0, requiredCalcium - currentCalcium);
        
        // Check contributor distribution
        const contributorCount = Object.keys(contributors.users).length;
        const avgCalciumPerContributor = currentCalcium / Math.max(1, contributorCount);
        
        // Check for over-contribution
        const overContributors = Object.entries(contributors.users).filter(([userId, data]) => {
            return data.calciumContributed > 3; // Max 3 ions per user
        });
        
        return {
            required: requiredCalcium,
            current: currentCalcium,
            missing: missing,
            contributors: contributorCount,
            avgPerContributor: avgCalciumPerContributor,
            overContributors: overContributors.length,
            complete: currentCalcium >= requiredCalcium
        };
    }

    /**
     * Validate Phosphate ion contributions
     */
    validatePhosphateContributions(phosphateIons, contributors) {
        const requiredPhosphate = 6;
        const currentPhosphate = phosphateIons.length;
        const missing = Math.max(0, requiredPhosphate - currentPhosphate);
        
        // Check contributor distribution
        const contributorCount = Object.keys(contributors.users).length;
        const avgPhosphatePerContributor = currentPhosphate / Math.max(1, contributorCount);
        
        // Check for over-contribution
        const overContributors = Object.entries(contributors.users).filter(([userId, data]) => {
            return data.phosphateContributed > 3; // Max 3 ions per user
        });
        
        return {
            required: requiredPhosphate,
            current: currentPhosphate,
            missing: missing,
            contributors: contributorCount,
            avgPerContributor: avgPhosphatePerContributor,
            overContributors: overContributors.length,
            complete: currentPhosphate >= requiredPhosphate
        };
    }

    /**
     * Validate overall contributions
     */
    validateOverallContributions(posnerData, contributors) {
        const totalIons = posnerData.calciumIons.length + posnerData.phosphateIons.length;
        const requiredIons = 15; // Ca9(PO4)6
        const uniqueContributors = Object.keys(contributors.users).length;
        
        // Check ion distribution
        const ionDistribution = {};
        Object.entries(contributors.users).forEach(([userId, userData]) => {
            ionDistribution[userId] = (userData.calciumContributed || 0) + (userData.phosphateContributed || 0);
        });
        
        // Check for users exceeding limits
        const usersOverLimit = Object.entries(ionDistribution).filter(([userId, count]) => count > 3);
        
        return {
            totalIons: totalIons,
            requiredIons: requiredIons,
            missingIons: Math.max(0, requiredIons - totalIons),
            uniqueContributors: uniqueContributors,
            requiredContributors: 5,
            ionDistribution: ionDistribution,
            usersOverLimit: usersOverLimit.length,
            complete: totalIons >= requiredIons && uniqueContributors >= 5
        };
    }

    /**
     * Generate contribution report
     */
    generateContributionReport(validation) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                valid: validation.valid,
                totalIssues: validation.issues.length,
                calciumComplete: validation.calcium.complete,
                phosphateComplete: validation.phosphate.complete,
                contributorsComplete: validation.overall.uniqueContributors >= 5
            },
            details: {
                calcium: {
                    status: validation.calcium.complete ? 'COMPLETE' : 'INCOMPLETE',
                    progress: Math.round((validation.calcium.current / validation.calcium.required) * 100),
                    current: validation.calcium.current,
                    required: validation.calcium.required,
                    missing: validation.calcium.missing,
                    contributors: validation.calcium.contributors
                },
                phosphate: {
                    status: validation.phosphate.complete ? 'COMPLETE' : 'INCOMPLETE',
                    progress: Math.round((validation.phosphate.current / validation.phosphate.required) * 100),
                    current: validation.phosphate.current,
                    required: validation.phosphate.required,
                    missing: validation.phosphate.missing,
                    contributors: validation.phosphate.contributors
                },
                overall: {
                    status: validation.overall.complete ? 'COMPLETE' : 'INCOMPLETE',
                    progress: Math.round((validation.overall.totalIons / validation.overall.requiredIons) * 100),
                    totalIons: validation.overall.totalIons,
                    requiredIons: validation.overall.requiredIons,
                    uniqueContributors: validation.overall.uniqueContributors,
                    requiredContributors: validation.overall.requiredContributors
                }
            },
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
        
        if (!validation.calcium.complete) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Calcium Ions',
                action: `Need ${validation.calcium.missing} more Calcium ions`,
                current: validation.calcium.current,
                required: validation.calcium.required
            });
        }
        
        if (!validation.phosphate.complete) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Phosphate Ions',
                action: `Need ${validation.phosphate.missing} more Phosphate ions`,
                current: validation.phosphate.current,
                required: validation.phosphate.required
            });
        }
        
        if (validation.overall.uniqueContributors < 5) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Contributors',
                action: `Need ${5 - validation.overall.uniqueContributors} more unique contributors`,
                current: validation.overall.uniqueContributors,
                required: 5
            });
        }
        
        if (validation.calcium.overContributors > 0) {
            recommendations.push({
                priority: 'LOW',
                category: 'Distribution',
                action: `${validation.calcium.overContributors} users exceeded Calcium ion limit`
            });
        }
        
        if (validation.phosphate.overContributors > 0) {
            recommendations.push({
                priority: 'LOW',
                category: 'Distribution',
                action: `${validation.phosphate.overContributors} users exceeded Phosphate ion limit`
            });
        }
        
        return recommendations;
    }

    /**
     * Output results
     */
    outputResults(validation, report) {
        console.log('\n🧪 Ion Contribution Results:');
        console.log(`   Overall Status: ${validation.valid ? '✅ VALID' : '❌ INVALID'}`);
        console.log(`   Issues Found: ${validation.issues.length}`);
        
        console.log('\n📊 Calcium Ions:');
        console.log(`   Status: ${validation.calcium.complete ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
        console.log(`   Progress: ${Math.round((validation.calcium.current / validation.calcium.required) * 100)}%`);
        console.log(`   Current: ${validation.calcium.current}/${validation.calcium.required}`);
        console.log(`   Contributors: ${validation.calcium.contributors}`);
        
        console.log('\n📊 Phosphate Ions:');
        console.log(`   Status: ${validation.phosphate.complete ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
        console.log(`   Progress: ${Math.round((validation.phosphate.current / validation.phosphate.required) * 100)}%`);
        console.log(`   Current: ${validation.phosphate.current}/${validation.phosphate.required}`);
        console.log(`   Contributors: ${validation.phosphate.contributors}`);
        
        console.log('\n📊 Overall Assembly:');
        console.log(`   Status: ${validation.overall.complete ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
        console.log(`   Total Ions: ${validation.overall.totalIons}/${validation.overall.requiredIons}`);
        console.log(`   Unique Contributors: ${validation.overall.uniqueContributors}/${validation.overall.requiredContributors}`);
        
        if (validation.issues.length > 0) {
            console.log('\n⚠️ Issues Found:');
            validation.issues.forEach(issue => console.log(`   - ${issue}`));
        }
        
        // Output to GitHub Actions
        if (process.env.GITHUB_OUTPUT) {
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `ions_valid=${validation.valid}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `calcium_complete=${validation.calcium.complete}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `phosphate_complete=${validation.phosphate.complete}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `contributors_needed=${Math.max(0, 5 - validation.overall.uniqueContributors)}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `ions_missing=${validation.overall.missingIons}\n`);
        }
    }

    /**
     * Save contribution log
     */
    saveContributionLog(validation, report) {
        const logPath = path.join(__dirname, '..', '..', 'ion-contribution-log.json');
        
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
        
        console.log(`\n💾 Contribution log saved to: ${logPath}`);
    }

    /**
     * Generate detailed ion tracking
     */
    generateIonTracking(posnerData, contributors) {
        const tracking = {
            calcium: {
                ions: posnerData.calciumIons,
                contributors: Object.entries(contributors.users).map(([userId, data]) => ({
                    userId: userId,
                    contributed: data.calciumContributed || 0,
                    timestamp: data.lastCalciumContribution
                }))
            },
            phosphate: {
                ions: posnerData.phosphateIons,
                contributors: Object.entries(contributors.users).map(([userId, data]) => ({
                    userId: userId,
                    contributed: data.phosphateContributed || 0,
                    timestamp: data.lastPhosphateContribution
                }))
            }
        };
        
        return tracking;
    }
}

// Execute if run directly
if (require.main === module) {
    const checker = new IonContributionChecker();
    checker.checkContributions().then(result => {
        if (result.valid) {
            console.log('\n🎉 Ion contributions are VALID!');
            console.log('All required ions have been properly contributed.');
        } else {
            console.log('\n⚠️ Ion contributions have ISSUES!');
            console.log('Review the validation results above.');
        }
    });
}

module.exports = IonContributionChecker;