import React from 'react';

const CreditScoreSpeedometer = ({ score }) => {
  const progress = (score - 300) / (850 - 300);
  const sweep = Math.max(0, Math.min(1, progress)) * 251.2;
  const angle = progress * 180 - 90;

  const getBand = (value) => {
    if (value < 580) return 'Risk';
    if (value < 670) return 'Fair';
    if (value < 740) return 'Good';
    return 'Excellent';
  };

  return (
    <section className="editorial-section relative flex flex-col items-center justify-center py-2 md:py-6">
      <div className="relative w-[320px] h-[320px] md:w-[360px] md:h-[360px] flex items-center justify-center">
        <svg className="absolute inset-0" width="360" height="360" viewBox="0 0 200 200" aria-label="Credit score meter">
          <defs>
            <linearGradient id="aiGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b1c5ff" />
              <stop offset="100%" stopColor="#cdbdff" />
            </linearGradient>
          </defs>

          <path
            d="M20 130 A80 80 0 0 1 180 130"
            fill="none"
            stroke="#353535"
            strokeWidth="14"
            strokeLinecap="round"
          />

          <path
            d="M20 130 A80 80 0 0 1 180 130"
            fill="none"
            className="ai-track"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray="251.2"
            strokeDashoffset={`${251.2 - sweep}`}
            style={{ transition: 'stroke-dashoffset 0.55s ease-in-out' }}
          />

          <line
            x1="100"
            y1="130"
            x2="100"
            y2="68"
            stroke="#a6e6ff"
            strokeWidth="2"
            transform={`rotate(${angle}, 100, 130)`}
            style={{ transition: 'transform 0.55s ease-in-out' }}
          />
        </svg>

        <div className="glass-card ghost-border rounded-full w-56 h-56 md:w-64 md:h-64 flex items-center justify-center flex-col ai-pulse">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-on-surface-variant">Credit Score</span>
          <div className="text-[3.5rem] leading-none font-extrabold tracking-tighter ai-shimmer mt-2">{score}</div>
          <span className="mt-3 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] bg-tertiary-container/20 text-tertiary font-semibold">{getBand(score)}</span>
        </div>

        <div className="absolute -z-10 w-56 h-56 md:w-72 md:h-72 rounded-full bg-primary/20 blur-[80px]"></div>
      </div>

      <div className="mt-6 text-center max-w-lg px-4">
        <h2 className="text-2xl md:text-3xl font-bold">Privacy-Preserving Credit Intelligence</h2>
        <p className="mt-2 text-sm text-on-surface-variant">Your score is generated from encrypted wallet behavior signals using Nada AI without exposing raw transaction details.</p>
      </div>
    </section>
  );
};

export default CreditScoreSpeedometer;
