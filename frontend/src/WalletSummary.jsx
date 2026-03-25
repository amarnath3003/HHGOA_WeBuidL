import React from 'react';

const fallbackSummary = {
  usdt_balance_display: '$0.00',
  ens_name: 'No ENS set',
  nft_count: 0,
  transaction_count: 0,
  account_age_display: '0 days',
  network_diversity: 0,
};

const fallbackCollections = [
  { name: 'Nebula Vault', tier: 'Blue Chip', estimated_value_display: '$0.00', accent: '#b1c5ff' },
  { name: 'Signal Archive', tier: 'Growth', estimated_value_display: '$0.00', accent: '#cdbdff' },
  { name: 'Atlas Registry', tier: 'Emerging', estimated_value_display: '$0.00', accent: '#622ae4' },
];

const WalletSummary = ({ summary = fallbackSummary, featuredCollections = fallbackCollections }) => {
  const walletSummary = summary || fallbackSummary;
  const collections = Array.isArray(featuredCollections) && featuredCollections.length > 0 ? featuredCollections : fallbackCollections;

  const stats = [
    {
      title: 'USDT Balance',
      value: walletSummary.usdt_balance_display,
      subtitle: 'Tether USD',
      icon: 'currency_exchange',
      color: 'text-tertiary',
      background: 'bg-tertiary-container/30',
    },
    {
      title: 'ENS Identity',
      value: walletSummary.ens_name || 'No ENS set',
      subtitle: 'Wallet naming',
      icon: 'alternate_email',
      color: 'text-tertiary',
      background: 'bg-tertiary-container/20',
    },
    {
      title: 'Transaction Count',
      value: `${walletSummary.transaction_count ?? 0}`,
      subtitle: walletSummary.account_age_display || 'Account activity',
      icon: 'history',
      color: 'text-primary',
      background: 'bg-primary/15',
    },
    {
      title: 'Network Diversity',
      value: `${walletSummary.network_diversity ?? 0} chains`,
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

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pt-2">
          {collections.map((collection) => (
            <article key={collection.name} className="flex-shrink-0 w-40 group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
              <div
                className="aspect-square rounded-xl mb-2 shadow-sm group-hover:shadow-lg transition-all duration-300 flex flex-col justify-between p-4 border border-white/10"
                style={{
                  background: `linear-gradient(160deg, ${collection.accent}33, rgba(19, 19, 19, 0.95))`,
                  boxShadow: `0 20px 40px -24px ${collection.accent}`,
                }}
              >
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/65">{collection.tier}</span>
                <div>
                  <div className="text-xl font-black text-white/90">{collection.name.slice(0, 2).toUpperCase()}</div>
                  <div className="text-xs text-white/50 mt-1">Estimated</div>
                </div>
              </div>
              <div className="text-xs font-bold truncate group-hover:text-tertiary-fixed-dim transition-colors">{collection.name}</div>
              <div className="text-[11px] font-mono text-on-surface-variant mt-1">{collection.estimated_value_display}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WalletSummary;
