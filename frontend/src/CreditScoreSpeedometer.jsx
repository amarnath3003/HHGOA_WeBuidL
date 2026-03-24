import React from 'react';

const CreditScoreSpeedometer = ({ score }) => {
  const progress = (score - 300) / (850 - 300);
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const rotation = -135 + clampedProgress * 270;

  const getBand = (value) => {
    if (value < 580) return 'Risk';
    if (value < 670) return 'Fair';
    if (value < 740) return 'Good';
    return 'Excellent';
  };

  return (
    <section className="relative flex flex-col items-center justify-center py-4">
      <div className="relative w-[18rem] h-[18rem] sm:w-[20rem] sm:h-[20rem] md:w-[22rem] md:h-[22rem] flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-[12px] border-surface-container-highest opacity-30"></div>

        <div
          className="absolute inset-0 rounded-full border-[12px] border-transparent border-t-tertiary border-r-tertiary border-l-primary opacity-95 transition-transform duration-700"
          style={{ transform: `rotate(${rotation}deg)` }}
        ></div>

        <div className="glass-card ghost-border rounded-full w-52 h-52 sm:w-56 sm:h-56 md:w-64 md:h-64 flex items-center justify-center flex-col ai-pulse">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-on-surface-variant">Credit Score</span>
          <div className="text-5xl sm:text-6xl md:text-7xl leading-none font-extrabold tracking-tighter ai-shimmer mt-2">{score}</div>
          <span className="mt-2 rounded-full px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] bg-secondary/20 text-secondary font-semibold">{getBand(score)}</span>
        </div>

        <div className="absolute -z-10 w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-tertiary/20 blur-[80px]"></div>
      </div>
    </section>
  );
};

export default CreditScoreSpeedometer;
