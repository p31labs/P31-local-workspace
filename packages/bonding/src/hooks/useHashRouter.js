import { useState, useEffect } from 'react';

/**
 * useHashRouter — Simple hash-based room navigation
 *
 * Routes (see ROOMS for labels):
 *   #bonding     → Main game (default)
 *   #collider    → ColliderMode proximity sensor
 *   #geodesic    → GeodesicMode 3D structure builder
 *   #observatory → Data dome (planned; product lives on hub as /dome, etc.)
 *   #bridge      → LOVE wallet / identity (planned)
 */
export function useHashRouter() {
  const [currentRoom, setCurrentRoom] = useState('bonding');

  useEffect(() => {
    // Parse initial hash
    const parseHash = () => {
      const hash = window.location.hash.replace('#', '') || 'bonding';
      setCurrentRoom(hash);
    };

    parseHash();

    // Listen for hash changes
    const handleHashChange = () => {
      parseHash();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (room) => {
    window.location.hash = room;
  };

  return { currentRoom, navigate };
}

// Room configuration
export const ROOMS = [
  { id: 'bonding',   label: 'BONDING',     description: 'Molecule builder' },
  { id: 'collider',  label: 'COLLIDER',    description: 'Proximity sensor' },
  { id: 'geodesic',  label: 'GEODESIC',    description: '3D structure builder' },
  { id: 'observatory', label: 'OBSERVATORY', description: 'Data dome (planned)' },
  { id: 'bridge',    label: 'BRIDGE',      description: 'Identity & wallet (planned)' },
];

export default useHashRouter;