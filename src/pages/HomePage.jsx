import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'

const HomePage = () => {
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    // Card rotation functionality
    const cards = document.querySelectorAll('.card')
    let currentIndex = 0

    function rotateCards() {
      cards.forEach(card => {
        card.classList.remove('card-1', 'card-2', 'card-3')
      })
      cards.forEach((card, index) => {
        const newPosition = (index + currentIndex) % 3
        card.classList.add(`card-${newPosition + 1}`)
      })
      currentIndex = (currentIndex + 1) % 3
    }

    cards.forEach(card => {
      card.addEventListener('click', rotateCards)
    })
    rotateCards()

    // Scroll animations (restore for all sections)
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, observerOptions)

    // Observe all sections
    document.querySelectorAll('.home-section-1, .home-section-2, .features-overview').forEach(section => {
      observer.observe(section)
    })
    // Observe welcome text and image
    document.querySelectorAll('.welcome-text, .welcome-image-container').forEach(element => {
      observer.observe(element)
    })
    // Observe feature items
    document.querySelectorAll('.feature-item').forEach(item => {
      observer.observe(item)
    })

    return () => {
      cards.forEach(card => {
        card.removeEventListener('click', rotateCards)
      })
    }
  }, [])

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  return (
    <div className="container-fluid">
      {/* Section 1: Welcome (restore fade-in) */}
      <section className="home-section-1 fade-in">
        <div className="welcome-container">
          <div className="welcome-card">
            <div className="welcome-info">
              <div className="welcome-text">
                <h1 className="display-4 fw-bold">ยินดีต้อนรับสู่</h1>
                <h1 className="display-4 fw-bold">เว็บไซต์ LotteRich</h1>
                <p className="lead">ประตูสู่ประสบการณ์ระดับพรีเมียม</p>
                <p className="welcome-description"></p>
                <Link to="/login">
                  <button className="btn btn-minimize">เริ่มต้นใช้งานทันที!</button>
                </Link>
              </div>
            </div>
            <div className="welcome-image-container">
              <img src="/Image/เริ่มแนะนำเว็ป.jpg" alt="Welcome Image" className="welcome-image" />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Features */}
      <section className="home-section-2 fade-in">
        <div className="row align-items-center">
          <div className="col-md-6 d-flex justify-content-center align-items-center">
            <div className="stacked-cards">
              <div className="card card-1">
                <img src="/Image/แนะนำ1.jpg" alt="Feature 1" className="card-image" />
              </div>
              <div className="card card-2">
                <img src="/Image/แนะนำ2.jpg" alt="Feature 2" className="card-image" />
              </div>
              <div className="card card-3">
                <img src="/Image/แนะนำ3.jpg" alt="Feature 3" className="card-image" />
              </div>
            </div>
          </div>
          <div className="col-md-6 text-md-start text-center">
            <h2 className="display-5 fw-bold mb-4">จัดการสลากด้วยตัวคุณเอง</h2>
            <p className="lead mb-4">สัมผัสประสบการณ์การจัดการสลากลอตเตอรี่ล่าสุดที่ออกแบบมาเพื่อคุณ</p>
            <Link to="/login">
              <button className="btn btn-close-app">ลองทันที</button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 3: Features Overview */}
      <section className="features-overview fade-in">
        <h2 className="text-center mb-5">Feature ของเว็บ</h2>
        <div className="row">
          <div className="col-md-3 feature-item">
            <div className="feature-icon">
              <i className="fas fa-ticket-alt fa-2x"></i>
            </div>
            <h3>Collection</h3>
            <p>จัดการและจัดระเบียบสลากลอตเตอรี่ของคุณ</p>
          </div>
          <div className="col-md-3 feature-item">
            <div className="feature-icon">
              <i className="fas fa-chart-pie fa-2x"></i>
            </div>
            <h3>Overview</h3>
            <p>ดูภาพรวมทั้งหมดของ Collection สลากลอตเตอรี่ของคุณ</p>
          </div>
          <div className="col-md-3 feature-item">
            <div className="feature-icon">
              <i className="fas fa-chart-line fa-2x"></i>
            </div>
            <h3>Statistics</h3>
            <p>รายละเอียดสถิติการออกรางวัลของสลากลอตเตอรี่</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage