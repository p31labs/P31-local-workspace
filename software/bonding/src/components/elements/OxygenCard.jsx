import React from 'react';
import { useAtomState } from '../hooks/useAtomState';

const OxygenCard = ({ playerId, onBond }) => {
  const { atoms, addAtom, removeAtom } = useAtomState();
  const atom = atoms.find(a => a.playerId === playerId);

  const handleBond = () => {
    if (!atom) {
      addAtom({
        playerId,
        element: 'O',
        valence: 2,
        electronegativity: 3.44,
        stability: 'Medium',
        description: 'Highly electronegative. Forms 2 bonds.'
      });
      onBond('O');
    } else {
      removeAtom(atom.id);
    }
  };

  return (
    <div className="element-card oxygen" onClick={handleBond}>
      <div className="element-symbol">O</div>
      <div className="element-name">Oxygen</div>
      <div className="element-stats">
        <div className="valence">Valence: 2</div>
        <div className="electronegativity">EN: 3.44</div>
        <div className="stability">Stability: Medium</div>
      </div>
      <div className="element-description">
        Highly electronegative. Forms 2 bonds. 
        Essential for energy transfer and stability.
      </div>
      <div className="bonding-capacity">
        <div className="bond-slot active"></div>
        <div className="bond-slot active"></div>
      </div>
    </div>
  );
};

export default OxygenCard;