import './ViewModeToggle.css'

function ViewModeToggle({ viewMode, onViewModeChange }) {
  const modes = [
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'current', label: 'Current' },
    { value: 'previous', label: 'Previous' }
  ];

  return (
    <div className="view-mode-toggle">
      <span className="view-mode-label">View:</span>
      <div className="view-mode-buttons">
        {modes.map((mode) => (
          <button
            key={mode.value}
            className={`view-mode-btn ${viewMode === mode.value ? 'active' : ''}`}
            onClick={() => onViewModeChange(mode.value)}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ViewModeToggle
