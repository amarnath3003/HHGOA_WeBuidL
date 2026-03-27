import React from 'react';

const suggestionForFactor = (factorName) => {
  if (factorName === 'Wallet Balance') {
    return 'Maintain stable wallet reserves over time to strengthen this signal.';
  }
  if (factorName === 'Transaction History') {
    return 'Consistent on-chain activity improves transaction reliability signals.';
  }
  if (factorName === 'NFT Holdings') {
    return 'Sustained NFT ownership can improve asset-profile depth.';
  }
  if (factorName === 'Account Age') {
    return 'Account age improves naturally with sustained activity history.';
  }
  if (factorName === 'Network Diversity') {
    return 'Using multiple ecosystems can strengthen cross-network resilience.';
  }
  return 'Keep building consistent on-chain behavior to improve this factor.';
};

const ScoreAnalysis = ({ payload }) => {
  if (!payload) {
    return (
      <section className="relative rounded-2xl bg-surface-container/50 backdrop-blur-xl border border-white/10 p-6 md:p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden">
        <h3 className="text-2xl font-extrabold tracking-tight mb-2">Peer & Risk Intelligence</h3>
        <p className="text-sm text-on-surface-variant">No score analysis data is available yet.</p>
      </section>
    );
  }

  const score = Number(payload.score ?? 0);
  const averageScore = Number(payload.average_score ?? 0);
  const delta = Number(payload.peer_delta ?? score - averageScore);
  const percentile = Number(payload.percentile ?? 0);
  const riskRegime = payload.risk_regime || 'Unknown';
  const volatility = payload?.summary?.volatility_index;

  const factors = Array.isArray(payload.factors) ? payload.factors : [];
  const weakestFactors = [...factors]
    .sort((a, b) => (Number(a?.normalized_value) || 0) - (Number(b?.normalized_value) || 0))
    .slice(0, 3);

  const deltaTextClass = delta >= 0 ? 'text-tertiary' : 'text-error';

  return (
    <section className="relative rounded-2xl bg-surface-container/50 backdrop-blur-xl border border-white/10 p-6 md:p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden">
      <div className="absolute top-0 right-0 w-72 h-72 bg-tertiary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-tertiary text-sm">psychology</span>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-tertiary/80">Score Analysis</p>
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-on-surface to-on-surface/60 bg-clip-text text-transparent">
            Peer & Risk Intelligence
          </h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-outline-variant/15 bg-surface-container-high backdrop-blur-md">
          <span className="material-symbols-outlined text-[14px] text-tertiary">compare_arrows</span>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-on-surface-variant">Live Backend Metrics</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 relative z-10 mb-8 sm:mb-10">
        <div className="group relative rounded-xl bg-surface-container/50 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:border-white/20 p-4 sm:p-5 overflow-hidden cursor-default">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-tertiary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <div className="relative z-10">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant/80 mb-2 group-hover:text-tertiary/80 transition-colors">Percentile Rank</p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">{percentile}</p>
              <span className="text-xs sm:text-sm font-bold text-tertiary">%</span>
            </div>
            <p className="text-[11px] sm:text-xs text-on-surface-variant mt-2 leading-relaxed">Your ranking compared to all monitored addresses.</p>
          </div>
        </div>

        <div className={`group relative rounded-xl bg-surface-container/50 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:border-white/20 p-4 sm:p-5 overflow-hidden cursor-default ${deltaTextClass}`}>
          <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${delta >= 0 ? 'bg-tertiary/10' : 'bg-error/10'}`}></div>
          <div className="relative z-10">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant/80 mb-2 group-hover:text-current transition-colors">Peer Delta</p>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-current">{delta >= 0 ? `+${delta}` : delta}</p>
            <p className="text-[11px] sm:text-xs text-on-surface-variant mt-2 leading-relaxed">Variance vs average base score ({averageScore}).</p>
          </div>
        </div>

        <div className="group relative rounded-xl bg-surface-container/50 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:border-white/20 p-4 sm:p-5 overflow-hidden cursor-default">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <div className="relative z-10">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant/80 mb-2 group-hover:text-primary/80 transition-colors">Risk Regime</p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface truncate">{riskRegime}</p>
            <p className="text-[11px] sm:text-xs text-on-surface-variant mt-2 leading-relaxed">System volatility index tracking at {typeof volatility === 'number' ? volatility.toFixed(1) : 'N/A'}.</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mb-8 sm:mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary text-sm animate-pulse-glow">lightbulb</span>
          <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-on-surface-variant/80">Opportunity Areas</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {weakestFactors.map((factor) => {
            const accent = factor?.color || '#8E05C2';
            return (
              <div key={factor.name} className="group relative rounded-xl bg-surface-container/50 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:border-white/20 p-4 sm:p-5 overflow-hidden cursor-default">
                <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ backgroundColor: `${accent}2A` }}></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[14px]" style={{ color: accent }}>{factor.icon}</span>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant/80 group-hover:text-on-surface transition-colors truncate">{factor.name}</p>
                  </div>
                  <p className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: accent }}>{factor.score}</p>
                  <p className="text-[11px] sm:text-xs text-on-surface-variant mt-2 leading-relaxed">{suggestionForFactor(factor.name)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 rounded-2xl bg-gradient-to-b from-surface-container-high/80 to-surface/40 p-6 sm:p-8 border border-outline-variant/15">
        <div className="grid grid-cols-2 gap-4 md:gap-8">
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-bright/10 border border-outline-variant/15">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant/80 mb-3">Your Score</span>
            <span className="text-tertiary text-5xl md:text-7xl font-black tracking-tighter">{score}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-black/20 border border-outline-variant/15">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant/80 mb-3">Backend Avg</span>
            <span className="text-on-surface-variant text-5xl md:text-7xl font-black tracking-tighter">{averageScore}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScoreAnalysis;
