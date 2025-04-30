import { Link, useNavigate } from 'react-router-dom'
import { Navbar, Nav, Container } from 'react-bootstrap'
import { useAuth } from '../../context/AuthContext'
import './Header.css'

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    scrollToTop()
  }

  return (
    <>
      <Navbar expand="lg" className="navbar">
        <Container fluid>
          <Navbar.Brand as={Link} to="/" onClick={scrollToTop}>
            <img src="/Image/Lotterich_Logo2.png" alt="Logo" className="logo" />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="navbar-nav me-auto mb-2 mb-lg-0">
              <Nav.Link as={Link} to="/" onClick={scrollToTop}>Home</Nav.Link>
              {isAuthenticated ? (
                <>
                  <Nav.Link as={Link} to="/collection" onClick={scrollToTop}>Collection</Nav.Link>
                  <Nav.Link as={Link} to="/overview" onClick={scrollToTop}>Overview</Nav.Link>
                  <Nav.Link as={Link} to="/statistics" onClick={scrollToTop}>Statistics</Nav.Link>
                  <Nav.Link as={Link} to="/" onClick={handleLogout}>Logout</Nav.Link>
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to="/login" onClick={scrollToTop}>Collection</Nav.Link>
                  <Nav.Link as={Link} to="/login" onClick={scrollToTop}>Overview</Nav.Link>
                  <Nav.Link as={Link} to="/statistics" onClick={scrollToTop}>Statistics</Nav.Link>
                </>
              )}
            </Nav>
            {isAuthenticated ? (
              <Link to="/profile" className="user-profile-link ms-auto" onClick={scrollToTop}>
                <div className="user-profile-container">
                  <div className="user-avatar">
                    <img src="https://cdn-icons-png.flaticon.com/512/3135/3135768.png" alt="User Avatar" />
                  </div>
                  <div className="user-info">
                    <span className="username">{user.name || user.email}</span>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="d-flex gap-2 ms-auto">
                <Link to="/register" className="btn btn-minimize" onClick={scrollToTop}>Create Account</Link>
                <Link to="/login" className="btn btn-close-app" onClick={scrollToTop}>Login</Link>
              </div>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <div className="background"></div>
    </>
  )
}

export default Header