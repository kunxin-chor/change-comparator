import './FileSelector.css'

function FileSelector({ files, selectedFileId, onFileChange, changedFileIds = [] }) {
  return (
    <div className="file-selector">
      <label htmlFor="file-select" className="file-selector-label">
        Select file:
      </label>
      <select
        id="file-select"
        className="file-dropdown"
        value={selectedFileId}
        onChange={(e) => onFileChange(e.target.value)}
      >
        {files.map((file) => {
          const isChanged = changedFileIds.includes(file.id);
          return (
            <option key={file.id} value={file.id}>
              {isChanged ? '● ' : ''}{file.id}
            </option>
          );
        })}
      </select>
    </div>
  )
}

export default FileSelector
