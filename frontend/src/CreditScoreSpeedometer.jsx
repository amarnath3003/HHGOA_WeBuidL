import React, { useEffect, useState } from 'react';

const CreditScoreSpeedometer = ({ score }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate the score progress on load
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const progress = (animatedScore - 300) / (850 - 300);
  const clampedProgress = Math.max(0, Math.min(1, progress));
  
  const getBand = (value) => {
    if (value < 580) return { label: 'Risk', colorClass: 'text-error' };
    if (value < 670) return { label: 'Fair', colorClass: 'text-on-surface-variant' };
    if (value < 740) return { label: 'Good', colorClass: 'text-primary' };
    return { label: 'Excellent', colorClass: 'text-tertiary' };
  };

  const band = getBand(score);

  // SVG Arc Math
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  // 260 degrees sweep for the arc
  const sweepAngle = 260;
  const arcLength = (sweepAngle / 360) * circumference;
  const gap = circumference - arcLength;
  const dashoffset = circumference - (arcLength * clampedProgress);
  // Start angle to center the gap at bottom (180 deg)
  const startAngle = 140;

  return (
    <section className="relative flex flex-col items-center justify-center py-8">
      <div className="relative w-[20rem] h-[20rem] sm:w-[24rem] sm:h-[24rem] flex items-center justify-center group cursor-default">
        
        {/* Ambient background external glow */}
        <div className="absolute inset-0 rounded-full bg-primary/5 blur-[80px] group-hover:bg-primary/10 transition-colors duration-700"></div>

        <svg 
          viewBox="0 0 300 300" 
          className="w-full h-full relative z-10 transition-transform duration-700 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="scoreGlow" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b1c5ff" />
              <stop offset="100%" stopColor="#cdbdff" />
            </linearGradient>

            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle
            cx="150"
            cy="150"
            r={radius + 14}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 8"
            className="text-outline-variant opacity-50"
          />

          <circle
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${gap}`}
            transform={`rotate(${startAngle} 150 150)`}
            className="text-surface-container-highest"
          />

          <circle
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            stroke="url(#scoreGlow)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ 
              strokeDashoffset: dashoffset,
              transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)' 
            }}
            transform={`rotate(${startAngle} 150 150)`}
            filter="url(#neonGlow)"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center bg-surface-container-high/90 backdrop-blur-xl rounded-full w-56 h-56 sm:w-64 sm:h-64 border border-outline-variant/15 shadow-lg z-20 overflow-hidden transition-all duration-700 group-hover:border-outline-variant/30 group-hover:shadow-xl">
          <div className="absolute -top-12 -right-6 w-32 h-32 bg-tertiary/20 rounded-full blur-3xl opacity-70"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl opacity-50"></div>
          
          <div className="relative z-10 flex flex-col items-center mt-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-full animate-pulse bg-tertiary shadow-[0_0_8px_rgba(205,189,255,0.8)]"></span>
              <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.25em] text-on-surface-variant uppercase">Credit Score</span>
            </div>
            
            <div className="text-7xl sm:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-tr from-primary to-tertiary drop-shadow-[0_0_20px_rgba(177,197,255,0.2)] mb-2">
              {score}
            </div>
            
            <div className="flex items-center gap-2 mt-2">
               <span 
                 className={`rounded-lg px-3.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest bg-surface-container-low border border-outline-variant/15 backdrop-blur-sm ${band.colorClass}`}
               >
                 {band.label}
               </span>
               <span className="rounded-lg px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest bg-surface-container-low border border-outline-variant/15 text-on-surface-variant">
                 30d Live
               </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreditScoreSpeedometer;