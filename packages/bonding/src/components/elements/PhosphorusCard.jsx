import React from 'react';
import { useAtomState } from '../hooks/useAtomState';

const PhosphorusCard = ({ playerId, onBond }) => {
  const { atoms, addAtom, removeAtom } = useAtomState();
  const atom = atoms.find(a => a.playerId === playerId);

  const handleBond = () => {
    if (!atom) {
      addAtom({
        playerId,
        element: 'P',
        valence: 3,
        electronegativity: 2.19,
        stability: 'Medium',
        description: 'The Quantum Egg builder. Forms 3 bonds.'
      });
      onBond('P');
    } else {
      removeAtom(atom.id);
    }
  };

  return (
    <div className="element-card phosphorus" onClick={handleBond}>
      <div className="element-symbol">P</div>
      <div className="element-name">Phosphorus</div>
      <div className="element-stats">
        <div className="valence">Valence: 3</div>
        <div className="electronegativity">EN: 2.19</div>
        <div className="stability">Stability: Medium</div>
      </div>
      <div className="element-description">
        The Quantum Egg builder. Forms 3 bonds. 
        Central to Posner Molecule formation.
      </div>
      <div className="bonding-capacity">
        <div className="bond-slot active"></div>
        <div className="bond-slot active"></div>
        <div className="bond-slot active"></div>
      </div>
    </div>
  );
};

export default PhosphorusCard;