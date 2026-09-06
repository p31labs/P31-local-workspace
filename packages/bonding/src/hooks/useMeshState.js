import { useState, useEffect, useCallback } from 'react';

// Cloudflare KV integration for mesh state management
export const useMeshState = (userId) => {
  const [meshState, setMeshState] = useState(null);
  const [nodeData, setNodeData] = useState(null);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Configuration
  const KV_ENDPOINT = 'https://mesh.p31ca.org';
  const KV_NAMESPACE = 'P31_MESH_STATE';

  // Initialize node data
  const initializeNode = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const initialNodeData = {
        user_id: userId,
        status: 'transit',
        frequency: 0,
        lat: null,
        lon: null,
        spoon_count: 100,
        last_update: Date.now()
      };

      // Store initial node data
      await setKVData(`mesh_node_${userId}`, initialNodeData);
      setNodeData(initialNodeData);

      // Initialize mesh status if not exists
      const meshStatus = await getKVData('mesh_status');
      if (!meshStatus) {
        const initialMeshStatus = {
          phase: 'superposition',
          active_nodes: 1,
          completed_edges: 0,
          target_location: {
            name: 'Pablo Creek Quasicrystal',
            lat: 30.3322,
            lon: -81.4700,
            radius_meters: 50
          }
        };
        await setKVData('mesh_status', initialMeshStatus);
        setMeshState(initialMeshStatus);
      } else {
        setMeshState(meshStatus);
      }

    } catch (err) {
      console.error('Failed to initialize node:', err);
      setError('Failed to initialize mesh node');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Update node data
  const updateNodeData = useCallback(async (updates) => {
    try {
      setError(null);
      
      const currentData = nodeData || {};
      const updatedData = {
        ...currentData,
        ...updates,
        last_update: Date.now()
      };

      await setKVData(`mesh_node_${userId}`, updatedData);
      setNodeData(updatedData);

      // Update mesh status if needed
      if (updates.status) {
        await updateMeshStatus({ active_nodes: await getActiveNodeCount() });
      }

    } catch (err) {
      console.error('Failed to update node data:', err);
      setError('Failed to update node state');
    }
  }, [userId, nodeData]);

  // Add edge to mesh
  const addEdge = useCallback(async (edgeData) => {
    try {
      setError(null);

      // Get current edges
      const currentEdges = await getKVData('k4_edges') || [];
      
      // Check for duplicates
      const isDuplicate = currentEdges.some(edge => 
        (edge.from === edgeData.from && edge.to === edgeData.to) ||
        (edge.from === edgeData.to && edge.to === edgeData.from)
      );

      if (!isDuplicate) {
        const newEdges = [...currentEdges, edgeData];
        await setKVData('k4_edges', newEdges);
        setEdges(newEdges);

        // Update mesh status
        await updateMeshStatus({ completed_edges: newEdges.length });

        // Check for K4 completion
        if (newEdges.length >= 6) {
          await triggerK4Completion();
        }
      }

    } catch (err) {
      console.error('Failed to add edge:', err);
      setError('Failed to record handshake');
    }
  }, [userId]);

  // Get active node count
  const getActiveNodeCount = useCallback(async () => {
    try {
      // This would require a more complex KV query in production
      // For now, we'll track this in mesh_status
      const status = await getKVData('mesh_status');
      return status?.active_nodes || 0;
    } catch (err) {
      console.error('Failed to get active node count:', err);
      return 0;
    }
  }, []);

  // Update mesh status
  const updateMeshStatus = useCallback(async (updates) => {
    try {
      const currentStatus = await getKVData('mesh_status') || {};
      const updatedStatus = { ...currentStatus, ...updates };
      
      await setKVData('mesh_status', updatedStatus);
      setMeshState(updatedStatus);
    } catch (err) {
      console.error('Failed to update mesh status:', err);
    }
  }, []);

  // Trigger K4 completion
  const triggerK4Completion = useCallback(async () => {
    try {
      await updateMeshStatus({
        phase: 'payload',
        completed_edges: 6
      });

      // Trigger L.O.V.E. token distribution
      await triggerLoveTokenDistribution();

      // Update all nodes to locked status
      const currentEdges = await getKVData('k4_edges') || [];
      const uniqueNodes = new Set();
      currentEdges.forEach(edge => {
        uniqueNodes.add(edge.from);
        uniqueNodes.add(edge.to);
      });

      uniqueNodes.forEach(async (nodeId) => {
        await updateNodeData({ status: 'locked' });
      });

    } catch (err) {
      console.error('Failed to trigger K4 completion:', err);
    }
  }, [updateMeshStatus, updateNodeData]);

  // Trigger L.O.V.E. token distribution
  const triggerLoveTokenDistribution = useCallback(async () => {
    try {
      // This would integrate with your blockchain/smart contract system
      // For now, we'll mark it as triggered in KV
      await setKVData('love_distribution', {
        triggered: true,
        timestamp: Date.now(),
        phase: 'completed'
      });
    } catch (err) {
      console.error('Failed to trigger L.O.V.E. distribution:', err);
    }
  }, []);

  // Get KV data helper
  const getKVData = useCallback(async (key) => {
    try {
      const response = await fetch(`${KV_ENDPOINT}/kv/${KV_NAMESPACE}/${key}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`KV fetch failed: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error(`Failed to get KV data for ${key}:`, err);
      return null;
    }
  }, []);

  // Set KV data helper
  const setKVData = useCallback(async (key, data) => {
    try {
      const response = await fetch(`${KV_ENDPOINT}/kv/${KV_NAMESPACE}/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`KV set failed: ${response.status}`);
      }
    } catch (err) {
      console.error(`Failed to set KV data for ${key}:`, err);
      throw err;
    }
  }, []);

  // Refresh all state
  const refreshState = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [nodeDataResult, meshStateResult, edgesResult] = await Promise.all([
        getKVData(`mesh_node_${userId}`),
        getKVData('mesh_status'),
        getKVData('k4_edges')
      ]);

      setNodeData(nodeDataResult);
      setMeshState(meshStateResult);
      setEdges(edgesResult || []);

    } catch (err) {
      console.error('Failed to refresh state:', err);
      setError('Failed to refresh mesh state');
    } finally {
      setLoading(false);
    }
  }, [userId, getKVData]);

  // Cleanup function
  const cleanup = useCallback(async () => {
    try {
      // Mark node as offline
      await updateNodeData({ status: 'offline' });
    } catch (err) {
      console.error('Failed to cleanup node:', err);
    }
  }, [updateNodeData]);

  // Initialize on mount
  useEffect(() => {
    initializeNode();
    
    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [initializeNode, cleanup]);

  return {
    meshState,
    nodeData,
    edges,
    loading,
    error,
    initializeNode,
    updateNodeData,
    addEdge,
    refreshState,
    cleanup,
    // Computed values
    isK4Complete: edges.length >= 6,
    activeNodeCount: meshState?.active_nodes || 0,
    completedEdges: edges.length,
    currentPhase: meshState?.phase || 'superposition',
    targetLocation: meshState?.target_location
  };
};

// Utility functions for mesh operations
export const meshUtils = {
  // Calculate distance between two geographic points
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  // Check if point is within radius of target
  isWithinRadius: (lat, lon, targetLat, targetLon, radius) => {
    const distance = meshUtils.calculateDistance(lat, lon, targetLat, targetLon);
    return distance <= radius;
  },

  // Validate K4 tetrahedron completion
  validateK4: (edges) => {
    if (edges.length < 6) return false;
    
    const uniqueNodes = new Set();
    edges.forEach(edge => {
      uniqueNodes.add(edge.from);
      uniqueNodes.add(edge.to);
    });
    
    return uniqueNodes.size === 4;
  },

  // Get phase emoji for display
  getPhaseEmoji: (phase) => {
    const emojis = {
      'superposition': '🌌',
      'measurement': '📍',
      'triadic_closure': '🔗',
      'payload': '💎'
    };
    return emojis[phase] || '❓';
  }
};