import React from 'react';
import { useAtomState } from '../../hooks/useAtomState';
import ElementGrid from './ElementGrid';
import './ElementStyles.css';

const ElementManager = ({ playerId }) => {
  const { atoms, molecules, addAtom, removeAtom } = useAtomState();

  const handleElementSelect = (element) => {
    // Add haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    
    // Play bonding sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  return (
    <div className="element-manager">
      <div className="element-header">
        <h2>Human Chemistry Lab</h2>
        <p>Build molecules by bonding with other players</p>
      </div>
      
      <ElementGrid playerId={playerId} onBond={handleElementSelect} />
      
      <div className="chemistry-guide">
        <h3>Chemistry Rules</h3>
        <ul>
          <li><strong>Hydrogen (H):</strong> 1 bond, high mobility, catalyst for complex molecules</li>
          <li><strong>Carbon (C):</strong> 4 bonds, backbone of organic chemistry</li>
          <li><strong>Oxygen (O):</strong> 2 bonds, highly electronegative, essential for energy</li>
          <li><strong>Phosphorus (P):</strong> 3 bonds, Quantum Egg builder, central to Posner Molecule</li>
        </ul>
        
        <div className="stability-guide">
          <h4>Molecular Stability</h4>
          <p><strong>High:</strong> Carbon + Hydrogen compounds</p>
          <p><strong>Quantum Coherent:</strong> Phosphorus + 6+ atoms (Posner Molecule)</p>
          <p><strong>Medium:</strong> Other combinations</p>
        </div>
      </div>
    </div>
  );
};

export default ElementManager;