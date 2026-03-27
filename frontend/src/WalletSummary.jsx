import React from 'react';

const WalletSummary = ({ summary, featuredCollections }) => {
  const walletSummary = summary || {};
  const collections = Array.isArray(featuredCollections) ? featuredCollections : [];

  const stats = [
    {
      title: 'USDT Balance',
      value: walletSummary.usdt_balance_display || 'N/A',
      subtitle: 'Tether USD',
      icon: 'currency_exchange',
      colorBase: 'text-primary',
      bgGlow: 'rgba(177,197,255,0.15)',
      hexColor: '#b1c5ff',
      hoverBorder: 'hover:border-primary/50',
      hoverShadow: 'hover:shadow-[0_8px_24px_rgba(177,197,255,0.2)]',
    },
    {
      title: 'ENS Identity',
      value: walletSummary.ens_name || 'N/A',
      subtitle: 'Wallet naming',
      icon: 'alternate_email',
      colorBase: 'text-tertiary',
      bgGlow: 'rgba(205,189,255,0.15)',
      hexColor: '#cdbdff',
      hoverBorder: 'hover:border-tertiary/50',
      hoverShadow: 'hover:shadow-[0_8px_24px_rgba(205,189,255,0.2)]',
    },
    {
      title: 'Transaction Count',
      value: `${walletSummary.transaction_count ?? 'N/A'}`,
      subtitle: walletSummary.account_age_display || 'Account age unavailable',
      icon: 'history',
      colorBase: 'text-primary',
      bgGlow: 'rgba(177,197,255,0.15)',
      hexColor: '#b1c5ff',
      hoverBorder: 'hover:border-primary/50',
      hoverShadow: 'hover:shadow-[0_8px_24px_rgba(177,197,255,0.2)]',
    },
    {
      title: 'Network Diversity',
      value: typeof walletSummary.network_diversity === 'number' ? `${walletSummary.network_diversity} chains` : 'N/A',
      subtitle: `${walletSummary.nft_count ?? 0} NFTs tracked`,
      icon: 'lan',
      colorBase: 'text-tertiary',
      bgGlow: 'rgba(205,189,255,0.15)',
      hexColor: '#cdbdff',
      hoverBorder: 'hover:border-tertiary/50',
      hoverShadow: 'hover:shadow-[0_8px_24px_rgba(205,189,255,0.2)]',
    },
  ];

  return (
    <section className="space-y-8 relative">
      <div className="space-y-4">
        <div className="flex justify-between items-end border-b border-outline-variant/15 pb-2">
          <h2 className="text-sm font-bold tracking-widest uppercase text-on-surface/90">On-Chain Assets</h2>
          <span className="text-[10px] font-mono text-tertiary/80 uppercase tracking-widest flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
            Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
          {stats.map((stat) => (
            <article 
              key={stat.title} 
              className={`group relative flex items-center justify-between p-4 rounded-xl bg-surface-container/50 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:border-white/20 cursor-default overflow-hidden ${stat.hoverBorder} ${stat.hoverShadow}`}
            >
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ backgroundColor: stat.bgGlow }}></div>
              
              <div className="relative z-10 flex items-center gap-3 min-w-0">
                <div 
                  className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center bg-surface-container border border-outline-variant/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] group-hover:scale-105 transition-transform duration-300`}
                  style={{ color: stat.hexColor }}
                >
                  <span className="material-symbols-outlined text-[20px]">{stat.icon}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] sm:text-sm font-semibold text-on-surface/90 truncate group-hover:text-on-surface transition-colors">{stat.title}</div>
                  <div className="text-[10px] sm:text-[11px] font-mono text-on-surface-variant truncate">{stat.subtitle}</div>
                </div>
              </div>
              <div className="relative z-10 text-right shrink-0">
                <div className={`text-sm md:text-base font-extrabold ${stat.colorBase}`}>{stat.value}</div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end border-b border-outline-variant/15 pb-2">
          <h2 className="text-sm font-bold tracking-widest uppercase text-on-surface/90">Collections</h2>
          <span className="text-[10px] font-mono text-on-surface-variant/80 uppercase tracking-widest">{walletSummary.nft_count ?? 0} Assets</span>
        </div>

        {collections.length === 0 ? (
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/50 backdrop-blur-xl p-4 text-xs text-on-surface-variant leading-relaxed shadow-[inset_0_1px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.2)]">
            No NFT collection data returned from configured providers.
          </div>
        ) : (
          <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-4 pt-1 snap-x snap-mandatory">
            {collections.map((collection, i) => {
              // Alternate colors for variety
              const accentColor = i % 2 === 0 ? '#b1c5ff' : '#cdbdff';
              const hoverBorder = i % 2 === 0 ? 'hover:border-primary/50' : 'hover:border-tertiary/50';
              const hoverShadow = i % 2 === 0 ? 'hover:shadow-[0_8px_24px_rgba(177,197,255,0.2)]' : 'hover:shadow-[0_8px_24px_rgba(205,189,255,0.2)]';
              const bgGlow = i % 2 === 0 ? 'rgba(177,197,255,0.15)' : 'rgba(205,189,255,0.15)';
              const icon = i % 2 === 0 ? 'hexagon' : 'token';

              return (
                <article 
                  key={`${collection.chain}-${collection.name}`} 
                  className={`group relative snap-start flex-shrink-0 w-48 rounded-xl border border-outline-variant/30 bg-surface-container/50 backdrop-blur-xl p-0 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 border border-white/10 self-start overflow-hidden hover:border-white/20 ${hoverBorder} ${hoverShadow}`}
                >
                  <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ backgroundColor: bgGlow }}></div>
                  
                  {collection.imageUrl && (
                    <div className="w-full h-32 bg-surface-container overflow-hidden relative">
                      <img src={collection.imageUrl} alt={collection.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent"></div>
                    </div>
                  )}

                  <div className="relative z-10 flex flex-col p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-on-surface-variant/80 bg-surface-container border border-outline-variant/10 px-2 py-0.5 rounded-md">{collection.chain || 'unknown'}</div>
                      <span className="material-symbols-outlined text-[14px]" style={{ color: accentColor }}>{icon}</span>
                    </div>
                    <div className="text-[13px] sm:text-sm font-extrabold text-on-surface truncate group-hover:text-white transition-colors">{collection.name}</div>
                    <div className="mt-1 text-[11px] sm:text-xs font-mono font-medium" style={{ color: accentColor }}>{collection.quantity ?? 1} items</div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default WalletSummary;
