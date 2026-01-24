import { useState } from 'react'
import * as Diff from 'diff'
import ReactMarkdown from 'react-markdown'
import './CodeDiffViewer.css'

function CodeDiffViewer({ file1, file2 }) {
  const [selectedLineComment, setSelectedLineComment] = useState(null);

  const diff = Diff.diffLines(file1.content, file2.content);
  
  let file1LineNum = 0;
  let file2LineNum = 0;

  const renderDiffLines = () => {
    const rows = [];

    diff.forEach((part, partIndex) => {
      const lines = part.value.split('\n').filter((line, idx, arr) => {
        return idx < arr.length - 1 || line !== '';
      });

      lines.forEach((line, lineIndex) => {
        if (part.removed) {
          file1LineNum++;
          const currentLineNum = file1LineNum;
          const comment = file1.comments && file1.comments[currentLineNum];
          
          rows.push({
            key: `${partIndex}-${lineIndex}-removed`,
            type: 'removed',
            lineNum: currentLineNum,
            line: line,
            comment: comment,
            file: file1.name
          });
        } else if (part.added) {
          file2LineNum++;
          const currentLineNum = file2LineNum;
          const comment = file2.comments && file2.comments[currentLineNum];
          
          rows.push({
            key: `${partIndex}-${lineIndex}-added`,
            type: 'added',
            lineNum: currentLineNum,
            line: line,
            comment: comment,
            file: file2.name
          });
        } else {
          file1LineNum++;
          file2LineNum++;
          const currentLineNum = file1LineNum;
          const comment = file1.comments?.[currentLineNum] || file2.comments?.[file2LineNum];
          
          rows.push({
            key: `${partIndex}-${lineIndex}-unchanged`,
            type: 'unchanged',
            lineNum: currentLineNum,
            line: line,
            comment: comment,
            file: file1.name
          });
        }
      });
    });

    return rows;
  };

  const diffLines = renderDiffLines();

  return (
    <div className="code-diff-viewer">
      <div className="diff-header">
        <div className="file-names">
          <span className="file-name old">{file1.name}</span>
          <span className="separator">→</span>
          <span className="file-name new">{file2.name}</span>
        </div>
      </div>

      <div className="two-column-layout">
        <div className="code-panel">
          <table className="diff-table">
            <thead>
              <tr>
                <th className="line-num-header">#</th>
                <th className="code-header">Code</th>
              </tr>
            </thead>
            <tbody>
              {diffLines.map((row) => (
                <tr 
                  key={row.key} 
                  className={`diff-row ${row.type} ${row.comment ? 'has-comment' : ''} ${selectedLineComment?.key === row.key ? 'selected' : ''}`}
                  onClick={() => row.comment && setSelectedLineComment({ ...row.comment, key: row.key, file: row.file, lineNum: row.lineNum })}
                >
                  <td className="line-num">{row.lineNum}</td>
                  <td className="code-cell">
                    <span className="diff-marker">
                      {row.type === 'removed' ? '-' : row.type === 'added' ? '+' : ' '}
                    </span>
                    <code>{row.line}</code>
                    {row.comment && (
                      <span className="comment-indicator">💬</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="comment-panel">
          {selectedLineComment ? (
            <div className="comment-display">
              <div className="comment-header">
                <h3>Comment</h3>
                <button 
                  className="close-comment-btn"
                  onClick={() => setSelectedLineComment(null)}
                >
                  ×
                </button>
              </div>
              <div className="comment-meta">
                <strong>{selectedLineComment.file}</strong> - Line {selectedLineComment.lineNum}
              </div>
              <div className="comment-content">
                <ReactMarkdown>{selectedLineComment.markdown || selectedLineComment.text}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="comment-placeholder">
              <p>Click on a line with 💬 to view its comment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CodeDiffViewer
