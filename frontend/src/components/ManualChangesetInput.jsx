import { useState } from 'react'
import './ManualChangesetInput.css'

function ManualChangesetInput({ onLoadChangesets }) {
  const [changesets, setChangesets] = useState([
    {
      name: '',
      files: [{ path: '', url: '' }]
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveKey, setSaveKey] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    if (!saveKey.trim()) {
      alert('Please enter a key name to save');
      return;
    }

    try {
      // Validate that all fields are filled
      for (let cs of changesets) {
        if (!cs.name.trim()) {
          alert('Please fill in all version names');
          return;
        }
        for (let file of cs.files) {
          if (!file.path.trim() || !file.url.trim()) {
            alert('Please fill in all file paths and URLs');
            return;
          }
        }
      }

      localStorage.setItem(`changeset_${saveKey}`, JSON.stringify(changesets));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      alert('Error saving: ' + error.message);
    }
  };

  const addChangeset = () => {
    setChangesets([...changesets, { name: '', files: [{ path: '', url: '' }] }]);
  };

  const removeChangeset = (index) => {
    setChangesets(changesets.filter((_, i) => i !== index));
  };

  const updateChangesetName = (index, name) => {
    const updated = [...changesets];
    updated[index].name = name;
    setChangesets(updated);
  };

  const addFile = (changesetIndex) => {
    const updated = [...changesets];
    updated[changesetIndex].files.push({ path: '', url: '' });
    setChangesets(updated);
  };

  const removeFile = (changesetIndex, fileIndex) => {
    const updated = [...changesets];
    updated[changesetIndex].files = updated[changesetIndex].files.filter((_, i) => i !== fileIndex);
    setChangesets(updated);
  };

  const updateFile = (changesetIndex, fileIndex, field, value) => {
    const updated = [...changesets];
    updated[changesetIndex].files[fileIndex][field] = value;
    setChangesets(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onLoadChangesets(changesets);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manual-changeset-input">
      <h2>Define Changesets Manually</h2>
      <p className="instruction">Add URLs to raw file content for each version you want to compare.</p>

      <form onSubmit={handleSubmit}>
        {changesets.map((changeset, csIndex) => (
          <div key={csIndex} className="changeset-section">
            <div className="changeset-header">
              <h3>Version {csIndex + 1}</h3>
              {changesets.length > 1 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeChangeset(csIndex)}
                >
                  Remove Version
                </button>
              )}
            </div>

            <div className="form-group">
              <label>Version Name:</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Initial version"
                value={changeset.name}
                onChange={(e) => updateChangesetName(csIndex, e.target.value)}
                required
              />
            </div>

            <div className="files-section">
              <h4>Files:</h4>
              {changeset.files.map((file, fileIndex) => (
                <div key={fileIndex} className="file-row">
                  <input
                    type="text"
                    className="input-field file-path"
                    placeholder="File path (e.g., /src/index.js)"
                    value={file.path}
                    onChange={(e) => updateFile(csIndex, fileIndex, 'path', e.target.value)}
                    required
                  />
                  <input
                    type="url"
                    className="input-field file-url"
                    placeholder="URL to raw file content"
                    value={file.url}
                    onChange={(e) => updateFile(csIndex, fileIndex, 'url', e.target.value)}
                    required
                  />
                  {changeset.files.length > 1 && (
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={() => removeFile(csIndex, fileIndex)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="add-file-btn"
                onClick={() => addFile(csIndex)}
              >
                + Add File
              </button>
            </div>
          </div>
        ))}

        <button type="button" className="add-changeset-btn" onClick={addChangeset}>
          + Add Version
        </button>

        <div className="save-section">
          <input
            type="text"
            className="input-field save-key-input"
            placeholder="Enter key name to save (e.g., assignment-1)"
            value={saveKey}
            onChange={(e) => setSaveKey(e.target.value)}
          />
          <button type="button" className="save-btn" onClick={handleSave}>
            Save to LocalStorage
          </button>
        </div>

        <button type="submit" className="load-btn" disabled={loading}>
          {loading ? 'Loading...' : 'Load Changesets'}
        </button>
      </form>

      {saveSuccess && (
        <div className="success-message">
          ✓ Saved successfully as "{saveKey}"
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
}

export default ManualChangesetInput
