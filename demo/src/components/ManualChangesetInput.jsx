import { useState } from 'react'
import { Container, Card, Form, Button, Row, Col, Alert } from 'react-bootstrap'

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

      // Save only URLs and paths (content will be fetched on load)
      const storageChangesets = changesets.map((cs, idx) => ({
        version: idx + 1,
        name: cs.name,
        files: cs.files.map(file => ({
          path: file.path,
          url: file.url,
          comments: {} // Empty initially
        }))
      }));

      localStorage.setItem(`changeset_${saveKey}`, JSON.stringify(storageChangesets));
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
    <Container className="my-4">
      <Card>
        <Card.Header>
          <h4 className="mb-0">Define Changesets Manually</h4>
        </Card.Header>
        <Card.Body>
          <p className="text-muted">Add URLs to raw file content for each version you want to compare.</p>

          <Form onSubmit={handleSubmit}>
        {changesets.map((changeset, csIndex) => (
          <Card key={csIndex} className="mb-3" bg="light">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Version {csIndex + 1}</h5>
              {changesets.length > 1 && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeChangeset(csIndex)}
                >
                  Remove Version
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Version Name:</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Initial version"
                  value={changeset.name}
                  onChange={(e) => updateChangesetName(csIndex, e.target.value)}
                  required
                />
              </Form.Group>

              <div className="mb-3">
                <h6>Files:</h6>
                {changeset.files.map((file, fileIndex) => (
                  <Row key={fileIndex} className="mb-2 align-items-center">
                    <Col md={3}>
                      <Form.Control
                        type="text"
                        placeholder="File path (e.g., /src/index.js)"
                        value={file.path}
                        onChange={(e) => updateFile(csIndex, fileIndex, 'path', e.target.value)}
                        required
                        style={{ fontFamily: 'monospace' }}
                      />
                    </Col>
                    <Col md={8}>
                      <Form.Control
                        type="url"
                        placeholder="URL to raw file content"
                        value={file.url}
                        onChange={(e) => updateFile(csIndex, fileIndex, 'url', e.target.value)}
                        required
                        style={{ fontFamily: 'monospace', fontSize: '0.9em' }}
                      />
                    </Col>
                    <Col md={1}>
                      {changeset.files.length > 1 && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeFile(csIndex, fileIndex)}
                        >
                          ×
                        </Button>
                      )}
                    </Col>
                  </Row>
                ))}
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => addFile(csIndex)}
                >
                  + Add File
                </Button>
              </div>
            </Card.Body>
          </Card>
        ))}

            <Button variant="primary" onClick={addChangeset} className="mb-3">
              + Add Version
            </Button>

            <Row className="mb-3">
              <Col md={8}>
                <Form.Control
                  type="text"
                  placeholder="Enter key name to save (e.g., assignment-1)"
                  value={saveKey}
                  onChange={(e) => setSaveKey(e.target.value)}
                />
              </Col>
              <Col md={4}>
                <Button variant="secondary" onClick={handleSave} className="w-100">
                  Save to LocalStorage
                </Button>
              </Col>
            </Row>

            <Button type="submit" variant="success" disabled={loading} className="w-100">
              {loading ? 'Loading...' : 'Load Changesets'}
            </Button>
          </Form>

          {saveSuccess && (
            <Alert variant="success" className="mt-3">
              ✓ Saved successfully as "{saveKey}"
            </Alert>
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

export default ManualChangesetInput
