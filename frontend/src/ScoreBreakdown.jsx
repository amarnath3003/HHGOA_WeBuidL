import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ScoreBreakdown = () => {
  const factors = [
    { name: 'Wallet Balance', percentage: 30, color: '#a6e6ff' },
    { name: 'Transaction History', percentage: 25, color: '#b1c5ff' },
    { name: 'NFT Holdings', percentage: 20, color: '#cdbdff' },
    { name: 'Account Age', percentage: 15, color: '#14d1ff' },
    { name: 'Network Diversity', percentage: 10, color: '#7f72ff' },
  ];

  const generateMockData = () => {
    return Array.from({ length: 7 }, () => Math.floor(Math.random() * 50) + 50);
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#1f2020',
        titleColor: '#e4e2e1',
        bodyColor: '#c3c6d6',
        borderWidth: 1,
        borderColor: 'rgba(67, 70, 83, 0.25)'
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
        min: 0,
        max: 100,
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 0,
      },
    },
  };

  return (
    <section className="rounded-xl bg-surface-container-high p-5 ghost-border">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-bold tracking-tight">Score Breakdown</h2>
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant">Weighted Factors</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {factors.map((factor, index) => {
          const mockData = generateMockData();
          const chartData = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
              {
                data: mockData,
                borderColor: factor.color,
                backgroundColor: factor.color,
                fill: false,
              },
            ],
          };

          return (
            <article key={index} className="rounded-lg bg-surface-container-low p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium">{factor.name}</span>
                <span className="rounded-lg px-2 py-0.5 text-[11px] font-semibold bg-secondary-container/20 text-secondary">{factor.percentage}%</span>
              </div>
              <div style={{ height: '56px' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default ScoreBreakdown;
