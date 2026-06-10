import { useState, useEffect, useRef, useMemo } from 'react';
import { calculateDistance } from '../utils/navigation';
import { CAMPUS_LOCATIONS, CAMPUS_EDGES } from '../data/config';
import { useGeolocation } from '../hooks/useGeolocation';

function computeRemainingRouteDistance(currentRoute, nextWaypointIndex) {
  if (!currentRoute || currentRoute.length < 2 || nextWaypointIndex < 1) return null;
  let total = 0;
  for (let i = nextWaypointIndex; i < currentRoute.length; i++) {
    const src = currentRoute[i - 1];
    const tgt = currentRoute[i];
    const edge = CAMPUS_EDGES.find(
      (e) =>
        (e.source === src && e.target === tgt) ||
        (e.target === src && e.source === tgt)
    );
    if (edge) total += edge.distance;
  }
  return total;
}

export default function ETAOverlay({ destination, visible, currentRoute, nextWaypointIndex }) {
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const lastPosRef = useRef(null);
  const lastTimeRef = useRef(null);
  const speedRef = useRef(1.4);

  const { latitude, longitude } = useGeolocation();

  const graphDistance = useMemo(
    () => computeRemainingRouteDistance(currentRoute, nextWaypointIndex),
    [currentRoute, nextWaypointIndex]
  );

  const dest = useMemo(
    () => destination ? CAMPUS_LOCATIONS.find((l) => l.id === destination) : null,
    [destination]
  );

  useEffect(() => {
    if (!visible || !dest?.lat) {
      setEta(null);
      setDistance(null);
      return;
    }

    if (graphDistance !== null) {
      setDistance(graphDistance);
    }
  }, [dest, visible, graphDistance]);

  useEffect(() => {
    if (!visible || !dest?.lat || latitude === null || longitude === null) return;

    if (graphDistance === null) {
      const dist = calculateDistance(latitude, longitude, dest.lat, dest.lng);
      setDistance(dist);
    }

    const now = Date.now();
    const lastPos = lastPosRef.current;
    const lastTime = lastTimeRef.current;

    if (lastPos && lastTime && now - lastTime > 3000) {
      const moved = calculateDistance(lastPos.lat, lastPos.lng, latitude, longitude);
      const dt = (now - lastTime) / 1000;
      if (moved > 1 && dt > 0) {
        speedRef.current = moved / dt;
      }
    }

    lastPosRef.current = { lat: latitude, lng: longitude };
    lastTimeRef.current = now;

    const currentDist = graphDistance !== null ? graphDistance : (distance !== null ? distance : 0);
    const speed = speedRef.current;
    if (speed > 0.1 && currentDist > 1) {
      setEta(Math.round(currentDist / speed / 60));
    } else {
      setEta(null);
    }
  }, [latitude, longitude, visible, dest, graphDistance]);

  if (!visible || (!eta && !distance && graphDistance === null)) return null;

  const displayDist = distance || graphDistance || 0;
  const miles = displayDist >= 1000
    ? `${(displayDist / 1000).toFixed(1)} km`
    : `${Math.round(displayDist)} m`;

  return (
    <div className="eta-overlay">
      <span className="eta-distance">{miles}</span>
      {eta !== null && (
        <span className="eta-time">~{eta} min</span>
      )}
    </div>
  );
}
