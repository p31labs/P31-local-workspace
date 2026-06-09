// ═══════════════════════════════════════════════════════════════
// WCD-28.3: Stats Overlay Panel
// P31 Labs — Spaceship Earth
//
// Activated via ?stats=1 URL parameter.
// Displays: FPS, frame time, memory, GPU time, particle count.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { performanceMonitor } from '../../services/performanceMonitor';

interface StatsProps {
  // Optional positioning
  initialX?: number;
  initialY?: number;
}

export function StatsPanel({ initialX = 20, initialY = 20 }: StatsProps) {
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [metrics, setMetrics] = useState(performanceMonitor.getMetrics());

  // Update stats at 1Hz
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) return null;

  const fpsColor = metrics.fps >= 55 ? '#00FF88' : metrics.fps >= 40 ? '#FFD700' : '#FF4444';

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };
    
    const handleMouseUp = () => setIsDragging(false);
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.85)',
        border: '1px solid #333',
        borderRadius: 8,
        padding: minimized ? '8px 12px' : '12px 16px',
        fontFamily: '"Space Mono", monospace',
        fontSize: 11,
        color: '#ccc',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        minWidth: minimized ? 'auto' : 180,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header with minimize toggle */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: minimized ? 0 : 8,
        cursor: 'pointer',
      }}>
        <span style={{ color: '#666', fontSize: 9, letterSpacing: 1 }}>
          P31 STATS
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }}
          style={{
            background: 'none',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            fontSize: 14,
            lineHeight: 1,
            padding: 0,
          }}
        >
          {minimized ? '▲' : '▼'}
        </button>
      </div>

      {!minimized && (
        <>
          {/* FPS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#666' }}>FPS</span>
            <span style={{ color: fpsColor, fontWeight: 'bold' }}>{metrics.fps}</span>
          </div>

          {/* Frame time */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#666' }}>Frame</span>
            <span>{metrics.frameTime.toFixed(1)}ms</span>
          </div>

          {/* Memory */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#666' }}>Memory</span>
            <span>{metrics.memory ? `${(metrics.memory / 1024 / 1024).toFixed(1)}MB` : 'N/A'}</span>
          </div>

          {/* GPU Time */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#666' }}>GPU</span>
            <span>{metrics.gpuTime ? `${metrics.gpuTime.toFixed(1)}ms` : 'N/A'}</span>
          </div>

          {/* Particles */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#666' }}>Particles</span>
            <span>{metrics.particleCount}</span>
          </div>

          {/* Performance level */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            paddingTop: 8,
            borderTop: '1px solid #333',
          }}>
            <span style={{ 
              color: performanceMonitor.getPerformanceLevel() === 'high' ? '#00FF88' : 
                     performanceMonitor.getPerformanceLevel() === 'medium' ? '#FFD700' : '#FF4444',
              fontSize: 10,
              letterSpacing: 2,
              fontWeight: 'bold',
            }}>
              {performanceMonitor.getPerformanceLevel().toUpperCase()}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// Activation check
export function isStatsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('stats') === '1';
}
