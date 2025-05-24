import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import '../styles/StatisticsPage.css';
import { getAllStatistics } from '../services/statisticsService';

const StatisticsPage = () => {
  const chartRef = useRef(null);
  const [statistics, setStatistics] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStat, setSelectedStat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [topNumbers, setTopNumbers] = useState([]);
  const [chart, setChart] = useState(null);
  const [searchNumber, setSearchNumber] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [checkCount, setCheckCount] = useState(0);
  const [checkError, setCheckError] = useState('');

  // Fetch all statistics on mount
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getAllStatistics();
        let stats = res;
        // If backend returns {data: [...]}, adjust here
        if (res && res.data) stats = res.data;
        if (!Array.isArray(stats)) stats = [];
        // Sort by date descending (latest first)
        stats.sort((a, b) => (b.date > a.date ? 1 : -1));
        setStatistics(stats);
        if (stats.length > 0) {
          setSelectedDate(stats[0].date);
          setSelectedStat(stats[0]);
        }
        // Calculate top 5 two-digit numbers from all statistics (เฉพาะ last2, ถ้าจำนวนครั้งเท่ากันให้งวดล่าสุดอยู่อันดับสูงกว่า)
        const twoDigitStats = {};
        stats.forEach(stat => {
          if (stat.last2 && /^\d{2}$/.test(stat.last2)) {
            if (!twoDigitStats[stat.last2]) {
              twoDigitStats[stat.last2] = { count: 0, latestDate: stat.date };
            }
            twoDigitStats[stat.last2].count += 1;
            // ถ้าเจอวันที่ใหม่กว่าให้เก็บไว้
            if (stat.date > twoDigitStats[stat.last2].latestDate) {
              twoDigitStats[stat.last2].latestDate = stat.date;
            }
          }
        });
        // Get top 5, sort by count desc, then by latestDate desc
        const top = Object.entries(twoDigitStats)
          .sort((a, b) => {
            if (b[1].count !== a[1].count) return b[1].count - a[1].count;
            if (b[1].latestDate > a[1].latestDate) return 1;
            if (b[1].latestDate < a[1].latestDate) return -1;
            return 0;
          })
          .slice(0, 5)
          .map(([number, obj]) => ({ number, count: obj.count }));
        setTopNumbers(top);
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Update selectedStat when selectedDate changes
  useEffect(() => {
    if (statistics.length > 0 && selectedDate) {
      const stat = statistics.find(s => s.date === selectedDate);
      setSelectedStat(stat || null);
    }
  }, [selectedDate, statistics]);

  // Draw chart for top 5 numbers
  useEffect(() => {
    if (!chartRef.current) return;
    if (chart) chart.destroy();
    if (topNumbers.length === 0) return;
    const ctx = chartRef.current.getContext('2d');
    const newChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: topNumbers.map(n => n.number),
        datasets: [{
          label: 'จำนวนครั้งที่ถูกรางวัล',
          data: topNumbers.map(n => n.count),
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
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#ffffff' }
          },
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#ffffff' }
          }
        },
        plugins: {
          legend: { labels: { color: '#ffffff' } }
        }
      }
    });
    setChart(newChart);
    return () => { newChart.destroy(); };
  }, [topNumbers]);

  // ตรวจสอบเลขเมื่อกดปุ่ม
  const handleCheckNumber = () => {
    setCheckError('');
    setCheckResult(null);
    setCheckCount(0);
    const num = searchNumber.trim();
    if (!/^\d{2,6}$/.test(num)) {
      setCheckError('กรุณากรอกเลข 2-6 หลักเท่านั้น');
      return;
    }
    const found = [];
    const foundSet = new Set();
    statistics.forEach(stat => {
      // --- รางวัลที่ 1 ---
      if (num.length === 6 && stat.prize1) {
        if (stat.prize1 === num) {
          const key = `prize1|${stat.date}|${stat.prize1}`;
          if (!foundSet.has(key)) {
            found.push({ type: 'รางวัลที่ 1', date: stat.date, value: stat.prize1 });
            foundSet.add(key);
          }
        } else {
          // ใกล้เคียงรางวัลที่ 1 (ต่างกัน 1)
          const n = parseInt(num, 10);
          const p = parseInt(stat.prize1, 10);
          if (!isNaN(n) && !isNaN(p) && Math.abs(n - p) === 1) {
            const key = `prize1near|${stat.date}|${stat.prize1}`;
            if (!foundSet.has(key)) {
              found.push({ type: 'ใกล้เคียงรางวัลที่ 1', date: stat.date, value: stat.prize1 });
              foundSet.add(key);
            }
          }
        }
      }
      // --- สามตัวหน้า ---
      if (num.length >= 3) {
        const first3 = num.slice(0, 3);
        if (stat.first3_one && stat.first3_one === first3) {
          const key = `first3_one|${stat.date}|${stat.first3_one}`;
          if (!foundSet.has(key)) {
            found.push({ type: 'สามตัวหน้า', date: stat.date, value: stat.first3_one });
            foundSet.add(key);
          }
        }
        if (stat.first3_two && stat.first3_two === first3) {
          const key = `first3_two|${stat.date}|${stat.first3_two}`;
          if (!foundSet.has(key)) {
            found.push({ type: 'สามตัวหน้า', date: stat.date, value: stat.first3_two });
            foundSet.add(key);
          }
        }
      }
      // --- สามตัวท้าย ---
      if (num.length >= 3) {
        const last3 = num.slice(-3);
        if (stat.last3_one && stat.last3_one === last3) {
          const key = `last3_one|${stat.date}|${stat.last3_one}`;
          if (!foundSet.has(key)) {
            found.push({ type: 'สามตัวท้าย', date: stat.date, value: stat.last3_one });
            foundSet.add(key);
          }
        }
        if (stat.last3_two && stat.last3_two === last3) {
          const key = `last3_two|${stat.date}|${stat.last3_two}`;
          if (!foundSet.has(key)) {
            found.push({ type: 'สามตัวท้าย', date: stat.date, value: stat.last3_two });
            foundSet.add(key);
          }
        }
      }
      // --- สองตัวท้าย ---
      if (num.length >= 2) {
        const last2 = num.slice(-2);
        if (stat.last2 && stat.last2 === last2) {
          const key = `last2|${stat.date}|${stat.last2}`;
          if (!foundSet.has(key)) {
            found.push({ type: 'สองตัวท้าย', date: stat.date, value: stat.last2 });
            foundSet.add(key);
          }
        }
      }
      // --- ตรวจสอบเลขย่อยกรณีเลข 4-5 หลัก ---
      if (num.length === 4) {
        // สามตัวหน้า: 3 ตัวแรก
        const first3 = num.slice(0, 3);
        if (stat.first3_one && stat.first3_one === first3) {
          const key = `first3_one|${stat.date}|${stat.first3_one}`;
          if (!foundSet.has(key)) {
            found.push({ type: 'สามตัวหน้า', date: stat.date, value: stat.first3_one });
            foundSet.add(key);
          }
        }
        if (stat.first3_two && stat.first3_two === first3) {
          const key = `first3_two|${stat.date}|${stat.first3_two}`;
          if (!foundSet.has(key)) {
            found.push({ type: 'สามตัวหน้า', date: stat.date, value: stat.first3_two });
            foundSet.add(key);
          }
        }
        // สามตัวท้าย: 3 ตัวหลัง
        const last3 = num.slice(1, 4);
        if (stat.last3_one && stat.last3_one === last3) {
          const key = `last3_one|${stat.date}|${stat.last3_one}`;
          if (!foundSet.has(key)) {
            found.push({ type: 'สามตัวท้าย', date: stat.date, value: stat.last3_one });
            foundSet.add(key);
          }
        }
        if (stat.last3_two && stat.last3_two === last3) {
          const key = `last3_two|${stat.date}|${stat.last3_two}`;
          if (!foundSet.has(key)) {
            found.push({ type: 'สามตัวท้าย', date: stat.date, value: stat.last3_two });
            foundSet.add(key);
          }
        }
        // สองตัวท้าย: 2 ตัวหลัง
        const last2 = num.slice(2, 4);
        if (stat.last2 && stat.last2 === last2) {
          const key = `last2|${stat.date}|${stat.last2}`;
          if (!foundSet.has(key)) {
            found.push({ type: 'สองตัวท้าย', date: stat.date, value: stat.last2 });
            foundSet.add(key);
          }
        }
      }
      if (num.length === 5) {
        // สามตัวหน้า: 3 ตัวแรก
        const first3 = num.slice(0, 3);
        if (stat.first3_one && stat.first3_one === first3) {
          const key = `first3_one|${stat.date}|${stat.first3_one}`;
          if (!foundSet.has(key)) {
            found.push({ type: 'สามตัวหน้า', date: stat.date, value: stat.first3_one });
            foundSet.add(key);
          }
        }
        if (stat.first3_two && stat.first3_two === first3) {
          const key = `first3_two|${stat.date}|${stat.first3_two}`;
          if (!foundSet.has(key)) {
            found.push({ type: 'สามตัวหน้า', date: stat.date, value: stat.first3_two });
            foundSet.add(key);
          }
        }
        // สามตัวท้าย: 3 ตัวหลัง
        const last3 = num.slice(2, 5);
        if (stat.last3_one && stat.last3_one === last3) {
          const key = `last3_one|${stat.date}|${stat.last3_one}`;
          if (!foundSet.has(key)) {
            found.push({ type: 'สามตัวท้าย', date: stat.date, value: stat.last3_one });
            foundSet.add(key);
          }
        }
        if (stat.last3_two && stat.last3_two === last3) {
          const key = `last3_two|${stat.date}|${stat.last3_two}`;
          if (!foundSet.has(key)) {
            found.push({ type: 'สามตัวท้าย', date: stat.date, value: stat.last3_two });
            foundSet.add(key);
          }
        }
        // สองตัวท้าย: 2 ตัวหลัง
        const last2 = num.slice(3, 5);
        if (stat.last2 && stat.last2 === last2) {
          const key = `last2|${stat.date}|${stat.last2}`;
          if (!foundSet.has(key)) {
            found.push({ type: 'สองตัวท้าย', date: stat.date, value: stat.last2 });
            foundSet.add(key);
          }
        }
      }
    });
    // เรียงจากงวดล่าสุดไปเก่าสุด
    found.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
    setCheckResult(found);
    setCheckCount(found.length);
  };

  if (loading) {
    return <div className="d-flex justify-content-center p-5">Loading...</div>;
  }
  if (error) {
    return <div className="alert alert-danger text-center mt-5">{error}</div>;
  }

  return (
    <div className="container-fluid">
      {/* Section 1: Latest Results */}
      <section className="statistics-section-1">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="latest-results visible">
                <div className="section-header">
                  <h2 className="section-title visible">สรุปผลรางวัลในแต่ละงวด</h2>
                  <div className="draw-selector">
                    <select 
                      className="form-select" 
                      id="drawDate" 
                      value={selectedDate} 
                      onChange={e => setSelectedDate(e.target.value)}
                    >
                      {statistics.map(stat => (
                        <option key={stat.date} value={stat.date}>
                          งวดวันที่ {stat.date}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {selectedStat ? (
                  <div className="prize-container visible">
                    <div className="main-prize">
                      <h3>รางวัลที่ 1</h3>
                      <div className="prize-number">{selectedStat.prize1 || '-'}</div>
                    </div>
                    <div className="other-prizes">
                      <div className="prize-item">
                        <h4>สามตัวหน้า</h4>
                        <div className="prize-numbers">{selectedStat.first3_one || '-'} , {selectedStat.first3_two || '-'}</div>
                      </div>
                      <div className="prize-item">
                        <h4>สามตัวท้าย</h4>
                        <div className="prize-numbers">{selectedStat.last3_one || '-'} , {selectedStat.last3_two || '-'}</div>
                      </div>
                      <div className="prize-item">
                        <h4>สองตัวท้าย</h4>
                        <div className="prize-numbers">
                          <span>{selectedStat.last2 || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted">ไม่พบข้อมูลรางวัลสำหรับงวดนี้</div>
                )}
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
                <h2 className="section-title visible">Top 5 เลขสองตัวท้ายที่ถูกรางวัลบ่อย</h2>
                <div className="top-numbers-list">
                  {topNumbers.map((item, idx) => (
                    <div className="number-item" key={item.number}>
                      <span className="rank">{idx + 1}.</span>
                      <span className="number">{item.number}</span>
                      <span className="count">ถูกรางวัลทั้งหมด {item.count} ครั้ง</span>
                    </div>
                  ))}
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
                      onChange={e => {
                        setSearchNumber(e.target.value.replace(/[^0-9]/g, ''));
                        setCheckResult(null);
                        setCheckError('');
                      }}
                    />
                    {checkError && (
                      <div className="error-message show" id="numberError">
                        {checkError}
                      </div>
                    )}
                  </div>
                  <button 
                    className="btn btn-primary w-100 mt-3"
                    onClick={handleCheckNumber}
                  >
                    ตรวจสอบ
                  </button>
                </div>
                {/* แสดงผลเฉพาะเมื่อมีการตรวจสอบแล้ว */}
                {checkResult !== null && (
                  <div className="result-container mt-4">
                    <div className="result-box">
                      <h4>ผลการตรวจสอบ</h4>
                      {checkResult.length > 0 ? (
                        <>
                          <p>เลข {searchNumber} เคยถูกรางวัลทั้งหมด {checkCount} ครั้ง</p>
                          <div className="winning-dates">
                            <p>ประวัติการถูกรางวัล:</p>
                            <ul>
                              {checkResult.map((item, idx) => (
                                <li key={idx}>
                                  งวดวันที่ {item.date} ถูกรางวัล{item.type}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      ) : (
                        <p>ไม่พบการถูกรางวัลสำหรับเลข {searchNumber}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StatisticsPage;
