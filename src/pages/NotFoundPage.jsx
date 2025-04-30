import { Container, Row, Col, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import '../styles/NotFoundPage.css'

const NotFoundPage = () => {
  return (
    <div className="not-found-container fade-in">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <div className="not-found-content">
              <h1 className="not-found-title">404</h1>
              <h2 className="not-found-heading">Page Not Found</h2>
              <p className="not-found-text">
                The page you are looking for might have been removed, had its name changed, 
                or is temporarily unavailable.
              </p>
              <Button as={Link} to="/" variant="" className="btn-minimize">
                Return to Home
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default NotFoundPage