import { useState } from 'react'
import { Container, Card, Form, Button, Row, Col, Alert, Badge, ListGroup } from 'react-bootstrap'

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
            url: `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${commit.sha}/${item.path}`,
            comments: {} // Empty initially, can be added later
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
    <Container className="my-4">
      <Card>
        <Card.Header>
          <h4 className="mb-0">GitHub Repository</h4>
        </Card.Header>
        <Card.Body>
          <p className="text-muted">Load commits from GitHub and save with raw file URLs.</p>

          <Form>
            <Row className="mb-3">
              <Col md={8}>
                <Form.Group>
                  <Form.Label>Repository URL:</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="https://github.com/owner/repo"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Branch:</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="main"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={8}>
                <Form.Group>
                  <Form.Label>GitHub Token (optional):</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Max Requests:</Form.Label>
                  <Form.Control
                    type="number"
                    value={maxRequests}
                    onChange={(e) => setMaxRequests(parseInt(e.target.value))}
                    min="1"
                    max="1000"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Alert variant="info" className="d-flex justify-content-between align-items-center">
              <span>Requests used: <Badge bg="primary">{requestCount} / {maxRequests}</Badge></span>
            </Alert>

            <Button variant="primary" onClick={handleLoadRepo} disabled={loading} className="w-100">
              {loading ? 'Loading...' : 'Load Repository'}
            </Button>
          </Form>

          {commits.length > 0 && (
            <div className="mt-4">
              <h5>Select Commits <Badge bg="secondary">{selectedCommits.length} selected</Badge></h5>
              <ListGroup style={{ maxHeight: '400px', overflowY: 'auto' }} className="mb-3">
                {commits.map((commit, index) => (
                  <ListGroup.Item
                    key={commit.sha}
                    active={selectedCommits.includes(index)}
                    onClick={() => toggleCommit(index)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Form.Check
                      type="checkbox"
                      checked={selectedCommits.includes(index)}
                      onChange={() => {}}
                      label={
                        <div>
                          <div className="fw-bold">{commit.message}</div>
                          <div className="small text-muted">
                            <Badge bg="secondary" className="me-2">{commit.shortSha}</Badge>
                            {commit.author} · {new Date(commit.date).toLocaleDateString()}
                          </div>
                        </div>
                      }
                    />
                  </ListGroup.Item>
                ))}
              </ListGroup>

              <Row>
                <Col md={8}>
                  <Form.Control
                    type="text"
                    placeholder="Enter key name to save (e.g., assignment-1)"
                    value={saveKey}
                    onChange={(e) => setSaveKey(e.target.value)}
                  />
                </Col>
                <Col md={4}>
                  <Button
                    variant="success"
                    onClick={handleLoadCommits}
                    disabled={selectedCommits.length < 2 || loading || !saveKey}
                    className="w-100"
                  >
                    {loading ? 'Loading...' : 'Load & Save'}
                  </Button>
                </Col>
              </Row>
            </div>
          )}

          {error && (
            <Alert variant="danger" className="mt-3">
              {error}
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default GitHubPanel
