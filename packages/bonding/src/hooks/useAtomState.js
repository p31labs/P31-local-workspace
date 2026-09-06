import { useState, useCallback } from 'react';

export const useAtomState = () => {
  const [atoms, setAtoms] = useState([]);
  const [molecules, setMolecules] = useState([]);

  const addAtom = useCallback((atomData) => {
    const newAtom = {
      id: Date.now() + Math.random(),
      ...atomData,
      timestamp: Date.now(),
      bonds: []
    };
    setAtoms(prev => [...prev, newAtom]);
  }, []);

  const removeAtom = useCallback((atomId) => {
    setAtoms(prev => prev.filter(atom => atom.id !== atomId));
    // Remove any molecules that contained this atom
    setMolecules(prev => prev.filter(molecule => 
      !molecule.atoms.includes(atomId)
    ));
  }, []);

  const formBond = useCallback((atom1Id, atom2Id) => {
    setAtoms(prev => prev.map(atom => {
      if (atom.id === atom1Id) {
        return {
          ...atom,
          bonds: [...atom.bonds, atom2Id]
        };
      }
      if (atom.id === atom2Id) {
        return {
          ...atom,
          bonds: [...atom.bonds, atom1Id]
        };
      }
      return atom;
    }));
  }, []);

  const createMolecule = useCallback((atomIds) => {
    const newMolecule = {
      id: Date.now() + Math.random(),
      atoms: atomIds,
      type: 'organic',
      stability: calculateMoleculeStability(atomIds),
      timestamp: Date.now()
    };
    setMolecules(prev => [...prev, newMolecule]);
  }, []);

  const calculateMoleculeStability = (atomIds) => {
    const atomElements = atoms.filter(atom => atomIds.includes(atom.id)).map(atom => atom.element);
    
    // Simple stability rules
    if (atomElements.includes('C') && atomElements.includes('H')) {
      return 'High';
    }
    if (atomElements.includes('P') && atomElements.length >= 6) {
      return 'Quantum Coherent';
    }
    return 'Medium';
  };

  const getAvailableBonds = useCallback((atomId) => {
    const atom = atoms.find(a => a.id === atomId);
    if (!atom) return 0;
    return atom.valence - atom.bonds.length;
  }, [atoms]);

  const canFormBond = useCallback((atom1Id, atom2Id) => {
    const atom1 = atoms.find(a => a.id === atom1Id);
    const atom2 = atoms.find(a => a.id === atom2Id);
    
    if (!atom1 || !atom2) return false;
    
    const atom1Available = atom1.valence - atom1.bonds.length;
    const atom2Available = atom2.valence - atom2.bonds.length;
    
    return atom1Available > 0 && atom2Available > 0;
  }, [atoms]);

  return {
    atoms,
    molecules,
    addAtom,
    removeAtom,
    formBond,
    createMolecule,
    getAvailableBonds,
    canFormBond
  };
};