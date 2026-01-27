import { useState } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import ReactMarkdown from 'react-markdown'

function CommentEditor({ show, onHide, onSave, existingComment, lineNumber, fileName, version }) {
  const [comment, setComment] = useState(existingComment?.text || '');
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = () => {
    if (comment.trim()) {
      onSave({
        text: comment,
        markdown: comment
      });
      onHide();
    }
  };

  const handleClose = () => {
    setComment(existingComment?.text || '');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {existingComment ? 'Edit Comment' : 'Add Comment'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <strong>File:</strong> <code>{fileName}</code> <br />
          <strong>Version:</strong> {version} <br />
          <strong>Line:</strong> {lineNumber}
        </div>

        <Form.Group className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="mb-0">Comment (Markdown supported)</Form.Label>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
          </div>
          
          {showPreview ? (
            <div 
              className="border rounded p-3 bg-light" 
              style={{ minHeight: '150px' }}
            >
              <ReactMarkdown>{comment || '*No content*'}</ReactMarkdown>
            </div>
          ) : (
            <Form.Control
              as="textarea"
              rows={6}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter your comment here. You can use **bold**, *italic*, `code`, etc."
            />
          )}
        </Form.Group>

        <div className="text-muted small">
          <strong>Markdown tips:</strong> **bold**, *italic*, `code`, [link](url), - bullet list
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={!comment.trim()}>
          Save Comment
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default CommentEditor
