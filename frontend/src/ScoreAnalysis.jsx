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
    <section className="relative rounded-2xl bg-[#0f1115]/80 backdrop-blur-xl border border-white/10 p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#cdbdff]/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#a6e6ff]/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#cdbdff] text-sm">psychology</span>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#cdbdff]/80">Score Analysis</p>
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Peer & Risk Intelligence
          </h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
          <span className="material-symbols-outlined text-[14px] text-[#cdbdff]">compare_arrows</span>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/70">Comparative Engine</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10 mb-10">
        {/* Percentile Rank */}
        <div className="group relative rounded-xl bg-gradient-to-br from-white/[0.08] to-transparent p-[1px] overflow-hidden transition-transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-[#cdbdff]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full rounded-xl bg-[#13151a]/90 backdrop-blur-sm p-6 border border-white/5 overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#cdbdff]/20 rounded-full blur-2xl group-hover:bg-[#cdbdff]/30 transition-colors duration-500"></div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/50 mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-[#cdbdff]">leaderboard</span> Percentile Rank
                </p>
                <div className="flex items-baseline gap-1 mt-2">
                  <p className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(205,189,255,0.3)]">{percentile}</p>
                  <span className="text-sm font-bold text-[#cdbdff]">%</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[#cdbdff]" style={{fontVariationSettings: "'FILL' 1"}}>group</span>
              </div>
            </div>
            <p className="text-xs text-white/40 mt-4 font-medium tracking-wide">Top tier against wallet cohort</p>
          </div>
        </div>

        {/* Peer Delta */}
        <div className="group relative rounded-xl bg-gradient-to-br from-white/[0.08] to-transparent p-[1px] overflow-hidden transition-transform hover:-translate-y-1">
          <div className={`absolute inset-0 bg-gradient-to-br ${delta >= 0 ? 'from-[#a6e6ff]/10' : 'from-[#ffb4ab]/10'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
          <div className="relative h-full rounded-xl bg-[#13151a]/90 backdrop-blur-sm p-6 border border-white/5 overflow-hidden">
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl transition-colors duration-500 ${delta >= 0 ? 'bg-[#a6e6ff]/20 group-hover:bg-[#a6e6ff]/30' : 'bg-[#ffb4ab]/20 group-hover:bg-[#ffb4ab]/30'}`}></div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/50 mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]" style={{color: deltaColor}}>compare_arrows</span> Peer Delta
                </p>
                <div className="flex items-baseline gap-1 mt-2">
                  <p className="text-4xl font-extrabold tracking-tight" style={{ color: deltaColor, textShadow: `0 0 15px ${deltaGlow}` }}>
                    {delta >= 0 ? `+${delta}` : delta}
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined" style={{color: deltaColor, fontVariationSettings: "'FILL' 1"}}>{delta >= 0 ? 'trending_up' : 'trending_down'}</span>
              </div>
            </div>
            <p className="text-xs text-white/40 mt-4 font-medium tracking-wide">Vs avg wallet score ({averageScore})</p>
          </div>
        </div>

        {/* Risk Regime */}
        <div className="group relative rounded-xl bg-gradient-to-br from-white/[0.08] to-transparent p-[1px] overflow-hidden transition-transform hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-[#b1c5ff]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full rounded-xl bg-[#13151a]/90 backdrop-blur-sm p-6 border border-white/5 overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#b1c5ff]/20 rounded-full blur-2xl group-hover:bg-[#b1c5ff]/30 transition-colors duration-500"></div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/50 mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-[#b1c5ff]">monitoring</span> Risk Regime
                </p>
                <div className="flex items-baseline gap-1 mt-2">
                  <p className="text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(177,197,255,0.3)]">Stable</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[#b1c5ff]" style={{fontVariationSettings: "'FILL' 1"}}>shield</span>
              </div>
            </div>
            <div className="mt-5 relative z-10 flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-[#b1c5ff] rounded-full w-[85%] shadow-[0_0_8px_rgba(177,197,255,0.8)]"></div>
              </div>
              <p className="text-[9px] text-[#b1c5ff] font-bold uppercase tracking-[0.2em] whitespace-nowrap">Low Drift</p>
            </div>
          </div>
        </div>
      </div>

      {/* Factor Insights */}
      <div className="relative z-10 mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-white/40 text-sm">lightbulb</span>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Factor Insights</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {insights.map((insight, index) => (
            <div key={index} className="group relative rounded-xl bg-gradient-to-br from-white/[0.08] to-transparent p-[1px] overflow-hidden transition-transform hover:-translate-y-1">
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                style={{ background: `linear-gradient(to bottom right, ${insight.glow}, transparent)` }}
              ></div>
              <div className="relative h-full flex flex-col rounded-xl bg-[#13151a]/90 backdrop-blur-sm p-6 border border-white/5 overflow-hidden">
                <div 
                  className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" 
                  style={{ backgroundColor: insight.color }}
                ></div>
                
                <div className="flex items-center gap-3 mb-5 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[20px]" style={{ color: insight.color }}>{insight.icon}</span>
                  </div>
                  <h4 className="text-base font-bold text-white/90 group-hover:text-white transition-colors">{insight.factor}</h4>
                </div>
                
                <div className="mt-auto relative z-10">
                  <div 
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 backdrop-blur-sm mb-3"
                    style={{ color: insight.color, boxShadow: `0 0 10px ${insight.glow}` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: insight.color, boxShadow: `0 0 5px ${insight.color}` }}></span>
                    Impact: {insight.impact}
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed font-medium tracking-wide group-hover:text-white/60 transition-colors">{insight.suggestion}</p>
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
            <span className="material-symbols-outlined text-white/40 text-sm">lan</span>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Peer Comparison</h3>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse"></span>
            <span className="text-[9px] font-mono text-white/70 uppercase tracking-widest">Global Network</span>
          </div>
        </div>
        
        <div className="rounded-2xl bg-gradient-to-b from-[#171920]/80 to-[#13151a]/40 p-6 sm:p-8 border border-white/[0.08] relative overflow-hidden group hover:border-white/[0.15] transition-colors duration-500">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMSkiLz48L3N2Zz4=')]"></div>
          
          <div className="relative z-10">
            {/* Visual Head-to-Head */}
            <div className="grid grid-cols-2 gap-4 md:gap-8 mb-10">
              <div className="relative flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md shadow-inner transition-transform duration-300 hover:scale-[1.02] hover:bg-white/[0.04]">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#a6e6ff]/10 rounded-full blur-xl"></div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-3 font-bold">Your Score</span>
                <span className="text-[#a6e6ff] text-5xl md:text-7xl font-black tracking-tighter drop-shadow-[0_0_25px_rgba(166,230,255,0.4)]">{score}</span>
              </div>
              <div className="relative flex flex-col items-center justify-center p-6 rounded-2xl bg-black/20 border border-white/5 backdrop-blur-md shadow-inner transition-transform duration-300 hover:scale-[1.02] hover:bg-white/[0.02]">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30 mb-3 font-bold">Network Avg</span>
                <span className="text-white/60 text-5xl md:text-7xl font-black tracking-tighter drop-shadow-md">{averageScore}</span>
              </div>
            </div>

            {/* Overlapping progress comparative layout */}
            <div className="space-y-6 mb-10">
              <div className="relative group/bar cursor-default">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest mb-2.5">
                  <span className="text-[#a6e6ff] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#a6e6ff] shadow-[0_0_10px_rgba(166,230,255,0.8)]"></span> You
                  </span>
                  <span className="text-[#a6e6ff] font-mono text-sm">{score}</span>
                </div>
                <div className="h-4 bg-black/40 rounded-full overflow-hidden shadow-inner p-0.5 border border-white/[0.02]">
                  <div className="h-full bg-gradient-to-r from-[#a6e6ff]/40 to-[#a6e6ff] rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_15px_rgba(166,230,255,0.5)]" style={{ width: `${(score / 850) * 100}%` }}>
                    <div className="absolute right-1 top-1 bottom-1 w-2 rounded-full bg-white/80 blur-[1px]"></div>
                  </div>
                </div>
              </div>

              <div className="relative group/bar cursor-default">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest mb-2.5">
                   <span className="text-white/50 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/20"></span> Average
                  </span>
                  <span className="text-white/50 font-mono text-sm">{averageScore}</span>
                </div>
                <div className="h-4 bg-black/40 rounded-full overflow-hidden shadow-inner p-0.5 border border-white/[0.02]">
                  <div className="h-full bg-gradient-to-r from-white/10 to-white/30 rounded-full transition-all duration-1000 ease-out" style={{ width: `${(averageScore / 850) * 100}%` }}></div>
                </div>
              </div>
            </div>

            {/* Premium Benchmark Ladder */}
            <div className="pt-8 border-t border-white/[0.08]">
              <h4 className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/40 mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">format_list_numbered</span>
                Cohort Distribution
              </h4>
              <div className="space-y-3">
                {benchmarkLadder.map((row) => {
                  const isCurrentTier = score >= row.value;
                  return (
                    <div key={row.label} className={`group/row relative flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 overflow-hidden ${isCurrentTier ? 'bg-[#a6e6ff]/5 border-[#a6e6ff]/20 hover:border-[#a6e6ff]/40 shadow-sm' : 'bg-transparent border-transparent hover:bg-white/[0.02]'}`}>
                      {isCurrentTier && <div className="absolute inset-0 bg-gradient-to-r from-[#a6e6ff]/0 via-[#a6e6ff]/5 to-[#a6e6ff]/0 animate-pulse pointer-events-none"></div>}
                      
                      <div className="flex items-center gap-3 relative z-10 w-1/3">
                        <div className={`w-1.5 h-6 rounded-full transition-colors ${isCurrentTier ? 'bg-[#a6e6ff] shadow-[0_0_10px_rgba(166,230,255,0.6)]' : 'bg-white/10 group-hover/row:bg-white/20'}`}></div>
                        <span className={`text-sm font-bold tracking-wide ${isCurrentTier ? 'text-white' : 'text-white/40 group-hover/row:text-white/60 transition-colors'}`}>{row.label}</span>
                      </div>
                      
                      <div className="flex items-center gap-6 justify-end relative z-10 flex-1">
                        <div className="hidden sm:flex flex-1 max-w-[200px] h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${isCurrentTier ? 'bg-[#a6e6ff] shadow-[0_0_8px_rgba(166,230,255,0.8)]' : 'bg-white/20'}`}
                            style={{ width: `${(row.value / 850) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center gap-2 min-w-[70px] justify-end">
                          <span className={`font-mono font-bold tracking-tight text-base ${isCurrentTier ? 'text-[#a6e6ff] drop-shadow-[0_0_8px_rgba(166,230,255,0.5)]' : 'text-white/40'}`}>{row.value}</span>
                          {isCurrentTier && <span className="material-symbols-outlined text-[18px] text-[#a6e6ff] drop-shadow-[0_0_8px_rgba(166,230,255,0.5)]" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>}
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
