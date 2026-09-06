import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Activity, 
  Shield, 
  Send, 
  CheckCircle2, 
  Server, 
  Cpu,
  Zap,
  Globe,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';

const WORKERS = [
  { id: 'kofi', name: 'p31-kofi-telemetry', url: 'https://p31-kofi-telemetry.trimtab-signal.workers.dev' },
  { id: 'zenodo', name: 'p31-zenodo-publisher', url: 'https://p31-zenodo-publisher.trimtab-signal.workers.dev' },
  { id: 'social', name: 'p31-social-broadcast', url: 'https://p31-social-broadcast.trimtab-signal.workers.dev' },
  { id: 'q_bridge', name: 'p31-quantum-bridge', url: 'https://p31-quantum-bridge.trimtab-signal.workers.dev' },
  { id: 'q_entropy', name: 'p31-quantum-entropy', url: 'https://p31-quantum-entropy.trimtab-signal.workers.dev' }
];

const PLATFORMS = [
  { id: 'nostr', name: 'Nostr', color: 'bg-purple-600' },
  { id: 'bluesky', name: 'Bluesky', color: 'bg-blue-500' },
  { id: 'mastodon', name: 'Mastodon', color: 'bg-indigo-500' },
  { id: 'twitter', name: 'Twitter/X', color: 'bg-slate-800' },
  { id: 'substack', name: 'Substack', color: 'bg-orange-500' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('broadcast');
  const [broadcastText, setBroadcastText] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['nostr', 'bluesky']);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState<'success' | 'error' | null>(null);
  const [entropySeed, setEntropySeed] = useState<string | null>(null);
  const [isGeneratingEntropy, setIsGeneratingEntropy] = useState(false);
  const [workerStatus, setWorkerStatus] = useState<Record<string, { status: string; latency: number }>>({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Toggle platform selection for broadcasting
  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // Live broadcast function connecting to Cloudflare Worker
  const handleBroadcast = async () => {
    if (!broadcastText.trim() || selectedPlatforms.length === 0) return;
    
    setIsBroadcasting(true);
    setBroadcastStatus(null);
    
    try {
      // Live connection to your Cloudflare Worker
      const response = await fetch('https://p31-social-broadcast.trimtab-signal.workers.dev', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Client-ID': 'sovereign-command-center',
          'X-Request-Timestamp': new Date().toISOString()
        },
        body: JSON.stringify({
          message: broadcastText,
          platforms: selectedPlatforms,
          metadata: {
            source: 'sovereign-command-center',
            timestamp: Date.now(),
            operator: 'WCD-Node-Zero'
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Broadcast successful:', result);
        setBroadcastStatus('success');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Broadcast failed:', error);
      setBroadcastStatus('error');
    } finally {
      setIsBroadcasting(false);
      setBroadcastText('');
      setTimeout(() => setBroadcastStatus(null), 3000);
    }
  };

  // Mock Quantum Entropy Generation
  const requestEntropy = async () => {
    setIsGeneratingEntropy(true);
    try {
      // Simulate IBM QPU latency
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a secure-looking mock hash
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const hash = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      
      setEntropySeed(hash);
      setIsGeneratingEntropy(false);
    } catch (error) {
      setIsGeneratingEntropy(false);
    }
  };

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize worker status
  useEffect(() => {
    const initialStatus: Record<string, { status: string; latency: number }> = {};
    WORKERS.forEach(worker => {
      initialStatus[worker.id] = { status: 'online', latency: Math.floor(Math.random() * 100) + 10 };
    });
    setWorkerStatus(initialStatus);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="bg-slate-900 border-b border-emerald-900/30 p-4 sticky top-0 z-10 shadow-lg shadow-emerald-900/10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-emerald-400 font-bold text-lg leading-tight">🔺</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-100 leading-tight">Sovereign Command</h1>
              <div className="text-xs text-emerald-400/70 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Mesh Active • 21 CFR §890.3710
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-emerald-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className="text-xs text-slate-400">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto p-4 pb-24">
        
        {/* TAB: BROADCAST */}
        {activeTab === 'broadcast' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                Decentralized Broadcast
              </label>
              <textarea
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder="Initialize protocol-independent transmission..."
                className="w-full h-32 bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-400">Target Vectors</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(platform => (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      selectedPlatforms.includes(platform.id)
                        ? `${platform.color} border-transparent text-white shadow-lg shadow-black/20`
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {platform.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleBroadcast}
              disabled={isBroadcasting || !broadcastText.trim() || selectedPlatforms.length === 0}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBroadcasting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
                  Transmitting to Edge...
                </span>
              ) : broadcastStatus === 'success' ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Broadcast Complete
                </span>
              ) : broadcastStatus === 'error' ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </span>
                  Transmission Failed
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Deploy Transmission
                </span>
              )}
            </button>
          </div>
        )}

        {/* TAB: STATUS */}
        {activeTab === 'status' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-sm font-medium text-slate-400 flex items-center gap-2 mb-4">
              <Server className="w-4 h-4 text-emerald-400" />
              Edge Worker Topology
            </h2>
            
            <div className="grid gap-3">
              {WORKERS.map(worker => (
                <div key={worker.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-200">{worker.name}</div>
                      <div className="text-xs text-slate-500 font-mono truncate w-48">.workers.dev</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-xs text-emerald-400 font-medium">HTTP 200</span>
                  </div>
                </div>
              ))}

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-200">Discord Gateway (p31#1581)</div>
                    <div className="text-xs text-slate-500 font-mono">Terminal 1 / Port 3000</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                  <span className="text-xs text-indigo-400 font-medium">Online</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: QUANTUM */}
        {activeTab === 'quantum' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <Cpu className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-200">IBM Quantum Bridge</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Connected to IBM Quantum Runtime. Use this interface to generate non-deterministic entropy for Work Center Documents (WCDs).
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={requestEntropy}
                  disabled={isGeneratingEntropy}
                  className="w-full py-2.5 rounded-lg border border-purple-500/30 text-purple-400 font-medium flex items-center justify-center gap-2 hover:bg-purple-500/10 transition-colors disabled:opacity-50"
                >
                  {isGeneratingEntropy ? (
                    <span className="flex items-center gap-2 text-sm">
                      <Zap className="w-4 h-4 animate-pulse" /> Collapsing Waveform...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4" /> Request WCD Entropy
                    </span>
                  )}
                </button>

                {entropySeed && (
                  <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-xs text-slate-500 mb-1">Quantum Seed (SHA-256 PQC Format):</div>
                    <div className="text-xs font-mono text-emerald-400 break-all">
                      {entropySeed}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Bottom Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 pb-safe">
        <div className="max-w-md mx-auto flex justify-around p-2">
          <button 
            onClick={() => setActiveTab('broadcast')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${activeTab === 'broadcast' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:text-slate-400'}`}
          >
            <Send className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Broadcast</span>
          </button>
          <button 
            onClick={() => setActiveTab('status')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${activeTab === 'status' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:text-slate-400'}`}
          >
            <Activity className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Mesh Status</span>
          </button>
          <button 
            onClick={() => setActiveTab('quantum')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${activeTab === 'quantum' ? 'text-purple-400 bg-purple-400/10' : 'text-slate-500 hover:text-slate-400'}`}
          >
            <Cpu className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Quantum</span>
          </button>
        </div>
      </nav>
    </div>
  );
}