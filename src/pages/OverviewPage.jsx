import React, { useEffect, useState, useRef } from 'react';
import { getCollection } from '../services/collectionService';
import Chart from 'chart.js/auto';
import '../styles/OverviewPage.css';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const OverviewPage = () => {
    const [stats, setStats] = useState({
        totalTickets: 0,
        totalSpent: 0,
        totalWins: 0,
        totalPrize: 0,
        netProfit: 0,
        lastWinningNumber: '-',
        winPercent: 0,
        losePercent: 0
    });
    const [monthlySpending, setMonthlySpending] = useState({ labels: [], data: [] });
    const [loading, setLoading] = useState(true);
    const lineChartRef = useRef(null);
    const lineChartInstance = useRef(null);
    const donutChart1Ref = useRef(null);
    const donutChart1Instance = useRef(null);
    const donutChart2Ref = useRef(null);
    const donutChart2Instance = useRef(null);
    const [donut1, setDonut1] = useState({ labels: [], data: [], colors: [] });
    const [hasCollection, setHasCollection] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const collection = await getCollection();
                setHasCollection(collection && collection.length > 0);
                let totalTickets = 0;
                let totalSpent = 0;
                let totalWins = 0;
                let totalPrize = 0;
                let lastWinning = null;
                let countWin = 0;
                let countLose = 0;
                let countValid = 0;

                // --- Monthly Spending Calculation ---
                const now = new Date();
                const months = [];
                const spendingMap = {};
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const key = `${d.getFullYear()}-${d.getMonth()}`;
                    months.push({
                        label: monthNames[d.getMonth()],
                        key,
                    });
                    spendingMap[key] = 0;
                }
                if (!collection || collection.length === 0) {
                    setMonthlySpending({
                        labels: months.map(m => m.label),
                        data: months.map(() => 0)
                    });
                    setStats({
                        totalTickets: 0,
                        totalSpent: 0,
                        totalWins: 0,
                        totalPrize: 0,
                        netProfit: 0,
                        lastWinningNumber: '-',
                        winPercent: 0,
                        losePercent: 0
                    });
                    setDonut1({ labels: [], data: [], colors: [] });
                    setLoading(false);
                    return;
                }
                collection.forEach(item => {
                    totalTickets += item.ticketQuantity;
                    totalSpent += item.ticketQuantity * item.ticketAmount;
                    // Monthly spending
                    const d = new Date(item.date);
                    const key = `${d.getFullYear()}-${d.getMonth()}`;
                    if (spendingMap[key] !== undefined) {
                        spendingMap[key] += item.ticketQuantity * item.ticketAmount;
                    }
                    if (item.prizeResult === 'yes') {
                        totalWins += 1;
                        totalPrize += item.prizeAmount * item.ticketQuantity;
                        if (!lastWinning || new Date(item.date) > new Date(lastWinning.date)) {
                            lastWinning = item;
                        }
                        countWin += 1;
                        countValid += 1;
                    } else if (item.prizeResult === 'no') {
                        countLose += 1;
                        countValid += 1;
                    }
                });
                const winPercent = countValid > 0 ? (countWin / countValid) * 100 : 0;
                const losePercent = countValid > 0 ? (countLose / countValid) * 100 : 0;
                setStats({
                    totalTickets,
                    totalSpent,
                    totalWins,
                    totalPrize,
                    netProfit: totalPrize - totalSpent,
                    lastWinningNumber: lastWinning ? lastWinning.ticketNumber : '-',
                    winPercent,
                    losePercent
                });
                setMonthlySpending({
                    labels: months.map(m => m.label),
                    data: months.map(m => spendingMap[m.key] || 0)
                });

                // --- Donut Chart 1 Calculation ---
                let donutLabels = [];
                let donutData = [];
                let donutColors = [];
                if (totalPrize >= totalSpent && totalPrize > 0) {
                    // กำไร
                    const profit = totalPrize - totalSpent;
                    const profitPercent = (profit / totalPrize) * 100;
                    const costPercent = (totalSpent / totalPrize) * 100;
                    donutLabels = ['กำไร', 'ต้นทุน'];
                    donutData = [profitPercent, costPercent];
                    donutColors = ['#ffd700', '#888'];
                } else if (totalSpent > 0) {
                    // ขาดทุน
                    const loss = totalSpent - totalPrize;
                    const lossPercent = (loss / totalSpent) * 100;
                    const revenuePercent = (totalPrize / totalSpent) * 100;
                    donutLabels = ['ขาดทุน', 'รายรับ'];
                    donutData = [lossPercent, revenuePercent];
                    donutColors = ['#FF4444', '#888'];
                } else {
                    donutLabels = ['ต้นทุน', 'รายรับ'];
                    donutData = [0, 0];
                    donutColors = ['#888', '#888'];
                }
                setDonut1({ labels: donutLabels, data: donutData, colors: donutColors });
            } catch (e) {
                // handle error
            }
            setLoading(false);
        };
        fetchStats();
    }, []);

    // Line Chart: Monthly Spending
    useEffect(() => {
        if (lineChartInstance.current) {
            lineChartInstance.current.destroy();
        }
        if (lineChartRef.current && monthlySpending.labels.length > 0) {
            lineChartInstance.current = new Chart(lineChartRef.current, {
                type: 'line',
                data: {
                    labels: monthlySpending.labels,
                    datasets: [{
                        label: 'รายจ่าย',
                        data: monthlySpending.data,
                        borderColor: '#ffd700',
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { ticks: { color: '#fff' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                        y: { min: 0, ticks: { color: '#fff' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: { color: '#fff' }
                        }
                    }
                }
            });
        }
        return () => {
            if (lineChartInstance.current) {
                lineChartInstance.current.destroy();
            }
        };
    }, [monthlySpending]);

    // Donut Chart 1: สัดส่วนรายได้จากเงินลงทุน
    useEffect(() => {
        if (donutChart1Instance.current) {
            donutChart1Instance.current.destroy();
        }
        if (donutChart1Ref.current && donut1.data.length > 0) {
            donutChart1Instance.current = new Chart(donutChart1Ref.current, {
                type: 'doughnut',
                data: {
                    labels: donut1.labels,
                    datasets: [{
                        data: donut1.data,
                        backgroundColor: donut1.colors
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: '#fff',
                                generateLabels: (chart) => {
                                    const data = chart.data;
                                    const dataset = data.datasets[0];
                                    const total = dataset.data.reduce((a, b) => a + b, 0);
                                    return data.labels.map((label, i) => {
                                        const value = dataset.data[i];
                                        const percent = total > 0 ? (value / total * 100).toFixed(1) : 0;
                                        return {
                                            text: `${label} ${percent}%`,
                                            fillStyle: dataset.backgroundColor[i],
                                            strokeStyle: dataset.backgroundColor[i],
                                            lineWidth: 1,
                                            hidden: false,
                                            index: i,
                                            fontColor: '#fff',
                                            color: '#fff'
                                        };
                                    });
                                }
                            }
                        }
                    }
                }
            });
        }
        return () => {
            if (donutChart1Instance.current) {
                donutChart1Instance.current.destroy();
            }
        };
    }, [donut1]);

    // Donut Chart 2: อัตราการถูกรางวัล
    useEffect(() => {
        if (donutChart2Instance.current) {
            donutChart2Instance.current.destroy();
        }
        if (donutChart2Ref.current && !loading) {
            donutChart2Instance.current = new Chart(donutChart2Ref.current, {
                type: 'doughnut',
                data: {
                    labels: ['ถูกรางวัล', 'ไม่ถูกรางวัล'],
                    datasets: [{
                        data: [stats.winPercent, stats.losePercent],
                        backgroundColor: ['#ffd700', '#FF4444']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: '#fff',
                                generateLabels: (chart) => {
                                    const data = chart.data;
                                    const dataset = data.datasets[0];
                                    const total = dataset.data.reduce((a, b) => a + b, 0);
                                    return data.labels.map((label, i) => {
                                        const value = dataset.data[i];
                                        const percent = total > 0 ? (value / total * 100).toFixed(1) : 0;
                                        return {
                                            text: `${label} ${percent}%`,
                                            fillStyle: dataset.backgroundColor[i],
                                            strokeStyle: dataset.backgroundColor[i],
                                            lineWidth: 1,
                                            hidden: false,
                                            index: i,
                                            fontColor: '#fff',
                                            color: '#fff'
                                        };
                                    });
                                }
                            }
                        }
                    }
                }
            });
        }
        return () => {
            if (donutChart2Instance.current) {
                donutChart2Instance.current.destroy();
            }
        };
    }, [stats.winPercent, stats.losePercent, loading]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="overview-page">
            <div className="container-fluid">
                {/* Section 1: Stat Boxes */}
                <section className="row mb-4" id="stat-boxes">
                    <div className="col-md-2 col-6 mb-3">
                        <div className="stat-box shadow-sm rounded text-center">
                            <h6 className="stat-title">จำนวนสลากทั้งหมดที่ซื้อ</h6>
                            <p className="stat-value">{stats.totalTickets} ใบ</p>
                        </div>
                    </div>
                    <div className="col-md-2 col-6 mb-3">
                        <div className="stat-box shadow-sm rounded text-center">
                            <h6 className="stat-title">รายจ่ายทั้งหมด</h6>
                            <p className="stat-value">฿{stats.totalSpent.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="col-md-2 col-6 mb-3">
                        <div className="stat-box shadow-sm rounded text-center">
                            <h6 className="stat-title">จำนวนการถูกรางวัล</h6>
                            <p className="stat-value">{stats.totalWins} ครั้ง</p>
                        </div>
                    </div>
                    <div className="col-md-2 col-6 mb-3">
                        <div className="stat-box shadow-sm rounded text-center">
                            <h6 className="stat-title">เงินรางวัลรวม</h6>
                            <p className="stat-value">฿{stats.totalPrize.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="col-md-2 col-6 mb-3">
                        <div className="stat-box shadow-sm rounded text-center">
                            <h6 className="stat-title">กำไร/ขาดทุนสุทธิ</h6>
                            <p className="stat-value">{stats.netProfit >= 0 ? '' : '-'}฿{Math.abs(stats.netProfit).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="col-md-2 col-6 mb-3">
                        <div className="stat-box shadow-sm rounded text-center">
                            <h6 className="stat-title">เลขล่าสุดที่ถูกรางวัล</h6>
                            <p className="stat-value">{stats.lastWinningNumber}</p>
                        </div>
                    </div>
                </section>

                {/* Section 2 & 3: Line Chart and Donut Charts */}
                <section className="row" id="charts-area">
                    {/* Line Chart */}
                    <div className={hasCollection ? "col-md-8" : "col-12"}>
                        <div className="chart-box shadow-sm rounded p-3">
                            <h5 className="mb-3">กราฟรายจ่ายต่อเดือนย้อนหลัง 6 เดือน</h5>
                            <div className="line-chart-container">
                                <canvas ref={lineChartRef}></canvas>
                            </div>
                        </div>
                    </div>

                    {/* Donut Charts */}
                    {hasCollection && (
                        <div className="col-md-4">
                            <div className="donut-chart-box shadow-sm rounded p-3 mb-4">
                                <h6 className="mb-3">สัดส่วนรายได้จากเงินลงทุน</h6>
                                <div className="donut-chart-container">
                                    <canvas ref={donutChart1Ref}></canvas>
                                </div>
                            </div>
                            <div className="donut-chart-box shadow-sm rounded p-3">
                                <h6 className="mb-3">อัตราการถูกรางวัล</h6>
                                <div className="donut-chart-container">
                                    <canvas ref={donutChart2Ref}></canvas>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default OverviewPage;
