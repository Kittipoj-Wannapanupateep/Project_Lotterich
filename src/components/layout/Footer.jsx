import { Container, Row, Col } from 'react-bootstrap'
import './Footer.css'

const Footer = () => {
  const year = new Date().getFullYear()
  
  return (
    <footer className="footer">
      <Container fluid>
        <Row>
          <Col>
            <p>&copy; {year} LotteRich. All rights reserved.</p>
          </Col>
        </Row>
      </Container>
    </footer>
  )
}

export default Footer