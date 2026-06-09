#!/usr/bin/env node

/**
 * Achievement Service
 * Headless service for processing game achievements and triggering notifications
 * 
 * This service operates on a publish-subscribe architecture, listening for
 * empirical formula strings from the BONDING game and dispatching
 * "Secret Unlocked" WebSocket notifications to the frontend.
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class AchievementService extends EventEmitter {
    constructor() {
        super();
        this.achievementMap = this.loadAchievementMap();
        this.leaderboard = this.loadLeaderboard();
        this.activeChallenges = this.loadChallenges();
    }

    /**
     * Load achievement hash map from encrypted file
     */
    loadAchievementMap() {
        const mapPath = path.join(__dirname, 'achievement-map.json');
        if (fs.existsSync(mapPath)) {
            const encryptedData = fs.readFileSync(mapPath, 'utf8');
            // In production, this would be properly encrypted
            return JSON.parse(encryptedData);
        }
        
        // Default achievement map
        return {
            // Secret molecular recipes that unlock achievements
            'Ca9(PO4)6': {
                name: 'Quantum Architect',
                description: 'Assembled the Posner molecule - the key to quantum biological computing',
                reward: { karma: 100, cosmetic: 'quantum-skin' },
                unlockMessage: 'The quantum cage is complete! Signal protection achieved.',
                channel: 'quantum-architects'
            },
            'C6H12O6': {
                name: 'Biochemist',
                description: 'Created glucose - the fundamental energy molecule',
                reward: { karma: 50, cosmetic: 'bio-skin' },
                unlockMessage: 'Energy unlocked! The foundation of life.',
                channel: 'biochemistry'
            },
            'C8H10N4O2': {
                name: 'Stimulant Master',
                description: 'Synthesized caffeine - the universal productivity catalyst',
                reward: { karma: 25, cosmetic: 'stimulant-skin' },
                unlockMessage: 'Caffeine detected! Alertness levels rising.',
                channel: 'productivity'
            },
            'C10H14N2': {
                name: 'Neurochemist',
                description: 'Created nicotine - the complex neuroactive compound',
                reward: { karma: 30, cosmetic: 'neuro-skin' },
                unlockMessage: 'Neural pathways activated!',
                channel: 'neuroscience'
            },
            'C17H19NO3': {
                name: 'Pain Relief Pioneer',
                description: 'Synthesized morphine - the powerful analgesic',
                reward: { karma: 75, cosmetic: 'pain-skin' },
                unlockMessage: 'Pain management protocols engaged.',
                channel: 'medicine'
            }
        };
    }

    /**
     * Load leaderboard data
     */
    loadLeaderboard() {
        const leaderboardPath = path.join(__dirname, 'leaderboard.json');
        if (fs.existsSync(leaderboardPath)) {
            return JSON.parse(fs.readFileSync(leaderboardPath, 'utf8'));
        }
        return {
            karma: [],
            achievements: [],
            molecules: []
        };
    }

    /**
     * Load active challenges
     */
    loadChallenges() {
        const challengesPath = path.join(__dirname, 'challenges.json');
        if (fs.existsSync(challengesPath)) {
            return JSON.parse(fs.readFileSync(challengesPath, 'utf8'));
        }
        return [
            {
                id: 'quantum-cage',
                name: 'The Tetrahedron Protocol',
                description: 'Assemble the Posner molecule to unlock quantum computing secrets',
                difficulty: 'Expert',
                reward: { karma: 200, node: 1 },
                active: true
            },
            {
                id: 'larmor-resonance',
                name: 'Larmor Frequency Lock',
                description: 'Synchronize your inputs to the 0.86 Hz Larmor frequency',
                difficulty: 'Intermediate',
                reward: { karma: 100, spoons: 5 },
                active: true
            },
            {
                id: 'nmr-puzzle',
                name: 'NMR Spectroscopy Challenge',
                description: 'Decode the NMR spectra to reveal hidden molecular structures',
                difficulty: 'Advanced',
                reward: { karma: 150, academic: true },
                active: true
            }
        ];
    }

    /**
     * Process empirical formula from game
     */
    processEmpiricalFormula(formula, userId, userName) {
        console.log(`Processing formula: ${formula} for user: ${userName}`);
        
        const achievement = this.achievementMap[formula];
        
        if (achievement) {
            this.unlockAchievement(achievement, userId, userName);
        } else {
            // Check if it's a complex molecule worth tracking
            this.trackMolecule(formula, userId, userName);
        }
    }

    /**
     * Unlock an achievement and dispatch notifications
     */
    unlockAchievement(achievement, userId, userName) {
        console.log(`Achievement unlocked: ${achievement.name} for ${userName}`);
        
        // Update leaderboard
        this.updateLeaderboard(userId, userName, achievement);
        
        // Dispatch WebSocket notification
        const notification = {
            type: 'achievement_unlocked',
            achievement: achievement,
            user: { id: userId, name: userName },
            timestamp: new Date().toISOString()
        };
        
        this.emit('achievement', notification);
        
        // Broadcast to Discord if configured
        this.broadcastToDiscord(achievement, userName);
        
        // Update user karma and rewards
        this.applyRewards(userId, achievement.reward);
    }

    /**
     * Track complex molecule creation
     */
    trackMolecule(formula, userId, userName) {
        const moleculeData = {
            formula: formula,
            userId: userId,
            userName: userName,
            timestamp: new Date().toISOString(),
            complexity: this.calculateComplexity(formula)
        };
        
        // Add to leaderboard
        this.leaderboard.molecules.push(moleculeData);
        this.leaderboard.molecules.sort((a, b) => b.complexity - a.complexity);
        
        // Keep only top 100
        if (this.leaderboard.molecules.length > 100) {
            this.leaderboard.molecules = this.leaderboard.molecules.slice(0, 100);
        }
        
        // Save leaderboard
        this.saveLeaderboard();
        
        // Check if it's a particularly complex molecule
        if (moleculeData.complexity > 50) {
            const notification = {
                type: 'complex_molecule',
                formula: formula,
                user: { id: userId, name: userName },
                complexity: moleculeData.complexity,
                timestamp: new Date().toISOString()
            };
            
            this.emit('complex_molecule', notification);
        }
    }

    /**
     * Calculate molecular complexity score
     */
    calculateComplexity(formula) {
        // Simple complexity calculation based on formula length and element diversity
        const elements = new Set(formula.match(/[A-Z][a-z]*/g));
        const length = formula.length;
        return (elements.size * 10) + (length * 2);
    }

    /**
     * Update leaderboard with achievement
     */
    updateLeaderboard(userId, userName, achievement) {
        // Update karma leaderboard
        const karmaEntry = this.leaderboard.karma.find(entry => entry.userId === userId);
        if (karmaEntry) {
            karmaEntry.karma += achievement.reward.karma;
            karmaEntry.achievements++;
        } else {
            this.leaderboard.karma.push({
                userId: userId,
                userName: userName,
                karma: achievement.reward.karma,
                achievements: 1,
                firstAchievement: new Date().toISOString()
            });
        }
        
        // Update achievements leaderboard
        this.leaderboard.achievements.push({
            userId: userId,
            userName: userName,
            achievement: achievement.name,
            timestamp: new Date().toISOString()
        });
        
        // Sort and save
        this.leaderboard.karma.sort((a, b) => b.karma - a.karma);
        this.saveLeaderboard();
    }

    /**
     * Apply rewards to user
     */
    applyRewards(userId, reward) {
        // In a real implementation, this would update the user's profile
        // For now, we'll just log it
        console.log(`Rewards applied to user ${userId}:`, reward);
    }

    /**
     * Broadcast achievement to Discord
     */
    broadcastToDiscord(achievement, userName) {
        const discordMessage = {
            embeds: [{
                title: '🎉 Achievement Unlocked!',
                description: `**${userName}** has unlocked: **${achievement.name}**`,
                color: 0x6366f1,
                fields: [
                    {
                        name: 'Description',
                        value: achievement.description,
                        inline: false
                    },
                    {
                        name: 'Reward',
                        value: `+${achievement.reward.karma} Karma`,
                        inline: true
                    },
                    {
                        name: 'Cosmetic',
                        value: achievement.reward.cosmetic || 'None',
                        inline: true
                    }
                ],
                timestamp: new Date().toISOString()
            }]
        };
        
        // In a real implementation, this would send to Discord webhook
        console.log('Discord broadcast:', discordMessage);
    }

    /**
     * Save leaderboard data
     */
    saveLeaderboard() {
        const leaderboardPath = path.join(__dirname, 'leaderboard.json');
        fs.writeFileSync(leaderboardPath, JSON.stringify(this.leaderboard, null, 2));
    }

    /**
     * Get current leaderboard
     */
    getLeaderboard() {
        return this.leaderboard;
    }

    /**
     * Get active challenges
     */
    getChallenges() {
        return this.activeChallenges;
    }

    /**
     * Start the achievement service
     */
    start() {
        console.log('Achievement Service started');
        console.log(`Loaded ${Object.keys(this.achievementMap).length} achievements`);
        console.log(`Active challenges: ${this.activeChallenges.length}`);
        
        // Listen for formula submissions
        this.on('formula_submitted', (data) => {
            this.processEmpiricalFormula(data.formula, data.userId, data.userName);
        });
        
        return this;
    }
}

// Export for use in other modules
module.exports = AchievementService;

// If run directly, start the service
if (require.main === module) {
    const service = new AchievementService();
    service.start();
    
    // Example usage
    setTimeout(() => {
        service.emit('formula_submitted', {
            formula: 'Ca9(PO4)6',
            userId: 'user123',
            userName: 'QuantumExplorer'
        });
    }, 1000);
}