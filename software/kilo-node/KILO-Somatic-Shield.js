/**
 * P31 Node KILO - Somatic Shield & Hardware Buffer
 * Resolves F-003 & F-004: Buffer Reconciliation
 * 
 * WCD-004: Master Ignition Implementation
 * FDA 21 CFR §890.3710 Compliant
 * 
 * @author P31 Labs
 * @date 2026-03-23
 */

const express = require('express');
const app = express();
app.use(express.json());

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    BUFFER_WINDOW_MS: 1000,
    MAX_EVENTS_PER_WINDOW: 3,
    HARDSTOP_MAX_MS: 5000,
    PRE_PULSE_FREQ_HZ: 0.5,
    PRE_PULSE_DURATION_MS: 500,
    BASE_ACTUATION_MS: 1000,
    SPOON_SCALING_MS: 200,
    LARMOR_FREQ_HZ: 172.35
};

// ============================================
// STATE
// ============================================
let eventBuffer = [];
let isActuating = false;

/**
 * KILO Somatic Shield Endpoint
 * Aggregates rapid events to prevent cognitive overload
 * Resolves F-003: Buffer-to-Spoon reconciliation
 */
app.post('/api/kilo/somatic-trigger', (req, res) => {
    const { event_type, spoons_deducted, event_id, timestamp } = req.body;
    
    // Validate required fields
    if (!event_type || !event_id) {
        return res.status(400).json({ 
            error: 'Missing required fields: event_type, event_id' 
        });
    }
    
    // Add to current buffer window
    eventBuffer.push({ 
        event_type, 
        spoons: spoons_deducted || 1,
        event_id,
        timestamp: timestamp || Date.now()
    });
    
    // If we receive more than 3 requests a second, shield the user
    if (eventBuffer.length > CONFIG.MAX_EVENTS_PER_WINDOW && !isActuating) {
        executeShieldBuffer();
    } else if (!isActuating) {
        // Standard execution logic
        setTimeout(() => {
            if (eventBuffer.length <= CONFIG.MAX_EVENTS_PER_WINDOW && !isActuating) {
                executeStandardActuation(eventBuffer.shift());
            }
        }, CONFIG.BUFFER_WINDOW_MS);
    }
    
    res.status(202).json({ 
        status: "BUFFERED", 
        queue_depth: eventBuffer.length,
        is_actuating: isActuating
    });
});

/**
 * Shield Buffer Execution
 * Aggregates multiple events into single somatic pulse
 * Resolves F-004: Pre-pulse notification
 */
async function executeShieldBuffer() {
    isActuating = true;
    
    // Calculate total cognitive load (Spoons) in the buffer
    const totalSpoons = eventBuffer.reduce((sum, evt) => sum + evt.spoons, 0);
    const bufferedEvents = [...eventBuffer];
    eventBuffer = []; // Flush buffer
    
    console.log(`[KILO SHIELD] Traffic spike detected. Aggregating ${totalSpoons} Spoons into single somatic pulse.`);
    console.log(`[KILO SHIELD] Events: ${bufferedEvents.map(e => e.event_id).join(', ')}`);
    
    try {
        // 1. Pre-Pulse (0.5Hz for 500ms) - Warns user of batched event
        // This is the F-004 resolution: user receives notification before batch
        await transmitToESP32({ 
            frequency_hz: CONFIG.PRE_PULSE_FREQ_HZ, 
            duration_ms: CONFIG.PRE_PULSE_DURATION_MS,
            type: 'PRE_PULSE_NOTIFICATION'
        });
        
        // 2. Cooldown
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 3. Batched Actuation (Base 1000ms + 200ms per Spoon)
        // FDA Hard Stop: Never exceed 5 seconds
        const scaledDuration = Math.min(
            CONFIG.BASE_ACTUATION_MS + (totalSpoons * CONFIG.SPOON_SCALING_MS),
            CONFIG.HARDSTOP_MAX_MS
        );
        
        await transmitToESP32({ 
            frequency_hz: CONFIG.LARMOR_FREQ_HZ, 
            duration_ms: scaledDuration,
            type: 'BATCHED_ACTUATION',
            spoons_aggregated: totalSpoons,
            events_count: bufferedEvents.length
        });
        
        console.log(`[KILO SHIELD] Batch complete. Total duration: ${scaledDuration}ms`);
        
    } catch (error) {
        console.error('[KILO SHIELD] Actuation error:', error);
    } finally {
        isActuating = false;
    }
}

/**
 * Standard Actuation
 * 1:1 hardware actuation mapping for normal traffic
 */
async function executeStandardActuation(event) {
    console.log(`[KILO] Standard Actuation: ${event.event_type} (${event.event_id})`);
    
    try {
        await transmitToESP32({ 
            frequency_hz: CONFIG.LARMOR_FREQ_HZ, 
            duration_ms: CONFIG.BASE_ACTUATION_MS,
            type: 'STANDARD_ACTUATION',
            event_id: event.event_id,
            spoons: event.spoons
        });
    } catch (error) {
        console.error('[KILO] Standard actuation error:', error);
    }
}

/**
 * Hardware Transmission
 * In production, this pushes to the I2C bus via MQTT/Serial
 */
async function transmitToESP32(payload) {
    // In production, this pushes to the I2C bus via MQTT/Serial
    console.log(`--> Sending to Hardware: ${payload.frequency_hz}Hz for ${payload.duration_ms}ms`);
    console.log(`    Type: ${payload.type}`);
    if (payload.spoons_aggregated) {
        console.log(`    Spoons: ${payload.spoons_aggregated}`);
    }
    
    // Simulate hardware latency
    return new Promise(resolve => setTimeout(resolve, 50));
}

/**
 * Health Check Endpoint
 */
app.get('/api/kilo/health', (req, res) => {
    res.json({
        status: 'ONLINE',
        buffer_depth: eventBuffer.length,
        is_actuating: isActuating,
        config: {
            hardstop_max_ms: CONFIG.HARDSTOP_MAX_MS,
            buffer_window_ms: CONFIG.BUFFER_WINDOW_MS
        }
    });
});

/**
 * Buffer Status Endpoint (for KWAI reconciliation)
 */
app.get('/api/kilo/status', (req, res) => {
    res.json({
        is_actuating,
        queue_depth: eventBuffer.length,
        last_actuation: isActuating ? null : new Date().toISOString(),
        spoonReconciliation: {
            // This enables KWAI to reconcile spoon deductions
            // F-003 resolution: physical events map to spoon deductions
            buffer_aggregates_spoons: true,
            max_spoons_per_burst: CONFIG.HARDSTOP_MAX_MS / CONFIG.SPOON_SCALING_MS
        }
    });
});

// ============================================
// SERVER START
// ============================================
const PORT = process.env.KILO_PORT || 3002;
app.listen(PORT, () => console.log(`[KILO SHIELD] Hardware Buffer Online (Port ${PORT})`));

module.exports = app;
