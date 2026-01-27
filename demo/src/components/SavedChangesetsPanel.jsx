import { useState, useEffect } from 'react'
import { Container, Card, Row, Col, ListGroup, Button, Badge, Alert } from 'react-bootstrap'

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
    <Container className="my-4">
      <Card>
        <Card.Header>
          <h4 className="mb-0">Saved Changesets</h4>
        </Card.Header>
        <Card.Body>
          <p className="text-muted">Load previously saved changesets from localStorage.</p>

          <Row>
            <Col md={4}>
              <Card bg="light">
                <Card.Header>
                  <h6 className="mb-0">Available Changesets <Badge bg="primary">{savedKeys.length}</Badge></h6>
                </Card.Header>
                <Card.Body style={{ maxHeight: '500px', overflowY: 'auto', padding: 0 }}>
                  {savedKeys.length === 0 ? (
                    <Alert variant="info" className="m-3">No saved changesets found.</Alert>
                  ) : (
                    <ListGroup variant="flush">
                      {savedKeys.map(key => (
                        <ListGroup.Item
                          key={key}
                          active={selectedKey === key}
                          onClick={() => handleSelectKey(key)}
                          style={{ cursor: 'pointer' }}
                          className="d-flex justify-content-between align-items-center"
                        >
                          <code>{key}</code>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(key);
                            }}
                          >
                            ×
                          </Button>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={8}>
              <Card bg="light">
                <Card.Header>
                  <h6 className="mb-0">Preview</h6>
                </Card.Header>
                <Card.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {changesetPreview ? (
                    <>
                      <Alert variant="info">
                        <strong>Versions:</strong> {changesetPreview.length}
                      </Alert>
                      {changesetPreview.map((cs, idx) => (
                        <Card key={idx} className="mb-3">
                          <Card.Header>
                            <strong>Version {cs.version}:</strong> {cs.name}
                          </Card.Header>
                          <Card.Body>
                            <p className="text-muted mb-2">{cs.files.length} file(s)</p>
                            <ListGroup variant="flush">
                              {cs.files.map((file, fIdx) => (
                                <ListGroup.Item key={fIdx}>
                                  <code>{file.id || file.path}</code>
                                </ListGroup.Item>
                              ))}
                            </ListGroup>
                          </Card.Body>
                        </Card>
                      ))}
                      <Button variant="success" onClick={handleLoad} className="w-100">
                        Load This Changeset
                      </Button>
                    </>
                  ) : (
                    <Alert variant="secondary">Select a changeset to preview</Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default SavedChangesetsPanel
