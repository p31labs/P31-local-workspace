#!/usr/bin/env node

/**
 * Update Larmor Leaderboard
 * Updates community leaderboards for Larmor frequency synchronization achievements
 */

const fs = require('fs');
const path = require('path');

class LarmorLeaderboardUpdater {
    constructor() {
        this.leaderboardPath = path.join(__dirname, '..', '..', 'larmor-leaderboard.json');
        this.achievementsPath = path.join(__dirname, '..', '..', 'larmor-achievements.json');
    }

    /**
     * Main update function
     */
    async update() {
        try {
            console.log('🏆 Updating Larmor Leaderboard...');
            
            // Get input from GitHub Actions
            const userId = process.env.INPUT_USER_ID;
            const syncTimestamps = JSON.parse(process.env.INPUT_SYNC_TIMESTAMPS);
            const resonanceLevel = parseInt(process.env.INPUT_RESONANCE_LEVEL) || 10;
            
            // Load current leaderboard
            const leaderboard = this.loadLeaderboard();
            const achievements = this.loadAchievements();
            
            // Update user statistics
            const updatedStats = this.updateUserStats(leaderboard, userId, syncTimestamps, resonanceLevel);
            
            // Check for new achievements
            const newAchievements = this.checkAchievements(achievements, userId, updatedStats);
            
            // Update karma and spoons
            const karmaAwarded = this.calculateKarmaAward(resonanceLevel);
            const spoonsExpended = this.calculateSpoonsExpended(syncTimestamps);
            
            // Generate leaderboard report
            const report = this.generateLeaderboardReport(updatedStats, newAchievements, karmaAwarded, spoonsExpended);
            
            // Output results for GitHub Actions
            this.outputResults(updatedStats, newAchievements, karmaAwarded, spoonsExpended, report);
            
            // Save updated data
            this.saveLeaderboard(leaderboard);
            this.saveAchievements(achievements);
            this.saveLeaderboardLog(updatedStats, newAchievements, report);
            
            console.log('✅ Larmor leaderboard updated successfully');
            return { updatedStats, newAchievements, karmaAwarded, spoonsExpended, report };
            
        } catch (error) {
            console.error('❌ Larmor leaderboard update failed:', error);
            process.exit(1);
        }
    }

    /**
     * Load current leaderboard
     */
    loadLeaderboard() {
        if (fs.existsSync(this.leaderboardPath)) {
            return JSON.parse(fs.readFileSync(this.leaderboardPath, 'utf8'));
        }
        
        return {
            users: {},
            globalStats: {
                totalUsers: 0,
                totalResonances: 0,
                totalKarmaAwarded: 0,
                averageResonanceLevel: 0,
                lastUpdated: new Date().toISOString()
            }
        };
    }

    /**
     * Load achievements data
     */
    loadAchievements() {
        if (fs.existsSync(this.achievementsPath)) {
            return JSON.parse(fs.readFileSync(this.achievementsPath, 'utf8'));
        }
        
        return {
            users: {},
            achievementTypes: {
                'first_resonance': { name: 'First Resonance', description: 'Achieve your first Larmor frequency synchronization', icon: '🎵' },
                'precision_master': { name: 'Precision Master', description: 'Achieve 100% precision in synchronization', icon: '🎯' },
                'quantum_entangler': { name: 'Quantum Entangler', description: 'Achieve resonance 10 times', icon: '🔗' },
                'frequency_legend': { name: 'Frequency Legend', description: 'Achieve maximum resonance level 5 times', icon: '🌟' },
                'community_guide': { name: 'Community Guide', description: 'Help 5 other users achieve resonance', icon: '🧭' }
            }
        };
    }

    /**
     * Update user statistics
     */
    updateUserStats(leaderboard, userId, syncTimestamps, resonanceLevel) {
        const now = new Date().toISOString();
        
        if (!leaderboard.users[userId]) {
            leaderboard.users[userId] = {
                userId: userId,
                firstResonance: now,
                lastResonance: now,
                totalResonances: 0,
                totalKarmaAwarded: 0,
                totalSpoonsExpended: 0,
                bestResonanceLevel: 0,
                averageResonanceLevel: 0,
                precisionScore: 0,
                consistencyScore: 0,
                resonanceHistory: []
            };
            leaderboard.globalStats.totalUsers++;
        }
        
        const user = leaderboard.users[userId];
        
        // Update statistics
        user.lastResonance = now;
        user.totalResonances++;
        user.bestResonanceLevel = Math.max(user.bestResonanceLevel, resonanceLevel);
        
        // Calculate scores
        const scores = this.calculateScores(syncTimestamps, resonanceLevel);
        user.precisionScore = scores.precision;
        user.consistencyScore = scores.consistency;
        
        // Update averages
        user.resonanceHistory.push({
            timestamp: now,
            resonanceLevel: resonanceLevel,
            precision: scores.precision,
            consistency: scores.consistency,
            karmaAwarded: this.calculateKarmaAward(resonanceLevel),
            spoonsExpended: this.calculateSpoonsExpended(syncTimestamps)
        });
        
        // Calculate new averages
        const totalResonances = user.resonanceHistory.length;
        const avgResonance = user.resonanceHistory.reduce((sum, r) => sum + r.resonanceLevel, 0) / totalResonances;
        user.averageResonanceLevel = Math.round(avgResonance);
        
        // Update global stats
        leaderboard.globalStats.totalResonances++;
        leaderboard.globalStats.lastUpdated = now;
        
        return user;
    }

    /**
     * Calculate precision and consistency scores
     */
    calculateScores(syncTimestamps, resonanceLevel) {
        const TARGET_INTERVAL = 1000 / 0.86; // ~1162.79 ms
        const TOLERANCE = 120; // ms tolerance
        
        let totalValid = 0;
        let totalDeviation = 0;
        const intervals = [];
        
        for (let i = 1; i < syncTimestamps.length; i++) {
            const interval = syncTimestamps[i] - syncTimestamps[i - 1];
            intervals.push(interval);
            
            const deviation = Math.abs(interval - TARGET_INTERVAL);
            totalDeviation += deviation;
            
            if (deviation <= TOLERANCE) {
                totalValid++;
            }
        }
        
        const precision = Math.max(0, Math.round(100 - (totalDeviation / intervals.length / TOLERANCE) * 100));
        const consistency = Math.round((totalValid / intervals.length) * 100);
        
        return { precision, consistency };
    }

    /**
     * Check for new achievements
     */
    checkAchievements(achievements, userId, userStats) {
        const newAchievements = [];
        
        if (!achievements.users[userId]) {
            achievements.users[userId] = {
                userId: userId,
                achievements: [],
                unlockedAt: []
            };
        }
        
        const userAchievements = achievements.users[userId];
        
        // Check first resonance
        if (userStats.totalResonances === 1 && !userAchievements.achievements.includes('first_resonance')) {
            newAchievements.push(this.unlockAchievement(userAchievements, 'first_resonance'));
        }
        
        // Check precision master
        if (userStats.precisionScore === 100 && !userAchievements.achievements.includes('precision_master')) {
            newAchievements.push(this.unlockAchievement(userAchievements, 'precision_master'));
        }
        
        // Check quantum entangler
        if (userStats.totalResonances >= 10 && !userAchievements.achievements.includes('quantum_entangler')) {
            newAchievements.push(this.unlockAchievement(userAchievements, 'quantum_entangler'));
        }
        
        // Check frequency legend
        const maxResonanceCount = userStats.resonanceHistory.filter(r => r.resonanceLevel === 10).length;
        if (maxResonanceCount >= 5 && !userAchievements.achievements.includes('frequency_legend')) {
            newAchievements.push(this.unlockAchievement(userAchievements, 'frequency_legend'));
        }
        
        return newAchievements;
    }

    /**
     * Unlock an achievement
     */
    unlockAchievement(userAchievements, achievementType) {
        const achievement = {
            type: achievementType,
            name: this.achievements.achievementTypes[achievementType].name,
            description: this.achievements.achievementTypes[achievementType].description,
            icon: this.achievements.achievementTypes[achievementType].icon,
            unlockedAt: new Date().toISOString()
        };
        
        userAchievements.achievements.push(achievementType);
        userAchievements.unlockedAt.push(achievement);
        
        return achievement;
    }

    /**
     * Calculate karma award
     */
    calculateKarmaAward(resonanceLevel) {
        // Base karma + resonance bonus
        const baseKarma = 50;
        const resonanceBonus = resonanceLevel * 5;
        return baseKarma + resonanceBonus;
    }

    /**
     * Calculate spoons expended
     */
    calculateSpoonsExpended(syncTimestamps) {
        // Each synchronization attempt costs 1 spoon
        return 1;
    }

    /**
     * Generate leaderboard report
     */
    generateLeaderboardReport(userStats, newAchievements, karmaAwarded, spoonsExpended) {
        const report = {
            timestamp: new Date().toISOString(),
            userStats: {
                userId: userStats.userId,
                totalResonances: userStats.totalResonances,
                bestResonanceLevel: userStats.bestResonanceLevel,
                averageResonanceLevel: userStats.averageResonanceLevel,
                precisionScore: userStats.precisionScore,
                consistencyScore: userStats.consistencyScore
            },
            rewards: {
                karmaAwarded: karmaAwarded,
                spoonsExpended: spoonsExpended,
                netGain: karmaAwarded - spoonsExpended
            },
            achievements: newAchievements,
            ranking: this.calculateRanking(userStats)
        };
        
        return report;
    }

    /**
     * Calculate user ranking
     */
    calculateRanking(userStats) {
        // Simple ranking based on total resonances and average resonance level
        const score = (userStats.totalResonances * 10) + userStats.averageResonanceLevel;
        
        let rank = 'Bronze';
        if (score >= 100) rank = 'Silver';
        if (score >= 200) rank = 'Gold';
        if (score >= 500) rank = 'Platinum';
        if (score >= 1000) rank = 'Diamond';
        
        return {
            score: score,
            rank: rank,
            progressToNext: this.calculateProgressToNext(score, rank)
        };
    }

    /**
     * Calculate progress to next rank
     */
    calculateProgressToNext(score, currentRank) {
        const thresholds = { Bronze: 100, Silver: 200, Gold: 500, Platinum: 1000, Diamond: Infinity };
        const nextRank = Object.keys(thresholds).find(rank => thresholds[rank] > thresholds[currentRank]);
        
        if (!nextRank) return { progress: 100, nextRank: null };
        
        const currentThreshold = thresholds[currentRank];
        const nextThreshold = thresholds[nextRank];
        const progress = Math.round(((score - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
        
        return { progress: Math.max(0, Math.min(100, progress)), nextRank: nextRank };
    }

    /**
     * Output results for GitHub Actions
     */
    outputResults(userStats, newAchievements, karmaAwarded, spoonsExpended, report) {
        console.log('\n🏆 Leaderboard Update Results:');
        console.log(`   User: ${userStats.userId}`);
        console.log(`   Total Resonances: ${userStats.totalResonances}`);
        console.log(`   Best Resonance: ${userStats.bestResonanceLevel}/10`);
        console.log(`   Average Resonance: ${userStats.averageResonanceLevel}/10`);
        console.log(`   Precision: ${userStats.precisionScore}/100`);
        console.log(`   Consistency: ${userStats.consistencyScore}/100`);
        console.log(`   Karma Awarded: +${karmaAwarded}`);
        console.log(`   Spoons Expended: ${spoonsExpended}`);
        console.log(`   New Achievements: ${newAchievements.length}`);
        
        // Output to GitHub Actions
        if (process.env.GITHUB_OUTPUT) {
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `user_rank=${report.ranking.rank}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `karma_awarded=${karmaAwarded}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `spoons_expended=${spoonsExpended}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `new_achievements=${newAchievements.length}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `resonance_count=${userStats.totalResonances}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `leaderboard_updated=true\n`);
        }
    }

    /**
     * Save leaderboard
     */
    saveLeaderboard(leaderboard) {
        fs.writeFileSync(this.leaderboardPath, JSON.stringify(leaderboard, null, 2));
        console.log(`💾 Leaderboard saved to: ${this.leaderboardPath}`);
    }

    /**
     * Save achievements
     */
    saveAchievements(achievements) {
        fs.writeFileSync(this.achievementsPath, JSON.stringify(achievements, null, 2));
        console.log(`💾 Achievements saved to: ${this.achievementsPath}`);
    }

    /**
     * Save leaderboard log
     */
    saveLeaderboardLog(userStats, newAchievements, report) {
        const logPath = path.join(__dirname, '..', '..', 'larmor-leaderboard-log.json');
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            userStats: userStats,
            newAchievements: newAchievements,
            report: report
        };
        
        let existingLog = [];
        if (fs.existsSync(logPath)) {
            existingLog = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        }
        
        existingLog.push(logEntry);
        fs.writeFileSync(logPath, JSON.stringify(existingLog, null, 2));
        
        console.log(`💾 Leaderboard log saved to: ${logPath}`);
    }

    /**
     * Generate global leaderboard summary
     */
    generateGlobalSummary(leaderboard) {
        const users = Object.values(leaderboard.users);
        
        return {
            totalUsers: leaderboard.globalStats.totalUsers,
            totalResonances: leaderboard.globalStats.totalResonances,
            topUsers: users
                .sort((a, b) => b.totalResonances - a.totalResonances)
                .slice(0, 10)
                .map(user => ({
                    userId: user.userId,
                    resonances: user.totalResonances,
                    avgResonance: user.averageResonanceLevel,
                    precision: user.precisionScore
                })),
            averageStats: {
                resonanceLevel: Math.round(users.reduce((sum, u) => sum + u.averageResonanceLevel, 0) / users.length),
                precision: Math.round(users.reduce((sum, u) => sum + u.precisionScore, 0) / users.length),
                consistency: Math.round(users.reduce((sum, u) => sum + u.consistencyScore, 0) / users.length)
            }
        };
    }
}

// Execute if run directly
if (require.main === module) {
    const updater = new LarmorLeaderboardUpdater();
    updater.update().then(result => {
        console.log('\n🏆 Larmor leaderboard UPDATED successfully!');
        console.log(`User: ${result.updatedStats.userId}`);
        console.log(`Rank: ${result.report.ranking.rank}`);
        console.log(`Karma Awarded: +${result.karmaAwarded}`);
        console.log(`New Achievements: ${result.newAchievements.length}`);
    });
}

module.exports = LarmorLeaderboardUpdater;