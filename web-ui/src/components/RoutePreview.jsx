import { useMemo } from 'react';
import { CAMPUS_NODES, CAMPUS_EDGES } from '../data/config';
import { getNodeById } from '../utils/pathfinding';

export default function RoutePreview({ currentRoute, totalDistance, onStart, onCancel }) {
  const steps = useMemo(() => {
    if (!currentRoute || currentRoute.length < 2) return [];
    const result = [];
    for (let i = 1; i < currentRoute.length; i++) {
      const srcNode = getNodeById(currentRoute[i - 1], CAMPUS_NODES);
      const tgtNode = getNodeById(currentRoute[i], CAMPUS_NODES);
      const edge = CAMPUS_EDGES.find(
        (e) =>
          (e.source === currentRoute[i - 1] && e.target === currentRoute[i]) ||
          (e.target === currentRoute[i - 1] && e.source === currentRoute[i])
      );
      result.push({
        index: i,
        from: srcNode?.label || currentRoute[i - 1],
        to: tgtNode?.label || currentRoute[i],
        distance: edge?.distance || 0,
        isStairs: edge?.isStairs || false,
      });
    }
    return result;
  }, [currentRoute]);

  const originLabel = steps[0]?.from || 'Current location';
  const destLabel = steps[steps.length - 1]?.to || 'Destination';

  return (
    <div className="route-preview-overlay">
      <div className="route-preview">
        <div className="route-preview-header">
          <span className="route-preview-title">Route Preview</span>
          <button className="route-preview-close" onClick={onCancel}>✕</button>
        </div>

        <div className="route-preview-summary">
          <span className="route-preview-route">{originLabel} → {destLabel}</span>
          {totalDistance > 0 && (
            <span className="route-preview-distance">
              {totalDistance >= 1000
                ? `${(totalDistance / 1000).toFixed(1)} km`
                : `${Math.round(totalDistance)} m`}
              {' · '}{steps.length} steps
            </span>
          )}
        </div>

        <div className="route-preview-steps">
          {steps.map((s) => (
            <div key={s.index} className="route-preview-step">
              <span className="route-preview-step-num">{s.index}</span>
              <div className="route-preview-step-info">
                <span className="route-preview-step-dir">
                  Walk to <strong>{s.to}</strong>
                  {s.isStairs ? ' ⚠️ Stairs' : ''}
                </span>
                <span className="route-preview-step-dist">{s.distance}m</span>
              </div>
            </div>
          ))}
        </div>

        <div className="route-preview-actions">
          <button className="route-preview-start" onClick={onStart}>
            Start Navigation
          </button>
          <button className="route-preview-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
