import { useState } from 'react'
import './GitHubPanel.css'

function GitHubPanel({ onLoadChangesets }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [token, setToken] = useState('');
  const [maxRequests, setMaxRequests] = useState(100);
  const [saveKey, setSaveKey] = useState('');
  const [commits, setCommits] = useState([]);
  const [selectedCommits, setSelectedCommits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestCount, setRequestCount] = useState(0);

  const parseRepoUrl = (url) => {
    const githubPattern = /github\.com\/([^\/]+)\/([^\/]+)/;
    const match = url.match(githubPattern);
    
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, '')
      };
    }
    return null;
  };

  const fetchWithToken = async (url) => {
    if (requestCount >= maxRequests) {
      throw new Error(`Request limit reached (${maxRequests})`);
    }
    
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };
    
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }
    
    setRequestCount(prev => prev + 1);
    return fetch(url, { headers });
  };

  const handleLoadRepo = async () => {
    setError('');
    setLoading(true);
    setRequestCount(0);

    try {
      const parsed = parseRepoUrl(repoUrl);
      if (!parsed) {
        throw new Error('Invalid GitHub URL');
      }

      const response = await fetchWithToken(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?sha=${branch}&per_page=20`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch commits: ${response.statusText}`);
      }

      const data = await response.json();
      const mappedCommits = data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        shortSha: commit.sha.substring(0, 7)
      }));

      setCommits(mappedCommits.reverse());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCommit = (index) => {
    setSelectedCommits(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index].sort((a, b) => a - b);
      }
    });
  };

  const handleLoadCommits = async () => {
    if (selectedCommits.length < 2) {
      alert('Please select at least 2 commits');
      return;
    }

    if (!saveKey.trim()) {
      alert('Please enter a key name to save the changeset');
      return;
    }

    setError('');
    setLoading(true);
    setRequestCount(0);

    try {
      const parsed = parseRepoUrl(repoUrl);
      const changesets = [];

      for (let i = 0; i < selectedCommits.length; i++) {
        const commitIndex = selectedCommits[i];
        const commit = commits[commitIndex];

        const treeResponse = await fetchWithToken(
          `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${commit.sha}?recursive=1`
        );

        if (!treeResponse.ok) {
          throw new Error(`Failed to fetch tree: ${treeResponse.statusText}`);
        }

        const treeData = await treeResponse.json();
        const files = treeData.tree
          .filter(item => {
            if (item.type !== 'blob') return false;
            const isValidSize = item.size < 1000000;
            const hasValidExtension = /\.(js|jsx|ts|tsx|py|java|cpp|c|cs|go|rs|rb|php|html|css|scss|json|md|yml|yaml|xml|sh|txt)$/i.test(item.path);
            return isValidSize && hasValidExtension;
          })
          .map(item => ({
            path: `/${item.path}`,
            url: `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${commit.sha}/${item.path}`
          }));

        changesets.push({
          version: i + 1,
          name: commit.message.split('\n')[0],
          sha: commit.sha,
          shortSha: commit.shortSha,
          author: commit.author,
          date: commit.date,
          files: files
        });
      }

      // Save to localStorage with raw URLs
      localStorage.setItem(`changeset_${saveKey}`, JSON.stringify(changesets));
      
      // Now fetch and load the actual content
      await onLoadChangesets(changesets, saveKey);
      
      alert(`Saved as "${saveKey}" and loaded successfully!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="github-panel">
      <h2>GitHub Repository</h2>
      <p className="instruction">Load commits from GitHub and save with raw file URLs.</p>

      <div className="github-form">
        <div className="form-row">
          <div className="form-group">
            <label>Repository URL:</label>
            <input
              type="text"
              className="input-field"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Branch:</label>
            <input
              type="text"
              className="input-field"
              placeholder="main"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>GitHub Token (optional):</label>
            <input
              type="password"
              className="input-field"
              placeholder="ghp_xxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Max Requests:</label>
            <input
              type="number"
              className="input-field"
              value={maxRequests}
              onChange={(e) => setMaxRequests(parseInt(e.target.value))}
              min="1"
              max="1000"
            />
          </div>
        </div>

        <div className="request-counter">
          Requests used: {requestCount} / {maxRequests}
        </div>

        <button className="load-repo-btn" onClick={handleLoadRepo} disabled={loading}>
          {loading ? 'Loading...' : 'Load Repository'}
        </button>
      </div>

      {commits.length > 0 && (
        <div className="commits-section">
          <h3>Select Commits ({selectedCommits.length} selected)</h3>
          <div className="commits-list">
            {commits.map((commit, index) => (
              <div
                key={commit.sha}
                className={`commit-item ${selectedCommits.includes(index) ? 'selected' : ''}`}
                onClick={() => toggleCommit(index)}
              >
                <input
                  type="checkbox"
                  checked={selectedCommits.includes(index)}
                  onChange={() => {}}
                />
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

          <div className="save-section">
            <input
              type="text"
              className="input-field"
              placeholder="Enter key name to save (e.g., assignment-1)"
              value={saveKey}
              onChange={(e) => setSaveKey(e.target.value)}
            />
            <button
              className="load-commits-btn"
              onClick={handleLoadCommits}
              disabled={selectedCommits.length < 2 || loading || !saveKey}
            >
              {loading ? 'Loading...' : 'Load & Save Selected Commits'}
            </button>
          </div>
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

export default GitHubPanel
