import React from 'react';

const ScoreAnalysis = ({ score }) => {
  const insights = [
    { factor: 'Wallet Balance', impact: 'High', suggestion: 'Maintain a stable balance to improve your score.', icon: '💰' },
    { factor: 'Transaction History', impact: 'Medium', suggestion: 'Increase your transaction frequency for a better score.', icon: '📊' },
    { factor: 'NFT Holdings', impact: 'Low', suggestion: 'Diversify your NFT portfolio to potentially boost your score.', icon: '🖼️' },
  ];

  const averageScore = 720;

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
    <section className="rounded-xl bg-surface-container-high p-5 ghost-border">
      <h2 className="text-lg font-bold tracking-tight">Score Analysis</h2>

      <div className="mt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">Factor Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-3">
          {insights.map((insight, index) => (
            <article key={index} className="bg-surface-container-low rounded-lg p-4 flex gap-3">
              <span className="text-2xl leading-none">{insight.icon}</span>
              <div>
                <div className="font-semibold">{insight.factor}</div>
                <div className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold mt-1 ${getImpactBadge(insight.impact)}`}>
                  Impact: {insight.impact}
                </div>
                <p className="text-sm text-on-surface-variant mt-2">{insight.suggestion}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">Peer Comparison</h3>
        <div className="bg-surface-container-low rounded-lg p-4 mt-3">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary">{score}</div>
              <div className="text-xs text-on-surface-variant mt-1">Your Score</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{averageScore}</div>
              <div className="text-xs text-on-surface-variant mt-1">Average Score</div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Your Score</span>
                <span>{score}/850</span>
              </div>
              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full transition-all duration-500" style={{ width: `${(score / 850) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Average Score</span>
                <span>{averageScore}/850</span>
              </div>
              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(averageScore / 850) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default ScoreAnalysis;
