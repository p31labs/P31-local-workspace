/**
 * starfield-settings-ui.js — Settings panel for starfield notifications
 *
 * Dynamically creates and injects the settings UI into the page.
 * Provides controls for:
 * - Enabling/disabling notifications
 * - Event type filters (messages, alerts, mesh, activity)
 * - Visual settings (duration, intensity)
 * - Audio settings
 * - Test buttons
 */

(function() {
  'use strict';

  // Only initialize once
  if (window.__starfieldSettingsUI) return;
  window.__starfieldSettingsUI = true;

  // CSS styles
  const STYLES = `
    .sf-settings-btn {
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(15, 17, 21, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #ede8e0;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
      z-index: 1000;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }
    .sf-settings-btn:hover {
      transform: scale(1.1);
      border-color: #4db8a8;
      box-shadow: 0 0 20px rgba(77, 184, 168, 0.3);
    }
    .sf-settings-btn.pulse::after {
      content: '';
      position: absolute;
      width: 8px;
      height: 8px;
      background: #f43f5e;
      border-radius: 50%;
      top: 8px;
      right: 8px;
      animation: sf-pulse-dot 2s infinite;
    }
    @keyframes sf-pulse-dot {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.5); opacity: 0.5; }
    }
    .sf-panel {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: none;
      align-items: center;
      justify-content: center;
    }
    .sf-panel.active { display: flex; }
    .sf-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
    }
    .sf-panel-inner {
      position: relative;
      width: 90%;
      max-width: 420px;
      max-height: 85vh;
      background: rgba(15, 17, 21, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .sf-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .sf-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #ede8e0;
    }
    .sf-close {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: rgba(255, 255, 255, 0.05);
      color: #ede8e0;
      font-size: 20px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .sf-close:hover { background: rgba(255, 255, 255, 0.1); }
    .sf-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .sf-section h3 {
      margin: 0 0 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(237, 232, 224, 0.6);
      font-family: monospace;
    }
    .sf-toggle {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
    }
    .sf-toggle input { display: none; }
    .sf-switch {
      width: 48px;
      height: 26px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 13px;
      position: relative;
      transition: background 0.3s;
    }
    .sf-switch::after {
      content: '';
      position: absolute;
      width: 22px;
      height: 22px;
      background: white;
      border-radius: 50%;
      top: 2px;
      left: 2px;
      transition: transform 0.3s;
    }
    .sf-toggle input:checked + .sf-switch { background: #4db8a8; }
    .sf-toggle input:checked + .sf-switch::after { transform: translateX(22px); }
    .sf-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
    }
    .sf-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #fbbf24;
      animation: sf-status-pulse 2s infinite;
    }
    .sf-status-dot.connected { background: #10b981; animation: none; }
    .sf-status-dot.disconnected { background: #f43f5e; animation: none; }
    @keyframes sf-status-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .sf-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 12px;
    }
    .sf-stat {
      text-align: center;
      padding: 12px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
    }
    .sf-stat-value {
      display: block;
      font-size: 24px;
      font-weight: 700;
      color: #4db8a8;
      font-family: monospace;
    }
    .sf-stat-label {
      font-size: 11px;
      color: rgba(237, 232, 224, 0.5);
      text-transform: uppercase;
    }
    .sf-filters { display: flex; flex-direction: column; gap: 8px; }
    .sf-filter {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .sf-filter:hover { background: rgba(255, 255, 255, 0.06); }
    .sf-filter input { width: 18px; height: 18px; accent-color: #4db8a8; }
    .sf-filter-icon { font-size: 18px; }
    .sf-filter-text { flex: 1; font-size: 14px; color: #ede8e0; }
    .sf-slider { margin-bottom: 16px; }
    .sf-slider label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
      color: #ede8e0;
    }
    .sf-slider input {
      width: 100%;
      height: 6px;
      -webkit-appearance: none;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      outline: none;
    }
    .sf-slider input::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      background: #4db8a8;
      border-radius: 50%;
      cursor: pointer;
    }
    .sf-tests {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .sf-test-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #ede8e0;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .sf-test-btn:hover {
      background: var(--test-color, rgba(255, 255, 255, 0.1));
      border-color: var(--test-color, #4db8a8);
    }
    .sf-footer {
      display: flex;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .sf-btn {
      flex: 1;
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .sf-btn-secondary {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: rgba(237, 232, 224, 0.5);
    }
    .sf-btn-secondary:hover { border-color: #ede8e0; color: #ede8e0; }
    .sf-btn-primary {
      background: #4db8a8;
      border: none;
      color: #0f1115;
    }
    .sf-btn-primary:hover { box-shadow: 0 0 20px rgba(77, 184, 168, 0.4); }
  `;

  // Create UI elements
  function createUI() {
    // Add styles
    const styleEl = document.createElement('style');
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);

    // Create toggle button
    const btn = document.createElement('button');
    btn.className = 'sf-settings-btn';
    btn.innerHTML = '✨';
    btn.setAttribute('aria-label', 'Starfield settings');
    btn.onclick = () => panel.classList.add('active');
    document.body.appendChild(btn);

    // Create panel
    const panel = document.createElement('div');
    panel.className = 'sf-panel';
    panel.innerHTML = `
      <div class="sf-backdrop" onclick="this.parentElement.classList.remove('active')"></div>
      <div class="sf-panel-inner">
        <div class="sf-header">
          <h2>✨ Starfield Notifications</h2>
          <button class="sf-close" onclick="this.closest('.sf-panel').classList.remove('active')">×</button>
        </div>
        <div class="sf-body">
          <div class="sf-section">
            <label class="sf-toggle">
              <input type="checkbox" id="sf-enabled" checked>
              <span class="sf-switch"></span>
              <span>Enable starfield notifications</span>
            </label>
          </div>
          <div class="sf-section">
            <h3>Connection</h3>
            <div class="sf-status">
              <span id="sf-status-dot" class="sf-status-dot"></span>
              <span id="sf-status-text">Connecting...</span>
            </div>
            <div class="sf-stats">
              <div class="sf-stat">
                <span class="sf-stat-value" id="sf-pulses">0</span>
                <span class="sf-stat-label">Active Pulses</span>
              </div>
              <div class="sf-stat">
                <span class="sf-stat-value" id="sf-events">0</span>
                <span class="sf-stat-label">Total Events</span>
              </div>
            </div>
          </div>
          <div class="sf-section">
            <h3>Event Types</h3>
            <div class="sf-filters">
              <label class="sf-filter">
                <input type="checkbox" id="sf-filter-msg" checked>
                <span class="sf-filter-icon" style="color: #3b82f6">💬</span>
                <span class="sf-filter-text">Messages</span>
              </label>
              <label class="sf-filter">
                <input type="checkbox" id="sf-filter-alert" checked>
                <span class="sf-filter-icon" style="color: #f43f5e">⚠️</span>
                <span class="sf-filter-text">Alerts</span>
              </label>
              <label class="sf-filter">
                <input type="checkbox" id="sf-filter-mesh" checked>
                <span class="sf-filter-icon" style="color: #10b981">🕸️</span>
                <span class="sf-filter-text">Mesh Events</span>
              </label>
              <label class="sf-filter">
                <input type="checkbox" id="sf-filter-activity">
                <span class="sf-filter-icon" style="color: #8b5cf6">✨</span>
                <span class="sf-filter-text">Activity</span>
              </label>
            </div>
          </div>
          <div class="sf-section">
            <h3>Visuals</h3>
            <div class="sf-slider">
              <label>Duration <span id="sf-dur-val">3.0s</span></label>
              <input type="range" id="sf-duration" min="0.5" max="10" step="0.5" value="3">
            </div>
            <div class="sf-slider">
              <label>Intensity <span id="sf-int-val">80%</span></label>
              <input type="range" id="sf-intensity" min="10" max="100" step="10" value="80">
            </div>
          </div>
          <div class="sf-section">
            <h3>Audio</h3>
            <label class="sf-toggle">
              <input type="checkbox" id="sf-sound">
              <span class="sf-switch"></span>
              <span>Enable sound effects</span>
            </label>
            <div class="sf-slider" id="sf-vol-wrap" style="opacity: 0.5; pointer-events: none;">
              <label>Volume <span id="sf-vol-val">30%</span></label>
              <input type="range" id="sf-volume" min="0" max="100" step="10" value="30">
            </div>
          </div>
          <div class="sf-section">
            <h3>Test</h3>
            <div class="sf-tests">
              <button class="sf-test-btn" data-test="message" style="--test-color: rgba(59, 130, 246, 0.2)">
                💬 Message
              </button>
              <button class="sf-test-btn" data-test="alert" style="--test-color: rgba(244, 63, 94, 0.2)">
                ⚠️ Alert
              </button>
              <button class="sf-test-btn" data-test="mesh" style="--test-color: rgba(16, 185, 129, 0.2)">
                🕸️ Mesh
              </button>
              <button class="sf-test-btn" data-test="activity" style="--test-color: rgba(139, 92, 246, 0.2)">
                ✨ Activity
              </button>
            </div>
          </div>
        </div>
        <div class="sf-footer">
          <button class="sf-btn sf-btn-secondary" onclick="resetDefaults()">Reset</button>
          <button class="sf-btn sf-btn-primary" onclick="saveSettings()">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    // Event listeners
    document.getElementById('sf-duration').addEventListener('input', (e) => {
      document.getElementById('sf-dur-val').textContent = e.target.value + 's';
    });
    document.getElementById('sf-intensity').addEventListener('input', (e) => {
      document.getElementById('sf-int-val').textContent = e.target.value + '%';
    });
    document.getElementById('sf-volume').addEventListener('input', (e) => {
      document.getElementById('sf-vol-val').textContent = e.target.value + '%';
    });
    document.getElementById('sf-sound').addEventListener('change', (e) => {
      const wrap = document.getElementById('sf-vol-wrap');
      wrap.style.opacity = e.target.checked ? '1' : '0.5';
      wrap.style.pointerEvents = e.target.checked ? 'auto' : 'none';
    });

    // Test buttons
    panel.querySelectorAll('.sf-test-btn').forEach(b => {
      b.addEventListener('click', () => {
        const type = b.dataset.test;
        if (window.p31StarfieldNotifications) {
          window.p31StarfieldNotifications.triggerNotification(type, 'normal');
        }
      });
    });

    // Load saved settings
    loadSettings();

    // Start status updates
    setInterval(updateStatus, 1000);

    return { btn, panel };
  }

  function loadSettings() {
    try {
      const saved = localStorage.getItem('p31-starfield-notifications-config');
      if (!saved) return;

      const config = JSON.parse(saved);
      document.getElementById('sf-enabled').checked = config.enabled ?? true;
      document.getElementById('sf-filter-msg').checked = config.filters?.messages ?? true;
      document.getElementById('sf-filter-alert').checked = config.filters?.alerts ?? true;
      document.getElementById('sf-filter-mesh').checked = config.filters?.meshEvents ?? true;
      document.getElementById('sf-filter-activity').checked = config.filters?.activity ?? false;

      const dur = (config.starPulseDuration ?? 3000) / 1000;
      document.getElementById('sf-duration').value = dur;
      document.getElementById('sf-dur-val').textContent = dur + 's';

      const int = Math.round((config.starPulseIntensity ?? 0.8) * 100);
      document.getElementById('sf-intensity').value = int;
      document.getElementById('sf-int-val').textContent = int + '%';

      document.getElementById('sf-sound').checked = config.enableSound ?? false;
      const vol = Math.round((config.soundVolume ?? 0.3) * 100);
      document.getElementById('sf-volume').value = vol;
      document.getElementById('sf-vol-val').textContent = vol + '%';
    } catch (e) {
      console.warn('Failed to load starfield settings:', e);
    }
  }

  function updateStatus() {
    const status = window.p31StarfieldNotifications?.getStatus?.();
    if (!status) return;

    const dot = document.getElementById('sf-status-dot');
    const text = document.getElementById('sf-status-text');

    if (dot && text) {
      dot.className = 'sf-status-dot ' + (status.connected ? 'connected' : 'disconnected');
      text.textContent = status.connected ? 'Connected to mesh' : 'Disconnected';
    }

    const pulses = document.getElementById('sf-pulses');
    const events = document.getElementById('sf-events');
    if (pulses) pulses.textContent = status.activePulses;
    if (events) events.textContent = status.eventCount;

    // Update button pulse
    const btn = document.querySelector('.sf-settings-btn');
    if (btn) {
      btn.classList.toggle('pulse', status.activePulses > 0);
    }
  }

  // Expose functions globally
  window.saveSettings = function() {
    const config = {
      enabled: document.getElementById('sf-enabled').checked,
      filters: {
        messages: document.getElementById('sf-filter-msg').checked,
        alerts: document.getElementById('sf-filter-alert').checked,
        meshEvents: document.getElementById('sf-filter-mesh').checked,
        activity: document.getElementById('sf-filter-activity').checked,
      },
      starPulseDuration: parseFloat(document.getElementById('sf-duration').value) * 1000,
      starPulseIntensity: parseInt(document.getElementById('sf-intensity').value) / 100,
      enableSound: document.getElementById('sf-sound').checked,
      soundVolume: parseInt(document.getElementById('sf-volume').value) / 100,
    };

    localStorage.setItem('p31-starfield-notifications-config', JSON.stringify(config));

    if (window.p31StarfieldNotifications) {
      window.p31StarfieldNotifications.updateConfig(config);
    }

    document.querySelector('.sf-panel').classList.remove('active');
  };

  window.resetDefaults = function() {
    if (!confirm('Reset all starfield notification settings to defaults?')) return;

    document.getElementById('sf-enabled').checked = true;
    document.getElementById('sf-filter-msg').checked = true;
    document.getElementById('sf-filter-alert').checked = true;
    document.getElementById('sf-filter-mesh').checked = true;
    document.getElementById('sf-filter-activity').checked = false;
    document.getElementById('sf-duration').value = 3;
    document.getElementById('sf-dur-val').textContent = '3.0s';
    document.getElementById('sf-intensity').value = 80;
    document.getElementById('sf-int-val').textContent = '80%';
    document.getElementById('sf-sound').checked = false;
    document.getElementById('sf-vol-wrap').style.opacity = '0.5';
    document.getElementById('sf-vol-wrap').style.pointerEvents = 'none';
    document.getElementById('sf-volume').value = 30;
    document.getElementById('sf-vol-val').textContent = '30%';
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createUI);
  } else {
    createUI();
  }
})();
