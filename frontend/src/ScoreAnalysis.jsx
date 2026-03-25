import React from 'react';

const ScoreAnalysis = ({ score }) => {
  const averageScore = 720;
  const delta = score - averageScore;
  const percentile = Math.max(1, Math.min(99, Math.round(((score - 300) / 550) * 100)));

  const insights = [
    {
      factor: 'Wallet Balance',
      impact: 'High',
      suggestion: 'Maintain a stable balance to improve your score.',
      icon: 'account_balance_wallet',
      colorClass: 'text-error',
    },
    {
      factor: 'Transaction History',
      impact: 'Medium',
      suggestion: 'Increase your transaction frequency for a better score.',
      icon: 'history',
      colorClass: 'text-tertiary',
    },
    {
      factor: 'NFT Holdings',
      impact: 'Low',
      suggestion: 'Diversify your NFT portfolio to potentially boost your score.',
      icon: 'token',
      colorClass: 'text-secondary',
    },
  ];

  const benchmarkLadder = [
    { label: 'Top 10%', value: 790 },
    { label: 'Top 25%', value: 760 },
    { label: 'Median', value: 705 },
    { label: 'Bottom 25%', value: 640 },
  ];

  const deltaTextClass = delta >= 0 ? 'text-secondary' : 'text-error';

  return (
    <section className="relative tonal-panel glass-panel ghost-outline p-6 md:p-8 overflow-hidden">
      <div className="absolute top-0 right-0 w-72 h-72 bg-tertiary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-tertiary text-sm">psychology</span>
            <p className="section-kicker">Score Analysis</p>
          </div>
          <h3 className="editorial-heading">Peer & Risk Intelligence</h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low">
          <span className="material-symbols-outlined text-[14px] text-tertiary">compare_arrows</span>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-on-surface-variant">Comparative Engine</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10 mb-10">
        <div className="rounded-xl bg-surface-container-low p-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant mb-2">Percentile Rank</p>
          <div className="flex items-baseline gap-1">
            <p className="text-4xl font-semibold tracking-tight text-on-surface">{percentile}</p>
            <span className="text-sm font-bold text-tertiary">%</span>
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-low p-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant mb-2">Peer Delta</p>
          <p className={`text-4xl font-semibold tracking-tight ${deltaTextClass}`}>{delta >= 0 ? `+${delta}` : delta}</p>
          <p className="text-xs text-on-surface-variant mt-3">Vs avg wallet score ({averageScore})</p>
        </div>

        <div className="rounded-xl bg-surface-container-low p-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant mb-2">Risk Regime</p>
          <p className="text-3xl font-semibold tracking-tight text-on-surface">Stable</p>
          <p className="text-xs text-on-surface-variant mt-3">Predictive drift remains low.</p>
        </div>
      </div>

      <div className="relative z-10 mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-on-surface-variant text-sm">lightbulb</span>
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/80">Factor Insights</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {insights.map((insight) => (
            <div key={insight.factor} className="rounded-xl bg-surface-container-low p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className={`material-symbols-outlined text-[20px] ${insight.colorClass}`}>{insight.icon}</span>
                <h4 className="text-base font-bold text-on-surface/90">{insight.factor}</h4>
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${insight.colorClass}`}>Impact: {insight.impact}</p>
              <p className="text-xs text-on-surface-variant leading-relaxed">{insight.suggestion}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 rounded-xl bg-surface-container-high p-6 sm:p-8">
        <div className="grid grid-cols-2 gap-4 md:gap-8 mb-8">
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-surface-container-low">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant/80 mb-3">Your Score</span>
            <span className="text-5xl md:text-7xl font-black tracking-tighter ai-shimmer">{score}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-surface-container-low">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant/80 mb-3">Network Avg</span>
            <span className="text-on-surface-variant text-5xl md:text-7xl font-black tracking-tighter">{averageScore}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {benchmarkLadder.map((tier) => (
            <div key={tier.label} className="flex flex-col items-center pt-4 bg-surface-container-low rounded-lg opacity-70 hover:opacity-100 transition-opacity">
              <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mb-1 text-center">{tier.label}</span>
              <span className="text-xs font-mono text-on-surface/50">{tier.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScoreAnalysis;
