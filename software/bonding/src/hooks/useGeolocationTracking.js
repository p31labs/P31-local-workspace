import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useGeolocationTracking - GPS tracking with Haversine distance calculation
 * 
 * Tracks user position and calculates distance to a target coordinate.
 * Returns current location, distance in meters, and grounded status.
 */
export function useGeolocationTracking({ targetLat, targetLon, groundThreshold = 50 } = {}) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isGrounded, setIsGrounded] = useState(false);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  
  const watchIdRef = useRef(null);

  /**
   * Calculate distance using Haversine formula
   * Returns distance in meters between two lat/lon points
   */
  const haversineDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  /**
   * Start tracking GPS position
   */
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation API not supported');
      return;
    }

    setError(null);
    setIsTracking(true);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000, // Accept cached position up to 5 seconds old
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        setCurrentLocation({
          lat: latitude,
          lon: longitude,
          accuracy: accuracy, // GPS accuracy in meters
          timestamp: position.timestamp,
        });

        // Calculate distance if target is provided
        if (targetLat !== undefined && targetLon !== undefined) {
          const dist = haversineDistance(latitude, longitude, targetLat, targetLon);
          setDistance(dist);
          setIsGrounded(dist <= groundThreshold);
        }
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location permission denied');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information unavailable');
            break;
          case err.TIMEOUT:
            setError('Location request timed out');
            break;
          default:
            setError('Unknown geolocation error');
        }
        setIsTracking(false);
      },
      options
    );
  }, [targetLat, targetLon, groundThreshold, haversineDistance]);

  /**
   * Stop tracking GPS position
   */
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  /**
   * Request single position update
   */
  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation API not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          resolve({
            lat: latitude,
            lon: longitude,
            accuracy,
            timestamp: position.timestamp,
          });
        },
        (err) => {
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    currentLocation,
    distance,
    isGrounded,
    error,
    isTracking,
    startTracking,
    stopTracking,
    getCurrentPosition,
  };
}

export default useGeolocationTracking;