/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useRef } from 'react';

const GeolocationContext = createContext(null);

export function GeolocationProvider({ children, enableHighAccuracy = true, maxInterval = 3000, distanceFilter = 3, lowPowerMode = false }) {
  const [coords, setCoords] = useState({ latitude: null, longitude: null, accuracy: null, heading: null, speed: null, timestamp: null });
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('Geolocation not available');
      return;
    }

    const options = {
      enableHighAccuracy: lowPowerMode ? false : enableHighAccuracy,
      maximumAge: lowPowerMode ? 30000 : 3000,
      timeout: 10000,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        });
        setError(null);
        setPermissionDenied(false);
        setIsWatching(true);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionDenied(true);
          setError('Location access denied. Please select your starting point manually from the list above.');
        } else {
          setError(err.message);
        }
        setIsWatching(false);
      },
      options
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enableHighAccuracy, maxInterval, distanceFilter, lowPowerMode]);

  const value = { ...coords, error, permissionDenied, isWatching };

  return (
    <GeolocationContext.Provider value={value}>
      {children}
    </GeolocationContext.Provider>
  );
}

export function useGeolocation() {
  const ctx = useContext(GeolocationContext);
  if (!ctx) {
    return { latitude: null, longitude: null, accuracy: null, heading: null, speed: null, timestamp: null, error: 'GeolocationProvider not mounted', permissionDenied: false, isWatching: false };
  }
  return ctx;
}

export default useGeolocation;
