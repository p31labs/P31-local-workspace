import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createMLSMeshClient } from './services/mls-crypto';
import { FinancialSubnet } from './services/FinancialSubnet';
import FamilyChat from './FamilyChat';
import P31MeshClock from './P31MeshClock';
import { ShieldCheck, Lock, Unlock, Wallet } from 'lucide-react';
import OmnibusD20 from './omnibus/OmnibusD20';

const OMNIBUS_PAPERS = [
  { id: 1, title: 'Tetrahedron Protocol', doi: '10.5281/zenodo.19004485', filename: 'P31_Paper_01_Tetrahedron_Protocol.docx' },
  { id: 2, title: 'Genesis Whitepaper v1.1', doi: '10.5281/zenodo.19411363', filename: 'P31_Paper_02_Genesis_Whitepaper_v1.1.docx' },
  { id: 3, title: 'Consciousness, Memory, and the Architecture of Self-Preservation', doi: '10.5281/zenodo.xxxxx', filename: 'P31_Paper_03_Consciousness_Memory_Architecture.docx' },
  { id: 4, title: 'The Minimum Enclosing Structure Monograph', doi: '10.5281/zenodo.19004485', filename: 'P31_Paper_04_Minimum_Enclosing_Structure.docx' },
  { id: 5, title: 'Delta Mesh Topology Underlying the P31 Labs Ecosystem', doi: '10.5281/zenodo.19416491', filename: 'P31_Paper_05_Delta_Mesh_Topology.docx' },
  { id: 6, title: 'Cognitive Passport Protocol', doi: '10.5281/zenodo.19432309', filename: 'P31_Paper_06_Cognitive_Passport_Protocol.docx' },
  { id: 7, title: 'Neurodivergent Founder Methodology', doi: '10.5281/zenodo.19432313', filename: 'P31_Paper_07_Neurodivergent_Founder_Methodology.docx' },
  { id: 8, title: 'BONDING: A Publicly Deployed Multiplayer Chemistry Game', doi: '10.5281/zenodo.xxxxx', filename: 'P31_Paper_08_BONDING_Chemistry_Game.docx' },
  { id: 9, title: 'Node Zero Hardware Prototype', doi: '10.5281/zenodo.xxxxx', filename: 'P31_Paper_09_Node_Zero_Hardware.docx' },
  { id: 10, title: 'The Buffer: Communication-Processing Application for Neurodivergent Users', doi: '10.5281/zenodo.xxxxx', filename: 'P31_Paper_10_The_Buffer_Application.docx' },
  { id: 11, title: 'Gates Foundation Grand Challenges: AI to Accelerate Charitable Giving', doi: '10.5281/zenodo.xxxxx', filename: 'P31_Paper_11_Gates_Grand_Challenges_Proposal.docx' },
  { id: 12, title: 'Universal Bridge: AI Accessibility Framework', doi: '10.5281/zenodo.19503542', filename: 'P31_Paper_12_Universal_Bridge_AI_Accessibility.docx' },
  { id: 13, title: 'Philosophical Foundations of Cognitive Liberty', doi: '10.5281/zenodo.xxxxx', filename: 'P31_Paper_13_Philosophical_Foundations.docx' },
  { id: 14, title: 'Predictive Processing Framework for Cognitive Prosthetics', doi: '10.5281/zenodo.xxxxx', filename: 'P31_Paper_14_Predictive_Processing_Framework.docx' },
  { id: 15, title: 'Entropic Bridge: Thermodynamics of Cognitive Systems', doi: '10.5281/zenodo.xxxxx', filename: 'P31_Paper_15_Entropic_Bridge.docx' },
  { id: 16, title: 'Thetorical Framework: Decision Making Under Uncertainty', doi: '10.5281/zenodo.xxxxx', filename: 'P31_Paper_16_Thetorical_Framework.docx' },
  { id: 17, title: 'Context-Dependent Memory and Cognitive Prosthetics', doi: '10.5281/zenodo.xxxxx', filename: 'P31_Paper_17_Context_Dependent_Memory.docx' },
  { id: 18, title: 'Reality Testing Protocols for Cognitive Prosthetics', doi: '10.5281/zenodo.xxxxx', filename: 'P31_Paper_18_Reality_Testing_Protocols.docx' },
  { id: 19, title: 'Sensory Integration and Cognitive Prosthetics', doi: '10.5281/zenodo.xxxxx', filename: 'P31_Paper_19_Sensory_Integration.docx' },
  { id: 20, title: 'Omnibus D20 System: Geodesic Navigation for Research Provenance', doi: '10.5281/zenodo.xxxxx', filename: 'P31_Paper_20_Omnibus_D20_System.docx' },
  { id: 21, title: 'Quantum Security Protocols for Cognitive Prosthetics', doi: '10.5281/zenodo.xxxxx', filename: 'P31_Paper_21_Quantum_Security_Protocols.docx' },
  { id: 22, title: 'Neural Entrainment Technology for Cognitive Prosthetics', doi: '10.5281/zenodo.xxxxx', filename: 'P31_Paper_22_Neural_Entrainment_Technology.docx' },
  { id: 23, title: 'Assistive Technology Economics for Neurodivergent Populations', doi: '10.5281/zenodo.xxxxx', filename: 'P31_Paper_23_Assistive_Technology_Economics.docx' },
  { id: 24, title: 'Geometric Security Model: Isostatic Rigidity in Cognitive Systems', doi: '10.5281/zenodo.xxxxx', filename: 'P31_Paper_24_Geometric_Security_Model.docx' },
  { id: 25, title: 'Digital Zeitgebers: Environmental Cues for Cognitive Regulation', doi: '10.5281/zenodo.xxxxx', filename: 'P31_Paper_25_Digital_Zeitgebers.docx' }
];

export default function AndromedaCommandCenter({ userId = 'will' }) {
  const [client, setClient] = useState(null);
  const [finance, setFinance] = useState(null);
  const [e2eeReady, setE2eeReady] = useState(false);
  const [globalPresence, setGlobalPresence] = useState({});
  const [latestMeshEvent, setLatestMeshEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [vaultPassword, setVaultPassword] = useState('');
  const passwordInputRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const meshClient = createMLSMeshClient(userId);
      await meshClient.initialize();
      setClient(meshClient);
      setE2eeReady(true);

      const financialNet = new FinancialSubnet(userId);
      setFinance(financialNet);
    };
    init();
  }, [userId]);

  const handleMeshTraffic = useCallback((eventType, data) => {
    setLatestMeshEvent({ type: eventType, payload: data, timestamp: Date.now() });
    if (eventType === 'presence:changed') {
      setGlobalPresence(prev => ({ ...prev, [data.userId]: data.status }));
    }
  }, []);

  const handleUnlockVault = async () => {
    if (!vaultPassword.trim()) return;
    try {
      await finance.unlockPhenixVault(vaultPassword);
      setVaultPassword('');
    } catch (err) {
      alert('Vault unlock failed: ' + err.message);
    }
  };

  const handleLockVault = () => {
    finance.lockPhenixVault();
  };

  return (
    <div className="flex h-screen w-full bg-[#050508] overflow-hidden">
      <div className="w-1/2 border-r border-[#1a1a24] flex flex-col relative z-10 shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#0a3d3d]/80 px-3 py-1.5 rounded-full border border-[#4db8a8]/30 backdrop-blur-md">
          <ShieldCheck className="w-4 h-4 text-[#4db8a8]" />
          <span className="text-[10px] font-mono text-[#4db8a8] tracking-widest uppercase">
            {e2eeReady ? 'MLS TreeKEM Active' : 'Initializing Crypto...'}
          </span>
        </div>
        <P31MeshClock
          userId={userId}
          externalEvent={latestMeshEvent}
          activeNodes={Object.keys(globalPresence).filter(k => globalPresence[k] === 'online')}
        />
      </div>

      <div className="w-1/2 flex flex-col bg-[#050508]">
        <div className="flex border-b border-[#1a1a24] bg-[#12121a]">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 text-sm font-mono ${activeTab === 'chat' ? 'bg-[#4db8a8] text-black' : 'text-gray-400 hover:text-white'}`}
          >
            MESH CHAT
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('treasury')}
            className={`flex-1 py-2 text-sm font-mono flex items-center justify-center gap-2 ${activeTab === 'treasury' ? 'bg-[#f59e0b] text-black' : 'text-gray-400 hover:text-white'}`}
          >
            <Wallet className="w-4 h-4" /> TREASURY
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('omnibus')}
            className={`flex-1 py-2 text-sm font-mono flex items-center justify-center gap-2 ${activeTab === 'omnibus' ? 'bg-cyan-700 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            OMNIBUS
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && client && (
            <FamilyChat
              client={client}
              userId={userId}
              onNetworkEvent={handleMeshTraffic}
            />
          )}

          {activeTab === 'treasury' && finance && (
            <div className="p-6 h-full overflow-y-auto custom-scrollbar">
              <div className="max-w-md mx-auto">
                <h2 className="text-xl font-bold text-[#f59e0b] mb-4 flex items-center gap-2">
                  <Wallet className="w-5 h-5" /> Phenix Vault
                </h2>

                <div className="bg-[#12121a] border border-[#1a1a24] rounded-lg p-4 mb-4">
                  {finance.getVaultStatus().exists ? (
                    finance.PhenixReady ? (
                      <div className="text-green-400 flex items-center gap-2">
                        <Unlock className="w-4 h-4" /> Vault Unlocked
                      </div>
                    ) : (
                      <div className="text-yellow-400 flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Vault Locked
                      </div>
                    )
                  ) : (
                    <div className="text-red-400">No Vault Found</div>
                  )}
                </div>

                {!finance.PhenixReady ? (
                  <div className="space-y-2">
                    <input
                      ref={passwordInputRef}
                      type="password"
                      value={vaultPassword}
                      onChange={(e) => setVaultPassword(e.target.value)}
                      placeholder="Vault Password"
                      className="w-full bg-[#050508] border border-[#1a1a24] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#f59e0b]"
                      onKeyPress={(e) => e.key === 'Enter' && handleUnlockVault()}
                    />
                    <button
                      type="button"
                      onClick={handleUnlockVault}
                      className="w-full bg-[#f59e0b] text-black py-2 rounded font-mono text-sm hover:bg-[#e08a0b]"
                    >
                      ACCESS VAULT
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleLockVault}
                    className="w-full bg-red-500/20 text-red-400 border border-red-500/50 py-2 rounded font-mono text-sm hover:bg-red-500/30"
                  >
                    LOCK VAULT NOW
                  </button>
                )}

                <div className="mt-6 pt-4 border-t border-[#1a1a24]">
                  <h3 className="text-xs font-mono text-gray-500 mb-2">LEGAL DEFENSE LEDGER</h3>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>Case: Johnson v. Johnson, 2025CV936</p>
                    <p>Asset Class: Pre-Marital IP Revenue</p>
                    <p>Status: Segregated & Traceable</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'omnibus' && (
            <div className="p-6 h-full overflow-y-auto custom-scrollbar">
              <div className="max-w-lg mx-auto">
                <OmnibusD20 papers={OMNIBUS_PAPERS} />
                <div className="mt-6 pt-4 border-t border-[#1a1a24]">
                  <h3 className="text-xs font-mono text-gray-500 mb-2">LEGAL DEFENSE LEDGER</h3>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>Case: Johnson v. Johnson, 2025CV936</p>
                    <p>Asset Class: Pre-Marital IP Revenue</p>
                    <p>Status: Segregated & Traceable</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
