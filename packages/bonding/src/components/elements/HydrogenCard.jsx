import React from 'react';
import { useAtomState } from '../hooks/useAtomState';

const HydrogenCard = ({ playerId, onBond }) => {
  const { atoms, addAtom, removeAtom } = useAtomState();
  const atom = atoms.find(a => a.playerId === playerId);

  const handleBond = () => {
    if (!atom) {
      addAtom({
        playerId,
        element: 'H',
        valence: 1,
        electronegativity: 2.20,
        stability: 'Unstable',
        description: 'The simplest atom. High mobility, low stability. Forms 1 bond.'
      });
      onBond('H');
    } else {
      removeAtom(atom.id);
    }
  };

  return (
    <div className="element-card hydrogen" onClick={handleBond}>
      <div className="element-symbol">H</div>
      <div className="element-name">Hydrogen</div>
      <div className="element-stats">
        <div className="valence">Valence: 1</div>
        <div className="electronegativity">EN: 2.20</div>
        <div className="stability">Stability: Low</div>
      </div>
      <div className="element-description">
        The simplest atom. High mobility, low stability. 
        Forms 1 bond. Acts as catalyst for complex molecules.
      </div>
      <div className="bonding-capacity">
        <div className="bond-slot active"></div>
      </div>
    </div>
  );
};

export default HydrogenCard;