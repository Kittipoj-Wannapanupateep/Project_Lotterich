import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Navbar, Nav, Container } from 'react-bootstrap'
import { useAuth } from '../../context/AuthContext'
import './Header.css'
import { useRef, useState } from 'react'

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Close navbar collapse (for mobile) using state
  const handleNavClick = () => {
    scrollToTop();
    setExpanded(false);
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    scrollToTop()
    setExpanded(false);
  }

  return (
    <>
      <Navbar expand="lg" className="navbar" expanded={expanded} onToggle={setExpanded}>
        <Container fluid>
          <Navbar.Brand as={Link} to="/" onClick={handleNavClick}>
            <img src="/Image/Lotterich_Logo2.png" alt="Logo" className="logo" />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            {/* User profile box at the top in mobile mode */}
            {isAuthenticated && (
              <div className="user-profile-responsive-wrapper w-100 d-lg-none mb-3">
                <Link to="/profile" className="user-profile-link" onClick={handleNavClick}>
                  <div className="user-profile-container w-100 justify-content-center">
                    <div className="user-avatar">
                      <img src="https://cdn-icons-png.flaticon.com/512/3135/3135768.png" alt="User Avatar" />
                    </div>
                    <div className="user-info">
                      <span className="username">{user.name || user.email}</span>
                    </div>
                  </div>
                </Link>
              </div>
            )}
            <Nav className="navbar-nav me-auto mb-2 mb-lg-0">
              <Nav.Link as={Link} to="/" onClick={handleNavClick}>Home</Nav.Link>
              {isAuthenticated ? (
                <>
                  <Nav.Link as={Link} to="/collection" onClick={handleNavClick}>Collection</Nav.Link>
                  <Nav.Link as={Link} to="/overview" onClick={handleNavClick}>Overview</Nav.Link>
                  <Nav.Link as={Link} to="/statistics" onClick={handleNavClick}>Statistics</Nav.Link>
                  <Nav.Link as={Link} to="/" onClick={handleLogout}>Logout</Nav.Link>
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to="/login" onClick={handleNavClick}>Collection</Nav.Link>
                  <Nav.Link as={Link} to="/login" onClick={handleNavClick}>Overview</Nav.Link>
                  <Nav.Link as={Link} to="/statistics" onClick={handleNavClick}>Statistics</Nav.Link>
                </>
              )}
            </Nav>
            {/* User profile box for desktop */}
            {isAuthenticated && (
              <Link to="/profile" className="user-profile-link ms-auto d-none d-lg-inline-block" onClick={handleNavClick}>
                <div className="user-profile-container">
                  <div className="user-avatar">
                    <img src="https://cdn-icons-png.flaticon.com/512/3135/3135768.png" alt="User Avatar" />
                  </div>
                  <div className="user-info">
                    <span className="username">{user.name || user.email}</span>
                  </div>
                </div>
              </Link>
            )}
            {!isAuthenticated && (
              <div className="d-flex gap-2 ms-auto">
                {location.pathname === '/login' ? (
                  <Link to="/register" className="btn btn-minimize" onClick={handleNavClick}>Create Account</Link>
                ) : location.pathname === '/register' ? (
                  <Link to="/login" className="btn btn-close-app" onClick={handleNavClick}>Login</Link>
                ) : (
                  <>
                    <Link to="/register" className="btn btn-minimize" onClick={handleNavClick}>Create Account</Link>
                    <Link to="/login" className="btn btn-close-app" onClick={handleNavClick}>Login</Link>
                  </>
                )}
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