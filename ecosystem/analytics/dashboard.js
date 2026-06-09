#!/usr/bin/env node

/**
 * Ecosystem Analytics Dashboard
 * Comprehensive monitoring and analytics system for the P31 ecosystem
 * 
 * Tracks metrics across all components:
 * - Ko-fi integration performance
 * - GitHub Actions workflow status
 * - IPFS deployment success
 * - Gamification system engagement
 * - Community growth and health
 */

const fs = require('fs');
const path = require('path');

class EcosystemAnalytics {
    constructor() {
        this.metrics = {
            koFi: {
                totalPayments: 0,
                totalRevenue: 0,
                averagePayment: 0,
                tierDistribution: {},
                conversionRate: 0
            },
            github: {
                workflowRuns: 0,
                successRate: 0,
                averageRuntime: 0,
                deploymentFrequency: 0
            },
            ipfs: {
                deployments: 0,
                totalSize: 0,
                gatewayUptime: 0,
                pinningSuccess: 0
            },
            gamification: {
                activeUsers: 0,
                karmaDistribution: {},
                spoonsUsage: {},
                achievementUnlocks: 0,
                challengeCompletion: 0
            },
            community: {
                totalMembers: 0,
                growthRate: 0,
                engagementScore: 0,
                retentionRate: 0
            }
        };
        
        this.reports = [];
        this.alerts = [];
    }

    /**
     * Update Ko-fi metrics
     */
    updateKoFiMetrics(paymentData) {
        this.metrics.koFi.totalPayments++;
        this.metrics.koFi.totalRevenue += paymentData.amount;
        this.metrics.koFi.averagePayment = this.metrics.koFi.totalRevenue / this.metrics.koFi.totalPayments;
        
        // Update tier distribution
        const tier = paymentData.tier || 'Supporter';
        this.metrics.koFi.tierDistribution[tier] = (this.metrics.koFi.tierDistribution[tier] || 0) + 1;
        
        console.log(`Ko-Fi metrics updated: +$${paymentData.amount} from ${paymentData.name}`);
    }

    /**
     * Update GitHub Actions metrics
     */
    updateGitHubMetrics(workflowData) {
        this.metrics.github.workflowRuns++;
        
        if (workflowData.success) {
            this.metrics.github.successRate = this.calculateSuccessRate();
        }
        
        this.metrics.github.averageRuntime = this.calculateAverageRuntime();
        this.metrics.github.deploymentFrequency = this.calculateDeploymentFrequency();
        
        console.log(`GitHub metrics updated: ${workflowData.type} - ${workflowData.success ? 'Success' : 'Failed'}`);
    }

    /**
     * Update IPFS deployment metrics
     */
    updateIPFSMetrics(deploymentData) {
        this.metrics.ipfs.deployments++;
        this.metrics.ipfs.totalSize += deploymentData.size;
        this.metrics.ipfs.pinningSuccess = deploymentData.pinningSuccess;
        
        console.log(`IPFS metrics updated: CID ${deploymentData.cid} - ${deploymentData.size} bytes`);
    }

    /**
     * Update gamification metrics
     */
    updateGamificationMetrics(userData) {
        this.metrics.gamification.activeUsers++;
        
        // Update karma distribution
        const karmaRange = this.getKarmaRange(userData.karma);
        this.metrics.gamification.karmaDistribution[karmaRange] = (this.metrics.gamification.karmaDistribution[karmaRange] || 0) + 1;
        
        // Update spoons usage
        const spoonsRange = this.getSpoonsRange(userData.spoonsUsed);
        this.metrics.gamification.spoonsUsage[spoonsRange] = (this.metrics.gamification.spoonsUsage[spoonsRange] || 0) + 1;
        
        console.log(`Gamification metrics updated: ${userData.name} - ${userData.karma} karma, ${userData.spoonsUsed} spoons`);
    }

    /**
     * Update community metrics
     */
    updateCommunityMetrics(communityData) {
        this.metrics.community.totalMembers = communityData.totalMembers;
        this.metrics.community.growthRate = communityData.growthRate;
        this.metrics.community.engagementScore = communityData.engagementScore;
        this.metrics.community.retentionRate = communityData.retentionRate;
        
        console.log(`Community metrics updated: ${communityData.totalMembers} members, ${communityData.engagementScore}% engagement`);
    }

    /**
     * Generate comprehensive ecosystem report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: this.generateSummary(),
            detailed: this.metrics,
            recommendations: this.generateRecommendations(),
            alerts: this.getRecentAlerts()
        };
        
        this.reports.push(report);
        this.saveReport(report);
        
        return report;
    }

    /**
     * Generate executive summary
     */
    generateSummary() {
        return {
            ecosystemHealth: this.calculateEcosystemHealth(),
            keyMetrics: {
                totalRevenue: this.metrics.koFi.totalRevenue,
                activeUsers: this.metrics.gamification.activeUsers,
                deploymentSuccess: this.metrics.github.successRate,
                communityGrowth: this.metrics.community.growthRate
            },
            trends: this.calculateTrends(),
            riskFactors: this.identifyRiskFactors()
        };
    }

    /**
     * Calculate overall ecosystem health score
     */
    calculateEcosystemHealth() {
        const koFiHealth = this.metrics.koFi.totalRevenue > 1000 ? 100 : (this.metrics.koFi.totalRevenue / 10);
        const githubHealth = this.metrics.github.successRate * 100;
        const ipfsHealth = this.metrics.ipfs.pinningSuccess * 100;
        const gamificationHealth = this.metrics.gamification.activeUsers > 50 ? 100 : (this.metrics.gamification.activeUsers * 2);
        const communityHealth = this.metrics.community.engagementScore;
        
        return Math.round((koFiHealth + githubHealth + ipfsHealth + gamificationHealth + communityHealth) / 5);
    }

    /**
     * Generate actionable recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Ko-Fi recommendations
        if (this.metrics.koFi.conversionRate < 0.1) {
            recommendations.push({
                category: 'Ko-Fi',
                priority: 'High',
                recommendation: 'Low conversion rate detected. Consider improving value proposition or reducing friction in payment flow.',
                impact: 'Revenue Growth'
            });
        }
        
        // GitHub recommendations
        if (this.metrics.github.successRate < 0.95) {
            recommendations.push({
                category: 'GitHub',
                priority: 'Critical',
                recommendation: 'Workflow success rate below 95%. Review and fix failing workflows.',
                impact: 'System Reliability'
            });
        }
        
        // IPFS recommendations
        if (this.metrics.ipfs.pinningSuccess < 0.9) {
            recommendations.push({
                category: 'IPFS',
                priority: 'High',
                recommendation: 'Pinning success rate below 90%. Review pinning providers and backup strategies.',
                impact: 'Data Sovereignty'
            });
        }
        
        // Community recommendations
        if (this.metrics.community.engagementScore < 50) {
            recommendations.push({
                category: 'Community',
                priority: 'Medium',
                recommendation: 'Low community engagement. Consider hosting events or improving gamification rewards.',
                impact: 'Community Growth'
            });
        }
        
        return recommendations;
    }

    /**
     * Identify potential risk factors
     */
    identifyRiskFactors() {
        const risks = [];
        
        if (this.metrics.koFi.totalRevenue < 100) {
            risks.push({
                type: 'Financial',
                severity: 'High',
                description: 'Low revenue may impact project sustainability',
                mitigation: 'Diversify revenue streams and improve marketing'
            });
        }
        
        if (this.metrics.github.successRate < 0.8) {
            risks.push({
                type: 'Technical',
                severity: 'Critical',
                description: 'Frequent deployment failures could impact user experience',
                mitigation: 'Review and stabilize CI/CD pipeline'
            });
        }
        
        if (this.metrics.community.retentionRate < 0.5) {
            risks.push({
                type: 'Community',
                severity: 'High',
                description: 'High churn rate indicates community health issues',
                mitigation: 'Improve onboarding and engagement strategies'
            });
        }
        
        return risks;
    }

    /**
     * Calculate trends over time
     */
    calculateTrends() {
        // This would analyze historical data to identify trends
        // For now, return placeholder data
        return {
            revenueTrend: 'Increasing',
            userGrowthTrend: 'Stable',
            deploymentFrequencyTrend: 'Increasing',
            engagementTrend: 'Decreasing'
        };
    }

    /**
     * Get recent alerts
     */
    getRecentAlerts() {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        return this.alerts.filter(alert => alert.timestamp > oneHourAgo);
    }

    /**
     * Add alert
     */
    addAlert(severity, message, category) {
        const alert = {
            id: this.generateId(),
            severity: severity,
            message: message,
            category: category,
            timestamp: Date.now(),
            acknowledged: false
        };
        
        this.alerts.push(alert);
        console.log(`Alert added: [${severity}] ${message}`);
        
        return alert;
    }

    /**
     * Acknowledge alert
     */
    acknowledgeAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            console.log(`Alert acknowledged: ${alert.message}`);
        }
    }

    /**
     * Save report to file
     */
    saveReport(report) {
        const reportsDir = path.join(__dirname, '..', '..', 'analytics-reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const filename = `report-${Date.now()}.json`;
        const filepath = path.join(reportsDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
        console.log(`Report saved: ${filepath}`);
    }

    /**
     * Load historical reports
     */
    loadHistoricalReports() {
        const reportsDir = path.join(__dirname, '..', '..', 'analytics-reports');
        if (!fs.existsSync(reportsDir)) return [];
        
        const files = fs.readdirSync(reportsDir);
        const reports = files
            .filter(file => file.startsWith('report-'))
            .map(file => {
                const filepath = path.join(reportsDir, file);
                return JSON.parse(fs.readFileSync(filepath, 'utf8'));
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return reports;
    }

    /**
     * Generate dashboard HTML
     */
    generateDashboard() {
        const report = this.generateReport();
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>P31 Ecosystem Analytics Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #0a0a0f; color: #e2e8f0; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .metric-card { background: #14141f; border: 1px solid #2a2a3f; padding: 20px; margin: 10px; border-radius: 8px; }
        .health-score { font-size: 48px; font-weight: bold; }
        .good { color: #10b981; }
        .warning { color: #f59e0b; }
        .critical { color: #ef4444; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .list { max-height: 300px; overflow-y: auto; }
        .alert { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .alert.high { background: #fee2e2; border-left: 4px solid #ef4444; }
        .alert.medium { background: #fef3c7; border-left: 4px solid #f59e0b; }
        .alert.low { background: #dbeafe; border-left: 4px solid #3b82f6; }
    </style>
</head>
<body>
    <div class="header">
        <h1>P31 Ecosystem Analytics Dashboard</h1>
        <div>
            <span>Last Updated: ${new Date(report.timestamp).toLocaleString()}</span>
        </div>
    </div>
    
    <div class="grid">
        <div class="metric-card">
            <h3>Ecosystem Health</h3>
            <div class="health-score ${this.getHealthClass(report.summary.ecosystemHealth)}">
                ${report.summary.ecosystemHealth}%
            </div>
        </div>
        
        <div class="metric-card">
            <h3>Key Metrics</h3>
            <ul>
                <li>Total Revenue: $${report.summary.keyMetrics.totalRevenue}</li>
                <li>Active Users: ${report.summary.keyMetrics.activeUsers}</li>
                <li>Deployment Success: ${Math.round(report.summary.keyMetrics.deploymentSuccess * 100)}%</li>
                <li>Community Growth: ${report.summary.keyMetrics.communityGrowth}%</li>
            </ul>
        </div>
        
        <div class="metric-card">
            <h3>Recent Alerts</h3>
            <div class="list">
                ${report.alerts.map(alert => `
                    <div class="alert ${alert.severity.toLowerCase()}">
                        <strong>${alert.severity}:</strong> ${alert.message}
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="metric-card">
            <h3>Recommendations</h3>
            <div class="list">
                ${report.recommendations.map(rec => `
                    <div style="margin-bottom: 15px;">
                        <strong class="${rec.priority === 'Critical' ? 'critical' : rec.priority === 'High' ? 'warning' : 'good'}">${rec.priority}:</strong>
                        <p>${rec.recommendation}</p>
                        <small>Impact: ${rec.impact}</small>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
    
    <div class="grid" style="margin-top: 30px;">
        <div class="metric-card">
            <h3>Ko-Fi Performance</h3>
            <p>Total Payments: ${this.metrics.koFi.totalPayments}</p>
            <p>Total Revenue: $${this.metrics.koFi.totalRevenue}</p>
            <p>Average Payment: $${this.metrics.koFi.averagePayment.toFixed(2)}</p>
        </div>
        
        <div class="metric-card">
            <h3>GitHub Actions</h3>
            <p>Workflow Runs: ${this.metrics.github.workflowRuns}</p>
            <p>Success Rate: ${Math.round(this.metrics.github.successRate * 100)}%</p>
            <p>Avg Runtime: ${this.metrics.github.averageRuntime}m</p>
        </div>
        
        <div class="metric-card">
            <h3>IPFS Deployments</h3>
            <p>Total Deployments: ${this.metrics.ipfs.deployments}</p>
            <p>Total Size: ${(this.metrics.ipfs.totalSize / 1024 / 1024).toFixed(2)} MB</p>
            <p>Pinning Success: ${Math.round(this.metrics.ipfs.pinningSuccess * 100)}%</p>
        </div>
        
        <div class="metric-card">
            <h3>Community Health</h3>
            <p>Total Members: ${this.metrics.community.totalMembers}</p>
            <p>Growth Rate: ${this.metrics.community.growthRate}%</p>
            <p>Engagement Score: ${this.metrics.community.engagementScore}%</p>
            <p>Retention Rate: ${this.metrics.community.retentionRate}%</p>
        </div>
    </div>
    
    <script>
        // Auto-refresh every 5 minutes
        setTimeout(() => location.reload(), 300000);
    </script>
</body>
</html>
        `;
    }

    /**
     * Helper methods
     */
    calculateSuccessRate() {
        // Implementation would calculate from historical data
        return 0.95;
    }
    
    calculateAverageRuntime() {
        // Implementation would calculate from historical data
        return 5;
    }
    
    calculateDeploymentFrequency() {
        // Implementation would calculate from historical data
        return 10;
    }
    
    getKarmaRange(karma) {
        if (karma < 50) return '0-50';
        if (karma < 200) return '50-200';
        if (karma < 500) return '200-500';
        return '500+';
    }
    
    getSpoonsRange(spoons) {
        if (spoons < 25) return '0-25';
        if (spoons < 50) return '25-50';
        if (spoons < 75) return '50-75';
        return '75+';
    }
    
    getHealthClass(score) {
        if (score >= 80) return 'good';
        if (score >= 60) return 'warning';
        return 'critical';
    }
    
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}

// Export for use in other modules
module.exports = EcosystemAnalytics;

// Example usage
if (require.main === module) {
    const analytics = new EcosystemAnalytics();
    
    // Simulate some metrics
    analytics.updateKoFiMetrics({ amount: 25, name: 'Alice', tier: 'Node' });
    analytics.updateGitHubMetrics({ type: 'kofi-tier-update', success: true });
    analytics.updateIPFSMetrics({ cid: 'Qm123...', size: 1024000, pinningSuccess: 0.95 });
    analytics.updateGamificationMetrics({ name: 'Bob', karma: 150, spoonsUsed: 20 });
    analytics.updateCommunityMetrics({ totalMembers: 100, growthRate: 10, engagementScore: 75, retentionRate: 80 });
    
    // Generate dashboard
    const dashboard = analytics.generateDashboard();
    console.log('Dashboard generated successfully');
}