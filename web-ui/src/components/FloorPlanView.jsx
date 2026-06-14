import { useEffect, useRef } from 'react';
// import L from 'leaflet'; // Disabled for Mapbox migration
import { getFloorPlan } from '../data/floorplans';
import { CAMPUS_LOCATIONS } from '../data/config';

/* 
// Disabled for Mapbox migration
function createRoomIcon(name, color = '#00FFFF') {
  return L.divIcon({ ... });
}
*/

export default function FloorPlanView({ locationId, visible, onClose }) {
  const containerRef = useRef(null);

  const plan = locationId ? getFloorPlan(locationId) : null;

  useEffect(() => {
    // Leaflet map initialization commented out during Mapbox migration
  }, [visible, plan]);

  const locName = locationId
    ? CAMPUS_LOCATIONS.find((l) => l.id === locationId)?.name || locationId
    : '';

  return (
    <div className={`floorplan-panel ${visible && plan ? 'visible' : ''}`}>
      <div className="floorplan-header">
        <span className="floorplan-title">{plan?.label || locName}</span>
        <button className="floorplan-close" onClick={onClose}>✕</button>
      </div>
      <div className="floorplan-legend">
        <span className="legend-dot" /> Indoor map temporarily disabled for upgrade
      </div>
      <div ref={containerRef} className="floorplan-map">
        {/* Mapbox indoor implementation to be added here */}
      </div>
    </div>
  );
}
