import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ScoreBreakdown = () => {
  const factors = [
    { name: 'Wallet Balance', percentage: 30, color: '#a6e6ff', impact: 'Primary driver' },
    { name: 'Transaction History', percentage: 25, color: '#b1c5ff', impact: 'Behavioral consistency' },
    { name: 'NFT Holdings', percentage: 20, color: '#cdbdff', impact: 'Asset credibility' },
    { name: 'Account Age', percentage: 15, color: '#14d1ff', impact: 'Longevity signal' },
    { name: 'Network Diversity', percentage: 10, color: '#7f72ff', impact: 'Cross-chain resilience' },
  ];

  const generateMockData = () => {
    return Array.from({ length: 7 }, () => Math.floor(Math.random() * 50) + 50);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
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

  const topFactor = factors[0];

  return (
    <section className="rounded-xl bg-surface-container-high p-6 md:p-7 ghost-border">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-on-surface-variant">Score Breakdown</p>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">Factor Contribution Matrix</h3>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-tertiary">Weighted / Dynamic</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg bg-surface-container-low p-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-on-surface-variant">Top Factor</p>
          <p className="text-base font-semibold mt-2">{topFactor.name}</p>
          <p className="text-sm text-tertiary mt-1">{topFactor.percentage}% weight</p>
        </div>
        <div className="rounded-lg bg-surface-container-low p-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-on-surface-variant">Model Confidence</p>
          <p className="text-base font-semibold mt-2">High</p>
          <p className="text-sm text-secondary mt-1">Stable over 90 days</p>
        </div>
        <div className="rounded-lg bg-surface-container-low p-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-on-surface-variant">Volatility</p>
          <p className="text-base font-semibold mt-2">Low</p>
          <p className="text-sm text-primary mt-1">Predictive drift: 1.9%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <article key={index} className="rounded-lg bg-surface-container-low p-5">
              <div className="flex justify-between items-start gap-2 mb-3">
                <div>
                  <span className="text-base font-medium leading-tight">{factor.name}</span>
                  <p className="text-sm text-on-surface-variant mt-1">{factor.impact}</p>
                </div>
                <span className="rounded-lg px-2.5 py-1 text-xs font-semibold bg-secondary-container/20 text-secondary">{factor.percentage}%</span>
              </div>

              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full" style={{ width: `${factor.percentage}%`, backgroundColor: factor.color }}></div>
              </div>

              <div style={{ height: '72px' }}>
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
