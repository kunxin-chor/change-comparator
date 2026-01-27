import { Route, Switch, Link, Redirect, useLocation } from 'wouter'
import { Container, Nav, Navbar } from 'react-bootstrap'
import ChangesetListPage from './pages/ChangesetListPage'
import ChangesetViewerPage from './pages/ChangesetViewerPage'

function App() {
  const [location] = useLocation()

  return (
    <div>
      <Navbar bg="primary" variant="dark" expand="lg" className="mb-3">
        <Container fluid>
          <Navbar.Brand>Code Diff Comment Tool</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} href="/changesets" active={location === '/changesets'}>
                Changesets
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Switch>
        <Route path="/changesets" component={ChangesetListPage} />
        <Route path="/changesets/:id" component={ChangesetViewerPage} />
        <Route>
          <Redirect to="/changesets" />
        </Route>
      </Switch>
    </div>
  )
}

export default App
