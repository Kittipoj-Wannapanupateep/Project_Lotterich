import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import '../styles/StatisticsPage.css';

const StatisticsPage = () => {
  const chartRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState('16/03/2024');
  const [searchNumber, setSearchNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [chart, setChart] = useState(null);
  
  // Initialize chart when component mounts
  useEffect(() => {
    if (chartRef && chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      
      const newChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['12', '34', '56', '78', '90'],
          datasets: [{
            label: 'จำนวนครั้งที่ถูกรางวัล',
            data: [15, 12, 10, 8, 7],
            backgroundColor: '#FFD700',
            borderColor: '#FFD700',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              ticks: {
                color: '#ffffff'
              }
            },
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              ticks: {
                color: '#ffffff'
              }
            }
          },
          plugins: {
            legend: {
              labels: {
                color: '#ffffff'
              }
            }
          }
        }
      });
      
      setChart(newChart);
      
      // Cleanup function
      return () => {
        if (newChart) {
          newChart.destroy();
        }
      };
    }
  }, []);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    console.log('Selected date:', e.target.value);
  };

  const handleNumberInput = (e) => {
    // Only allow numeric input
    const value = e.target.value.replace(/[^0-9]/g, '');
    setSearchNumber(value);
    setErrorMessage('');
  };

  const handleCheckNumber = () => {
    if (searchNumber && /^\d{2,6}$/.test(searchNumber)) {
      console.log('Checking number:', searchNumber);
      setErrorMessage('');
    } else {
      setErrorMessage('กรุณากรอกเลข 2-6 หลักเท่านั้น');
    }
  };

  return (
    <div className="container-fluid">
      {/* Section 1: Latest Results */}
      <section className="statistics-section-1">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="latest-results visible">
                <div className="section-header">
                  <h2 className="section-title visible">สรุปผลรางวัลล่าสุด</h2>
                  <div className="draw-selector">
                    <select 
                      className="form-select" 
                      id="drawDate" 
                      value={selectedDate} 
                      onChange={handleDateChange}
                    >
                      <option value="16/03/2024">งวดวันที่ 16/03/2024</option>
                      <option value="01/03/2024">งวดวันที่ 01/03/2024</option>
                      <option value="16/02/2024">งวดวันที่ 16/02/2024</option>
                    </select>
                  </div>
                </div>
                <div className="prize-container visible">
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

      {/* Section 2: Top 5 Numbers */}
      <section className="statistics-section-2">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="top-numbers">
                <h2 className="section-title visible">Top 5 เลข 2 ตัวท้ายที่ถูกรางวัลบ่อย</h2>
                <div className="top-numbers-list">
                  <div className="number-item">
                    <span className="rank">1.</span>
                    <span className="number">12</span>
                    <span className="count">ถูกรางวัลทั้งหมด 15 ครั้ง</span>
                  </div>
                  <div className="number-item">
                    <span className="rank">2.</span>
                    <span className="number">34</span>
                    <span className="count">ถูกรางวัลทั้งหมด 12 ครั้ง</span>
                  </div>
                  <div className="number-item">
                    <span className="rank">3.</span>
                    <span className="number">56</span>
                    <span className="count">ถูกรางวัลทั้งหมด 10 ครั้ง</span>
                  </div>
                  <div className="number-item">
                    <span className="rank">4.</span>
                    <span className="number">78</span>
                    <span className="count">ถูกรางวัลทั้งหมด 8 ครั้ง</span>
                  </div>
                  <div className="number-item">
                    <span className="rank">5.</span>
                    <span className="number">90</span>
                    <span className="count">ถูกรางวัลทั้งหมด 7 ครั้ง</span>
                  </div>
                </div>
                <div className="chart-container">
                  <canvas ref={chartRef} id="topNumbersChart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Number Checker */}
      <section className="statistics-section-3">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="number-checker">
                <h2 className="section-title visible">ตรวจสอบประวัติเลขที่เคยถูกรางวัล</h2>
                <div className="checker-form">
                  <div className="form-group">
                    <label htmlFor="numberInput">กรอกเลขที่ต้องการตรวจสอบ (2-6 หลัก)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="numberInput" 
                      placeholder="กรอกเลข 2-6 หลัก" 
                      maxLength="6"
                      value={searchNumber}
                      onChange={handleNumberInput}
                    />
                    <div className={`error-message ${errorMessage ? 'show' : ''}`} id="numberError">
                      {errorMessage}
                    </div>
                  </div>
                  <button 
                    className="btn btn-primary w-100 mt-3" 
                    onClick={handleCheckNumber}
                  >
                    ตรวจสอบ
                  </button>
                </div>
                <div className="result-container mt-4">
                  <div className="result-box">
                    <h4>ผลการตรวจสอบ</h4>
                    <p>เลข 123456 ถูกรางวัลทั้งหมด 3 ครั้ง</p>
                    <div className="winning-dates">
                      <p>ประวัติการถูกรางวัล:</p>
                      <ul>
                        <li>เคยถูกรางวัลเลขสองตัวท้าย งวดวันที่ 16/03/2024</li>
                        <li>เคยถูกรางวัลเลขสามตัวท้าย งวดวันที่ 01/03/2024</li>
                        <li>เคยถูกรางวัลเลขสามตัวหน้า งวดวันที่ 16/02/2024</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StatisticsPage;
