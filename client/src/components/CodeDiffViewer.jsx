import { useState } from 'react'
import * as Diff from 'diff'
import ReactMarkdown from 'react-markdown'
import './CodeDiffViewer.css'

function CodeDiffViewer({
  file1,
  file2,
  fileName,
  version1,
  version2,
  viewMode = 'hybrid',
}) {
  const [selectedLineComment, setSelectedLineComment] = useState(null)
  const [copyStatus, setCopyStatus] = useState('')

  const diff = Diff.diffLines(file1.content, file2.content)

  let file1LineNum = 0
  let file2LineNum = 0

  const renderDiffLines = () => {
    const rows = []

    diff.forEach((part, partIndex) => {
      const lines = part.value.split('\n').filter((line, idx, arr) => {
        return idx < arr.length - 1 || line !== ''
      })

      lines.forEach((line, lineIndex) => {
        if (part.removed) {
          file1LineNum++
          const currentLineNum = file1LineNum
          const comment = file1.comments && file1.comments[currentLineNum]

          if (viewMode === 'hybrid' || viewMode === 'previous') {
            rows.push({
              key: `${partIndex}-${lineIndex}-removed`,
              type: 'removed',
              lineNum: currentLineNum,
              line: line,
              comment: comment,
              file: fileName,
            })
          }
        } else if (part.added) {
          file2LineNum++
          const currentLineNum = file2LineNum
          const comment = file2.comments && file2.comments[currentLineNum]

          if (viewMode === 'hybrid' || viewMode === 'current') {
            rows.push({
              key: `${partIndex}-${lineIndex}-added`,
              type: 'added',
              lineNum: currentLineNum,
              line: line,
              comment: comment,
              file: fileName,
            })
          }
        } else {
          file1LineNum++
          file2LineNum++
          const currentLineNum = file1LineNum
          const comment = file1.comments?.[currentLineNum] || file2.comments?.[file2LineNum]

          rows.push({
            key: `${partIndex}-${lineIndex}-unchanged`,
            type: 'unchanged',
            lineNum: currentLineNum,
            line: line,
            comment: comment,
            file: fileName,
          })
        }
      })
    })

    return rows
  }

  const diffLines = renderDiffLines()

  const buildAskAiPrompt = () => {
    const patch = Diff.createTwoFilesPatch(
      fileName,
      fileName,
      file1.content || '',
      file2.content || '',
      `v${version1}`,
      `v${version2}`
    )

    const header = [
      'You are a programmer coach',
      'Task: Explain ONLY the differences shown in the diff below.',
      'Do NOT propose corrections, refactors, improvements, or alternative implementations.',
      'Do NOT judge code quality. Do NOT add new code. Do NOT suggest tests.',
      'Just show the lines of code that have been changed, describe what changed in a neutral tone.',
      'Explain the reasons for the change.',
      'Show the line numbers',
      '',
      `File: ${fileName}`,
      `Change: v${version1} -> v${version2}`,
      '',
      'DIFF (unified patch):',
      '```diff',
      patch || '',
      '```',
      '',
      'SOURCE CODE BEFORE (v' + version1 + '):',
      '```',
      file1.content || '',
      '```',
      '',
      'SOURCE CODE AFTER (v' + version2 + '):',
      '```',
      file2.content || '',
      '```',
      '',
      'Output format:',
      '- Display the lines of code that have been changed',
      '- Start with a short 1-2 sentence overview of the change.',
      '- Then list each change hunk and explain it line-by-line.',
      '- Explain the reason for the change',
      '- End with a short summary of what was changed (still no suggestions).',
    ]

    return header.join('\n')
  }

  const copyAskAiPrompt = async () => {
    const prompt = buildAskAiPrompt()
    setCopyStatus('')

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(prompt)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = prompt
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.top = '-1000px'
        textarea.style.left = '-1000px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      setCopyStatus('Copied!')
      window.setTimeout(() => setCopyStatus(''), 2000)
    } catch (e) {
      setCopyStatus('Copy failed')
      window.setTimeout(() => setCopyStatus(''), 2500)
    }
  }

  return (
    <div className="code-diff-viewer">
      <div className="diff-header">
        <div className="file-names">
          <span className="file-name-display">{fileName}</span>
          <span className="version-info">
            <span className="version old">v{version1}</span>
            <span className="separator">→</span>
            <span className="version new">v{version2}</span>
          </span>
        </div>

        <div className="diff-actions">
          <button type="button" className="ask-ai-btn" onClick={copyAskAiPrompt}>
            Ask AI
          </button>
          {copyStatus ? <span className="copy-status">{copyStatus}</span> : null}
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
                  className={`diff-row ${row.type} ${row.comment ? 'has-comment' : ''} ${
                    selectedLineComment?.key === row.key ? 'selected' : ''
                  }`}
                >
                  <td className="line-num">{row.lineNum}</td>
                  <td className="code-cell">
                    <span className="diff-marker">
                      {row.type === 'removed' ? '-' : row.type === 'added' ? '+' : ' '}
                    </span>
                    <code>{row.line}</code>
                    {row.comment ? (
                      <span
                        className="comment-indicator clickable"
                        onClick={() =>
                          setSelectedLineComment({
                            text: typeof row.comment === 'string' ? row.comment : row.comment?.text,
                            markdown:
                              typeof row.comment === 'string'
                                ? row.comment
                                : row.comment?.markdown || row.comment?.text,
                            key: row.key,
                            file: row.file,
                            lineNum: row.lineNum,
                            version: row.type === 'removed' ? version1 : version2,
                          })
                        }
                        title="View comment"
                      >
                        💬
                      </span>
                    ) : (
                      null
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
                <div>
                  <button className="close-comment-btn" onClick={() => setSelectedLineComment(null)}>
                    ×
                  </button>
                </div>
              </div>
              <div className="comment-meta">
                <strong>{selectedLineComment.file}</strong> - Line {selectedLineComment.lineNum} (v{selectedLineComment.version})
              </div>
              <div className="comment-content">
                <ReactMarkdown>{selectedLineComment.markdown || selectedLineComment.text}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="comment-placeholder">
              <p>Click on a line with 💬 to view its comment</p>
              <p className="text-muted small">Or click +💬 to add a new comment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CodeDiffViewer
