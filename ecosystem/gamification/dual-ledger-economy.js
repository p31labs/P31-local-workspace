#!/usr/bin/env node

/**
 * Dual-Ledger Economy System
 * Implements the Karma and Spoons ledger system for P31 ecosystem
 * 
 * This system manages two complementary currencies:
 * - Karma: Peer-reviewed reputation points for positive contributions
 * - Spoons: Cognitive capacity tracking to prevent burnout
 * 
 * Inspired by disability metaphors and neurodivergent community needs.
 */

class DualLedgerEconomy {
    constructor() {
        this.users = new Map();
        this.karmaDecayRate = 0.01; // 1% daily decay
        this.spoonsDecayRate = 0.1; // 10% hourly regeneration
        this.spoonsMax = 100;
        this.karmaThresholds = {
            'Supporter': 0,
            'Node': 50,
            'Guild Leader': 200,
            'Core Team': 500
        };
    }

    /**
     * Initialize user account
     */
    createUser(userId, userName) {
        if (this.users.has(userId)) {
            throw new Error('User already exists');
        }
        
        const user = {
            id: userId,
            name: userName,
            karma: 0,
            spoons: this.spoonsMax,
            nodeCount: 0,
            tier: 'Supporter',
            lastKarmaDecay: Date.now(),
            lastSpoonsRegeneration: Date.now(),
            contributions: [],
            spoonsSpent: [],
            createdAt: Date.now()
        };
        
        this.users.set(userId, user);
        console.log(`User created: ${userName} (${userId})`);
        return user;
    }

    /**
     * Award karma for positive contributions
     */
    awardKarma(userId, amount, reason, fromUserId = null) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        user.karma += amount;
        user.contributions.push({
            type: 'karma_award',
            amount: amount,
            reason: reason,
            fromUserId: fromUserId,
            timestamp: Date.now()
        });
        
        this.updateTier(user);
        console.log(`Karma awarded: +${amount} to ${user.name} for "${reason}"`);
        
        return {
            success: true,
            newKarma: user.karma,
            tier: user.tier
        };
    }

    /**
     * Spend spoons for platform interactions
     */
    spendSpoons(userId, amount, activity) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        if (user.spoons < amount) {
            return {
                success: false,
                message: 'Insufficient spoons',
                available: user.spoons,
                required: amount
            };
        }
        
        user.spoons -= amount;
        user.spoonsSpent.push({
            amount: amount,
            activity: activity,
            timestamp: Date.now()
        });
        
        console.log(`Spoons spent: -${amount} by ${user.name} for "${activity}"`);
        
        // Check if user is signaling low capacity
        if (user.spoons < 20) {
            this.emit('low_spoons_warning', {
                userId: userId,
                userName: user.name,
                spoons: user.spoons,
                message: 'User may need to disengage'
            });
        }
        
        return {
            success: true,
            remainingSpoons: user.spoons
        };
    }

    /**
     * Regenerate spoons over time
     */
    regenerateSpoons(userId) {
        const user = this.users.get(userId);
        if (!user) return { success: false, message: 'User not found' };
        
        const now = Date.now();
        const hoursPassed = (now - user.lastSpoonsRegeneration) / (1000 * 60 * 60);
        
        if (hoursPassed >= 1) {
            const spoonsRegenerated = Math.floor(this.spoonsMax * this.spoonsDecayRate * hoursPassed);
            user.spoons = Math.min(this.spoonsMax, user.spoons + spoonsRegenerated);
            user.lastSpoonsRegeneration = now;
            
            console.log(`Spoons regenerated: +${spoonsRegenerated} for ${user.name}`);
            return {
                success: true,
                regenerated: spoonsRegenerated,
                total: user.spoons
            };
        }
        
        return { success: false, message: 'Too soon to regenerate' };
    }

    /**
     * Decay karma over time to prevent hoarding
     */
    decayKarma(userId) {
        const user = this.users.get(userId);
        if (!user) return { success: false, message: 'User not found' };
        
        const now = Date.now();
        const daysPassed = (now - user.lastKarmaDecay) / (1000 * 60 * 60 * 24);
        
        if (daysPassed >= 1) {
            const karmaLost = Math.floor(user.karma * this.karmaDecayRate * daysPassed);
            user.karma = Math.max(0, user.karma - karmaLost);
            user.lastKarmaDecay = now;
            
            console.log(`Karma decayed: -${karmaLost} for ${user.name}`);
            return {
                success: true,
                lost: karmaLost,
                total: user.karma
            };
        }
        
        return { success: false, message: 'Too soon to decay' };
    }

    /**
     * Submit formal work package for peer review
     */
    submitWorkPackage(userId, title, description, estimatedSpoons) {
        const user = this.users.get(userId);
        if (!user) return { success: false, message: 'User not found' };
        
        if (user.spoons < estimatedSpoons) {
            return {
                success: false,
                message: 'Insufficient spoons for this work package'
            };
        }
        
        const workPackage = {
            id: this.generateId(),
            title: title,
            description: description,
            estimatedSpoons: estimatedSpoons,
            submitterId: userId,
            status: 'pending_review',
            reviewers: [],
            karmaReward: 0,
            createdAt: Date.now()
        };
        
        user.contributions.push({
            type: 'work_package',
            workPackage: workPackage,
            timestamp: Date.now()
        });
        
        console.log(`Work package submitted: "${title}" by ${user.name}`);
        return {
            success: true,
            workPackage: workPackage
        };
    }

    /**
     * Review work package and award karma
     */
    reviewWorkPackage(workPackageId, reviewerId, karmaAward, feedback) {
        // Find work package
        let targetUser = null;
        let workPackage = null;
        
        for (const [userId, user] of this.users) {
            const contribution = user.contributions.find(c => 
                c.type === 'work_package' && c.workPackage.id === workPackageId
            );
            if (contribution) {
                targetUser = user;
                workPackage = contribution.workPackage;
                break;
            }
        }
        
        if (!workPackage) return { success: false, message: 'Work package not found' };
        if (workPackage.status !== 'pending_review') return { success: false, message: 'Work package already reviewed' };
        
        // Award karma
        this.awardKarma(targetUser.id, karmaAward, `Work package: ${workPackage.title}`, reviewerId);
        
        workPackage.status = 'completed';
        workPackage.reviewers.push({
            reviewerId: reviewerId,
            karmaAward: karmaAward,
            feedback: feedback,
            timestamp: Date.now()
        });
        
        console.log(`Work package reviewed: "${workPackage.title}" - +${karmaAward} karma awarded`);
        return { success: true, karmaAwarded: karmaAward };
    }

    /**
     * Get user status
     */
    getUserStatus(userId) {
        const user = this.users.get(userId);
        if (!user) return null;
        
        return {
            id: user.id,
            name: user.name,
            karma: user.karma,
            spoons: user.spoons,
            nodeCount: user.nodeCount,
            tier: user.tier,
            contributions: user.contributions.length,
            spoonsSpent: user.spoonsSpent.length,
            lastActive: Math.max(
                user.lastKarmaDecay,
                user.lastSpoonsRegeneration,
                user.contributions[user.contributions.length - 1]?.timestamp || 0
            )
        };
    }

    /**
     * Get leaderboard
     */
    getLeaderboard() {
        const usersArray = Array.from(this.users.values());
        
        return {
            karma: usersArray
                .sort((a, b) => b.karma - a.karma)
                .slice(0, 10)
                .map(u => ({ name: u.name, karma: u.karma, tier: u.tier })),
            
            spoons: usersArray
                .sort((a, b) => b.spoons - a.spoons)
                .slice(0, 10)
                .map(u => ({ name: u.name, spoons: u.spoons, tier: u.tier })),
            
            contributions: usersArray
                .sort((a, b) => b.contributions.length - a.contributions.length)
                .slice(0, 10)
                .map(u => ({ name: u.name, contributions: u.contributions.length, tier: u.tier }))
        };
    }

    /**
     * Update user tier based on karma
     */
    updateTier(user) {
        const thresholds = this.karmaThresholds;
        
        if (user.karma >= thresholds['Core Team']) {
            user.tier = 'Core Team';
        } else if (user.karma >= thresholds['Guild Leader']) {
            user.tier = 'Guild Leader';
        } else if (user.karma >= thresholds['Node']) {
            user.tier = 'Node';
        } else {
            user.tier = 'Supporter';
        }
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Process daily maintenance (karma decay, spoon regeneration)
     */
    dailyMaintenance() {
        console.log('Running daily maintenance...');
        
        let processed = 0;
        let totalKarmaDecayed = 0;
        
        for (const [userId, user] of this.users) {
            // Decay karma
            const karmaResult = this.decayKarma(userId);
            if (karmaResult.success) {
                totalKarmaDecayed += karmaResult.lost;
            }
            
            // Regenerate spoons
            this.regenerateSpoons(userId);
            
            processed++;
        }
        
        console.log(`Daily maintenance complete: ${processed} users processed, ${totalKarmaDecayed} total karma decayed`);
    }

    /**
     * Get system statistics
     */
    getSystemStats() {
        const totalUsers = this.users.size;
        const totalKarma = Array.from(this.users.values()).reduce((sum, user) => sum + user.karma, 0);
        const totalSpoons = Array.from(this.users.values()).reduce((sum, user) => sum + user.spoons, 0);
        const averageKarma = totalUsers > 0 ? totalKarma / totalUsers : 0;
        const averageSpoons = totalUsers > 0 ? totalSpoons / totalUsers : 0;
        
        return {
            totalUsers,
            totalKarma,
            totalSpoons,
            averageKarma: Math.round(averageKarma),
            averageSpoons: Math.round(averageSpoons),
            tierDistribution: this.getTierDistribution()
        };
    }

    /**
     * Get tier distribution
     */
    getTierDistribution() {
        const distribution = {
            'Supporter': 0,
            'Node': 0,
            'Guild Leader': 0,
            'Core Team': 0
        };
        
        for (const user of this.users.values()) {
            distribution[user.tier]++;
        }
        
        return distribution;
    }
}

// Export for use in other modules
module.exports = DualLedgerEconomy;

// Example usage
if (require.main === module) {
    const economy = new DualLedgerEconomy();
    
    // Create users
    economy.createUser('user1', 'Alice');
    economy.createUser('user2', 'Bob');
    economy.createUser('user3', 'Charlie');
    
    // Award karma
    economy.awardKarma('user1', 100, 'Helped with quantum puzzle');
    economy.awardKarma('user2', 50, 'Fixed bug in game engine');
    
    // Spend spoons
    economy.spendSpoons('user1', 10, 'Participated in review');
    economy.spendSpoons('user2', 20, 'Submitted work package');
    
    // Submit work package
    const wp = economy.submitWorkPackage('user2', 'Quantum Tutorial', 'Created tutorial for Posner molecule', 30);
    if (wp.success) {
        economy.reviewWorkPackage(wp.workPackage.id, 'user1', 75, 'Excellent tutorial!');
    }
    
    // Get status
    console.log('Alice status:', economy.getUserStatus('user1'));
    console.log('Bob status:', economy.getUserStatus('user2'));
    
    // Get leaderboard
    console.log('Leaderboard:', economy.getLeaderboard());
    
    // Get system stats
    console.log('System stats:', economy.getSystemStats());
}