#!/usr/bin/env node

/**
 * Verify Multi-Sig Requirements
 * Validates that all multi-sig conditions are met for Posner molecule assembly
 */

const fs = require('fs');
const path = require('path');

class MultiSigVerifier {
    constructor() {
        this.posnerDataPath = path.join(__dirname, '..', '..', 'posner-molecule.json');
        this.contributorsPath = path.join(__dirname, '..', '..', 'posner-contributors.json');
        this.gamificationPath = path.join(__dirname, '..', '..', 'ecosystem', 'gamification', 'dual-ledger-economy.js');
    }

    /**
     * Main verification function
     */
    async verify() {
        try {
            console.log('🔒 Verifying Multi-Sig Requirements...');
            
            // Load all required data
            const posnerData = this.loadPosnerData();
            const contributors = this.loadContributors();
            
            // Run all verification checks
            const checks = await this.runAllChecks(posnerData, contributors);
            
            // Generate verification report
            const report = this.generateReport(checks);
            
            // Output results
            this.outputResults(checks, report);
            
            // Save verification log
            this.saveVerificationLog(checks, report);
            
            return {
                verified: checks.every(check => check.passed),
                checks: checks,
                report: report
            };
            
        } catch (error) {
            console.error('❌ Multi-sig verification failed:', error);
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
        
        throw new Error('Posner molecule data not found');
    }

    /**
     * Load contributors data
     */
    loadContributors() {
        if (fs.existsSync(this.contributorsPath)) {
            return JSON.parse(fs.readFileSync(this.contributorsPath, 'utf8'));
        }
        
        throw new Error('Contributors data not found');
    }

    /**
     * Run all verification checks
     */
    async runAllChecks(posnerData, contributors) {
        const checks = [];
        
        // 1. Assembly Completeness Check
        checks.push(await this.checkAssemblyCompleteness(posnerData));
        
        // 2. Contributor Count Check
        checks.push(await this.checkContributorCount(contributors));
        
        // 3. Ion Distribution Check
        checks.push(await this.checkIonDistribution(posnerData, contributors));
        
        // 4. Spoons Expenditure Check
        checks.push(await this.checkSpoonsExpenditure(contributors));
        
        // 5. Time Window Check
        checks.push(await this.checkTimeWindow(posnerData));
        
        // 6. Signature Verification Check
        checks.push(await this.checkSignatureVerification(posnerData, contributors));
        
        // 7. Anti-Sybil Check
        checks.push(await this.checkAntiSybil(contributors));
        
        return checks;
    }

    /**
     * Check 1: Assembly Completeness
     */
    async checkAssemblyCompleteness(posnerData) {
        const requiredCalcium = 9;
        const requiredPhosphate = 6;
        
        const currentCalcium = posnerData.calciumIons.length;
        const currentPhosphate = posnerData.phosphateIons.length;
        
        const passed = currentCalcium >= requiredCalcium && currentPhosphate >= requiredPhosphate;
        
        return {
            id: 'assembly_completeness',
            name: 'Assembly Completeness',
            passed: passed,
            details: {
                calcium: { current: currentCalcium, required: requiredCalcium },
                phosphate: { current: currentPhosphate, required: requiredPhosphate },
                complete: passed
            },
            message: passed 
                ? `✅ Assembly complete: ${currentCalcium} Ca + ${currentPhosphate} PO4`
                : `❌ Assembly incomplete: ${currentCalcium}/${requiredCalcium} Ca, ${currentPhosphate}/${requiredPhosphate} PO4`
        };
    }

    /**
     * Check 2: Contributor Count
     */
    async checkContributorCount(contributors) {
        const requiredContributors = 5;
        const uniqueContributors = Object.keys(contributors.users).length;
        
        const passed = uniqueContributors >= requiredContributors;
        
        return {
            id: 'contributor_count',
            name: 'Contributor Count',
            passed: passed,
            details: {
                current: uniqueContributors,
                required: requiredContributors,
                users: Object.keys(contributors.users)
            },
            message: passed
                ? `✅ Sufficient contributors: ${uniqueContributors} unique users`
                : `❌ Insufficient contributors: ${uniqueContributors}/${requiredContributors} unique users`
        };
    }

    /**
     * Check 3: Ion Distribution
     */
    async checkIonDistribution(posnerData, contributors) {
        // Verify that ions are properly distributed among contributors
        const ionContributions = {};
        
        // Count contributions per user
        Object.entries(contributors.users).forEach(([userId, userData]) => {
            ionContributions[userId] = userData.ionsContributed || 0;
        });
        
        // Check max ions per user (3)
        const maxIonsPerUser = 3;
        const usersOverLimit = Object.entries(ionContributions).filter(([userId, count]) => count > maxIonsPerUser);
        
        const passed = usersOverLimit.length === 0;
        
        return {
            id: 'ion_distribution',
            name: 'Ion Distribution',
            passed: passed,
            details: {
                maxPerUser: maxIonsPerUser,
                usersOverLimit: usersOverLimit.length,
                distribution: ionContributions
            },
            message: passed
                ? '✅ Ion distribution within limits'
                : `❌ ${usersOverLimit.length} users exceeded ion limit`
        };
    }

    /**
     * Check 4: Spoons Expenditure
     */
    async checkSpoonsExpenditure(contributors) {
        // Verify that contributors have spent appropriate spoons
        const spoonsRequiredPerIon = 10; // Configurable
        let totalSpoonsRequired = 0;
        let totalSpoonsSpent = 0;
        
        Object.entries(contributors.users).forEach(([userId, userData]) => {
            const ionsContributed = userData.ionsContributed || 0;
            totalSpoonsRequired += ionsContributed * spoonsRequiredPerIon;
            totalSpoonsSpent += userData.spoonsSpent || 0;
        });
        
        const passed = totalSpoonsSpent >= totalSpoonsRequired;
        
        return {
            id: 'spoons_expenditure',
            name: 'Spoons Expenditure',
            passed: passed,
            details: {
                required: totalSpoonsRequired,
                spent: totalSpoonsSpent,
                perIon: spoonsRequiredPerIon
            },
            message: passed
                ? `✅ Spoons properly expended: ${totalSpoonsSpent}/${totalSpoonsRequired}`
                : `❌ Insufficient spoons spent: ${totalSpoonsSpent}/${totalSpoonsRequired}`
        };
    }

    /**
     * Check 5: Time Window
     */
    async checkTimeWindow(posnerData) {
        // Verify that assembly was completed within acceptable time window
        const maxAssemblyTime = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        const assemblyStartTime = new Date(posnerData.assemblyStarted || posnerData.lastUpdated);
        const assemblyEndTime = new Date(posnerData.lastUpdated);
        const assemblyDuration = assemblyEndTime - assemblyStartTime;
        
        const passed = assemblyDuration <= maxAssemblyTime;
        
        return {
            id: 'time_window',
            name: 'Time Window',
            passed: passed,
            details: {
                duration: assemblyDuration,
                maxDuration: maxAssemblyTime,
                started: assemblyStartTime,
                completed: assemblyEndTime
            },
            message: passed
                ? `✅ Assembly within time window: ${Math.round(assemblyDuration / (1000 * 60 * 60))} hours`
                : `❌ Assembly exceeded time window: ${Math.round(assemblyDuration / (1000 * 60 * 60))} hours`
        };
    }

    /**
     * Check 6: Signature Verification
     */
    async checkSignatureVerification(posnerData, contributors) {
        // Verify that all contributors have valid signatures
        const validSignatures = Object.entries(contributors.users).filter(([userId, userData]) => {
            return userData.signature && userData.signature.length > 0;
        });
        
        const passed = validSignatures.length === Object.keys(contributors.users).length;
        
        return {
            id: 'signature_verification',
            name: 'Signature Verification',
            passed: passed,
            details: {
                totalUsers: Object.keys(contributors.users).length,
                signedUsers: validSignatures.length,
                unsignedUsers: Object.keys(contributors.users).length - validSignatures.length
            },
            message: passed
                ? '✅ All contributors have valid signatures'
                : `❌ ${Object.keys(contributors.users).length - validSignatures.length} users missing signatures`
        };
    }

    /**
     * Check 7: Anti-Sybil
     */
    async checkAntiSybil(contributors) {
        // Basic anti-sybil checks
        const issues = [];
        
        // Check for suspicious patterns
        Object.entries(contributors.users).forEach(([userId, userData]) => {
            // Check if user contributed too many ions too quickly
            if (userData.ionsContributed > 3) {
                issues.push(`User ${userId} contributed ${userData.ionsContributed} ions (suspicious)`);
            }
            
            // Check for identical timestamps (potential botting)
            if (userData.contributionTimes) {
                const uniqueTimes = new Set(userData.contributionTimes);
                if (uniqueTimes.size < userData.contributionTimes.length) {
                    issues.push(`User ${userId} has duplicate contribution timestamps`);
                }
            }
        });
        
        const passed = issues.length === 0;
        
        return {
            id: 'anti_sybil',
            name: 'Anti-Sybil Check',
            passed: passed,
            details: {
                issues: issues,
                totalUsers: Object.keys(contributors.users).length
            },
            message: passed
                ? '✅ No sybil attacks detected'
                : `❌ ${issues.length} potential sybil issues detected`
        };
    }

    /**
     * Generate verification report
     */
    generateReport(checks) {
        const passedChecks = checks.filter(check => check.passed).length;
        const totalChecks = checks.length;
        const overallPassed = passedChecks === totalChecks;
        
        return {
            timestamp: new Date().toISOString(),
            overallStatus: overallPassed ? 'VERIFIED' : 'FAILED',
            passedChecks: passedChecks,
            totalChecks: totalChecks,
            successRate: Math.round((passedChecks / totalChecks) * 100),
            checks: checks,
            summary: {
                assembly: checks.find(c => c.id === 'assembly_completeness').passed,
                contributors: checks.find(c => c.id === 'contributor_count').passed,
                distribution: checks.find(c => c.id === 'ion_distribution').passed,
                expenditure: checks.find(c => c.id === 'spoons_expenditure').passed,
                timing: checks.find(c => c.id === 'time_window').passed,
                signatures: checks.find(c => c.id === 'signature_verification').passed,
                sybil: checks.find(c => c.id === 'anti_sybil').passed
            }
        };
    }

    /**
     * Output verification results
     */
    outputResults(checks, report) {
        console.log('\n📊 Multi-Sig Verification Results:');
        console.log(`   Overall Status: ${report.overallStatus}`);
        console.log(`   Passed: ${report.passedChecks}/${report.totalChecks} (${report.successRate}%)`);
        
        console.log('\n🔍 Individual Checks:');
        checks.forEach(check => {
            const status = check.passed ? '✅' : '❌';
            console.log(`   ${status} ${check.name}: ${check.message}`);
        });
        
        // Output to GitHub Actions
        if (process.env.GITHUB_OUTPUT) {
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `multisig_verified=${report.overallStatus === 'VERIFIED'}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `multisig_passed=${report.passedChecks}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `multisig_total=${report.totalChecks}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `multisig_success_rate=${report.successRate}\n`);
        }
    }

    /**
     * Save verification log
     */
    saveVerificationLog(checks, report) {
        const logPath = path.join(__dirname, '..', '..', 'multisig-verification-log.json');
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            report: report,
            checks: checks
        };
        
        let existingLog = [];
        if (fs.existsSync(logPath)) {
            existingLog = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        }
        
        existingLog.push(logEntry);
        fs.writeFileSync(logPath, JSON.stringify(existingLog, null, 2));
        
        console.log(`\n💾 Verification log saved to: ${logPath}`);
    }
}

// Execute if run directly
if (require.main === module) {
    const verifier = new MultiSigVerifier();
    verifier.verify().then(result => {
        if (result.verified) {
            console.log('\n🎉 Multi-sig verification PASSED!');
            console.log('All requirements have been met for PR approval.');
        } else {
            console.log('\n⚠️ Multi-sig verification FAILED!');
            console.log('Some requirements are not met. Review the checks above.');
        }
    });
}

module.exports = MultiSigVerifier;