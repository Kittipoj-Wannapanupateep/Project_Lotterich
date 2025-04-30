import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import Chart from 'chart.js/auto'

const AuthenticatedHome = () => {
  const { user } = useAuth()
  const chartRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Chart.js
    const chartCanvas = document.getElementById('monthlySpendingChart')
    if (chartCanvas && chartCanvas instanceof HTMLCanvasElement) {
      const ctx = chartCanvas.getContext('2d')
      if (ctx) {
        chartRef.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['สัปดาห์ที่ 1', 'สัปดาห์ที่ 2', 'สัปดาห์ที่ 3', 'สัปดาห์ที่ 4'],
            datasets: [{
              label: 'จำนวนเงินที่ใช้ซื้อสลาก (บาท)',
              data: [80, 240, 0, 160],
              backgroundColor: 'rgba(255, 215, 0, 0.5)',
              borderColor: 'rgba(255, 215, 0, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: 'จำนวนเงิน (บาท)', color: '#ffffff' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#ffffff' }
              },
              x: {
                title: { display: true, text: 'สัปดาห์', color: '#ffffff' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#ffffff' }
              }
            },
            plugins: {
              legend: { labels: { color: '#FFD700' } }
            }
          }
        })
      }
    }
    // Scroll animations
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 }
    const observer = new window.IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          if (entry.target.classList.contains('home-section-1')) {
            const children = entry.target.querySelectorAll('.welcome-text, .latest-ticket-container')
            children.forEach((child, index) => {
              setTimeout(() => {
                child.classList.add('visible')
              }, index * 200)
            })
          }
        }
      })
    }, observerOptions)
    document.querySelectorAll('.home-section-1, .home-section-2, .home-section-3').forEach(section => {
      observer.observe(section)
    })
    document.querySelectorAll('.latest-results, .section-title, .draw-date, .prize-container').forEach(element => {
      observer.observe(element)
    })
    document.querySelectorAll('.prize-item').forEach(item => {
      observer.observe(item)
    })
    document.querySelectorAll('.chart-box, .stats-box').forEach(element => {
      observer.observe(element)
    })
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [])

  return (
    <div className="container-fluid">
      {/* Section 1: Welcome Back */}
      <section className="home-section-1">
        <div className="welcome-container">
          <div className="welcome-info">
            <div className="welcome-text">
              <h1 className="display-4 fw-bold">ยินดีต้อนรับกลับ</h1>
              <h1 className="display-4 fw-bold">คุณ {user?.name || user?.email || 'User'}</h1>
            </div>
          </div>
          <div className="latest-ticket-container">
            <div className="latest-ticket">
              <h3>เลขสลากล่าสุดที่บันทึก</h3>
              <div className="ticket-number">123456</div>
              <Link to="/collection">
                <button className="btn btn-primary mt-3">บันทึกเพิ่มทันที</button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* Section 2: Latest Results */}
      <section className="home-section-2">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="latest-results">
                <h2 className="section-title">สรุปผลรางวัลล่าสุด</h2>
                <div className="draw-date">งวดวันที่ 16/03/2024</div>
                <div className="prize-container">
                  <div className="main-prize">
                    <h3>รางวัลที่ 1</h3>
                    <div className="prize-number">123456</div>
                  </div>
                  <div className="other-prizes">
                    <div className="prize-item">
                      <h4>สามตัวหน้า</h4>
                      <div className="prize-numbers">123 , 456</div>
                    </div>
                    <div className="prize-item">
                      <h4>สามตัวท้าย</h4>
                      <div className="prize-numbers">123 , 456</div>
                    </div>
                    <div className="prize-item">
                      <h4>สองตัวท้าย</h4>
                      <div className="prize-numbers">
                        <span>12</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Section 3: Monthly Overview */}
      <section className="home-section-3">
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              <div className="chart-box">
                <h5 className="mb-3">รายจ่ายสำหรับเดือนนี้</h5>
                <div className="chart-container">
                  <canvas id="monthlySpendingChart"></canvas>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="stats-box">
                <div className="stat-item">
                  <h3>จำนวนสลากทั้งหมด</h3>
                  <div className="stat-number">50</div>
                </div>
                <Link to="/overview" className="btn btn-primary w-100">ดูภาพรวมของฉัน</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AuthenticatedHome