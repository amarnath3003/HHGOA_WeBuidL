import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const ScoreBreakdown = () => {
  const factors = [
    { name: 'Wallet Balance', percentage: 30, color: '#a6e6ff', glow: 'rgba(166, 230, 255, 0.4)', impact: 'Primary driver', icon: 'account_balance_wallet' },
    { name: 'Transaction History', percentage: 25, color: '#b1c5ff', glow: 'rgba(177, 197, 255, 0.4)', impact: 'Behavioral consistency', icon: 'history' },
    { name: 'NFT Holdings', percentage: 20, color: '#cdbdff', glow: 'rgba(205, 189, 255, 0.4)', impact: 'Asset credibility', icon: 'token' },
    { name: 'Account Age', percentage: 15, color: '#14d1ff', glow: 'rgba(20, 209, 255, 0.4)', impact: 'Longevity signal', icon: 'hourglass_empty' },
    { name: 'Network Diversity', percentage: 10, color: '#7f72ff', glow: 'rgba(127, 114, 255, 0.4)', impact: 'Cross-chain resilience', icon: 'lan' },
  ];

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
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.1)',
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

  const topFactor = factors[0];

  return (
    <section className="relative rounded-2xl bg-[#0f1115]/80 backdrop-blur-xl border border-white/10 p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#cdbdff]/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-sm">equalizer</span>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary/80">Score Breakdown</p>
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Factor Matrix
          </h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/70">Weighted / Dynamic</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 relative z-10">
        <div className="group relative rounded-xl bg-gradient-to-br from-white/[0.08] to-transparent p-[1px] overflow-hidden transition-transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-[#a6e6ff]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full rounded-xl bg-[#13151a]/90 backdrop-blur-sm p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-3 text-white/50">
              <span className="material-symbols-outlined text-[18px] text-[#a6e6ff]">star</span>
              <p className="text-[10px] font-mono uppercase tracking-widest">Top Factor</p>
            </div>
            <p className="text-lg font-bold text-white mb-1 group-hover:text-[#a6e6ff] transition-colors">{topFactor.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#a6e6ff] bg-[#a6e6ff]/10 px-2 py-0.5 rounded">{topFactor.percentage}%</span>
              <span className="text-xs text-white/40">Total Weight</span>
            </div>
          </div>
        </div>

        <div className="group relative rounded-xl bg-gradient-to-br from-white/[0.08] to-transparent p-[1px] overflow-hidden transition-transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-[#cdbdff]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full rounded-xl bg-[#13151a]/90 backdrop-blur-sm p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-3 text-white/50">
              <span className="material-symbols-outlined text-[18px] text-[#cdbdff]">verified_user</span>
              <p className="text-[10px] font-mono uppercase tracking-widest">Model Confidence</p>
            </div>
            <p className="text-lg font-bold text-white mb-1 group-hover:text-[#cdbdff] transition-colors">High</p>
            <p className="text-xs text-white/50">Stable over 90 days</p>
          </div>
        </div>

        <div className="group relative rounded-xl bg-gradient-to-br from-white/[0.08] to-transparent p-[1px] overflow-hidden transition-transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full rounded-xl bg-[#13151a]/90 backdrop-blur-sm p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-3 text-white/50">
              <span className="material-symbols-outlined text-[18px] text-green-400">trending_up</span>
              <p className="text-[10px] font-mono uppercase tracking-widest">Volatility</p>
            </div>
            <p className="text-lg font-bold text-white mb-1 group-hover:text-green-400 transition-colors">Low</p>
            <p className="text-xs text-white/50">Predictive drift: <span className="text-green-400/80 font-mono">1.9%</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 relative z-10">
        {factors.map((factor, index) => {
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
              className="group flex flex-col justify-between rounded-xl bg-[#171920]/60 p-5 border border-white/[0.04] hover:bg-[#1a1c24]/80 hover:border-white/10 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-300"
                    style={{ color: factor.color, boxShadow: `0 0 20px -5px ${factor.glow}` }}
                  >
                    <span className="material-symbols-outlined text-[20px]">{factor.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-white/90 group-hover:text-white transition-colors">{factor.name}</h4>
                    <p className="text-xs text-white/40 mt-0.5">{factor.impact}</p>
                  </div>
                </div>
                <div 
                  className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 backdrop-blur-sm"
                  style={{ color: factor.color }}
                >
                  <span className="text-sm font-bold">{factor.percentage}%</span>
                </div>
              </div>

              <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-5">
                <div 
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out origin-left group-hover:scale-x-[1.02]"
                  style={{ 
                    width: `${factor.percentage}%`, 
                    backgroundColor: factor.color,
                    boxShadow: `0 0 10px ${factor.color}` 
                  }}
                />
              </div>

              <div className="h-[60px] w-full mt-auto opacity-70 group-hover:opacity-100 transition-opacity duration-300">
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
