import { useState } from 'react'
import './GitHubInput.css'

function GitHubInput({ onLoadRepo }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onLoadRepo(repoUrl, branch);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="github-input">
      <form onSubmit={handleSubmit} className="github-form">
        <div className="form-group">
          <label htmlFor="repo-url">GitHub Repository URL:</label>
          <input
            id="repo-url"
            type="text"
            className="github-input-field"
            placeholder="https://github.com/owner/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="branch">Branch:</label>
          <input
            id="branch"
            type="text"
            className="github-input-field"
            placeholder="main"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          />
        </div>

        <button type="submit" className="load-repo-btn" disabled={loading}>
          {loading ? 'Loading...' : 'Load Repository'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
}

export default GitHubInput
