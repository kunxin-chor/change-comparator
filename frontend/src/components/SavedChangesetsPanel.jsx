import { useState, useEffect } from 'react'
import './SavedChangesetsPanel.css'

function SavedChangesetsPanel({ onLoadChangeset }) {
  const [savedKeys, setSavedKeys] = useState([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [changesetPreview, setChangesetPreview] = useState(null);

  useEffect(() => {
    loadSavedKeys();
  }, []);

  const loadSavedKeys = () => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('changeset_')) {
        keys.push(key.replace('changeset_', ''));
      }
    }
    setSavedKeys(keys);
  };

  const handleSelectKey = (key) => {
    setSelectedKey(key);
    const data = localStorage.getItem(`changeset_${key}`);
    if (data) {
      try {
        const changeset = JSON.parse(data);
        setChangesetPreview(changeset);
      } catch (error) {
        console.error('Error parsing changeset:', error);
      }
    }
  };

  const handleLoad = () => {
    if (!selectedKey) {
      alert('Please select a changeset to load');
      return;
    }
    
    const data = localStorage.getItem(`changeset_${selectedKey}`);
    if (data) {
      try {
        const changeset = JSON.parse(data);
        onLoadChangeset(changeset);
      } catch (error) {
        alert('Error loading changeset: ' + error.message);
      }
    }
  };

  const handleDelete = (key) => {
    if (confirm(`Delete changeset "${key}"?`)) {
      localStorage.removeItem(`changeset_${key}`);
      loadSavedKeys();
      if (selectedKey === key) {
        setSelectedKey('');
        setChangesetPreview(null);
      }
    }
  };

  return (
    <div className="saved-changesets-panel">
      <h2>Saved Changesets</h2>
      <p className="instruction">Load previously saved changesets from localStorage.</p>

      <div className="saved-content">
        <div className="saved-list">
          <h3>Available Changesets ({savedKeys.length})</h3>
          {savedKeys.length === 0 ? (
            <p className="empty-message">No saved changesets found.</p>
          ) : (
            <div className="keys-list">
              {savedKeys.map(key => (
                <div
                  key={key}
                  className={`key-item ${selectedKey === key ? 'selected' : ''}`}
                  onClick={() => handleSelectKey(key)}
                >
                  <span className="key-name">{key}</span>
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(key);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="preview-panel">
          <h3>Preview</h3>
          {changesetPreview ? (
            <div className="preview-content">
              <p><strong>Versions:</strong> {changesetPreview.length}</p>
              {changesetPreview.map((cs, idx) => (
                <div key={idx} className="version-preview">
                  <h4>Version {cs.version}: {cs.name}</h4>
                  <p className="file-count">{cs.files.length} file(s)</p>
                  <ul className="file-list">
                    {cs.files.map((file, fIdx) => (
                      <li key={fIdx}>{file.id}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <button className="load-btn" onClick={handleLoad}>
                Load This Changeset
              </button>
            </div>
          ) : (
            <p className="empty-message">Select a changeset to preview</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SavedChangesetsPanel
