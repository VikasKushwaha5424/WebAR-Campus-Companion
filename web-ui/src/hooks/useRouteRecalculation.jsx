import { useEffect, useRef } from 'react';

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(Math.max(0, a)), Math.sqrt(Math.max(0, 1 - a)));
}

function toMeters(lat, lng, refLat, refLng) {
  const R = 6371000;
  const dLat = (lat - refLat) * Math.PI / 180;
  const dLng = (lng - refLng) * Math.PI / 180;
  const midLat = (lat + refLat) / 2 * Math.PI / 180;
  return { x: R * dLng * Math.cos(midLat), y: R * dLat };
}

export function distanceToRoute(lat, lng, route) {
  if (!route || route.length < 2) return Infinity;
  let minDist = Infinity;
  for (let i = 1; i < route.length; i++) {
    const p1 = route[i - 1];
    const p2 = route[i];
    if (!p1?.lat || !p1?.lng || !p2?.lat || !p2?.lng) continue;
    const d = haversine(lat, lng, p1.lat, p1.lng);
    if (d < minDist) minDist = d;
    const d2 = haversine(lat, lng, p2.lat, p2.lng);
    if (d2 < minDist) minDist = d2;
    const segDist = haversine(p1.lat, p1.lng, p2.lat, p2.lng);
    if (segDist < 0.5) continue;
    const refLat = (lat + p1.lat + p2.lat) / 3;
    const refLng = (lng + p1.lng + p2.lng) / 3;
    const A = toMeters(p1.lat, p1.lng, refLat, refLng);
    const B = toMeters(p2.lat, p2.lng, refLat, refLng);
    const P = toMeters(lat, lng, refLat, refLng);
    const ABx = B.x - A.x, ABy = B.y - A.y;
    const APx = P.x - A.x, APy = P.y - A.y;
    const t = (APx * ABx + APy * ABy) / (ABx * ABx + ABy * ABy);
    if (t > 0 && t < 1) {
      const projX = A.x + t * ABx;
      const projY = A.y + t * ABy;
      const dx = P.x - projX, dy = P.y - projY;
      const d3 = Math.sqrt(dx * dx + dy * dy);
      if (d3 < minDist) minDist = d3;
    }
  }
  return minDist;
}

// Snaps a point to the nearest position on the route polyline
export function snapToRoute(lat, lng, route) {
  if (!route || route.length < 2) return { lat, lng };
  let bestLat = route[0].lat, bestLng = route[0].lng;
  let minDist = Infinity;

  for (let i = 1; i < route.length; i++) {
    const p1 = route[i - 1];
    const p2 = route[i];
    if (!p1?.lat || !p1?.lng || !p2?.lat || !p2?.lng) continue;

    // Check endpoints
    const d1 = haversine(lat, lng, p1.lat, p1.lng);
    if (d1 < minDist) { minDist = d1; bestLat = p1.lat; bestLng = p1.lng; }
    const d2 = haversine(lat, lng, p2.lat, p2.lng);
    if (d2 < minDist) { minDist = d2; bestLat = p2.lat; bestLng = p2.lng; }

    // Check projection onto segment
    const segDist = haversine(p1.lat, p1.lng, p2.lat, p2.lng);
    if (segDist < 0.5) continue;
    const refLat = (lat + p1.lat + p2.lat) / 3;
    const refLng = (lng + p1.lng + p2.lng) / 3;
    const A = toMeters(p1.lat, p1.lng, refLat, refLng);
    const B = toMeters(p2.lat, p2.lng, refLat, refLng);
    const P = toMeters(lat, lng, refLat, refLng);
    const ABx = B.x - A.x, ABy = B.y - A.y;
    const APx = P.x - A.x, APy = P.y - A.y;
    const t = (APx * ABx + APy * ABy) / (ABx * ABx + ABy * ABy);
    if (t > 0 && t < 1) {
      const projLat = p1.lat + t * (p2.lat - p1.lat);
      const projLng = p1.lng + t * (p2.lng - p1.lng);
      const d3 = haversine(lat, lng, projLat, projLng);
      if (d3 < minDist) { minDist = d3; bestLat = projLat; bestLng = projLng; }
    }
  }
  return { lat: bestLat, lng: bestLng };
}

export { haversine };

export default function useRouteRecalculation({ currentRoute, currentCoords, routeStatus, onRecalculate }) {
  const intervalRef = useRef(null);
  const offRouteCountRef = useRef(0);

  // Store frequently-changing values in refs so useEffect doesn't restart
  // the interval on every GPS tick (Bug #1: interval was perpetually re-created)
  const currentCoordsRef = useRef(currentCoords);
  const currentRouteRef = useRef(currentRoute);
  const onRecalculateRef = useRef(onRecalculate);

  useEffect(() => { currentCoordsRef.current = currentCoords; }, [currentCoords]);
  useEffect(() => { currentRouteRef.current = currentRoute; }, [currentRoute]);
  useEffect(() => { onRecalculateRef.current = onRecalculate; }, [onRecalculate]);

  useEffect(() => {
    if (routeStatus !== 'active') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      offRouteCountRef.current = 0;
      return;
    }

    intervalRef.current = setInterval(() => {
      const coords = currentCoordsRef.current;
      const route = currentRouteRef.current;
      if (coords?.latitude == null || coords?.longitude == null) return;

      const dist = distanceToRoute(coords.latitude, coords.longitude, route);

      if (dist > 15) {
        offRouteCountRef.current += 1;
        if (offRouteCountRef.current >= 3 && onRecalculateRef.current) {
          onRecalculateRef.current(dist);
          offRouteCountRef.current = 0;
        }
      } else {
        offRouteCountRef.current = 0;
      }
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [routeStatus]); // Only restart interval when route status changes
}
