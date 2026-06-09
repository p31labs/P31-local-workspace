#!/usr/bin/env node

/**
 * Check Posner Molecule Status
 * Verifies if the community has assembled the required Posner molecule
 * for multi-sig approval of GitHub PRs
 */

const fs = require('fs');
const path = require('path');

// Configuration
const POSNER_REQUIREMENTS = {
    totalIons: 15,        // Ca9(PO4)6 = 9 Ca + 6 PO4
    calciumIons: 9,
    phosphateIons: 6,
    uniqueContributors: 5,
    maxIonsPerUser: 3
};

class PosnerStatusChecker {
    constructor() {
        this.posnerDataPath = path.join(__dirname, '..', '..', 'posner-molecule.json');
        this.contributorsPath = path.join(__dirname, '..', '..', 'posner-contributors.json');
    }

    /**
     * Main execution function
     */
    async checkStatus() {
        try {
            console.log('🔍 Checking Posner Molecule Status...');
            
            // Load current status
            const posnerData = this.loadPosnerData();
            const contributors = this.loadContributors();
            
            // Calculate current state
            const status = this.calculateStatus(posnerData, contributors);
            
            // Output results for GitHub Actions
            this.outputGitHubActions(status);
            
            // Save status for dashboard
            this.saveStatus(status);
            
            console.log('✅ Posner status check complete');
            return status;
            
        } catch (error) {
            console.error('❌ Error checking Posner status:', error);
            process.exit(1);
        }
    }

    /**
     * Load posner molecule assembly data
     */
    loadPosnerData() {
        if (fs.existsSync(this.posnerDataPath)) {
            return JSON.parse(fs.readFileSync(this.posnerDataPath, 'utf8'));
        }
        
        return {
            calciumIons: [],
            phosphateIons: [],
            assembled: false,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Load contributor tracking data
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
     * Calculate current assembly status
     */
    calculateStatus(posnerData, contributors) {
        const currentCalcium = posnerData.calciumIons.length;
        const currentPhosphate = posnerData.phosphateIons.length;
        const totalIons = currentCalcium + currentPhosphate;
        const uniqueContributors = Object.keys(contributors.users).length;
        
        // Check if assembly is complete
        const assemblyComplete = (
            currentCalcium >= POSNER_REQUIREMENTS.calciumIons &&
            currentPhosphate >= POSNER_REQUIREMENTS.phosphateIons &&
            uniqueContributors >= POSNER_REQUIREMENTS.uniqueContributors
        );
        
        // Check individual user limits
        const usersOverLimit = Object.entries(contributors.users).filter(([userId, data]) => 
            data.ionsContributed > POSNER_REQUIREMENTS.maxIonsPerUser
        );
        
        const status = {
            assembled: assemblyComplete,
            calciumIons: currentCalcium,
            phosphateIons: currentPhosphate,
            totalIons: totalIons,
            uniqueContributors: uniqueContributors,
            requirements: POSNER_REQUIREMENTS,
            usersOverLimit: usersOverLimit.length,
            progress: {
                calcium: Math.round((currentCalcium / POSNER_REQUIREMENTS.calciumIons) * 100),
                phosphate: Math.round((currentPhosphate / POSNER_REQUIREMENTS.phosphateIons) * 100),
                contributors: Math.round((uniqueContributors / POSNER_REQUIREMENTS.uniqueContributors) * 100),
                overall: Math.round((totalIons / POSNER_REQUIREMENTS.totalIons) * 100)
            },
            timestamp: new Date().toISOString()
        };
        
        console.log(`📊 Current Status:`);
        console.log(`   Calcium Ions: ${currentCalcium}/${POSNER_REQUIREMENTS.calciumIons} (${status.progress.calcium}%)`);
        console.log(`   Phosphate Ions: ${currentPhosphate}/${POSNER_REQUIREMENTS.phosphateIons} (${status.progress.phosphate}%)`);
        console.log(`   Unique Contributors: ${uniqueContributors}/${POSNER_REQUIREMENTS.uniqueContributors} (${status.progress.contributors}%)`);
        console.log(`   Overall Progress: ${totalIons}/${POSNER_REQUIREMENTS.totalIons} (${status.progress.overall}%)`);
        console.log(`   Assembly Complete: ${assemblyComplete ? '✅ YES' : '❌ NO'}`);
        
        return status;
    }

    /**
     * Output results for GitHub Actions
     */
    outputGitHubActions(status) {
        console.log(`\n📤 GitHub Actions Output:`);
        console.log(`posner_assembled=${status.assembled}`);
        console.log(`contributors_count=${status.uniqueContributors}`);
        console.log(`required_contributors=${status.requirements.uniqueContributors}`);
        console.log(`calcium_ions=${status.calciumIons}`);
        console.log(`phosphate_ions=${status.phosphateIons}`);
        console.log(`total_ions=${status.totalIons}`);
        console.log(`progress_overall=${status.progress.overall}`);
        
        // Write to GitHub Actions output
        if (process.env.GITHUB_OUTPUT) {
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `posner_assembled=${status.assembled}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `contributors_count=${status.uniqueContributors}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `required_contributors=${status.requirements.uniqueContributors}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `calcium_ions=${status.calciumIons}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `phosphate_ions=${status.phosphateIons}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `total_ions=${status.totalIons}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `progress_overall=${status.progress.overall}\n`);
        }
    }

    /**
     * Save status for dashboard
     */
    saveStatus(status) {
        const statusPath = path.join(__dirname, '..', '..', 'posner-status.json');
        fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
        console.log(`💾 Status saved to: ${statusPath}`);
    }

    /**
     * Validate contributor data integrity
     */
    validateContributors(contributors) {
        const issues = [];
        
        // Check for users exceeding ion limits
        Object.entries(contributors.users).forEach(([userId, data]) => {
            if (data.ionsContributed > POSNER_REQUIREMENTS.maxIonsPerUser) {
                issues.push(`User ${userId} has contributed ${data.ionsContributed} ions (max: ${POSNER_REQUIREMENTS.maxIonsPerUser})`);
            }
        });
        
        // Check timestamp freshness
        const lastUpdated = new Date(contributors.lastUpdated);
        const now = new Date();
        const hoursOld = (now - lastUpdated) / (1000 * 60 * 60);
        
        if (hoursOld > 24) {
            issues.push(`Contributor data is ${Math.round(hoursOld)} hours old`);
        }
        
        return {
            valid: issues.length === 0,
            issues: issues
        };
    }

    /**
     * Generate detailed report
     */
    generateReport(status) {
        const report = {
            title: 'Posner Molecule Assembly Status Report',
            timestamp: status.timestamp,
            summary: {
                assembled: status.assembled,
                progress: status.progress.overall,
                status: status.assembled ? 'COMPLETE' : 'IN_PROGRESS'
            },
            details: {
                calciumIons: {
                    current: status.calciumIons,
                    required: status.requirements.calciumIons,
                    progress: status.progress.calcium
                },
                phosphateIons: {
                    current: status.phosphateIons,
                    required: status.requirements.phosphateIons,
                    progress: status.progress.phosphate
                },
                contributors: {
                    current: status.uniqueContributors,
                    required: status.requirements.uniqueContributors,
                    progress: status.progress.contributors
                }
            },
            recommendations: this.generateRecommendations(status)
        };
        
        return report;
    }

    /**
     * Generate recommendations based on current status
     */
    generateRecommendations(status) {
        const recommendations = [];
        
        if (!status.assembled) {
            if (status.progress.calcium < 100) {
                recommendations.push({
                    priority: 'HIGH',
                    action: 'Need more Calcium ions',
                    current: status.calciumIons,
                    required: status.requirements.calciumIons,
                    delta: status.requirements.calciumIons - status.calciumIons
                });
            }
            
            if (status.progress.phosphate < 100) {
                recommendations.push({
                    priority: 'HIGH',
                    action: 'Need more Phosphate ions',
                    current: status.phosphateIons,
                    required: status.requirements.phosphateIons,
                    delta: status.requirements.phosphateIons - status.phosphateIons
                });
            }
            
            if (status.progress.contributors < 100) {
                recommendations.push({
                    priority: 'MEDIUM',
                    action: 'Need more unique contributors',
                    current: status.uniqueContributors,
                    required: status.requirements.uniqueContributors,
                    delta: status.requirements.uniqueContributors - status.uniqueContributors
                });
            }
        }
        
        return recommendations;
    }
}

// Execute if run directly
if (require.main === module) {
    const checker = new PosnerStatusChecker();
    checker.checkStatus().then(status => {
        if (status.assembled) {
            console.log('\n🎉 Posner molecule assembly is COMPLETE!');
            console.log('PR multi-sig requirements have been met.');
        } else {
            console.log('\n⏳ Posner molecule assembly is IN PROGRESS');
            console.log('Community contributions still needed.');
        }
    });
}

module.exports = PosnerStatusChecker;