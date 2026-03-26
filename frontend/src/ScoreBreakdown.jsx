import React from 'react';

const toPercent = (factor) => {
  const normalized = Number(factor?.normalized_value);
  if (Number.isFinite(normalized)) {
    return Math.max(0, Math.min(100, Math.round(normalized * 100)));
  }
  const score = Number(factor?.score);
  if (Number.isFinite(score)) {
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  return 0;
};

const ScoreBreakdown = ({ factors, summary, warnings }) => {
  const safeFactors = Array.isArray(factors) ? factors : [];
  const safeWarnings = Array.isArray(warnings) ? warnings : [];

  if (safeFactors.length === 0) {
    return (
      <section className="relative rounded-lg bg-surface-container/80 backdrop-blur-[20px] p-6 md:p-8 shadow-ambient overflow-hidden border border-outline-variant/15">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary text-sm">equalizer</span>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Score Breakdown</p>
        </div>
        <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">Factor Matrix</h3>
        <p className="text-sm text-on-surface-variant">No factor data returned for this wallet yet.</p>
      </section>
    );
  }

  const topFactor = safeFactors.reduce((best, factor) => {
    if (!best) {
      return factor;
    }
    return (Number(factor?.weighted_points) || 0) > (Number(best?.weighted_points) || 0) ? factor : best;
  }, null);

  const coverageText = summary?.data_quality === 'complete' ? 'Complete' : 'Partial';
  const volatilityIndex = typeof summary?.volatility_index === 'number' ? summary.volatility_index.toFixed(1) : 'N/A';

  return (
    <section className="relative rounded-lg bg-surface-container/80 backdrop-blur-[20px] p-6 md:p-8 shadow-ambient overflow-hidden border border-outline-variant/15">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-tertiary/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-sm">equalizer</span>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Score Breakdown</p>
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-tr from-primary to-tertiary bg-clip-text text-transparent">
            Factor Matrix
          </h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant/15 bg-surface-container-highest backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-tertiary" />
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-on-surface-variant">Backend Driven</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 relative z-10 bg-surface-container-low p-5 rounded-lg">
        <div className="rounded-lg bg-surface-container-highest p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-2">Top Factor</p>
          <p className="text-lg font-bold text-on-surface mb-1">{topFactor?.name || 'N/A'}</p>
          <p className="text-sm text-primary">{topFactor?.weighted_points ?? '0'} weighted points</p>
        </div>

        <div className="rounded-lg bg-surface-container-highest p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-2">Data Coverage</p>
          <p className="text-lg font-bold text-on-surface mb-1">{coverageText}</p>
          <p className="text-xs text-on-surface-variant">Warnings: {safeWarnings.length}</p>
        </div>

        <div className="rounded-lg bg-surface-container-highest p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-2">Volatility Index</p>
          <p className="text-lg font-bold text-on-surface mb-1">{volatilityIndex}</p>
          <p className="text-xs text-on-surface-variant">Lower values indicate steadier activity patterns.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 relative z-10">
        {safeFactors.map((factor, index) => {
          const normalizedPercent = toPercent(factor);
          return (
            <article
              key={`${factor.name}-${index}`}
              className="group flex flex-col rounded-lg bg-surface-container-highest p-5 border border-outline-variant/15"
            >
              <div className="flex justify-between items-start mb-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container border border-outline-variant/15"
                    style={{ color: factor.color }}
                  >
                    <span className="material-symbols-outlined text-[20px]">{factor.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base font-semibold text-on-surface truncate">{factor.name}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5 truncate">{factor.impact}</p>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/15 backdrop-blur-sm" style={{ color: factor.color }}>
                  <span className="text-sm font-bold">{factor.percentage}%</span>
                </div>
              </div>

              <div className="relative h-2 w-full bg-surface-container rounded-full overflow-hidden mb-4">
                <div
                  className="absolute top-0 left-0 h-full rounded-full"
                  style={{
                    width: `${normalizedPercent}%`,
                    backgroundColor: factor.color,
                    boxShadow: `0 0 10px ${factor.color}`,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-md bg-surface-container p-2">
                  <p className="text-on-surface-variant font-mono uppercase tracking-wider mb-1">Value</p>
                  <p className="text-on-surface font-semibold">{factor.value}</p>
                </div>
                <div className="rounded-md bg-surface-container p-2">
                  <p className="text-on-surface-variant font-mono uppercase tracking-wider mb-1">Factor Score</p>
                  <p className="text-on-surface font-semibold">{factor.score}</p>
                </div>
                <div className="rounded-md bg-surface-container p-2 col-span-2">
                  <p className="text-on-surface-variant font-mono uppercase tracking-wider mb-1">Rationale</p>
                  <p className="text-on-surface-variant">{factor.rationale}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default ScoreBreakdown;
