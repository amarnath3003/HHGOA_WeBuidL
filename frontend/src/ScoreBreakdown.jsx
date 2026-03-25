import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const fallbackFactors = [
  { name: 'Wallet Balance', percentage: 30, color: '#b1c5ff', glow: 'rgba(177, 197, 255, 0.35)', impact: 'Primary driver', icon: 'account_balance_wallet' },
  { name: 'Transaction History', percentage: 25, color: '#a6e6ff', glow: 'rgba(166, 230, 255, 0.3)', impact: 'Behavioral consistency', icon: 'history' },
  { name: 'NFT Holdings', percentage: 20, color: '#cdbdff', glow: 'rgba(205, 189, 255, 0.3)', impact: 'Asset credibility', icon: 'token' },
  { name: 'Account Age', percentage: 15, color: '#b1c5ff', glow: 'rgba(177, 197, 255, 0.3)', impact: 'Longevity signal', icon: 'hourglass_empty' },
  { name: 'Network Diversity', percentage: 10, color: '#a6e6ff', glow: 'rgba(166, 230, 255, 0.3)', impact: 'Cross-chain resilience', icon: 'lan' },
];

const ScoreBreakdown = ({ factors = fallbackFactors }) => {
  const factorList = Array.isArray(factors) && factors.length > 0 ? factors : fallbackFactors;

  const generateMockData = () => {
    return Array.from({ length: 12 }, () => Math.floor(Math.random() * 40) + 60);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(31, 32, 32, 0.92)',
        titleColor: '#e4e2e1',
        bodyColor: '#c3c6d6',
        borderColor: 'rgba(67, 70, 83, 0.2)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context) => `Trend: ${context.parsed.y}`
        }
      },
    },
    scales: {
      x: { display: false },
      y: { display: false, min: 40, max: 110 },
    },
    elements: {
      line: { tension: 0.5, borderWidth: 2 },
      point: { radius: 0, hoverRadius: 4, hitRadius: 10 },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const topFactor = factorList[0];

  return (
    <section className="relative tonal-panel glass-panel ghost-outline p-6 md:p-8 overflow-hidden">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/15 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-tertiary text-sm">equalizer</span>
            <p className="section-kicker">Score Breakdown</p>
          </div>
          <h3 className="editorial-heading">Factor Matrix</h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-on-surface-variant">Weighted / Dynamic</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 md:mb-10 relative z-10 bg-surface-container-low rounded-xl p-5">
        <div className="group rounded-xl bg-surface-container-high p-5 transition-colors duration-300 hover:bg-surface-container-highest">
          <div className="relative h-full">
            <div className="flex items-center gap-2 mb-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-primary">star</span>
              <p className="text-[10px] font-mono uppercase tracking-widest">Top Factor</p>
            </div>
            <p className="text-lg font-semibold text-on-surface mb-1 group-hover:text-primary transition-colors">{topFactor.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{topFactor.percentage}%</span>
              <span className="text-xs text-on-surface-variant">Total Weight</span>
            </div>
          </div>
        </div>

        <div className="group rounded-xl bg-surface-container-high p-5 transition-colors duration-300 hover:bg-surface-container-highest">
          <div className="relative h-full">
            <div className="flex items-center gap-2 mb-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-tertiary">verified_user</span>
              <p className="text-[10px] font-mono uppercase tracking-widest">Model Confidence</p>
            </div>
            <p className="text-lg font-semibold text-on-surface mb-1 group-hover:text-tertiary transition-colors">High</p>
            <p className="text-xs text-on-surface-variant">Stable over 90 days</p>
          </div>
        </div>

        <div className="group rounded-xl bg-surface-container-high p-5 transition-colors duration-300 hover:bg-surface-container-highest">
          <div className="relative h-full">
            <div className="flex items-center gap-2 mb-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-secondary">trending_up</span>
              <p className="text-[10px] font-mono uppercase tracking-widest">Volatility</p>
            </div>
            <p className="text-lg font-semibold text-on-surface mb-1 group-hover:text-secondary transition-colors">Low</p>
            <p className="text-xs text-on-surface-variant">Predictive drift: <span className="text-secondary font-mono">1.9%</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 relative z-10">
        {factorList.map((factor, index) => {
          const mockData = generateMockData();
          
          const chartData = {
            labels: Array(12).fill(''),
            datasets: [
              {
                data: mockData,
                borderColor: factor.color,
                backgroundColor: (context) => {
                  const ctx = context.chart.ctx;
                  const gradient = ctx.createLinearGradient(0, 0, 0, 100);
                  gradient.addColorStop(0, factor.glow);
                  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                  return gradient;
                },
                fill: true,
              },
            ],
          };

          return (
            <article
              key={index}
              className="group rounded-xl overflow-hidden bg-surface-container-low hover:bg-surface-container transition-colors duration-300"
            >
              <div className="p-5 bg-surface-container-low">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center bg-surface-container-high"
                      style={{ color: factor.color }}
                    >
                      <span className="material-symbols-outlined text-[20px]">{factor.icon}</span>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-on-surface">{factor.name}</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">{factor.impact}</p>
                    </div>
                  </div>
                  <div
                    className="px-2.5 py-1 rounded-lg bg-surface-container-high"
                    style={{ color: factor.color }}
                  >
                    <span className="text-sm font-semibold">{factor.percentage}%</span>
                  </div>
                </div>

                <div className="relative h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${factor.percentage}%`,
                      background: 'linear-gradient(45deg, #b1c5ff, #cdbdff)'
                    }}
                  />
                </div>
              </div>

              <div className="h-[72px] w-full bg-surface-container-high p-3 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
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