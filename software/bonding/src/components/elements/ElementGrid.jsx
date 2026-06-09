import React from 'react';
import { useAtomState } from '../../hooks/useAtomState';
import ElementSelector from './ElementSelector';

const ElementGrid = ({ playerId }) => {
  const { atoms, molecules, getAvailableBonds, canFormBond } = useAtomState();

  const handleBond = (element) => {
    console.log(`${playerId} selected ${element}`);
    // Trigger haptic feedback and audio cue
    navigator.vibrate && navigator.vibrate(100);
  };

  const renderMoleculeVisualization = () => {
    if (molecules.length === 0) return null;

    return (
      <div className="molecule-display">
        <h3>Your Molecules</h3>
        {molecules.map(molecule => (
          <div key={molecule.id} className="molecule-card">
            <div className="molecule-type">{molecule.type}</div>
            <div className="molecule-stability">{molecule.stability}</div>
            <div className="molecule-atoms">
              {atoms
                .filter(atom => molecule.atoms.includes(atom.id))
                .map(atom => (
                  <span key={atom.id} className={`atom-symbol ${atom.element.toLowerCase()}`}>
                    {atom.element}
                  </span>
                ))
              }
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="element-grid-container">
      <ElementSelector playerId={playerId} onBond={handleBond} />
      
      <div className="player-status">
        <h3>Your Atoms</h3>
        {atoms.length === 0 ? (
          <p>No atoms selected yet. Choose an element to begin!</p>
        ) : (
          <div className="atoms-list">
            {atoms.map(atom => (
              <div key={atom.id} className={`atom-card ${atom.element.toLowerCase()}`}>
                <div className="atom-header">
                  <span className="element-symbol">{atom.element}</span>
                  <span className="bond-count">
                    Bonds: {atom.bonds.length}/{atom.valence}
                  </span>
                </div>
                <div className="atom-stats">
                  <span>EN: {atom.electronegativity}</span>
                  <span>Stability: {atom.stability}</span>
                </div>
                <div className="bond-slots">
                  {Array.from({ length: atom.valence }, (_, i) => (
                    <div 
                      key={i} 
                      className={`bond-slot ${i < atom.bonds.length ? 'filled' : 'empty'}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {renderMoleculeVisualization()}
    </div>
  );
};

export default ElementGrid;