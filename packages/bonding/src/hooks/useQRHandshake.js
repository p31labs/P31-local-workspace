import { useState, useCallback, useRef } from 'react';

// QR Code generation and scanning utilities
export const useQRHandshake = (userId) => {
  const [nodeIdentity, setNodeIdentity] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [handshakeHistory, setHandshakeHistory] = useState([]);
  
  const qrCodeRef = useRef(null);
  const scannerRef = useRef(null);

  // Generate cryptographic node identity
  const generateNodeIdentity = useCallback(async () => {
    try {
      setIsGenerating(true);
      setError(null);

      // Generate key pair for this session
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 2048,
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
          hash: { name: 'SHA-256' }
        },
        true,
        ['sign', 'verify']
      );

      const timestamp = Date.now();
      const signatureData = `${userId}:${timestamp}`;
      
      // Sign the identity data
      const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        keyPair.privateKey,
        new TextEncoder().encode(signatureData)
      );

      // Export public key for verification
      const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);

      const identity = {
        userId,
        timestamp,
        signature: btoa(String.fromCharCode(...new Uint8Array(signature))),
        publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
        nodeId: `node_${userId}_${timestamp}`
      };

      setNodeIdentity(identity);
      return identity;

    } catch (err) {
      console.error('Failed to generate node identity:', err);
      setError('Failed to generate cryptographic identity');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [userId]);

  // Verify a scanned handshake
  const verifyHandshake = useCallback(async (scannedData) => {
    try {
      setError(null);

      const { userId: scannedUserId, timestamp, signature, publicKey } = scannedData;

      // Import the public key for verification
      const importedKey = await crypto.subtle.importKey(
        'spki',
        Uint8Array.from(atob(publicKey), c => c.charCodeAt(0)),
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: { name: 'SHA-256' }
        },
        false,
        ['verify']
      );

      // Verify the signature
      const isValid = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        importedKey,
        Uint8Array.from(atob(signature), c => c.charCodeAt(0)),
        new TextEncoder().encode(`${scannedUserId}:${timestamp}`)
      );

      if (isValid) {
        const handshake = {
          from: userId,
          to: scannedUserId,
          timestamp: Date.now(),
          verified: true
        };

        setHandshakeHistory(prev => [...prev, handshake]);
        setScanResult({
          success: true,
          userId: scannedUserId,
          timestamp,
          handshake
        });

        return handshake;
      } else {
        throw new Error('Invalid signature');
      }

    } catch (err) {
      console.error('Handshake verification failed:', err);
      setError('Failed to verify handshake');
      setScanResult({
        success: false,
        error: err.message
      });
      return null;
    }
  }, [userId]);

  // Generate QR code data URL
  const generateQRCode = useCallback(async (data) => {
    try {
      // Use a simple QR code generation approach
      // In production, you might want to use a library like qrcode
      const qrData = JSON.stringify(data);
      
      // For now, return a simple data URL representation
      // This would be replaced with actual QR code generation
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      
      // Simple visual representation (replace with actual QR generation)
      ctx.fillStyle = '#000';
      ctx.font = '12px monospace';
      ctx.fillText('P31 Node Identity', 10, 20);
      ctx.fillText(`User: ${data.userId}`, 10, 40);
      ctx.fillText(`Time: ${new Date(data.timestamp).toISOString()}`, 10, 60);
      
      return canvas.toDataURL();
    } catch (err) {
      console.error('QR code generation failed:', err);
      return null;
    }
  }, []);

  // Simulate QR code scanning (replace with actual scanner integration)
  const simulateScan = useCallback(async (scannedData) => {
    return await verifyHandshake(scannedData);
  }, [verifyHandshake]);

  // Reset scan result
  const clearScanResult = useCallback(() => {
    setScanResult(null);
    setError(null);
  }, []);

  // Get current handshake count
  const getHandshakeCount = useCallback(() => {
    return handshakeHistory.length;
  }, [handshakeHistory]);

  // Check if K4 tetrahedron is complete (6 edges)
  const isK4Complete = useCallback(() => {
    return handshakeHistory.length >= 6;
  }, [handshakeHistory]);

  return {
    nodeIdentity,
    isGenerating,
    scanResult,
    error,
    handshakeHistory,
    generateNodeIdentity,
    verifyHandshake,
    generateQRCode,
    simulateScan,
    clearScanResult,
    getHandshakeCount,
    isK4Complete,
    // Additional computed values
    status: nodeIdentity ? 'ready' : (isGenerating ? 'generating' : 'idle'),
    progress: Math.min(100, (handshakeHistory.length / 6) * 100)
  };
};

// Utility function to create edge data for KV storage
export const createEdgeData = (fromUserId, toUserId, handshake) => {
  return {
    from: fromUserId,
    to: toUserId,
    timestamp: handshake.timestamp,
    verified: handshake.verified,
    edgeId: `${fromUserId}_${toUserId}_${handshake.timestamp}`
  };
};

// Utility function to validate edge completeness for K4
export const validateK4Completion = (edges) => {
  if (edges.length < 6) return false;
  
  // Check if we have exactly 4 unique nodes
  const uniqueNodes = new Set();
  edges.forEach(edge => {
    uniqueNodes.add(edge.from);
    uniqueNodes.add(edge.to);
  });
  
  return uniqueNodes.size === 4;
};