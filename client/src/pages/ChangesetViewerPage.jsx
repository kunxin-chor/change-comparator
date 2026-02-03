import { useEffect, useMemo, useState } from 'react'
import { useLocation, useRoute } from 'wouter'
import { Alert, Container, Spinner } from 'react-bootstrap'
import CodeDiffViewer from '../components/CodeDiffViewer'
import ControlBar from '../components/ControlBar'
import FileSelector from '../components/FileSelector'
import ViewModeToggle from '../components/ViewModeToggle'
import { fetchChangesetById } from '../services/api'
import {
  getAllFilesFromChangesets,
  getFileFromChangeset,
  loadChangesetsFromDbDocument,
} from '../services/changesetService'

function ChangesetViewerPage() {
  const [, params] = useRoute('/changesets/:id')
  const [, setLocation] = useLocation()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [docMeta, setDocMeta] = useState(null)
  const [changesets, setChangesets] = useState([])

  const [pairIndex, setPairIndex] = useState(0)
  const [selectedFileId, setSelectedFileId] = useState('')
  const [viewMode, setViewMode] = useState('hybrid')

  const id = params?.id

  useEffect(() => {
    if (!id) return

    let cancelled = false

    async function run() {
      try {
        setLoading(true)
        setError(null)

        const doc = await fetchChangesetById(id)
        if (cancelled) return

        setDocMeta({
          _id: doc._id,
          name: doc.name,
          repoUrl: doc.repoUrl,
          branch: doc.branch,
        })

        const loaded = await loadChangesetsFromDbDocument(doc)
        if (cancelled) return

        setChangesets(loaded)
        setPairIndex(0)

        if (loaded[0]?.files?.length) {
          setSelectedFileId(loaded[0].files[0].id)
        } else {
          setSelectedFileId('')
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || String(e))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [id])

  const maxPairIndex = Math.max(0, changesets.length - 2)

  useEffect(() => {
    if (pairIndex > maxPairIndex) {
      setPairIndex(maxPairIndex)
    }
  }, [pairIndex, maxPairIndex])

  const allFiles = useMemo(() => getAllFilesFromChangesets(changesets, pairIndex), [changesets, pairIndex])

  const changedFileIds = useMemo(() => {
    if (!changesets[pairIndex] || !changesets[pairIndex + 1]) return []
    const files1 = changesets[pairIndex].files
    const files2 = changesets[pairIndex + 1].files
    const ids = []

    const f1Map = new Map(files1.map(f => [f.id, f.content]))
    const f2Map = new Map(files2.map(f => [f.id, f.content]))

    const allIds = new Set([...f1Map.keys(), ...f2Map.keys()])
    for (const id of allIds) {
      if (f1Map.get(id) !== f2Map.get(id)) {
        ids.push(id)
      }
    }
    return ids
  }, [changesets, pairIndex])

  const file1 = useMemo(() => getFileFromChangeset(changesets, pairIndex, selectedFileId), [changesets, pairIndex, selectedFileId])
  const file2 = useMemo(() => getFileFromChangeset(changesets, pairIndex + 1, selectedFileId), [changesets, pairIndex, selectedFileId])

  useEffect(() => {
    if (!selectedFileId && allFiles.length > 0) {
      setSelectedFileId(allFiles[0].id)
    }
  }, [selectedFileId, allFiles])

  const pairOptions = useMemo(() => {
    const opts = []
    for (let i = 0; i < changesets.length - 1; i++) {
      const cs2 = changesets[i + 1]
      // Display as v0 -> v1, v1 -> v2, ... and show the commit message for the right-hand version.
      // First pair is special: there is no "v0 commit" in the data, but users expect the label.
      const left = i
      const right = i + 1
      const name2 = cs2?.name ? `: ${cs2.name}` : ''
      opts.push({ index: i, label: `v${left} → v${right}${name2}` })
    }
    return opts
  }, [changesets])


  if (!id) {
    return (
      <Container className="py-4">
        <Alert variant="warning">Missing changeset id.</Alert>
      </Container>
    )
  }

  if (loading) {
    return (
      <Container className="py-4">
        <div className="d-flex align-items-center gap-2 text-muted">
          <Spinner size="sm" />
          <span>Loading changeset...</span>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <div className="mb-2">{error}</div>
          <a href="#" onClick={(e) => {
            e.preventDefault()
            setLocation('/changesets')
          }}>Back to list</a>
        </Alert>
      </Container>
    )
  }

  if (changesets.length < 2) {
    return (
      <Container className="py-4">
        <Alert variant="warning">Need at least 2 versions to compare.</Alert>
      </Container>
    )
  }

  return (
    <>
      <Container fluid className="py-2">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div>
            <h4 className="mb-1">{docMeta?.name || 'Changeset'}</h4>
            <div className="text-muted small">
              <code>{docMeta?.repoUrl}</code>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <label className="text-muted small" htmlFor="pairSelect">
              Versions
            </label>
            <select
              id="pairSelect"
              className="form-select form-select-sm"
              style={{ width: 160 }}
              value={pairIndex}
              onChange={(e) => setPairIndex(parseInt(e.target.value, 10))}
            >
              {pairOptions.map((opt) => (
                <option key={opt.index} value={opt.index}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Container>

      <Container fluid className="mb-1">
        <ControlBar>
          <FileSelector
            files={allFiles}
            selectedFileId={selectedFileId}
            onFileChange={setSelectedFileId}
            changedFileIds={changedFileIds}
          />
          <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </ControlBar>
      </Container>

      {file1 && file2 ? (
        <CodeDiffViewer
          file1={file1}
          file2={file2}
          fileName={selectedFileId}
          version1={changesets[pairIndex].version}
          version2={changesets[pairIndex + 1].version}
          viewMode={viewMode}
        />
      ) : (
        <Container className="py-4">
          <Alert variant="secondary">No matching file found in both versions.</Alert>
        </Container>
      )}
    </>
  )
}

export default ChangesetViewerPage
