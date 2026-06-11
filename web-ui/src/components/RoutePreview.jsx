export default function RoutePreview({ currentRoute, totalDistance, steps, onStart, onCancel }) {
  const originLabel = currentRoute?.[0]?.label || 'Current location';
  const destLabel = currentRoute?.[currentRoute.length - 1]?.label || 'Destination';

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
              {steps?.length > 0 ? ` · ${steps.length} steps` : ''}
            </span>
          )}
        </div>

        {(steps?.length > 0) && (
          <div className="route-preview-steps">
            {steps.map((step, i) => (
              <div key={i} className="route-preview-step">
                <span className="route-preview-step-num">{i + 1}</span>
                <div className="route-preview-step-info">
                  <span className="route-preview-step-dir">{step}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="route-preview-actions">
          <button className="route-preview-start" onClick={onStart}>Start Navigation</button>
          <button className="route-preview-cancel" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
