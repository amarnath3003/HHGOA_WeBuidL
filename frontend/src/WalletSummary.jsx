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
      color: 'text-tertiary',
      background: 'bg-tertiary-container/30',
    },
    {
      title: 'ENS Identity',
      value: walletSummary.ens_name || 'N/A',
      subtitle: 'Wallet naming',
      icon: 'alternate_email',
      color: 'text-tertiary',
      background: 'bg-tertiary-container/20',
    },
    {
      title: 'Transaction Count',
      value: `${walletSummary.transaction_count ?? 'N/A'}`,
      subtitle: walletSummary.account_age_display || 'Account age unavailable',
      icon: 'history',
      color: 'text-primary',
      background: 'bg-primary/15',
    },
    {
      title: 'Network Diversity',
      value: typeof walletSummary.network_diversity === 'number' ? `${walletSummary.network_diversity} chains` : 'N/A',
      subtitle: `${walletSummary.nft_count ?? 0} NFTs tracked`,
      icon: 'lan',
      color: 'text-primary',
      background: 'bg-primary/10',
    },
  ];

  return (
    <section className="space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-base font-bold tracking-tight uppercase">On-Chain Assets</h2>
          <span className="text-[11px] font-mono text-tertiary/70 uppercase tracking-wider">Verified by Backend</span>
        </div>

        <div className="space-y-3">
          {stats.map((stat) => (
            <article key={stat.title} className="group flex items-center justify-between p-4 rounded-xl bg-surface-container-low ghost-border hover:bg-surface-container-high transition-all duration-300 hover:-translate-y-1 hover:shadow-lg gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-full ${stat.background} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <span className={`material-symbols-outlined ${stat.color}`}>{stat.icon}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold group-hover:text-tertiary-fixed-dim transition-colors">{stat.title}</div>
                  <div className="text-xs font-mono text-on-surface-variant truncate">{stat.subtitle}</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-sm md:text-base font-mono font-bold ${stat.color}`}>{stat.value}</div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold tracking-tight uppercase">Collections</h2>
          <span className="text-[11px] font-mono text-on-surface-variant">{walletSummary.nft_count ?? 0} Assets</span>
        </div>

        {collections.length === 0 ? (
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4 text-sm text-on-surface-variant">
            No NFT collection data returned from configured providers.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pt-2">
            {collections.map((collection) => (
              <article key={`${collection.chain}-${collection.name}`} className="flex-shrink-0 w-44 rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant">{collection.chain || 'unknown chain'}</div>
                <div className="mt-3 text-sm font-bold text-on-surface truncate">{collection.name}</div>
                <div className="mt-2 text-xs font-mono text-tertiary">{collection.quantity ?? 1} items</div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default WalletSummary;
