#!/usr/bin/env node

/**
 * Update Multi-Sig Dashboard
 * Updates the analytics dashboard with current multi-sig status
 */

const fs = require('fs');
const path = require('path');

class MultiSigDashboardUpdater {
    constructor() {
        this.dashboardPath = path.join(__dirname, '..', '..', 'ecosystem', 'analytics', 'dashboard.js');
        this.statusPath = path.join(__dirname, '..', '..', 'posner-status.json');
        this.contributorsPath = path.join(__dirname, '..', '..', 'posner-contributors.json');
    }

    /**
     * Main update function
     */
    async updateDashboard() {
        try {
            console.log('📊 Updating Multi-Sig Dashboard...');
            
            // Load current status
            const status = this.loadStatus();
            const contributors = this.loadContributors();
            
            // Generate dashboard data
            const dashboardData = this.generateDashboardData(status, contributors);
            
            // Update dashboard
            this.updateDashboardFile(dashboardData);
            
            // Generate dashboard HTML
            const dashboardHTML = this.generateDashboardHTML(dashboardData);
            
            // Save dashboard files
            this.saveDashboardFiles(dashboardData, dashboardHTML);
            
            console.log('✅ Multi-sig dashboard updated successfully');
            return dashboardData;
            
        } catch (error) {
            console.error('❌ Failed to update multi-sig dashboard:', error);
            process.exit(1);
        }
    }

    /**
     * Load current status
     */
    loadStatus() {
        if (fs.existsSync(this.statusPath)) {
            return JSON.parse(fs.readFileSync(this.statusPath, 'utf8'));
        }
        
        return {
            assembled: false,
            calciumIons: 0,
            phosphateIons: 0,
            totalIons: 0,
            uniqueContributors: 0,
            requirements: {
                calciumIons: 9,
                phosphateIons: 6,
                uniqueContributors: 5
            },
            progress: {
                calcium: 0,
                phosphate: 0,
                contributors: 0,
                overall: 0
            },
            timestamp: new Date().toISOString()
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
     * Generate dashboard data
     */
    generateDashboardData(status, contributors) {
        const dashboardData = {
            timestamp: new Date().toISOString(),
            multiSig: {
                status: status.assembled ? 'COMPLETE' : 'IN_PROGRESS',
                assemblyComplete: status.assembled,
                progress: status.progress.overall,
                requirements: status.requirements,
                current: {
                    calciumIons: status.calciumIons,
                    phosphateIons: status.phosphateIons,
                    totalIons: status.totalIons,
                    uniqueContributors: status.uniqueContributors
                }
            },
            contributors: {
                total: Object.keys(contributors.users).length,
                active: Object.values(contributors.users).filter(user => 
                    (user.calciumContributed || 0) + (user.phosphateContributed || 0) > 0
                ).length,
                distribution: this.generateContributionDistribution(contributors.users)
            },
            metrics: {
                ionsPerContributor: this.calculateIonsPerContributor(status, contributors),
                timeToCompletion: this.calculateTimeToCompletion(status),
                complianceRate: this.calculateComplianceRate(contributors)
            },
            visualization: {
                progressBars: this.generateProgressBars(status),
                contributorChart: this.generateContributorChart(contributors),
                timeline: this.generateTimeline(status, contributors)
            }
        };
        
        return dashboardData;
    }

    /**
     * Generate contribution distribution
     */
    generateContributionDistribution(users) {
        const distribution = {
            0: 0, // Users with 0 contributions
            1: 0, // Users with 1 contribution
            2: 0, // Users with 2 contributions
            3: 0, // Users with 3 contributions
            '3+': 0 // Users with more than 3 contributions
        };
        
        Object.values(users).forEach(user => {
            const totalContributions = (user.calciumContributed || 0) + (user.phosphateContributed || 0);
            
            if (totalContributions === 0) distribution[0]++;
            else if (totalContributions === 1) distribution[1]++;
            else if (totalContributions === 2) distribution[2]++;
            else if (totalContributions === 3) distribution[3]++;
            else distribution['3+']++;
        });
        
        return distribution;
    }

    /**
     * Calculate ions per contributor
     */
    calculateIonsPerContributor(status, contributors) {
        const totalContributors = Object.keys(contributors.users).length;
        const totalIons = status.totalIons;
        
        return totalContributors > 0 ? totalIons / totalContributors : 0;
    }

    /**
     * Calculate time to completion
     */
    calculateTimeToCompletion(status) {
        // This would calculate based on assembly start time
        // For now, return a placeholder
        return {
            started: status.timestamp,
            estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            timeRemaining: '7 days'
        };
    }

    /**
     * Calculate compliance rate
     */
    calculateComplianceRate(contributors) {
        // Calculate based on spoons expenditure
        const compliantUsers = Object.values(contributors.users).filter(user => 
            user.spoonsSpent >= ((user.calciumContributed || 0) + (user.phosphateContributed || 0)) * 10
        );
        
        const totalUsers = Object.keys(contributors.users).length;
        return totalUsers > 0 ? Math.round((compliantUsers.length / totalUsers) * 100) : 100;
    }

    /**
     * Generate progress bars data
     */
    generateProgressBars(status) {
        return {
            calcium: {
                current: status.calciumIons,
                required: status.requirements.calciumIons,
                progress: status.progress.calcium,
                status: status.calciumIons >= status.requirements.calciumIons ? 'complete' : 'in_progress'
            },
            phosphate: {
                current: status.phosphateIons,
                required: status.requirements.phosphateIons,
                progress: status.progress.phosphate,
                status: status.phosphateIons >= status.requirements.phosphateIons ? 'complete' : 'in_progress'
            },
            contributors: {
                current: status.uniqueContributors,
                required: status.requirements.uniqueContributors,
                progress: status.progress.contributors,
                status: status.uniqueContributors >= status.requirements.uniqueContributors ? 'complete' : 'in_progress'
            },
            overall: {
                current: status.totalIons,
                required: status.requirements.calciumIons + status.requirements.phosphateIons,
                progress: status.progress.overall,
                status: status.assembled ? 'complete' : 'in_progress'
            }
        };
    }

    /**
     * Generate contributor chart data
     */
    generateContributorChart(contributors) {
        const chartData = {
            labels: Object.keys(contributors.users),
            data: Object.values(contributors.users).map(user => ({
                calcium: user.calciumContributed || 0,
                phosphate: user.phosphateContributed || 0,
                total: (user.calciumContributed || 0) + (user.phosphateContributed || 0),
                spoons: user.spoonsSpent || 0
            }))
        };
        
        return chartData;
    }

    /**
     * Generate timeline data
     */
    generateTimeline(status, contributors) {
        // This would generate a timeline of contributions
        // For now, return a placeholder structure
        return {
            events: [
                {
                    timestamp: status.timestamp,
                    type: 'assembly_started',
                    description: 'Posner molecule assembly initiated'
                }
            ],
            lastUpdate: status.timestamp
        };
    }

    /**
     * Update dashboard file
     */
    updateDashboardFile(dashboardData) {
        // This would update the actual dashboard.js file
        // For now, we'll just log the update
        console.log('📝 Dashboard data structure updated');
    }

    /**
     * Generate dashboard HTML
     */
    generateDashboardHTML(dashboardData) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>P31 Multi-Sig Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #0a0a0f; color: #e2e8f0; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .status-card { background: #14141f; border: 1px solid #2a2a3f; padding: 20px; margin: 10px; border-radius: 8px; }
        .progress-bar { width: 100%; height: 20px; background: #333; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; background: #6366f1; transition: width 0.3s; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric { font-size: 24px; font-weight: bold; color: #6366f1; }
        .complete { color: #10b981; }
        .in-progress { color: #f59e0b; }
        .chart { background: #1a1a2e; padding: 15px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>P31 Multi-Sig Dashboard</h1>
        <div>
            <span>Last Updated: ${new Date(dashboardData.timestamp).toLocaleString()}</span>
        </div>
    </div>
    
    <div class="grid">
        <div class="status-card">
            <h3>Multi-Sig Status</h3>
            <div class="metric ${dashboardData.multiSig.status === 'COMPLETE' ? 'complete' : 'in-progress'}">
                ${dashboardData.multiSig.status}
            </div>
            <p>Assembly Progress: ${dashboardData.multiSig.progress}%</p>
        </div>
        
        <div class="status-card">
            <h3>Contributors</h3>
            <p>Total: ${dashboardData.contributors.total}</p>
            <p>Active: ${dashboardData.contributors.active}</p>
            <p>Compliance Rate: ${dashboardData.metrics.complianceRate}%</p>
        </div>
        
        <div class="status-card">
            <h3>Current Status</h3>
            <p>Calcium Ions: ${dashboardData.multiSig.current.calciumIons}/${dashboardData.multiSig.requirements.calciumIons}</p>
            <p>Phosphate Ions: ${dashboardData.multiSig.current.phosphateIons}/${dashboardData.multiSig.requirements.phosphateIons}</p>
            <p>Unique Contributors: ${dashboardData.multiSig.current.uniqueContributors}/${dashboardData.multiSig.requirements.uniqueContributors}</p>
        </div>
    </div>
    
    <div class="grid" style="margin-top: 30px;">
        <div class="status-card">
            <h3>Progress Bars</h3>
            <div>
                <strong>Calcium Ions</strong>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${dashboardData.visualization.progressBars.calcium.progress}%"></div>
                </div>
                <small>${dashboardData.visualization.progressBars.calcium.current}/${dashboardData.visualization.progressBars.calcium.required}</small>
            </div>
            
            <div style="margin-top: 15px;">
                <strong>Phosphate Ions</strong>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${dashboardData.visualization.progressBars.phosphate.progress}%"></div>
                </div>
                <small>${dashboardData.visualization.progressBars.phosphate.current}/${dashboardData.visualization.progressBars.phosphate.required}</small>
            </div>
            
            <div style="margin-top: 15px;">
                <strong>Contributors</strong>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${dashboardData.visualization.progressBars.contributors.progress}%"></div>
                </div>
                <small>${dashboardData.visualization.progressBars.contributors.current}/${dashboardData.visualization.progressBars.contributors.required}</small>
            </div>
        </div>
        
        <div class="status-card">
            <h3>Contribution Distribution</h3>
            <div class="chart">
                ${Object.entries(dashboardData.contributors.distribution).map(([key, value]) => 
                    `<p>${key} contributions: ${value} users</p>`
                ).join('')}
            </div>
        </div>
    </div>
    
    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>
        `;
    }

    /**
     * Save dashboard files
     */
    saveDashboardFiles(dashboardData, dashboardHTML) {
        // Save JSON data
        const dataPath = path.join(__dirname, '..', '..', 'multisig-dashboard-data.json');
        fs.writeFileSync(dataPath, JSON.stringify(dashboardData, null, 2));
        
        // Save HTML dashboard
        const htmlPath = path.join(__dirname, '..', '..', 'multisig-dashboard.html');
        fs.writeFileSync(htmlPath, dashboardHTML);
        
        console.log(`💾 Dashboard files saved:`);
        console.log(`   Data: ${dataPath}`);
        console.log(`   HTML: ${htmlPath}`);
    }
}

// Execute if run directly
if (require.main === module) {
    const updater = new MultiSigDashboardUpdater();
    updater.updateDashboard().then(dashboardData => {
        console.log('\n📊 Multi-sig dashboard updated successfully!');
        console.log(`   Status: ${dashboardData.multiSig.status}`);
        console.log(`   Progress: ${dashboardData.multiSig.progress}%`);
        console.log(`   Contributors: ${dashboardData.contributors.total}`);
    });
}

module.exports = MultiSigDashboardUpdater;