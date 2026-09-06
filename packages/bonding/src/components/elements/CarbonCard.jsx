import React from 'react';
import { useAtomState } from '../hooks/useAtomState';

const CarbonCard = ({ playerId, onBond }) => {
  const { atoms, addAtom, removeAtom } = useAtomState();
  const atom = atoms.find(a => a.playerId === playerId);

  const handleBond = () => {
    if (!atom) {
      addAtom({
        playerId,
        element: 'C',
        valence: 4,
        electronegativity: 2.55,
        stability: 'High',
        description: 'The backbone of organic chemistry. Forms 4 bonds.'
      });
      onBond('C');
    } else {
      removeAtom(atom.id);
    }
  };

  return (
    <div className="element-card carbon" onClick={handleBond}>
      <div className="element-symbol">C</div>
      <div className="element-name">Carbon</div>
      <div className="element-stats">
        <div className="valence">Valence: 4</div>
        <div className="electronegativity">EN: 2.55</div>
        <div className="stability">Stability: High</div>
      </div>
      <div className="element-description">
        The backbone of organic chemistry. 
        Forms 4 bonds. Creates complex molecular structures.
      </div>
      <div className="bonding-capacity">
        <div className="bond-slot active"></div>
        <div className="bond-slot active"></div>
        <div className="bond-slot active"></div>
        <div className="bond-slot active"></div>
      </div>
    </div>
  );
};

export default CarbonCard;