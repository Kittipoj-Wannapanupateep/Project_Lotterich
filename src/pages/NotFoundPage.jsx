import { Container, Row, Col, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/NotFoundPage.css'

const NotFoundPage = () => {
  const { user, isAuthenticated } = useAuth();
  const homeLink = isAuthenticated && user.role === 'admin' ? '/admin/manage' : '/';
  return (
    <div className="not-found-container fade-in">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <div className="not-found-content">
              <h1 className="not-found-title">404</h1>
              <h2 className="not-found-heading">ไม่พบหน้าดังกล่าว</h2>
              <p className="not-found-text">
              หน้าที่คุณกำลังมองหาอาจถูกลบไปแล้วหรือไม่สามารถใช้งานได้ชั่วคราว
              </p>
              <Button as={Link} to={homeLink} variant="" className="btn-minimize">
                กลับไปยังหน้าหลัก
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default NotFoundPage