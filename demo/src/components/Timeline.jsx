import './Timeline.css'

function Timeline({ changesets, selectedIndex, onIndexChange }) {
  return (
    <div className="timeline">
      <label htmlFor="timeline-select" className="timeline-label">
        Compare to:
      </label>
      <select 
        id="timeline-select"
        className="timeline-dropdown"
        value={selectedIndex}
        onChange={(e) => onIndexChange(parseInt(e.target.value))}
      >
        {changesets.slice(1).map((changeset, index) => (
          <option key={changeset.version} value={index}>
            v{changesets[index].version} → v{changeset.version}: {changeset.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default Timeline
