import ReactMarkdown from 'react-markdown'
import './CommentModal.css'

function CommentModal({ comment, comments, onClose, showAll = false }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{showAll ? 'All Comments' : 'Comment'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {showAll ? (
            <div className="all-comments">
              {comments.map((c, idx) => (
                <div key={idx} className="comment-item">
                  <div className="comment-meta">
                    <strong>{c.file}</strong> - Line {c.line}
                  </div>
                  <div className="comment-content">
                    <ReactMarkdown>{c.markdown || c.text}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="comment-content">
              <ReactMarkdown>{comment.markdown || comment.text}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommentModal
