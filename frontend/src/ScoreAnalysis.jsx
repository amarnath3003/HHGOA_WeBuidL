import React from 'react';

const ScoreAnalysis = ({ score }) => {
  const insights = [
    { factor: 'Wallet Balance', impact: 'High', suggestion: 'Maintain a stable balance to improve your score.', icon: '💰' },
    { factor: 'Transaction History', impact: 'Medium', suggestion: 'Increase your transaction frequency for a better score.', icon: '📊' },
    { factor: 'NFT Holdings', impact: 'Low', suggestion: 'Diversify your NFT portfolio to potentially boost your score.', icon: '🖼️' },
  ];

  const averageScore = 720;
  const delta = score - averageScore;
  const percentile = Math.max(1, Math.min(99, Math.round(((score - 300) / 550) * 100)));
  const benchmarkLadder = [
    { label: 'Top 10%', value: 790 },
    { label: 'Top 25%', value: 760 },
    { label: 'Median', value: 705 },
    { label: 'Bottom 25%', value: 640 },
  ];

  const getImpactBadge = (impact) => {
    if (impact === 'High') {
      return 'bg-error/20 text-error';
    }
    if (impact === 'Medium') {
      return 'bg-tertiary-container/20 text-tertiary';
    }
    return 'bg-secondary-container/20 text-secondary';
  };

  return (
    <section className="rounded-xl bg-surface-container-high p-6 md:p-7 ghost-border">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-on-surface-variant">Score Analysis</p>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">Peer & Risk Intelligence</h3>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-tertiary">Comparative Engine</span>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Percentile Rank */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-b from-surface-container-low to-surface-container p-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border border-white/5 cursor-default">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-tertiary-container/10 rounded-full blur-2xl group-hover:bg-tertiary-container/30 transition-colors duration-500"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-[14px]">leaderboard</span> Percentile Rank
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <p className="text-4xl font-extrabold tracking-tight ai-shimmer drop-shadow-sm">{percentile}</p>
                <span className="text-sm font-bold text-tertiary-fixed-dim">%</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-white/5 shadow-inner">
               <span className="material-symbols-outlined text-tertiary-fixed-dim" style={{fontVariationSettings: "'FILL' 1"}}>group</span>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant mt-3 relative z-10 font-medium tracking-wide">Top tier against wallet cohort</p>
        </div>

        {/* Peer Delta */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-b from-surface-container-low to-surface-container p-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border border-white/5 cursor-default">
          <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl transition-colors duration-500 ${delta >= 0 ? 'bg-secondary/10 group-hover:bg-secondary/20' : 'bg-error/10 group-hover:bg-error/20'}`}></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-[14px]">compare_arrows</span> Peer Delta
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <p className={`text-4xl font-extrabold tracking-tight drop-shadow-sm ${delta >= 0 ? 'text-secondary' : 'text-error'}`}>{delta >= 0 ? `+${delta}` : delta}</p>
              </div>
            </div>
             <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-white/5 shadow-inner">
               <span className={`material-symbols-outlined ${delta >= 0 ? 'text-secondary' : 'text-error'}`} style={{fontVariationSettings: "'FILL' 1"}}>{delta >= 0 ? 'trending_up' : 'trending_down'}</span>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant mt-3 relative z-10 font-medium tracking-wide">Vs average wallet score ({averageScore})</p>
        </div>

        {/* Risk Regime */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-b from-surface-container-low to-surface-container p-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border border-white/5 cursor-default">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors duration-500"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-[14px]">monitoring</span> Risk Regime
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <p className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">Stable</p>
              </div>
            </div>
             <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-white/5 shadow-inner">
               <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>shield</span>
            </div>
          </div>
          <div className="mt-4 relative z-10 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
               <div className="h-full bg-primary rounded-full w-[85%]"></div>
            </div>
            <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-[0.2em] whitespace-nowrap">Low Drift</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">Factor Insights</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 mt-3">
          {insights.map((insight, index) => (
            <article key={index} className="group bg-surface-container-low rounded-lg p-5 hover:bg-surface-container hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border border-transparent hover:border-white/5 cursor-default">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl leading-none group-hover:scale-110 transition-transform duration-300">{insight.icon}</span>
                <div className="text-lg font-semibold leading-tight group-hover:text-white transition-colors">{insight.factor}</div>
              </div>
              <div className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${getImpactBadge(insight.impact)}`}>
                  Impact: {insight.impact}
              </div>
              <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">{insight.suggestion}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">Peer Comparison</h3>
          <span className="px-2.5 py-1 rounded-full bg-surface-container-highest text-[10px] font-mono text-on-surface-variant uppercase tracking-widest border border-white/5">Global Network</span>
        </div>
        
        <div className="bg-gradient-to-b from-surface-container-low/80 to-surface-container-low/30 rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors duration-500">
          {/* Subtle noise/grid background */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50"></div>
          
          <div className="relative z-10">
            {/* Visual Header */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-surface-container-highest/50 backdrop-blur-md border border-white/5 shadow-inner hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(166,230,255,0.15)] transition-all duration-300">
                <span className="text-secondary text-5xl md:text-6xl font-black tracking-tighter drop-shadow-lg scale-100">{score}</span>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant mt-2 font-bold">Your Score</span>
              </div>
              <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-surface-container-highest/30 backdrop-blur-md border border-white/5 shadow-inner hover:-translate-y-1 transition-all duration-300">
                <span className="text-primary text-5xl md:text-6xl font-black tracking-tighter drop-shadow-lg opacity-80">{averageScore}</span>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant mt-2 font-bold">Network Avg</span>
              </div>
            </div>

            {/* Overlapping progress comparative layout */}
            <div className="space-y-6 mb-8 pt-2">
              <div className="relative group/bar cursor-default">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-2">
                  <span className="text-secondary flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(166,230,255,0.8)]"></span> You</span>
                  <span className="text-secondary font-mono">{score}</span>
                </div>
                <div className="h-3 bg-surface-container-highest rounded-full overflow-hidden shadow-inner group-hover/bar:bg-surface-container-highest/80 transition-colors">
                  <div className="h-full bg-gradient-to-r from-secondary-fixed-dim/50 to-secondary rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${(score / 850) * 100}%` }}>
                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 blur-[2px]"></div>
                  </div>
                </div>
              </div>

              <div className="relative group/bar cursor-default">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-2">
                   <span className="text-primary flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(177,197,255,0.8)] opacity-70"></span> Average</span>
                  <span className="text-primary font-mono">{averageScore}</span>
                </div>
                <div className="h-3 bg-surface-container-highest rounded-full overflow-hidden shadow-inner opacity-60 group-hover/bar:opacity-80 transition-opacity">
                  <div className="h-full bg-gradient-to-r from-primary-fixed-dim/50 to-primary rounded-full transition-all duration-1000 ease-out" style={{ width: `${(averageScore / 850) * 100}%` }}></div>
                </div>
              </div>
            </div>

            {/* Premium Benchmark Ladder */}
            <div className="pt-6 border-t border-white/5">
              <h4 className="text-[10px] font-mono uppercase tracking-[0.25em] text-on-surface-variant mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">format_list_numbered</span>
                Cohort Distribution
              </h4>
              <div className="space-y-2">
                {benchmarkLadder.map((row) => {
                  const isCurrentTier = score >= row.value;
                  return (
                    <div key={row.label} className={`group/row flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${isCurrentTier ? 'bg-secondary/5 border-secondary/20 hover:border-secondary/40 shadow-sm' : 'bg-transparent border-transparent hover:bg-surface-container/50 cursor-default'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-6 rounded-full transition-colors ${isCurrentTier ? 'bg-secondary shadow-[0_0_8px_rgba(166,230,255,0.5)]' : 'bg-surface-container-highest group-hover/row:bg-white/20'}`}></div>
                        <span className={`text-sm font-bold tracking-tight ${isCurrentTier ? 'text-on-surface' : 'text-on-surface-variant group-hover/row:text-on-surface transition-colors'}`}>{row.label}</span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:flex w-24 md:w-32 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${isCurrentTier ? 'bg-secondary' : 'bg-on-surface-variant/40'}`}
                            style={{ width: `${(row.value / 850) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center gap-2 w-16 justify-end">
                          <span className={`font-mono font-bold tracking-tight text-sm ${isCurrentTier ? 'text-secondary ai-shimmer drop-shadow-md' : 'text-on-surface-variant'}`}>{row.value}</span>
                          {isCurrentTier && <span className="material-symbols-outlined text-sm text-secondary animate-pulse-glow" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default ScoreAnalysis;
