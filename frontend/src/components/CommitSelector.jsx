import { useState } from 'react'
import './CommitSelector.css'

function CommitSelector({ commits, onLoadCommits }) {
  const [selectedCommits, setSelectedCommits] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleCommit = (index) => {
    setSelectedCommits(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index].sort((a, b) => a - b);
      }
    });
  };

  const handleLoad = async () => {
    console.log('handleLoad called, selectedCommits:', selectedCommits);
    
    if (selectedCommits.length < 2) {
      alert('Please select at least 2 commits');
      return;
    }

    setLoading(true);
    try {
      console.log('Calling onLoadCommits with:', selectedCommits);
      await onLoadCommits(selectedCommits);
      console.log('onLoadCommits completed successfully');
    } catch (error) {
      console.error('Error in handleLoad:', error);
      alert('Error loading commits: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="commit-selector">
      <div className="commit-selector-header">
        <h3>Select Commits to Compare ({selectedCommits.length} selected)</h3>
        <button 
          className="load-commits-btn"
          onClick={handleLoad}
          disabled={selectedCommits.length < 2 || loading}
        >
          {loading ? 'Loading...' : 'Load Selected Commits'}
        </button>
      </div>

      <div className="commits-list">
        {commits.map((commit, index) => (
          <div
            key={commit.sha}
            className={`commit-item ${selectedCommits.includes(index) ? 'selected' : ''}`}
            onClick={() => toggleCommit(index)}
          >
            <div className="commit-checkbox">
              <input
                type="checkbox"
                checked={selectedCommits.includes(index)}
                onChange={() => {}}
              />
            </div>
            <div className="commit-info">
              <div className="commit-message">{commit.message}</div>
              <div className="commit-meta">
                <span className="commit-sha">{commit.shortSha}</span>
                <span className="commit-author">{commit.author}</span>
                <span className="commit-date">
                  {new Date(commit.date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CommitSelector
