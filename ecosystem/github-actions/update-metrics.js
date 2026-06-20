#!/usr/bin/env node

/**
 * Update Community Metrics
 * Updates various metrics and statistics across the ecosystem
 */

const fs = require('fs');
const path = require('path');

const registryPath = path.join(__dirname, '..', '..', 'user-registry.json');
const metricsPath = path.join(__dirname, '..', '..', 'community-metrics.json');

// Load user registry
let registry = {};
if (fs.existsSync(registryPath)) {
    registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
}

// Calculate metrics
const metrics = {
    lastUpdated: new Date().toISOString(),
    totalUsers: Object.keys(registry).length,
    totalSupport: Object.values(registry).reduce((sum, user) => sum + user.totalSupport, 0),
    totalNodes: Object.values(registry).reduce((sum, user) => sum + user.nodeCount, 0),
    totalKarma: Object.values(registry).reduce((sum, user) => sum + user.karma, 0),
    averageSupport: 0,
    tierDistribution: {
        'Supporter': 0,
        'Node': 0,
        'Guild Leader': 0,
        'Core Team': 0
    },
    monthlyGrowth: calculateMonthlyGrowth(registry),
    topContributors: getTopContributors(registry)
};

// Calculate average support
if (metrics.totalUsers > 0) {
    metrics.averageSupport = Math.round(metrics.totalSupport / metrics.totalUsers);
}

// Calculate tier distribution
Object.values(registry).forEach(user => {
    metrics.tierDistribution[user.tier]++;
});

// Save metrics
fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));

console.log('Community metrics updated successfully');
console.log(`Total users: ${metrics.totalUsers}`);
console.log(`Total support: $${metrics.totalSupport}`);
console.log(`Total nodes: ${metrics.totalNodes}`);
console.log(`Total karma: ${metrics.totalKarma}`);

function calculateMonthlyGrowth(registry) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let currentMonthContributions = 0;
    let previousMonthContributions = 0;
    
    Object.values(registry).forEach(user => {
        user.payments.forEach(payment => {
            const paymentDate = new Date(payment.timestamp);
            if (paymentDate.getFullYear() === currentYear) {
                if (paymentDate.getMonth() === currentMonth) {
                    currentMonthContributions += payment.amount;
                } else if (paymentDate.getMonth() === currentMonth - 1) {
                    previousMonthContributions += payment.amount;
                }
            }
        });
    });
    
    return {
        currentMonth: currentMonthContributions,
        previousMonth: previousMonthContributions,
        growthRate: previousMonthContributions > 0 
            ? Math.round(((currentMonthContributions - previousMonthContributions) / previousMonthContributions) * 100)
            : 0
    };
}

function getTopContributors(registry, limit = 5) {
    return Object.entries(registry)
        .sort(([,a], [,b]) => b.totalSupport - a.totalSupport)
        .slice(0, limit)
        .map(([id, user]) => ({
            name: user.name,
            totalSupport: user.totalSupport,
            tier: user.tier,
            joinDate: user.joinDate
        }));
}