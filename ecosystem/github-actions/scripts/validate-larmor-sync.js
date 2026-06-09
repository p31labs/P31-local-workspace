#!/usr/bin/env node

/**
 * Validate Larmor Frequency Synchronization
 * Validates 0.86 Hz synchronization events from BONDING game
 */

const fs = require('fs');
const path = require('path');

class LarmorSyncValidator {
    constructor() {
        this.TARGET_FREQ = 0.86; // Hz
        this.TARGET_INTERVAL = 1000 / this.TARGET_FREQ; // ~1162.79 ms
        this.TOLERANCE = 120; // ms tolerance
        this.REQUIRED_RESONANCE = 10; // Number of consecutive successful taps
    }

    /**
     * Main validation function
     */
    async validate() {
        try {
            console.log('🎵 Validating Larmor Frequency Synchronization...');
            
            // Get input from GitHub Actions
            const encryptedCID = process.env.INPUT_ENCRYPTED_CID;
            const syncTimestamps = JSON.parse(process.env.INPUT_SYNC_TIMESTAMPS);
            const userId = process.env.INPUT_USER_ID;
            
            // Validate synchronization
            const validation = this.validateSynchronization(syncTimestamps);
            
            // Generate validation report
            const report = this.generateValidationReport(validation, userId, encryptedCID);
            
            // Output results for GitHub Actions
            this.outputResults(validation, report);
            
            // Save validation log
            this.saveValidationLog(validation, report);
            
            console.log('✅ Larmor synchronization validation complete');
            return validation;
            
        } catch (error) {
            console.error('❌ Larmor synchronization validation failed:', error);
            process.exit(1);
        }
    }

    /**
     * Validate synchronization timestamps
     */
    validateSynchronization(timestamps) {
        if (!Array.isArray(timestamps) || timestamps.length < this.REQUIRED_RESONANCE) {
            return {
                valid: false,
                reason: 'Insufficient synchronization attempts',
                details: {
                    required: this.REQUIRED_RESONANCE,
                    provided: timestamps.length
                }
            };
        }

        let consecutiveValid = 0;
        let totalValid = 0;
        const intervals = [];
        const deviations = [];

        for (let i = 1; i < timestamps.length; i++) {
            const interval = timestamps[i] - timestamps[i - 1];
            intervals.push(interval);
            
            const deviation = Math.abs(interval - this.TARGET_INTERVAL);
            deviations.push(deviation);
            
            if (deviation <= this.TOLERANCE) {
                consecutiveValid++;
                totalValid++;
            } else {
                consecutiveValid = 0; // Reset consecutive count
            }
        }

        const valid = consecutiveValid >= this.REQUIRED_RESONANCE;
        
        return {
            valid: valid,
            reason: valid ? 'Synchronization successful' : 'Insufficient consecutive valid intervals',
            details: {
                targetFrequency: this.TARGET_FREQ,
                targetInterval: this.TARGET_INTERVAL,
                tolerance: this.TOLERANCE,
                requiredResonance: this.REQUIRED_RESONANCE,
                totalAttempts: timestamps.length,
                totalValid: totalValid,
                consecutiveValid: consecutiveValid,
                intervals: intervals,
                deviations: deviations,
                averageInterval: intervals.reduce((a, b) => a + b, 0) / intervals.length,
                averageDeviation: deviations.reduce((a, b) => a + b, 0) / deviations.length
            }
        };
    }

    /**
     * Generate validation report
     */
    generateValidationReport(validation, userId, encryptedCID) {
        const report = {
            timestamp: new Date().toISOString(),
            userId: userId,
            encryptedCID: encryptedCID,
            validation: validation,
            summary: {
                frequency: this.TARGET_FREQ,
                tolerance: this.TOLERANCE,
                requiredResonance: this.REQUIRED_RESONANCE,
                achievedResonance: validation.details.consecutiveValid,
                success: validation.valid
            },
            metrics: {
                precision: this.calculatePrecision(validation.details),
                consistency: this.calculateConsistency(validation.details),
                resonanceLevel: this.calculateResonanceLevel(validation.details)
            },
            recommendations: this.generateRecommendations(validation)
        };
        
        return report;
    }

    /**
     * Calculate precision score
     */
    calculatePrecision(details) {
        const avgDeviation = details.averageDeviation;
        const maxAcceptableDeviation = this.TOLERANCE;
        
        if (avgDeviation <= maxAcceptableDeviation) {
            return Math.round(100 - (avgDeviation / maxAcceptableDeviation) * 50);
        } else {
            return Math.max(0, Math.round(50 - (avgDeviation - maxAcceptableDeviation) / 50));
        }
    }

    /**
     * Calculate consistency score
     */
    calculateConsistency(details) {
        const validRatio = details.totalValid / details.totalAttempts;
        return Math.round(validRatio * 100);
    }

    /**
     * Calculate resonance level
     */
    calculateResonanceLevel(details) {
        const achieved = details.consecutiveValid;
        const required = this.REQUIRED_RESONANCE;
        
        if (achieved >= required) {
            return Math.min(100, Math.round((achieved / required) * 100));
        } else {
            return Math.round((achieved / required) * 100);
        }
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(validation) {
        const recommendations = [];
        
        if (!validation.valid) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Synchronization',
                action: `Achieve ${this.REQUIRED_RESONANCE} consecutive valid intervals within ${this.TOLERANCE}ms tolerance`
            });
        }
        
        if (validation.details.averageDeviation > this.TOLERANCE * 0.5) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Precision',
                action: 'Improve timing precision - average deviation is high'
            });
        }
        
        if (validation.details.totalValid / validation.details.totalAttempts < 0.8) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Consistency',
                action: 'Improve consistency - too many intervals outside tolerance'
            });
        }
        
        return recommendations;
    }

    /**
     * Output results for GitHub Actions
     */
    outputResults(validation, report) {
        console.log('\n🎵 Larmor Synchronization Results:');
        console.log(`   Status: ${validation.valid ? '✅ VALID' : '❌ INVALID'}`);
        console.log(`   Reason: ${validation.reason}`);
        console.log(`   Resonance Level: ${report.metrics.resonanceLevel}/100`);
        console.log(`   Precision: ${report.metrics.precision}/100`);
        console.log(`   Consistency: ${report.metrics.consistency}/100`);
        
        // Output to GitHub Actions
        if (process.env.GITHUB_OUTPUT) {
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `sync_valid=${validation.valid}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `resonance_level=${report.metrics.resonanceLevel}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `precision_score=${report.metrics.precision}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `consistency_score=${report.metrics.consistency}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `frequency=${this.TARGET_FREQ}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `tolerance=${this.TOLERANCE}\n`);
        }
    }

    /**
     * Save validation log
     */
    saveValidationLog(validation, report) {
        const logPath = path.join(__dirname, '..', '..', 'larmor-validation-log.json');
        
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
        
        console.log(`💾 Larmor validation log saved to: ${logPath}`);
    }

    /**
     * Generate detailed analysis
     */
    generateDetailedAnalysis(validation) {
        const analysis = {
            frequencyAnalysis: {
                target: this.TARGET_FREQ,
                achieved: 1000 / validation.details.averageInterval,
                deviation: Math.abs(this.TARGET_FREQ - (1000 / validation.details.averageInterval))
            },
            timingAnalysis: {
                targetInterval: this.TARGET_INTERVAL,
                averageInterval: validation.details.averageInterval,
                minInterval: Math.min(...validation.details.intervals),
                maxInterval: Math.max(...validation.details.intervals)
            },
            qualityMetrics: {
                precision: this.calculatePrecision(validation.details),
                consistency: this.calculateConsistency(validation.details),
                stability: this.calculateStability(validation.details.intervals)
            }
        };
        
        return analysis;
    }

    /**
     * Calculate stability score
     */
    calculateStability(intervals) {
        const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);
        
        // Lower standard deviation = higher stability
        const maxAcceptableStdDev = this.TOLERANCE / 2;
        const stability = Math.max(0, Math.round(100 - (stdDev / maxAcceptableStdDev) * 100));
        
        return Math.max(0, stability);
    }
}

// Execute if run directly
if (require.main === module) {
    const validator = new LarmorSyncValidator();
    validator.validate().then(validation => {
        if (validation.valid) {
            console.log('\n🎉 Larmor synchronization VALIDATED!');
            console.log('The 0.86 Hz resonance has been successfully achieved.');
        } else {
            console.log('\n⚠️ Larmor synchronization FAILED!');
            console.log('The synchronization did not meet the required precision.');
        }
    });
}

module.exports = LarmorSyncValidator;