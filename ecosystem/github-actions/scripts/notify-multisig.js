#!/usr/bin/env node

/**
 * Notify Multi-Sig Community
 * Sends notifications to Discord about multi-sig requirements and progress
 */

const fs = require('fs');
const path = require('path');

class MultiSigNotifier {
    constructor() {
        this.statusPath = path.join(__dirname, '..', '..', 'posner-status.json');
        this.contributorsPath = path.join(__dirname, '..', '..', 'posner-contributors.json');
        this.discordWebhook = process.env.DISCORD_MULTISIG_WEBHOOK;
    }

    /**
     * Main notification function
     */
    async notify() {
        try {
            console.log('📢 Sending Multi-Sig Notifications...');
            
            // Load current status
            const status = this.loadStatus();
            const contributors = this.loadContributors();
            
            // Determine notification type
            const notificationType = this.determineNotificationType(status, contributors);
            
            // Generate notification
            const notification = this.generateNotification(notificationType, status, contributors);
            
            // Send notification
            await this.sendNotification(notification);
            
            // Log notification
            this.logNotification(notification);
            
            console.log('✅ Multi-sig notifications sent successfully');
            return notification;
            
        } catch (error) {
            console.error('❌ Failed to send multi-sig notifications:', error);
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
     * Determine notification type
     */
    determineNotificationType(status, contributors) {
        if (status.assembled) {
            return 'assembly_complete';
        }
        
        const progress = status.progress.overall;
        const contributorsCount = Object.keys(contributors.users).length;
        
        if (progress >= 90) {
            return 'assembly_near_complete';
        } else if (progress >= 50) {
            return 'assembly_halfway';
        } else if (contributorsCount >= 3) {
            return 'contributors_active';
        } else if (contributorsCount >= 1) {
            return 'assembly_started';
        } else {
            return 'assembly_waiting';
        }
    }

    /**
     * Generate notification content
     */
    generateNotification(type, status, contributors) {
        const notification = {
            type: type,
            timestamp: new Date().toISOString(),
            embed: {
                title: '',
                description: '',
                color: 0x6366f1,
                fields: [],
                footer: {
                    text: 'P31 Multi-Sig System'
                },
                timestamp: new Date().toISOString()
            }
        };
        
        switch (type) {
            case 'assembly_complete':
                notification.embed.title = '🎉 Posner Molecule Assembly Complete!';
                notification.embed.color = 0x10b981;
                notification.embed.description = `
**The Posner molecule ($Ca_9(PO_4)_6$) has been successfully assembled!**

✅ **Assembly Status:** COMPLETE
✅ **Calcium Ions:** ${status.calciumIons}/${status.requirements.calciumIons}
✅ **Phosphate Ions:** ${status.phosphateIons}/${status.requirements.phosphateIons}
✅ **Unique Contributors:** ${status.uniqueContributors}/${status.requirements.uniqueContributors}

The community has achieved decentralized consensus. The associated PR can now be merged.
                `;
                break;
                
            case 'assembly_near_complete':
                notification.embed.title = '🚀 Assembly Nearly Complete!';
                notification.embed.color = 0xf59e0b;
                notification.embed.description = `
**The Posner molecule assembly is ${status.progress.overall}% complete!**

📊 **Current Progress:**
- Calcium Ions: ${status.calciumIons}/${status.requirements.calciumIons} (${status.progress.calcium}%)
- Phosphate Ions: ${status.phosphateIons}/${status.requirements.phosphateIons} (${status.progress.phosphate}%)
- Contributors: ${status.uniqueContributors}/${status.requirements.uniqueContributors} (${status.progress.contributors}%)

Only ${status.requirements.calciumIons - status.calciumIons} Calcium ions and ${status.requirements.phosphateIons - status.phosphateIons} Phosphate ions remain!
                `;
                break;
                
            case 'assembly_halfway':
                notification.embed.title = '⚡ Assembly Halfway There!';
                notification.embed.color = 0x3b82f6;
                notification.embed.description = `
**The Posner molecule assembly is ${status.progress.overall}% complete!**

📊 **Current Progress:**
- Calcium Ions: ${status.calciumIons}/${status.requirements.calciumIons}
- Phosphate Ions: ${status.phosphateIons}/${status.requirements.phosphateIons}
- Contributors: ${status.uniqueContributors}/${status.requirements.uniqueContributors}

Keep contributing ions to reach consensus!
                `;
                break;
                
            case 'contributors_active':
                notification.embed.title = '👥 Community Assembly Active!';
                notification.embed.color = 0x8b5cf6;
                notification.embed.description = `
**${Object.keys(contributors.users).length} contributors are actively assembling the Posner molecule!**

📊 **Current Status:**
- Calcium Ions: ${status.calciumIons}/${status.requirements.calciumIons}
- Phosphate Ions: ${status.phosphateIons}/${status.requirements.phosphateIons}
- Contributors: ${status.uniqueContributors}/${status.requirements.uniqueContributors}

Join the effort at [phosphorus31.org/bonding](https://phosphorus31.org/bonding)!
                `;
                break;
                
            case 'assembly_started':
                notification.embed.title = '🧪 Assembly Initiated!';
                notification.embed.color = 0x22c55e;
                notification.embed.description = `
**The Posner molecule assembly has begun!**

📊 **Current Status:**
- Calcium Ions: ${status.calciumIons}/${status.requirements.calciumIons}
- Phosphate Ions: ${status.phosphateIons}/${status.requirements.phosphateIons}
- Contributors: ${status.uniqueContributors}/${status.requirements.uniqueContributors}

Be one of the first to contribute ions and help achieve consensus!
                `;
                break;
                
            case 'assembly_waiting':
                notification.embed.title = '⏳ Assembly Waiting for Contributors';
                notification.embed.color = 0x64748b;
                notification.embed.description = `
**The Posner molecule assembly is ready to begin!**

📊 **Requirements:**
- Calcium Ions: ${status.requirements.calciumIons}
- Phosphate Ions: ${status.requirements.phosphateIons}
- Unique Contributors: ${status.requirements.uniqueContributors}

Join the BONDING game at [phosphorus31.org/bonding](https://phosphorus31.org/bonding) to start contributing!
                `;
                break;
        }
        
        // Add progress fields
        notification.embed.fields.push(
            {
                name: 'Overall Progress',
                value: `${status.progress.overall}%`,
                inline: true
            },
            {
                name: 'Contributors',
                value: `${status.uniqueContributors}/${status.requirements.uniqueContributors}`,
                inline: true
            },
            {
                name: 'Time Elapsed',
                value: this.calculateTimeElapsed(status.timestamp),
                inline: true
            }
        );
        
        return notification;
    }

    /**
     * Calculate time elapsed since assembly started
     */
    calculateTimeElapsed(startTime) {
        const start = new Date(startTime);
        const now = new Date();
        const diff = now - start;
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }

    /**
     * Send notification to Discord
     */
    async sendNotification(notification) {
        if (!this.discordWebhook) {
            console.log('⚠️ Discord webhook not configured, skipping notification');
            return;
        }
        
        try {
            const response = await fetch(this.discordWebhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    embeds: [notification.embed]
                })
            });
            
            if (!response.ok) {
                throw new Error(`Discord API error: ${response.status}`);
            }
            
            console.log('✅ Discord notification sent successfully');
            
        } catch (error) {
            console.error('❌ Failed to send Discord notification:', error);
            throw error;
        }
    }

    /**
     * Log notification
     */
    logNotification(notification) {
        const logPath = path.join(__dirname, '..', '..', 'multisig-notifications.log');
        
        const logEntry = {
            timestamp: notification.timestamp,
            type: notification.type,
            title: notification.embed.title,
            description: notification.embed.description
        };
        
        const logLine = JSON.stringify(logEntry) + '\n';
        fs.appendFileSync(logPath, logLine);
        
        console.log(`💾 Notification logged to: ${logPath}`);
    }

    /**
     * Generate summary notification
     */
    generateSummaryNotification(status, contributors) {
        return {
            type: 'summary',
            embed: {
                title: '📊 Multi-Sig Assembly Summary',
                description: 'Current status of the Posner molecule assembly',
                color: 0x6366f1,
                fields: [
                    {
                        name: 'Assembly Status',
                        value: status.assembled ? '✅ Complete' : '⏳ In Progress',
                        inline: true
                    },
                    {
                        name: 'Overall Progress',
                        value: `${status.progress.overall}%`,
                        inline: true
                    },
                    {
                        name: 'Contributors',
                        value: `${status.uniqueContributors}/${status.requirements.uniqueContributors}`,
                        inline: true
                    },
                    {
                        name: 'Calcium Ions',
                        value: `${status.calciumIons}/${status.requirements.calciumIons}`,
                        inline: true
                    },
                    {
                        name: 'Phosphate Ions',
                        value: `${status.phosphateIons}/${status.requirements.phosphateIons}`,
                        inline: true
                    },
                    {
                        name: 'Time Elapsed',
                        value: this.calculateTimeElapsed(status.timestamp),
                        inline: true
                    }
                ],
                footer: {
                    text: 'P31 Multi-Sig System'
                },
                timestamp: new Date().toISOString()
            }
        };
    }
}

// Execute if run directly
if (require.main === module) {
    const notifier = new MultiSigNotifier();
    notifier.notify().then(notification => {
        console.log('\n📢 Multi-sig notification sent successfully!');
        console.log(`   Type: ${notification.type}`);
        console.log(`   Title: ${notification.embed.title}`);
    }).catch(error => {
        console.error('Failed to send notification:', error);
    });
}

module.exports = MultiSigNotifier;