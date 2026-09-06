import React, { useState, useEffect, useRef } from 'react';
import { useGeolocationTracking, TARGET_LOCATIONS } from '../hooks/useGeolocationTracking';
import { useQRHandshake } from '../hooks/useQRHandshake';
import { useMeshState, meshUtils } from '../hooks/useMeshState';
import './QuantumEggHunt.css';

const QuantumEggHunt = ({ userId }) => {
  const [isHuntActive, setIsHuntActive] = useState(false);
  const [huntPhase, setHuntPhase] = useState('superposition'); // superposition, measurement, triadic_closure, payload
  const [showColliderMode, setShowColliderMode] = useState(false);
  
  // Hook integrations
  const {
    position,
    distance,
    isGrounded,
    frequency,
    error: geoError,
    isTracking,
    startTracking,
    stopTracking,
    targetLocation,
    status: geoStatus,
    proximity
  } = useGeolocationTracking(TARGET_LOCATIONS.JAX_QUASICRYSTAL);

  const {
