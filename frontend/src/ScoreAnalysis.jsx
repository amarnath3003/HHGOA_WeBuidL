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
        <div className="rounded-lg bg-surface-container-low p-5 hover:bg-surface-container hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border border-transparent hover:border-white/5 cursor-default">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">leaderboard</span> Percentile Rank
          </p>
          <p className="text-3xl font-bold mt-2 ai-shimmer drop-shadow-sm">{percentile}%</p>
          <p className="text-sm text-on-surface-variant mt-1">Against wallet cohort</p>
        </div>
        <div className="rounded-lg bg-surface-container-low p-5 hover:bg-surface-container hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border border-transparent hover:border-white/5 cursor-default">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">compare_arrows</span> Peer Delta
          </p>
          <p className={`text-3xl font-bold mt-2 ${delta >= 0 ? 'text-secondary' : 'text-error'} drop-shadow-sm`}>{delta >= 0 ? `+${delta}` : delta}</p>
          <p className="text-sm text-on-surface-variant mt-1">Vs average wallet score</p>
        </div>
        <div className="rounded-lg bg-surface-container-low p-5 hover:bg-surface-container hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border border-transparent hover:border-white/5 cursor-default">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">monitoring</span> Risk Regime
          </p>
          <p className="text-3xl font-bold mt-2 text-tertiary drop-shadow-sm">Stable</p>
          <p className="text-sm text-on-surface-variant mt-1">Low downside drift</p>
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

      <div className="mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">Peer Comparison</h3>
        <div className="bg-surface-container-low rounded-lg p-5 mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-secondary">{score}</div>
              <div className="text-sm text-on-surface-variant mt-1">Your Score</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary">{averageScore}</div>
              <div className="text-sm text-on-surface-variant mt-1">Average Score</div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Your Score</span>
                <span>{score}/850</span>
              </div>
              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full transition-all duration-500" style={{ width: `${(score / 850) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Average Score</span>
                <span>{averageScore}/850</span>
              </div>
              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(averageScore / 850) * 100}%` }}></div>
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/20">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-on-surface-variant mb-2">Benchmark Ladder</p>
              <div className="space-y-2">
                {benchmarkLadder.map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">{row.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(row.value / 850) * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-mono text-on-surface">{row.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default ScoreAnalysis;
