import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { Alert, Button, Container, Spinner, Table } from 'react-bootstrap'
import { fetchChangesets } from '../services/api'

function ChangesetListPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchChangesets()
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : [])
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
  }, [])

  return (
    <Container className="py-2">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h3 className="mb-0">Changesets</h3>
        <Button variant="outline-secondary" size="sm" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="d-flex align-items-center gap-2 text-muted">
          <Spinner size="sm" />
          <span>Loading changesets...</span>
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Repo</th>
              <th>Branch</th>
              <th>Versions</th>
              <th>Last synced</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted">
                  No changesets found.
                </td>
              </tr>
            ) : (
              items.map((cs) => (
                <tr key={cs._id}>
                  <td>{cs.name}</td>
                  <td className="text-truncate" style={{ maxWidth: 320 }}>
                    <code>{cs.repoUrl}</code>
                  </td>
                  <td>{cs.branch}</td>
                  <td>{cs.versions}</td>
                  <td>{cs.lastSyncedAt ? new Date(cs.lastSyncedAt).toLocaleString() : ''}</td>
                  <td style={{ width: 120 }}>
                    <Button as={Link} href={`/changesets/${cs._id}`} size="sm">
                      Open
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}
    </Container>
  )
}

export default ChangesetListPage
