import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import Chart from 'chart.js/auto'
import { getCollection } from '../services/collectionService'
import { getLatestStatistics } from '../services/statisticsService'
import ChartDataLabels from 'chartjs-plugin-datalabels'

// ฟังก์ชันแปลงวันที่เป็นรูปแบบไทย เช่น 1 พ.ค. 2567
function formatThaiDate(dateStr) {
  if (!dateStr) return '';
  const months = [
    '', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  const day = parseInt(d, 10);
  const month = months[parseInt(m, 10)];
  const year = parseInt(y, 10) + 543;
  return `${day} ${month} ${year}`;
}

const AuthenticatedHome = () => {
  const { user } = useAuth()
  const chartRef = useRef(null)
  const navigate = useNavigate()
  const [latestTicket, setLatestTicket] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [collection, setCollection] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch collection data
        const collectionData = await getCollection()
        setCollection(collectionData || [])
        
        // Get latest ticket
        if (collectionData && collectionData.length > 0) {
          const sortedCollection = [...collectionData].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
          )
          setLatestTicket(sortedCollection[0])
        } else {
          setLatestTicket(null)
        }

        // Fetch latest statistics
        const latestStats = await getLatestStatistics()
        setStatistics(latestStats || null)

      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Failed to load data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (loading) return

    // Calculate weekly spending
    const weeklySpending = [0, 0, 0, 0]
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    if (collection && collection.length > 0) {
      collection.forEach(item => {
        const itemDate = new Date(item.date)
        if (itemDate >= firstDayOfMonth) {
          const weekNumber = Math.floor((itemDate.getDate() - 1) / 7)
          // If it's week 5, add to week 4's total
          const adjustedWeekNumber = weekNumber >= 4 ? 3 : weekNumber
          if (adjustedWeekNumber >= 0 && adjustedWeekNumber < 4) {
            const itemTotal = (item.ticketQuantity || 0) * (item.ticketAmount || 0)
            weeklySpending[adjustedWeekNumber] += itemTotal
          }
        }
      })
    }

    // Chart.js
    const chartCanvas = document.getElementById('monthlySpendingChart')
    if (chartCanvas && chartCanvas instanceof HTMLCanvasElement) {
      const ctx = chartCanvas.getContext('2d')
      if (ctx) {
        if (chartRef.current) {
          chartRef.current.destroy()
        }
        
        chartRef.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['สัปดาห์ที่ 1', 'สัปดาห์ที่ 2', 'สัปดาห์ที่ 3', 'สัปดาห์ที่ 4'],
            datasets: [{
              label: 'จำนวนเงินที่ใช้ซื้อสลาก (บาท)',
              data: weeklySpending,
              backgroundColor: 'rgba(255, 215, 0, 0.5)',
              borderColor: 'rgba(255, 215, 0, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
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
              legend: { labels: { color: '#FFD700' } },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `จำนวนเงิน: ${context.raw.toLocaleString()} บาท`;
                  }
                }
              },
              datalabels: {
                color: '#FFD700',
                anchor: 'end',
                align: 'top',
                formatter: function(value) {
                  return value.toLocaleString() + ' บาท';
                },
                font: {
                  weight: 'bold'
                }
              }
            }
          },
          plugins: [ChartDataLabels]
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
  }, [loading, collection])

  if (loading) {
    return (
      <div className="container-fluid d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-fluid d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    )
  }

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
              <div className="ticket-number">{latestTicket?.ticketNumber || 'ยังไม่มีข้อมูล'}</div>
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
                <h2 className="section-title">สรุปผลรางวัลงวดล่าสุด</h2>
                <div className="draw-date">งวดประจำวันที่ {statistics?.date ? formatThaiDate(statistics.date) : 'ยังไม่มีข้อมูล'}</div>
                <div className="prize-container">
                  <div className="main-prize">
                    <h3>รางวัลที่ 1</h3>
                    <div className="prize-number">{statistics?.prize1 || 'ยังไม่มีข้อมูล'}</div>
                  </div>
                  <div className="other-prizes">
                    <div className="prize-item">
                      <h4>สามตัวหน้า</h4>
                      <div className="prize-numbers">
                        {statistics?.first3_one || 'ยังไม่มีข้อมูล'} , {statistics?.first3_two || 'ยังไม่มีข้อมูล'}
                      </div>
                    </div>
                    <div className="prize-item">
                      <h4>สามตัวท้าย</h4>
                      <div className="prize-numbers">
                        {statistics?.last3_one || 'ยังไม่มีข้อมูล'} , {statistics?.last3_two || 'ยังไม่มีข้อมูล'}
                      </div>
                    </div>
                    <div className="prize-item">
                      <h4>สองตัวท้าย</h4>
                      <div className="prize-numbers">
                        <span>{statistics?.last2 || 'ยังไม่มีข้อมูล'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="telegram-notification fade-in-up">
                📢 รับการแจ้งเตือนผลรางวัลทุกครั้งที่มีการประกาศงวดใหม่ได้ที่
                <a
                  href="https://t.me/+QqcjNXNHLRxhNGJl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="telegram-link"
                >
                  กลุ่ม Telegram
                </a>
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
                  <div className="stat-number">
                    {collection.reduce((total, item) => total + (item.ticketQuantity || 0), 0)}
                  </div>
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