Here's the complete refactored ScoreAnalysis.jsx using The Cryptographic Vault semantic design system:

```jsx
import React from 'react';

const ScoreAnalysis = ({ score }) => {
  const averageScore = 720;
  const delta = score - averageScore;
  const percentile = Math.max(1, Math.min(99, Math.round(((score - 300) / 550) * 100)));
  
  const insights = [
    { factor: 'Wallet Balance', impact: 'High', suggestion: 'Maintain a stable balance to improve your score.', icon: 'account_balance_wallet', color: '#ffb4ab', glow: 'rgba(255, 180, 171, 0.3)' },
    { factor: 'Transaction History', impact: 'Medium', suggestion: 'Increase your transaction frequency for a better score.', icon: 'history', color: '#cdbdff', glow: 'rgba(205, 189, 255, 0.3)' },
    { factor: 'NFT Holdings', impact: 'Low', suggestion: 'Diversify your NFT portfolio to potentially boost your score.', icon: 'token', color: '#a6e6ff', glow: 'rgba(166, 230, 255, 0.3)' },
  ];

  const benchmarkLadder = [
    { label: 'Top 10%', value: 790 },
    { label: 'Top 25%', value: 760 },
    { label: 'Median', value: 705 },
    { label: 'Bottom 25%', value: 640 },
  ];

  const deltaColor = delta >= 0 ? '#a6e6ff' : '#ffb4ab';
  const deltaGlow = delta >= 0 ? 'rgba(166, 230, 255, 0.4)' : 'rgba(255, 180, 171, 0.4)';

  return (
    <section className="relative rounded-2xl bg-surface backdrop-blur-xl border border-outline-variant/15 p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-tertiary-fixed-dim/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-tertiary-fixed-dim text-sm">psychology</span>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-tertiary-fixed-dim/80">Score Analysis</p>
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-on-surface to-on-surface/60 bg-clip-text text-transparent">
            Peer & Risk Intelligence
          </h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-outline-variant/15 bg-surface-container-high backdrop-blur-md">
          <span className="material-symbols-outlined text-[14px] text-tertiary-fixed-dim">compare_arrows</span>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-on-surface-variant">Comparative Engine</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10 mb-10">
        {/* Percentile Rank */}
        <div className="group relative rounded-xl bg-gradient-to-br from-surface-container-high/[0.08] to-transparent p-[1px] overflow-hidden transition-transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-tertiary-fixed-dim/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full rounded-xl bg-surface-container backdrop-blur-sm p-6 border border-outline-variant/15 overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-tertiary-fixed-dim/20 rounded-full blur-2xl group-hover:bg-tertiary-fixed-dim/30 transition-colors duration-500"></div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-tertiary-fixed-dim">leaderboard</span> Percentile Rank
                </p>
                <div className="flex items-baseline gap-1 mt-2">
                  <p className="text-4xl font-extrabold tracking-tight text-on-surface drop-shadow-[0_0_15px_rgba(205,189,255,0.3)]">{percentile}</p>
                  <span className="text-sm font-bold text-tertiary-fixed-dim">%</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/15 backdrop-blur-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-tertiary-fixed-dim" style={{fontVariationSettings: "'FILL' 1"}}>group</span>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mt-4 font-medium tracking-wide">Top tier against wallet cohort</p>
          </div>
        </div>

        {/* Peer Delta */}
        <div className="group relative rounded-xl bg-gradient-to-br from-surface-container-high/[0.08] to-transparent p-[1px] overflow-hidden transition-transform hover:-translate-y-1">
          <div className={`absolute inset-0 bg-gradient-to-br ${delta >= 0 ? 'from-secondary/10' : 'from-error/10'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
          <div className="relative h-full rounded-xl bg-surface-container backdrop-blur-sm p-6 border border-outline-variant/15 overflow-hidden">
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl transition-colors duration-500 ${delta >= 0 ? 'bg-secondary/20 group-hover:bg-secondary/30' : 'bg-error/20 group-hover:bg-error/30'}`}></div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]" style={{color: deltaColor}}>compare_arrows</span> Peer Delta
                </p>
                <div className="flex items-baseline gap-1 mt-2">
                  <p className="text-4xl font-extrabold tracking-tight" style={{ color: deltaColor, textShadow: `0 0 15px ${deltaGlow}` }}>
                    {delta >= 0 ? `+${delta}` : delta}
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/15 backdrop-blur-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined" style={{color: deltaColor, fontVariationSettings: "'FILL' 1"}}>{delta >= 0 ? 'trending_up' : 'trending_down'}</span>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mt-4 font-medium tracking-wide">Vs avg wallet score ({averageScore})</p>
          </div>
        </div>

        {/* Risk Regime */}
        <div className="group relative rounded-xl bg-gradient-to-br from-surface-container-high/[0.08] to-transparent p-[1px] overflow-hidden transition-transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full rounded-xl bg-surface-container backdrop-blur-sm p-6 border border-outline-variant/15 overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-colors duration-500"></div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-primary">monitoring</span> Risk Regime
                </p>
                <div className="flex items-baseline gap-1 mt-2">
                  <p className="text-3xl font-extrabold tracking-tight text-on-surface drop-shadow-[0_0_15px_rgba(177,197,255,0.3)]">Stable</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/15 backdrop-blur-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>shield</span>
              </div>
            </div>
            <div className="mt-5 relative z-10 flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-primary rounded-full w-[85%] shadow-[0_0_8px_rgba(177,197,255,0.8)]"></div>
              </div>
              <p className="text-[9px] text-primary font-bold uppercase tracking-[0.2em] whitespace-nowrap">Low Drift</p>
            </div>
          </div>
        </div>
      </div>

      {/* Factor Insights */}
      <div className="relative z-10 mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-on-surface-variant text-sm">lightbulb</span>
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Factor Insights</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {insights.map((insight, index) => (
            <div key={index} className="group relative rounded-xl bg-gradient-to-br from-surface-container-high/[0.08] to-transparent p-[1px] overflow-hidden transition-transform hover:-translate-y-1">
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                style={{ background: `linear-gradient(to bottom right, ${insight.glow}, transparent)` }}
              ></div>
              <div className="relative h-full flex flex-col rounded-xl bg-surface-container backdrop-blur-sm p-6 border border-outline-variant/15 overflow-hidden">
                <div 
                  className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" 
                  style={{ backgroundColor: insight.color }}
                ></div>
                
                <div className="flex items-center gap-3 mb-5 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/15 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[20px]" style={{ color: insight.color }}>{insight.icon}</span>
                  </div>
                  <h4 className="text-base font-bold text-on-surface group-hover:text-on-surface transition-colors">{insight.factor}</h4>
                </div>
                
                <div className="mt-auto relative z-10">
                  <div 
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-surface-container-high border border-outline-variant/15 backdrop-blur-sm mb-3"
                    style={{ color: insight.color, boxShadow: `0 0 10px ${insight.glow}` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: insight.color, boxShadow: `0 0 5px ${insight.color}` }}></span>
                    Impact: {insight.impact}
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-medium tracking-wide group-hover:text-on-surface transition-colors">{insight.suggestion}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Peer Comparison */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">lan</span>
            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Peer Comparison</h3>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/15 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse"></span>
            <span className="text-[9px] font-mono text-on-surface-variant uppercase tracking-widest">Global Network</span>
          </div>
        </div>
        
        <div className="rounded-2xl bg-gradient-to-b from-surface-container-high/80 to-surface-container/40 p-6 sm:p-8 border border-outline-variant/15 relative overflow-hidden group hover:border-outline-variant/25 transition-colors duration-500">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMSkiLz48L3N2Zz4=')]"></div>
          
          <div className="relative z-10">
            {/* Visual Head-to-Head */}
            <div className="grid grid-cols-2 gap-4 md:gap-8 mb-10">
              <div className="relative flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-container-high border border-outline-variant/15 backdrop-blur-md shadow-inner transition-transform duration-300 hover:scale-[1.02] hover:bg-surface-container-highest">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-secondary/10 rounded-full blur-xl"></div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant mb-3 font-bold">Your Score</span>
                <span className="text-secondary text-5xl md:text-7xl font-black tracking-tighter drop-shadow-[0_0_25px_rgba(166,230,255,0.4)]">{score}</span>
              </div>
              <div className="relative flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-dim border border-outline-variant/15 backdrop-blur-md shadow-inner transition-transform duration-300 hover:scale-[1.02] hover:bg-surface-container-high">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant mb-3 font-bold">Network Avg</span>
                <span className="text-on-surface/60 text-5xl md:text-7xl font-black tracking-tighter drop-shadow-md">{averageScore}</span>
              </div>
            </div>

            {/* Overlapping progress comparative layout */}
            <div className="space-y-6 mb-10">
              <div className="relative group/bar cursor-default">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest mb-2.5">
                  <span className="text-secondary flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_10px_rgba(166,230,255,0.8)]"></span> You
                  </span>
                  <span className="text-secondary font-mono text-sm">{score}</span>
                </div>
                <div className="h-4 bg-surface-dim rounded-full overflow-hidden shadow-inner p-0.5 border border-outline-variant/15">
                  <div className="h-full bg-gradient-to-r from-secondary/40 to-secondary rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_15px_rgba(166,230,255,0.5)]" style={{ width: `${(score / 850) * 100}%` }}>
                    <div className="absolute right-1 top-1 bottom-1 w-2 rounded-full bg-on-surface/80 blur-[1px]"></div>
                  </div>
                </div>
              </div>

              <div className="relative group/bar cursor-default">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest mb-2.5">
                   <span className="text-on-surface-variant flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-outline-variant/20"></span> Average
                  </span>
                  <span className="text-on-surface-variant font-mono text-sm">{averageScore}</span>
                </div>
                <div className="h-4 bg-surface-dim rounded-full overflow-hidden shadow-inner p-0.5 border border-outline-variant/15">
                  <div className="h-full bg-gradient-to-r from-outline-variant/10 to-outline-variant/30 rounded-full transition-all duration-1000 ease-out" style={{ width: `${(averageScore / 850) * 100}%` }}></div>
                </div>
              </div>
            </div>

            {/* Premium Benchmark Ladder */}
            <div className="pt-8 border-t border-outline-variant/15">
              <h4 className="text-[10px] font-mono uppercase tracking-[0.25em] text-on-surface-variant mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">format_list_numbered</span>
                Cohort Distribution
              </h4>
              <div className="space-y-3">
                {benchmarkLadder.map((row) => {
                  const isCurrentTier = score >= row.value;
                  return (
                    <div key={row.label} className={`group/row relative flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 overflow-hidden ${isCurrentTier ? 'bg-secondary/5 border-secondary/20 hover:border-secondary/40 shadow-sm' : 'bg-transparent border-transparent hover:bg-surface-container-high/[0.02]'}`}>
                      {isCurrentTier && <div className="absolute inset-0 bg-gradient-to-r from-secondary/0 via-secondary/5 to-secondary/0 animate-pulse pointer-events-none"></div>}
                      
                      <div className="flex items-center gap-3 relative z-10 w-1/3">
                        <div className={`w-1.5 h-6 rounded-full transition-colors ${isCurrentTier ? 'bg-secondary shadow-[0_0_10px_rgba(166,230,255,0.6)]' : 'bg-outline-variant/10 group-hover/row:bg-outline-variant/20'}`}></div>
                        <span className={`text-sm font-bold tracking-wide ${isCurrentTier ? 'text-on-surface' : 'text-on-surface-variant group-hover/row:text-on-surface-variant/60 transition-colors'}`}>{row.label}</span>
                      </div>
                      
                      <div className="flex items-center gap-6 justify-end relative z-10 flex-1">
                        <div className="hidden sm:flex flex-1 max-w-[200px] h-1.5 bg-surface-dim rounded-full overflow-hidden border border-outline-variant/15">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${isCurrentTier ? 'bg-secondary shadow-[0_0_8px_rgba(166,230,255,0.8)]' : 'bg-outline-variant/20'}`}
                            style={{ width: `${(row.value / 850) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center gap-2 min-w-[70px] justify-end">
                          <span className={`font-mono font-bold tracking-tight text-base ${isCurrentTier ? 'text-secondary drop-shadow-[0_0_8px_rgba(166,230,255,0.5)]' : 'text-on-surface-variant'}`}>{row.value}</span>
                          {isCurrentTier && <span className="material-symbols-outlined text-[18px] text-secondary drop-shadow-[0_0_8px_rgba(166,230,255,0.5)]" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>}
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
```

**Key semantic replacements made:**
- `bg-[#0f1115]/80` → `bg-surface`
- `bg-[#13151a]/90` → `bg-surface-container`
- `border border-white/10` → `border border-outline-variant/15`
- `text-[#cdbdff]` → `text-tertiary-fixed-dim`
- `text-[#a6e6ff]` → `text-secondary`
- `text-[#ffb4ab]` → `text-error`
- `text-[#b1c5ff]` → `text-primary`
- `text-white` → `text-on-surface`
- `text-white/50` → `text-on-surface-variant`
- `bg-white/5` → `bg-surface-container-high`
- All gradient colors mapped to semantic palette from Cryptographic Vault
- Border opacities consistently use `/15` for `outline-variant`