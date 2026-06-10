export default function SettingsPanel({ filters, onToggle, onClose }) {
  const toggles = [
    { key: 'noStairs', label: 'Avoid stairs', desc: 'Use ramps and elevators instead' },
    { key: 'wheelchair', label: 'Wheelchair accessible', desc: 'Only routes with ramps or elevators' },
    { key: 'noKeycard', label: 'Avoid keycard areas', desc: 'Skip restricted-access routes' },
  ];

  return (
    <div className="settings-panel-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <span className="settings-title">Route Preferences</span>
          <button className="settings-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="settings-body">
          {toggles.map((t) => (
            <label key={t.key} className="settings-toggle-row">
              <div className="settings-toggle-info">
                <span className="settings-toggle-label">{t.label}</span>
                <span className="settings-toggle-desc">{t.desc}</span>
              </div>
              <input
                type="checkbox"
                className="settings-toggle-input"
                checked={filters[t.key] || false}
                onChange={() => onToggle(t.key)}
              />
              <span className={`settings-toggle-slider ${filters[t.key] ? 'active' : ''}`} />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
