import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ROUTE_COLORS = ['#FF0000', '#FFD700', '#2196F3', '#4CAF50', '#9C27B0', '#FF8C00', '#E91E63', '#FF69B4', '#808080', '#00FFFF'];

function createIcon(html, className = '') {
  return L.divIcon({
    html,
    className: `custom-marker ${className}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

const LOCATION_ICON = (color) => createIcon(
  `<div style="width:16px;height:16px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`
);

const CURRENT_ICON = createIcon(
  `<div style="width:20px;height:20px;background:#2196F3;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 3px rgba(33,150,243,0.4),0 2px 8px rgba(0,0,0,0.4);"></div>`,
  'current-marker'
);

const LIVE_ICON = createIcon(
  `<div style="width:16px;height:16px;background:#2196F3;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(33,150,243,0.3),0 0 0 8px rgba(33,150,243,0.1),0 2px 8px rgba(0,0,0,0.4);animation:livePulse 2s infinite;"></div>`,
  'current-marker live-marker'
);

const DEST_ICON = createIcon(
  `<div style="width:20px;height:20px;background:#4CAF50;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 3px rgba(76,175,80,0.4),0 2px 8px rgba(0,0,0,0.4);"></div>`,
  'dest-marker'
);

const POI_ICON = createIcon(
  `<div style="width:8px;height:8px;background:#00BCD4;border:1px solid #fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`
);

export default function CampusMap({ currentId, destinationId, locations, pois, visible, onClose, currentRoute, currentCoords }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const currentMarkerRef = useRef(null);
  const liveMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const poiMarkersRef = useRef([]);
  const routePolylineRef = useRef(null);
  const routeMarkersRef = useRef([]);
  const initializedRef = useRef(false);
  const invalidateTimerRef = useRef(null);

  useEffect(() => {
    if (initializedRef.current || !containerRef.current) return;
    initializedRef.current = true;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 15,
      maxZoom: 19,
    }).setView([17.782, 83.377], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;

    invalidateTimerRef.current = setTimeout(() => map.invalidateSize(), 300);

    return () => {
      clearTimeout(invalidateTimerRef.current);
      map.remove();
      mapRef.current = null;
      initializedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    poiMarkersRef.current.forEach((m) => map.removeLayer(m));
    poiMarkersRef.current = [];

    if (pois) {
      poiMarkersRef.current = pois.map((poi) => {
        const m = L.marker([poi.lat, poi.lng], { icon: POI_ICON }).addTo(map);
        m.bindTooltip(poi.name, { direction: 'top', offset: [0, -4] });
        return m;
      });
    }
  }, [pois]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach((m) => map.removeLayer(m));
    markersRef.current = {};

    locations.forEach((loc) => {
      if (!loc.lat || !loc.lng || !loc.id) return;
      const m = L.marker([loc.lat, loc.lng], { icon: LOCATION_ICON('#9E9E9E') }).addTo(map);
      m.bindTooltip(loc.name, { direction: 'top', offset: [0, -4] });
      markersRef.current[loc.id] = m;
    });
  }, [locations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (currentMarkerRef.current) {
      map.removeLayer(currentMarkerRef.current);
      currentMarkerRef.current = null;
    }

    if (currentCoords?.latitude && currentCoords?.longitude) {
      return;
    }

    if (currentId) {
      const loc = locations.find((l) => l.id === currentId);
      if (loc?.lat && loc?.lng) {
        currentMarkerRef.current = L.marker([loc.lat, loc.lng], {
          icon: CURRENT_ICON, zIndexOffset: 1000,
        }).addTo(map);
        currentMarkerRef.current.bindTooltip('You are here', { direction: 'top' });
        map.setView([loc.lat, loc.lng], map.getZoom(), { animate: true });
      }
    }
  }, [currentId, locations, currentCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (liveMarkerRef.current) {
      map.removeLayer(liveMarkerRef.current);
      liveMarkerRef.current = null;
    }

    if (currentCoords?.latitude && currentCoords?.longitude) {
      liveMarkerRef.current = L.marker([currentCoords.latitude, currentCoords.longitude], {
        icon: LIVE_ICON, zIndexOffset: 1000,
      }).addTo(map);
      liveMarkerRef.current.bindTooltip('You are here', { direction: 'top' });
      map.setView([currentCoords.latitude, currentCoords.longitude], map.getZoom(), { animate: true });
    }
  }, [currentCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (destMarkerRef.current) {
      map.removeLayer(destMarkerRef.current);
      destMarkerRef.current = null;
    }

    if (destinationId) {
      const loc = locations.find((l) => l.id === destinationId);
      if (loc?.lat && loc?.lng) {
        destMarkerRef.current = L.marker([loc.lat, loc.lng], {
          icon: DEST_ICON, zIndexOffset: 1000,
        }).addTo(map);
        destMarkerRef.current.bindTooltip(loc.name, { direction: 'top' });
      }
    }
  }, [destinationId, locations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    routeMarkersRef.current.forEach((m) => map.removeLayer(m));
    routeMarkersRef.current = [];

    if (currentRoute && currentRoute.length >= 2) {
      const coords = currentRoute
        .filter((n) => n.lat && n.lng)
        .map((n) => [n.lat, n.lng]);

      if (coords.length >= 2) {
        const color = ROUTE_COLORS[0];
        routePolylineRef.current = L.polyline(coords, {
          color, weight: 5, opacity: 0.85,
        }).addTo(map);

        currentRoute.forEach((node, i) => {
          if (!node.lat || !node.lng) return;
          const m = L.circleMarker([node.lat, node.lng], {
            radius: i === 0 || i === currentRoute.length - 1 ? 6 : 4,
            color,
            fillColor: i === 0 ? '#2196F3' : i === currentRoute.length - 1 ? '#4CAF50' : color,
            fillOpacity: 0.9, weight: 2,
          }).addTo(map);
          if (node.label) m.bindTooltip(node.label, { direction: 'top', offset: [0, -4] });
          routeMarkersRef.current.push(m);
        });

        const bounds = L.latLngBounds(coords);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
      }
    }
  }, [currentRoute]);

  return (
    <div className={`campus-map ${visible ? 'visible' : ''}`}>
      <div className="map-header">
        <div className="map-drag-handle" />
        <span className="map-title">Campus Map</span>
        <button className="map-close-btn" onClick={onClose} aria-label="Close map">✕</button>
      </div>
      <div ref={containerRef} className="map-body" />
    </div>
  );
}
