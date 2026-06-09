import { useState, useEffect, useCallback } from 'react';
import { useGeolocationTracking, useFrequencySynthesis } from '../hooks';

/**
 * ColliderMode — Proximity-based sensor interface
 * 
 * Visualizes Wye/Delta topology based on GPS distance.
 * When grounded (< 50m), triggers Cloudflare webhook to Discord #mesh-telemetry.
 * Hot/cold audio feedback based on distance.
 */
export function ColliderMode({ 
  targetLocation = { lat: 30.9729, lon: -81.5683 }, // Default: St. Marys, GA
  groundThreshold = 50,
  onGrounded = () => {},
  className = '',
}) {
  const [meshConnected, setMeshConnected] = useState(false);
  const [lastTelemetry, setLastTelemetry] = useState(null);
  
  // Use the GPS hook
  const { 
    currentLocation, 
    distance, 
    isGrounded, 
    error: gpsError,
    isTracking, 
    startTracking, 
    stopTracking,
  } = useGeolocationTracking({
    targetLat: targetLocation.lat,
    targetLon: targetLocation.lon,
    groundThreshold,
  });

  // Use the frequency synthesis hook
  const { 
    playP31NMR, 
    playNoise, 
    stop: stopAudio,
    setVolume,
  } = useFrequencySynthesis();

  // Hot/cold pulse calculation based on distance
  const getPulseIntensity = useCallback(() => {
    if (distance === null || distance === undefined) return 0;
    if (distance <= groundThreshold) return 0; // Grounded = no pulse
    if (distance > 1000) return 0.1; // Cold (far)
    
    // Normalize 0-1000m to 1.0-0.2 range
    const normalized = 1 - (distance / 1000);
    return Math.max(0.2, normalized);
  }, [distance, groundThreshold]);

  // Audio feedback based on proximity
  useEffect(() => {
    if (!isTracking) return;
    
    const pulseIntensity = getPulseIntensity();
    
    if (isGrounded) {
      // Grounded: Play calm 172.35 Hz
      stopAudio();
      playP31NMR({ gain: 0.3, fadeIn: 1, type: 'sine' });
    } else if (distance !== null && distance < 1000) {
      // Hot/Cold: Pink noise with variable gain
      const gain = pulseIntensity * 0.15;
      playNoise('pink', { gain, filter: { type: 'lowpass', freq: 800 } });
    } else {
      stopAudio();
    }
    
    return () => stopAudio();
  }, [isGrounded, distance, isTracking, getPulseIntensity, playP31NMR, playNoise, stopAudio]);

  // Report to Cloudflare when grounded
  useEffect(() => {
    if (isGrounded && currentLocation && !lastTelemetry) {
      const reportGrounded = async () => {
        try {
          const response = await fetch('/api/mesh-telemetry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'grounded',
              location: currentLocation,
              timestamp: Date.now(),
              threshold: groundThreshold,
            }),
          });
          
          if (response.ok) {
            setLastTelemetry({ 
              event: 'grounded', 
              timestamp: Date.now() 
            });
            setMeshConnected(true);
            onGrounded?.({ location: currentLocation, timestamp: Date.now() });
          }
        } catch (err) {
          console.error('Telemetry report failed:', err);
        }
      };
      
      reportGrounded();
    }
  }, [isGrounded, currentLocation, groundThreshold, lastTelemetry, onGrounded]);

  // Start tracking on mount
  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, [startTracking, stopTracking]);

  // Calculate signal strength for visualization
  const getSignalStrength = () => {
    if (gpsError) return 0;
    if (!isTracking) return 0;
    if (distance === null) return 0;
    if (isGrounded) return 100;
    return Math.max(0, 100 - (distance / 10));
  };

  return (
    <div className={`collider-mode ${className}`}>
      {/* Status Header */}
      <div className="collider-header">
        <h3>Collider Mode</h3>
        <div className={`status-indicator ${isGrounded ? 'grounded' : isTracking ? 'seeking' : 'offline'}`}>
          {isGrounded ? 'Δ DELTA' : isTracking ? '◊ SEEKING' : '○ OFFLINE'}
        </div>
      </div>

      {/* Wye/Delta Topology Visualization */}
      <div className="topology-display">
        {isGrounded ? (
          <div className="delta-topology">
            <svg viewBox="0 0 100 100" className="tetrahedron">
              {/* K4 complete graph visualization */}
              <line x1="50" y1="10" x2="20" y2="80" stroke="#00FF88" strokeWidth="2" />
              <line x1="50" y1="10" x2="80" y2="80" stroke="#00FF88" strokeWidth="2" />
              <line x1="20" y1="80" x2="80" y2="80" stroke="#00FF88" strokeWidth="2" />
              <line x1="50" y1="10" x2="50" y2="50" stroke="#00FF88" strokeWidth="2" />
              <line x1="20" y1="80" x2="50" y2="50" stroke="#00FF88" strokeWidth="2" />
              <line x1="80" y1="80" x2="50" y2="50" stroke="#00FF88" strokeWidth="2" />
              
              {/* Nodes */}
              <circle cx="50" cy="10" r="6" fill="#00FF88" />
              <circle cx="20" cy="80" r="6" fill="#00D4FF" />
              <circle cx="80" cy="80" r="6" fill="#7A27FF" />
              <circle cx="50" cy="50" r="6" fill="#FF6600" />
            </svg>
            <div className="delta-label">TETRAHEDRON FORMED</div>
          </div>
        ) : (
          <div className="wye-topology">
            <svg viewBox="0 0 100 100" className="star-network">
              {/* Centralized star (fragile) */}
              <line x1="50" y1="50" x2="50" y2="15" stroke="#FF6600" strokeWidth="1" strokeDasharray="4" />
              <line x1="50" y1="50" x2="15" y2="75" stroke="#FF6600" strokeWidth="1" strokeDasharray="4" />
              <line x1="50" y1="50" x2="85" y2="75" stroke="#FF6600" strokeWidth="1" strokeDasharray="4" />
              
              {/* Central hub */}
              <circle cx="50" cy="50" r="8" fill="#FF6600" opacity="0.5" />
              <circle cx="50" cy="15" r="4" fill="#FF6600" />
              <circle cx="15" cy="75" r="4" fill="#FF6600" />
              <circle cx="85" cy="75" r="4" fill="#FF6600" />
            </svg>
            <div className="wye-label">WYE TOPOLOGY (SEEKING)</div>
          </div>
        )}
      </div>

      {/* Signal Strength Bar */}
      <div className="signal-bar">
        <div className="signal-label">SIGNAL</div>
        <div className="signal-track">
          <div 
            className="signal-fill"
            style={{ 
              width: `${getSignalStrength()}%`,
              backgroundColor: isGrounded ? '#00FF88' : '#FF6600',
            }}
          />
        </div>
        <div className="signal-value">{Math.round(getSignalStrength())}%</div>
      </div>

      {/* Distance Display */}
      <div className="distance-display">
        {distance !== null ? (
          <>
            <div className="distance-value">
              {isGrounded ? '0' : Math.round(distance)}
              <span className="distance-unit">m</span>
            </div>
            <div className="distance-label">
              {isGrounded ? 'GROUNDED' : 'TO TARGET'}
            </div>
          </>
        ) : (
          <div className="distance-value seeking">
            ◊
            <span className="distance-unit">ACQUIRING</span>
          </div>
        )}
      </div>

      {/* Mesh Connection Status */}
      <div className="mesh-status">
        <div className={`mesh-indicator ${meshConnected ? 'connected' : ''}`}>
          {meshConnected ? 'MESH LINKED' : 'MESH DISCONNECTED'}
        </div>
        {lastTelemetry && (
          <div className="last-telemetry">
            Last: {new Date(lastTelemetry.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Error Display */}
      {gpsError && (
        <div className="error-display">
          ⚠️ {gpsError}
        </div>
      )}

      {/* Controls */}
      <div className="collider-controls">
        <button 
          onClick={startTracking}
          disabled={isTracking}
          className="control-btn"
        >
          {isTracking ? 'TRACKING' : 'START'}
        </button>
        <button 
          onClick={stopTracking}
          disabled={!isTracking}
          className="control-btn"
        >
          STOP
        </button>
        <button 
          onClick={() => setVolume(0)}
          className="control-btn"
        >
          MUTE
        </button>
      </div>

      <style>{`
        .collider-mode {
          background: #0B0F19;
          border: 1px solid #1a1f2e;
          border-radius: 8px;
          padding: 16px;
          font-family: 'JetBrains Mono', monospace;
          color: #E8ECF4;
        }

        .collider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .collider-header h3 {
          margin: 0;
          font-size: 14px;
          color: #00D4FF;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .status-indicator {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
        }

        .status-indicator.grounded {
          background: #00FF88;
          color: #0B0F19;
        }

        .status-indicator.seeking {
          background: #FF6600;
          color: #0B0F19;
          animation: pulse 1s infinite;
        }

        .status-indicator.offline {
          background: #333;
          color: #666;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .topology-display {
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 16px 0;
        }

        .tetrahedron, .star-network {
          width: 80px;
          height: 80px;
        }

        .delta-label, .wye-label {
          font-size: 10px;
          color: #666;
          text-align: center;
          margin-top: 8px;
        }

        .delta-label { color: #00FF88; }

        .signal-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 16px 0;
        }

        .signal-label {
          font-size: 10px;
          color: #666;
          width: 40px;
        }

        .signal-track {
          flex: 1;
          height: 8px;
          background: #1a1f2e;
          border-radius: 4px;
          overflow: hidden;
        }

        .signal-fill {
          height: 100%;
          transition: width 0.3s ease, background-color 0.3s ease;
        }

        .signal-value {
          font-size: 12px;
          color: #00D4FF;
          width: 40px;
          text-align: right;
        }

        .distance-display {
          text-align: center;
          padding: 16px 0;
        }

        .distance-value {
          font-size: 48px;
          font-weight: bold;
          color: #00FF88;
          line-height: 1;
        }

        .distance-value.seeking {
          color: #FF6600;
          animation: pulse 1s infinite;
        }

        .distance-unit {
          font-size: 14px;
          color: #666;
          margin-left: 4px;
        }

        .distance-label {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-top: 4px;
        }

        .mesh-status {
          text-align: center;
          padding: 8px 0;
          border-top: 1px solid #1a1f2e;
        }

        .mesh-indicator {
          font-size: 10px;
          color: #666;
        }

        .mesh-indicator.connected {
          color: #00D4FF;
        }

        .last-telemetry {
          font-size: 9px;
          color: #444;
          margin-top: 4px;
        }

        .error-display {
          background: #EF4444;
          color: white;
          padding: 8px;
          border-radius: 4px;
          font-size: 12px;
          margin: 8px 0;
        }

        .collider-controls {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }

        .control-btn {
          flex: 1;
          padding: 8px;
          background: #1a1f2e;
          border: 1px solid #333;
          border-radius: 4px;
          color: #E8ECF4;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .control-btn:hover:not(:disabled) {
          background: #2a3040;
          border-color: #00D4FF;
        }

        .control-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default ColliderMode;