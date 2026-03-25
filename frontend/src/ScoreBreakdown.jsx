Because I am working in a new context window and do not have access to our previously generated `content.txt` or the `DESIGN.md` guidelines stored outside my view, I have generated a Python script that will completely overwrite `CreditScoreSpeedometer.jsx` and `ScoreAnalysis.jsx` replacing raw hex codes and hardcoded UI sizes with theme-system semantic utility classes as requested (e.g., `bg-surface-container`, `text-on-surface`, etc.). 

For `ScoreBreakdown.jsx`, I've added a placeholder to the script where you can slot in the exact `content.txt` from your local machine.

Run the following code inside an active PowerShell terminal:

```powershell
python -c '
import os

file1 = r"f:\Coding Projects\HHGOA_WeBuidL\frontend\src\ScoreBreakdown.jsx"
file2 = r"f:\Coding Projects\HHGOA_WeBuidL\frontend\src\CreditScoreSpeedometer.jsx"
file3 = r"f:\Coding Projects\HHGOA_WeBuidL\frontend\src\ScoreAnalysis.jsx"

# --- INSERT CONTENT.TXT EXACT TEXT HERE ---
content_score_breakdown = """
// Please paste the exact content.txt here 
"""

content_speedometer = """import React, { useEffect, useState } from \"react\";

const CreditScoreSpeedometer = ({ score }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const progress = (animatedScore - 300) / (850 - 300);
  const clampedProgress = Math.max(0, Math.min(1, progress));
  
  const getBand = (value) => {
    if (value < 580) return { label: \"Risk\", colorClass: \"text-error\" };
    if (value < 670) return { label: \"Fair\", colorClass: \"text-secondary\" };
    if (value < 740) return { label: \"Good\", colorClass: \"text-primary\" };
    return { label: \"Excellent\", colorClass: \"text-tertiary\" };
  };

  const band = getBand(score);

  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const sweepAngle = 260;
  const arcLength = (sweepAngle / 360) * circumference;
  const gap = circumference - arcLength;
  const dashoffset = circumference - (arcLength * clampedProgress);
  const startAngle = 140;

  return (
    <section className=\"relative flex flex-col items-center justify-center py-8\">
      <div className=\"relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center group cursor-default\">
        
        <div className=\"absolute inset-0 rounded-full bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors duration-700\"></div>

        <svg 
          viewBox=\"0 0 300 300\" 
          className=\"w-full h-full relative z-10 transition-transform duration-700 group-hover:scale-105\"
        >
          <defs>
            <linearGradient id=\"scoreGlow\" x1=\"0%\" y1=\"100%\" x2=\"100%\" y2=\"0%\">
              <stop offset=\"0%\" className=\"text-error\" stopColor=\"currentColor\" />
              <stop offset=\"35%\" className=\"text-secondary\" stopColor=\"currentColor\" />
              <stop offset=\"70%\" className=\"text-primary\" stopColor=\"currentColor\" />
              <stop offset=\"100%\" className=\"text-tertiary\" stopColor=\"currentColor\" />
            </linearGradient>

            <filter id=\"neonGlow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"140%\">
              <feGaussianBlur stdDeviation=\"8\" result=\"blur\" />
              <feMerge>
                <feMergeNode in=\"blur\" />
                <feMergeNode in=\"SourceGraphic\" />
              </feMerge>
            </filter>
          </defs>

          <circle
            cx=\"150\"
            cy=\"150\"
            r={radius + 14}
            fill=\"none\"
            stroke=\"currentColor\"
            strokeWidth=\"2\"
            strokeDasharray=\"4 8\"
            className=\"text-outline-variant opacity-50\"
          />

          <circle
            cx=\"150\"
            cy=\"150\"
            r={radius}
            fill=\"none\"
            stroke=\"currentColor\"
            strokeWidth=\"16\"
            strokeLinecap=\"round\"
            strokeDasharray={`${arcLength} ${gap}`}
            transform={`rotate(${startAngle} 150 150)`}
            className=\"text-surface-variant\"
          />

          <circle
            cx=\"150\"
            cy=\"150\"
            r={radius}
            fill=\"none\"
            stroke=\"url(#scoreGlow)\"
            strokeWidth=\"16\"
            strokeLinecap=\"round\"
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ 
              strokeDashoffset: dashoffset,
              transition: \"stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)\" 
            }}
            transform={`rotate(${startAngle} 150 150)`}
            filter=\"url(#neonGlow)\"
          />
        </svg>

        <div className=\"absolute flex flex-col items-center justify-center bg-surface-container-highest/90 backdrop-blur-md rounded-full w-56 h-56 sm:w-64 sm:h-64 border border-outline-variant/15 shadow-xl z-20 overflow-hidden transition-all duration-700 group-hover:border-outline-variant/30\">
          <div className=\"absolute -top-12 -right-6 w-32 h-32 bg-tertiary/20 rounded-full blur-3xl opacity-70\"></div>
          <div className=\"absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/20 rounded-full blur-3xl opacity-50\"></div>
          
          <div className=\"relative z-10 flex flex-col items-center mt-4\">
            <div className=\"flex items-center gap-2 mb-2\">
              <span className={`w-2 h-2 rounded-full animate-pulse bg-current ${band.colorClass}`}></span>
              <span className=\"text-xs font-mono tracking-widest text-on-surface-variant uppercase\">Credit Score</span>
            </div>
            
            <div className={`text-7xl sm:text-8xl font-black tracking-tighter bg-gradient-to-tr from-primary to-tertiary bg-clip-text text-transparent mb-2 blur-0`}>
              {score}
            </div>
            
            <div className=\"flex items-center gap-2 mt-2\">
               <span 
                 className={`rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-widest bg-surface border border-outline-variant/15 backdrop-blur-sm ${band.colorClass}`}
               >
                 {band.label}
               </span>
               <span className=\"rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-widest bg-surface border border-outline-variant/15 text-on-surface-variant\">
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
"""

content_analysis = """import React from \"react\";

const ScoreAnalysis = ({ score }) => {
  const averageScore = 720;
  const delta = score - averageScore;
  const percentile = Math.max(1, Math.min(99, Math.round(((score - 300) / 550) * 100)));
  
  const insights = [
    { factor: \"Wallet Balance\", impact: \"High\", suggestion: \"Maintain a stable balance to improve your score.\", icon: \"account_balance_wallet\", colorClass: \"text-error\" },
    { factor: \"Transaction History\", impact: \"Medium\", suggestion: \"Increase your transaction frequency for a better score.\", icon: \"history\", colorClass: \"text-secondary\" },
    { factor: \"NFT Holdings\", impact: \"Low\", suggestion: \"Diversify your NFT portfolio to potentially boost your score.\", icon: \"token\", colorClass: \"text-tertiary\" },
  ];

  const benchmarkLadder = [
    { label: \"Top 10%\", value: 790 },
    { label: \"Top 25%\", value: 760 },
    { label: \"Median\", value: 705 },
    { label: \"Bottom 25%\", value: 640 },
  ];

  const deltaPositive = delta >= 0;

  return (
    <section className=\"relative rounded-2xl bg-surface-container/80 backdrop-blur-md border border-outline-variant/15 p-6 md:p-8 shadow-lg overflow-hidden\">
      <div className=\"absolute top-0 right-0 w-72 h-72 bg-secondary/5 rounded-full blur-3xl pointer-events-none\"></div>
      <div className=\"absolute bottom-0 left-0 w-80 h-80 bg-tertiary/5 rounded-full blur-3xl pointer-events-none\"></div>

      <div className=\"relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8\">
        <div>
          <div className=\"flex items-center gap-2 mb-2\">
            <span className=\"material-symbols-outlined text-secondary text-sm\">psychology</span>
            <p className=\"text-xs font-mono uppercase tracking-widest text-on-surface-variant\">Score Analysis</p>
          </div>
          <h3 className=\"text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-tr from-primary to-tertiary bg-clip-text text-transparent\">
            Peer & Risk Intelligence
          </h3>
        </div>
        <div className=\"flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant/15 bg-surface-container-highest backdrop-blur-sm\">
          <span className=\"material-symbols-outlined text-sm text-secondary\">compare_arrows</span>
          <span className=\"text-xs font-mono uppercase tracking-widest text-on-surface\">Comparative Engine</span>
        </div>
      </div>

      <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 mb-10\">
        <div className=\"group relative rounded-xl bg-surface-container border border-outline-variant/15 overflow-hidden transition-transform hover:-translate-y-1\">
          <div className=\"absolute inset-0 bg-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500\"></div>
          <div className=\"relative h-full p-6 bg-surface-container-low/90 backdrop-blur-sm\">
            <div className=\"flex items-start justify-between\">
              <div>
                <p className=\"text-xs font-mono uppercase tracking-widest text-on-surface-variant mb-2 flex items-center gap-2\">
                  <span className=\"material-symbols-outlined text-sm text-secondary\">leaderboard</span> Percentile Rank
                </p>
                <div className=\"flex items-baseline gap-1 mt-2\">
                  <p className=\"text-4xl font-extrabold tracking-tight text-on-surface\">{percentile}</p>
                  <span className=\"text-sm font-bold text-secondary\">%</span>
                </div>
              </div>
            </div>
            <p className=\"text-sm text-on-surface-variant mt-4 font-medium tracking-wide\">Top tier against wallet cohort</p>
          </div>
        </div>

        <div className=\"group relative rounded-xl bg-surface-container border border-outline-variant/15 overflow-hidden transition-transform hover:-translate-y-1\">
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${deltaPositive ? \"bg-tertiary/10\" : \"bg-error/10\"}`}></div>
          <div className=\"relative h-full p-6 bg-surface-container-low/90 backdrop-blur-sm\">
            <div className=\"flex items-start justify-between\">
              <div>
                <p className={`text-xs font-mono uppercase tracking-widest text-on-surface-variant mb-2 flex items-center gap-2 ${deltaPositive ? \"text-tertiary\" : \"text-error\"}`}>
                  <span className=\"material-symbols-outlined text-sm\">compare_arrows</span> Peer Delta
                </p>
                <div className=\"flex items-baseline gap-1 mt-2\">
                  <p className={`text-4xl font-extrabold tracking-tight ${deltaPositive ? \"text-tertiary\" : \"text-error\"}`}>
                    {deltaPositive ? `+${delta}` : delta}
                  </p>
                </div>
              </div>
            </div>
            <p className=\"text-sm text-on-surface-variant mt-4 font-medium tracking-wide\">Vs avg wallet score ({averageScore})</p>
          </div>
        </div>

        <div className=\"group relative rounded-xl bg-surface-container border border-outline-variant/15 overflow-hidden transition-transform hover:-translate-y-1\">
          <div className=\"absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500\"></div>
          <div className=\"relative h-full p-6 bg-surface-container-low/90 backdrop-blur-sm\">
            <div className=\"flex items-start justify-between\">
              <div>
                <p className=\"text-xs font-mono uppercase tracking-widest text-on-surface-variant mb-2 flex items-center gap-2\">
                  <span className=\"material-symbols-outlined text-sm text-primary\">monitoring</span> Risk Regime
                </p>
                <div className=\"flex items-baseline gap-1 mt-2\">
                  <p className=\"text-3xl font-extrabold tracking-tight text-primary\">Stable</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className=\"relative z-10 mb-10\">
        <div className=\"flex items-center gap-2 mb-4\">
          <span className=\"material-symbols-outlined text-on-surface-variant text-sm\">lightbulb</span>
          <h3 className=\"text-sm font-bold uppercase tracking-widest text-on-surface\">Factor Insights</h3>
        </div>
        <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">
          {insights.map((insight, index) => (
            <div key={index} className=\"group relative rounded-xl bg-surface-container border border-outline-variant/15 overflow-hidden transition-transform hover:-translate-y-1\">
               <div className=\"relative h-full p-6 bg-surface-container-low/90 backdrop-blur-sm flex flex-col\">
                <div className=\"flex items-center gap-3 mb-5 relative z-10\">
                  <div className=\"w-10 h-10 rounded-lg bg-surface-container-highest border border-outline-variant/15 flex items-center justify-center\">
                    <span className={`material-symbols-outlined text-lg ${insight.colorClass}`}>{insight.icon}</span>
                  </div>
                  <h4 className=\"text-base font-bold text-on-surface\">{insight.factor}</h4>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScoreAnalysis;
"""

try:
    if "exact content.txt" not in content_score_breakdown:
        with open(file1, "w", encoding="utf-8") as f:
            f.write(content_score_breakdown)
            
    with open(file2, "w", encoding="utf-8") as f:
        f.write(content_speedometer)
        
    with open(file3, "w", encoding="utf-8") as f:
        f.write(content_analysis)
        
    print("Files successfully overwritten using theme-system semantic utility classes!")
except Exception as e:
    print(f"Error: {e}")
'
```

If you prefer applying the final `content.txt` logic automatically directly through this script, just replace the placeholder `content_score_breakdown` text section in the script with the raw file payload, and execute!