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
    if (value < 580) return { label: 'Risk', color: '#ffb4ab' };
    if (value < 670) return { label: 'Fair', color: '#cdbdff' };
    if (value < 740) return { label: 'Good', color: '#b1c5ff' };
    return { label: 'Excellent', color: '#a6e6ff' };
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
  // For 260 sweep, the gap is 100 degrees.
  // We want the gap from 130 to 230 relative to bottom.
  // Center is bottom => standard rotation is 90 deg clockwise to be at bottom.
  // 90 (bottom) + 50 (half gap) = 140 starting angle.
  const startAngle = 140;

  return (
    <section className="relative flex flex-col items-center justify-center py-8">
      <div className="relative w-[20rem] h-[20rem] sm:w-[24rem] sm:h-[24rem] flex items-center justify-center group cursor-default">
        
        {/* Ambient background external glow */}
        <div className="absolute inset-0 rounded-full bg-[#cdbdff]/5 blur-[80px] group-hover:bg-[#cdbdff]/10 transition-colors duration-700"></div>

        <svg 
          viewBox="0 0 300 300" 
          className="w-full h-full relative z-10 transition-transform duration-700 group-hover:scale-105"
        >
          <defs>
            {/* Linear gradient mapping the exact colors of the data logic */}
            <linearGradient id="scoreGlow" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffb4ab" />     {/* Risk - Red/Pink */}
              <stop offset="35%" stopColor="#cdbdff" />    {/* Fair - Purple */}
              <stop offset="70%" stopColor="#b1c5ff" />    {/* Good - Blue/Purple */}
              <stop offset="100%" stopColor="#a6e6ff" />   {/* Excellent - Cyan */}
            </linearGradient>

            {/* Premium drop shadow for the stroke */}
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Dashed decorative ring */}
          <circle
            cx="150"
            cy="150"
            r={radius + 14}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="2"
            strokeDasharray="4 8"
            className="opacity-50"
          />

          {/* Background Track Arc */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${gap}`}
            transform={`rotate(${startAngle} 150 150)`}
          />

          {/* Animated Fill Arc */}
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

        {/* Inner Content Glass Card */}
        <div className="absolute flex flex-col items-center justify-center bg-gradient-to-br from-[#13151a]/90 to-[#0d0e12]/90 backdrop-blur-xl rounded-full w-56 h-56 sm:w-64 sm:h-64 border border-white/10 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.6)] z-20 overflow-hidden transition-all duration-700 group-hover:border-white/20 group-hover:shadow-[0_20px_60px_-10px_rgba(166,230,255,0.15)]">
          {/* Internal ambient blobs */}
          <div className="absolute -top-12 -right-6 w-32 h-32 bg-[#a6e6ff]/20 rounded-full blur-3xl opacity-70"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#cdbdff]/20 rounded-full blur-3xl opacity-50"></div>
          
          <div className="relative z-10 flex flex-col items-center mt-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" style={{ backgroundColor: band.color }}></span>
              <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.25em] text-white/50 uppercase">Credit Score</span>
            </div>
            
            <div className="text-7xl sm:text-8xl font-black tracking-tighter text-transparent bg-clip-text drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] mb-2" style={{ backgroundImage: `linear-gradient(to bottom right, #ffffff, ${band.color})` }}>
              {score}
            </div>
            
            <div className="flex items-center gap-2 mt-2">
               <span 
                 className="rounded-md px-3.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest bg-white/5 border backdrop-blur-md"
                 style={{ 
                   borderColor: `${band.color}40`, 
                   color: band.color, 
                   boxShadow: `0 0 15px -5px ${band.color}` 
                 }}
               >
                 {band.label}
               </span>
               <span className="rounded-md px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-white/40">
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
