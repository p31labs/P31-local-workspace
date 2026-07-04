# Spaceship Earth End-User Manual

## Welcome to Spaceship Earth

Spaceship Earth is a local-first Progressive Web App designed to help neurodivergent individuals manage their cognitive energy, navigate social spaces, and maintain sovereignty over their environment. This manual will guide you through using the system effectively.

## Getting Started

### Installation
1. **Visit the Website**: Go to https://p31ca.org/spaceship-earth
2. **Install as PWA**: Click the "Install" button in your browser or use the menu to "Add to Home Screen"
3. **Grant Permissions**: Allow camera, microphone, and Bluetooth permissions when prompted
4. **First Launch**: The app will guide you through initial setup

### Initial Setup
1. **Create Your Profile**: Set up your display name and avatar
2. **Morning Assessment**: Complete the daily energy assessment to set your Spoon budget
3. **Zone Discovery**: Explore available zones and their rules
4. **BLE Configuration**: If using physical beacons, pair your devices

## Core Concepts

### Spoons (Cognitive Energy)
- **What are Spoons?**: Your daily cognitive energy budget (typically 12/day)
- **Spending**: Activities like socializing, decision-making, and sensory processing cost spoons
- **Borrowing**: You can borrow spoons but must pay back with 1.5x interest
- **Stand Down**: When you reach 0 spoons, you enter Stand Down mode and should rest

### LOVE (Karma)
- **What is LOVE?**: A lifetime counter of positive social interactions
- **Earning**: Receive LOVE from peers for helpful actions, completing tasks, or positive contributions
- **Usage**: LOVE unlocks Creator Status and zone creation privileges
- **Never Decreases**: LOVE is monotonically increasing

### Zones and Sovereignty
- **Zones**: Designated areas with specific rules and energy requirements
- **Sovereignty**: Each zone has a sovereign resident who sets rules
- **Visitor Mindset**: When entering a zone, you must acknowledge its rules
- **Energy Matching**: Zones have energy levels (Kinetic, Balanced, Ordered, Still)

## Interface Overview

### The ZUI (Zoomable User Interface)
The main interface uses a three-level zoom system:

#### Level 0: Macro View (Sierpinski Tetrahedron)
- **Purpose**: Overview of all zones in your network
- **Navigation**: Click on glowing nodes to zoom into specific zones
- **Information**: Shows zone health, activity levels, and connections

#### Level 1: Meso View (Local Zone Orbs)
- **Purpose**: View individual spaces within a selected zone
- **Navigation**: Click on orbs to see creator profiles and content
- **Information**: Shows member count, recent activity, and energy levels

#### Level 2: Micro View (Creator Context)
- **Purpose**: Detailed view of creators, their rules, and content
- **Navigation**: Scroll through profiles and interact with content
- **Information**: Shows karma scores, zone rules, and available actions

### Camera Controls
- **Mouse/Touch**: Pan, zoom, and rotate the 3D view
- **Collision Detection**: Camera automatically avoids obstacles
- **Multi-Screen**: Supports multiple monitor setups
- **Performance**: System adapts to your device capabilities

## Daily Workflow

### Morning Routine
1. **Open the App**: Launch Spaceship Earth
2. **Complete Assessment**: Answer questions about:
   - Medication status
   - Pain levels
   - Legal obligations
   - Emotional state
3. **Review Spoon Budget**: See your available energy for the day
4. **Plan Activities**: Check zone requirements and plan accordingly

### Zone Navigation
1. **Select Destination**: Choose a zone from the Macro view
2. **Check Requirements**: Review energy costs and rules
3. **BLE Trigger**: If using physical beacons, approach the zone boundary
4. **Visitor Mindset**: Acknowledge zone rules in the modal
5. **Enter Zone**: Proceed with appropriate energy expenditure

### Social Interactions
1. **Help Board**: Post requests or offer assistance
2. **Karma System**: Award LOVE for positive interactions
3. **Creator Status**: Work towards unlocking zone creation privileges
4. **Peer Review**: Participate in community governance

## Advanced Features

### BLE Beacon Integration
**For Physical Spaces:**
- **Detection**: Automatic zone detection when approaching physical boundaries
- **Haptic Feedback**: Gentle vibrations when entering/exiting zones
- **Audio Cues**: Spatial audio changes based on location
- **Visual Transitions**: Smooth UI transitions synchronized with physical movement

**Setup:**
1. Ensure Bluetooth is enabled
2. Approach a configured beacon
3. Grant location permissions if requested
4. Follow on-screen instructions for pairing

### Cognitive Shield
**Purpose**: Filters high-conflict messages to reduce stress
**How it works:**
1. **Detection**: Automatically identifies potentially stressful content
2. **Rewriting**: Uses local AI to create neutral summaries
3. **Toggle**: You can view the original message if needed
4. **Learning**: System adapts to your preferences over time

### Economy Management
**Spoon Tracking:**
- Automatic logging of energy expenditures
- Real-time balance updates
- Borrowing and repayment tracking
- Daily reset and penalty calculations

**LOVE Management:**
- Peer-to-peer karma transfers
- Task completion rewards
- Creator status progression
- Community contribution tracking

## Troubleshooting

### Common Issues

**WebGPU Not Working:**
- **Cause**: Browser doesn't support WebGPU
- **Solution**: System automatically falls back to CPU processing
- **Performance**: May be slightly slower but fully functional

**BLE Not Detected:**
- **Cause**: Bluetooth disabled or permissions denied
- **Solution**: Enable Bluetooth and grant location permissions
- **Alternative**: Use manual zone selection

**Camera Controls Unresponsive:**
- **Cause**: Performance issues or input conflicts
- **Solution**: Try refreshing the page or adjusting performance settings
- **Alternative**: Use keyboard shortcuts for navigation

**Spoon Count Incorrect:**
- **Cause**: Manual adjustments or system errors
- **Solution**: Use the "Reset Daily" function or contact support
- **Prevention**: Avoid manual spoon adjustments unless necessary

### Performance Optimization

**For Low-End Devices:**
- Reduce Sierpinski depth in settings
- Enable performance monitoring
- Use CPU fallback mode
- Close other browser tabs

**For High-End Devices:**
- Enable all WebGPU features
- Increase visual quality settings
- Use multi-monitor support
- Enable advanced camera features

### Getting Help

**In-App Support:**
- Help Board for community assistance
- Documentation links in settings
- Tutorial videos for complex features

**External Resources:**
- Implementation Summary document
- Technical documentation
- Developer guides

## Best Practices

### Energy Management
1. **Plan Ahead**: Check zone requirements before visiting
2. **Rest Regularly**: Don't wait until Stand Down to rest
3. **Borrow Wisely**: Only borrow spoons for essential activities
4. **Track Patterns**: Notice which activities cost the most energy

### Social Engagement
1. **Start Small**: Begin with low-energy interactions
2. **Be Consistent**: Regular small contributions build karma
3. **Respect Boundaries**: Always acknowledge zone rules
4. **Ask for Help**: Use the Help Board when needed

### Technical Usage
1. **Keep Updated**: Regularly update the PWA
2. **Monitor Performance**: Use built-in monitoring tools
3. **Backup Data**: Export important information periodically
4. **Test Features**: Experiment with settings to find optimal configuration

## Privacy and Security

### Local-First Design
- **Data Ownership**: All data stored locally on your device
- **No Cloud Dependencies**: Critical functionality works offline
- **Privacy Protection**: No personal data sent to external servers
- **Encryption**: Sensitive data encrypted using WebCrypto

### Permissions
- **Bluetooth**: Only for zone detection and beacon interaction
- **Camera/Microphone**: Only for optional video/audio features
- **Location**: Only for BLE beacon proximity detection
- **Storage**: For local data persistence and offline functionality

### Data Management
- **Export**: Regularly export important data
- **Backup**: Use browser's built-in backup features
- **Clear Data**: Option to reset all data if needed
- **Privacy**: No tracking or analytics by default

## Conclusion

Spaceship Earth is designed to empower you with tools for cognitive sovereignty and social navigation. Take time to explore the features at your own pace, and don't hesitate to use the Help Board or documentation for support.

Remember: This is your spaceship. You are the captain. Use these tools to create a environment that supports your needs and helps you thrive.

## Quick Reference

### Keyboard Shortcuts
- **Space**: Reset camera position
- **F**: Toggle fullscreen
- **P**: Toggle performance monitoring
- **H**: Show help overlay

### Common Actions
- **Add Spoon**: Manual energy adjustment (use sparingly)
- **Award LOVE**: Click karma button on user profiles
- **Post Request**: Use Help Board in any zone
- **Reset Day**: Use morning assessment to reset spoon budget

### Emergency Procedures
- **Stand Down**: Automatic when spoons reach 0
- **Reset System**: Clear data in settings if needed
- **Contact Support**: Use Help Board or documentation

Welcome aboard, Captain. The journey begins now.