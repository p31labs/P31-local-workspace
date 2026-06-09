#!/usr/bin/env node

/**
 * Larmor Frequency Temporal Lock System
 * Implements the 0.86 Hz temporal synchronization mechanism for P-31
 * 
 * This system creates a metronome that ticks at the precise Larmor frequency
 * of Phosphorus-31 in Earth's magnetic field, requiring players to synchronize
 * their inputs to achieve quantum coherence.
 */

class LarmorFrequencyLock {
    constructor() {
        // Constants for P-31 Larmor frequency calculation
        this.GYROMAGNETIC_RATIO = 10.8394e6; // Hz/T for P-31
        this.EARTH_MAGNETIC_FIELD = 25e-6; // Tesla (approximate)
        
        // Calculate Larmor frequency: ω = |γB|
        this.LARMOR_FREQUENCY = Math.abs(this.GYROMAGNETIC_RATIO * this.EARTH_MAGNETIC_FIELD);
        this.LARMOR_PERIOD = 1 / this.LARMOR_FREQUENCY; // seconds
        
        console.log(`Larmor Frequency: ${this.LARMOR_FREQUENCY.toFixed(3)} Hz`);
        console.log(`Larmor Period: ${this.LARMOR_PERIOD.toFixed(3)} seconds`);
        
        this.isActive = false;
        this.phase = 0;
        this.coherenceLevel = 0;
        this.multiplier = 1;
        this.listeners = [];
    }

    /**
     * Start the Larmor frequency metronome
     */
    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.phase = 0;
        this.coherenceLevel = 0;
        this.multiplier = 1;
        
        console.log('Larmor Frequency Lock activated');
        console.log(`Metronome running at ${this.LARMOR_FREQUENCY.toFixed(3)} Hz`);
        
        // Start the metronome
        this.metronomeInterval = setInterval(() => {
            this.tick();
        }, this.LARMOR_PERIOD * 1000); // Convert to milliseconds
    }

    /**
     * Stop the Larmor frequency metronome
     */
    stop() {
        if (!this.isActive) return;
        
        this.isActive = false;
        clearInterval(this.metronomeInterval);
        
        console.log('Larmor Frequency Lock deactivated');
        console.log(`Final coherence level: ${this.coherenceLevel}`);
        console.log(`Final multiplier: ${this.multiplier}x`);
    }

    /**
     * Metronome tick - advances phase and checks for synchronization
     */
    tick() {
        this.phase += (2 * Math.PI) / (this.LARMOR_PERIOD * 1000);
        
        // Emit phase update for visual metronome
        this.emit('phase_update', {
            phase: this.phase,
            coherence: this.coherenceLevel,
            multiplier: this.multiplier
        });
        
        // Decay coherence over time if not being maintained
        if (this.coherenceLevel > 0) {
            this.coherenceLevel *= 0.95; // Slow decay
            if (this.coherenceLevel < 1) {
                this.coherenceLevel = 0;
                this.multiplier = 1;
            }
        }
    }

    /**
     * Player input synchronization check
     * Called when player places an atom or makes a bond
     */
    checkSynchronization(inputTime) {
        if (!this.isActive) return { success: false, message: 'Lock not active' };
        
        const now = Date.now();
        const timeSinceLastTick = (now - inputTime) % (this.LARMOR_PERIOD * 1000);
        const phaseError = Math.abs(timeSinceLastTick - (this.LARMOR_PERIOD * 500)); // Half period for optimal sync
        
        // Calculate synchronization quality (0.0 to 1.0)
        const maxError = this.LARMOR_PERIOD * 250; // 1/4 period tolerance
        const quality = Math.max(0, 1 - (phaseError / maxError));
        
        if (quality > 0.8) {
            // Excellent synchronization
            this.coherenceLevel += 20;
            this.multiplier = Math.min(5, this.multiplier + 0.5);
            
            this.emit('synchronization', {
                type: 'excellent',
                quality: quality,
                coherence: this.coherenceLevel,
                multiplier: this.multiplier,
                message: 'Quantum coherence achieved! Signal stabilized.'
            });
            
            return {
                success: true,
                type: 'excellent',
                quality: quality,
                coherence: this.coherenceLevel,
                multiplier: this.multiplier,
                message: 'Perfect synchronization! Quantum state stabilized.'
            };
            
        } else if (quality > 0.5) {
            // Good synchronization
            this.coherenceLevel += 10;
            this.multiplier = Math.min(3, this.multiplier + 0.2);
            
            this.emit('synchronization', {
                type: 'good',
                quality: quality,
                coherence: this.coherenceLevel,
                multiplier: this.multiplier,
                message: 'Signal coherence improving.'
            });
            
            return {
                success: true,
                type: 'good',
                quality: quality,
                coherence: this.coherenceLevel,
                multiplier: this.multiplier,
                message: 'Good synchronization. Signal stabilizing.'
            };
            
        } else if (quality > 0.2) {
            // Poor synchronization
            this.coherenceLevel += 5;
            
            this.emit('synchronization', {
                type: 'poor',
                quality: quality,
                coherence: this.coherenceLevel,
                multiplier: this.multiplier,
                message: 'Signal interference detected.'
            });
            
            return {
                success: true,
                type: 'poor',
                quality: quality,
                coherence: this.coherenceLevel,
                multiplier: this.multiplier,
                message: 'Partial synchronization. Signal unstable.'
            };
            
        } else {
            // Out of sync
            this.coherenceLevel = Math.max(0, this.coherenceLevel - 5);
            this.multiplier = Math.max(1, this.multiplier - 0.1);
            
            this.emit('synchronization', {
                type: 'failed',
                quality: quality,
                coherence: this.coherenceLevel,
                multiplier: this.multiplier,
                message: 'Signal decoherence detected.'
            });
            
            return {
                success: false,
                type: 'failed',
                quality: quality,
                coherence: this.coherenceLevel,
                multiplier: this.multiplier,
                message: 'Synchronization failed. Signal lost.'
            };
        }
    }

    /**
     * Get current lock status
     */
    getStatus() {
        return {
            active: this.isActive,
            frequency: this.LARMOR_FREQUENCY,
            period: this.LARMOR_PERIOD,
            phase: this.phase,
            coherence: this.coherenceLevel,
            multiplier: this.multiplier,
            quality: this.coherenceLevel > 0 ? 'stable' : 'unstable'
        };
    }

    /**
     * Reset the lock system
     */
    reset() {
        this.stop();
        this.coherenceLevel = 0;
        this.multiplier = 1;
        this.phase = 0;
    }

    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    /**
     * Emit event to listeners
     */
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}

// Export for use in game
module.exports = LarmorFrequencyLock;

// Example usage
if (require.main === module) {
    const lock = new LarmorFrequencyLock();
    
    // Listen for synchronization events
    lock.on('synchronization', (data) => {
        console.log(`Sync event: ${data.type} - Coherence: ${data.coherence}, Multiplier: ${data.multiplier}x`);
    });
    
    lock.on('phase_update', (data) => {
        console.log(`Phase: ${data.phase.toFixed(2)}, Coherence: ${data.coherence}`);
    });
    
    // Start the lock
    lock.start();
    
    // Simulate player inputs at different times
    setTimeout(() => {
        console.log('Player input 1 (in sync)');
        lock.checkSynchronization(Date.now());
    }, 2000);
    
    setTimeout(() => {
        console.log('Player input 2 (out of sync)');
        lock.checkSynchronization(Date.now() + 500);
    }, 4000);
    
    setTimeout(() => {
        lock.stop();
    }, 10000);
}