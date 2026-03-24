import React from 'react';

const WalletSummary = () => {
  const balance = '1,250 USDT';
  const nfts = [
    {
      id: 1,
      name: 'CryptoPunk #1234',
      thumbnail: 'https://i.seadn.io/gae/qoR1cWuIZzjlrNVcSMAzhrwDvXNtMxaYuDbNqkc_J5WGGqMSrF0wzO7K2MnSCEBLG8G8pZyJPqV7eTGt4wGwret85sbXJBYoAkypdQ?auto=format&dpr=1&w=1000',
      lastSale: '90 ETH',
    },
    {
      id: 2,
      name: 'Bored Ape #5678',
      thumbnail: 'https://i.seadn.io/gae/zhBAmEH_zYzNsK2HRaD_qWV43fBz8B5urR0qxy0rjpy5lGSMz1AU_sLyRxttBuMPt76FkF8k4xqg7NGGRDCps52M3ss_0dxoSUKT?auto=format&dpr=1&w=1000',
      lastSale: '60 ETH',
    },
  ];

  return (
    <section className="space-y-5">
      <div className="rounded-xl bg-surface-container-high p-5 ghost-border">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Wallet Summary</h2>
            <p className="mt-1 text-xs text-on-surface-variant">AI-verifiable portfolio posture</p>
          </div>
          <span className="material-symbols-outlined text-tertiary">account_balance_wallet</span>
        </div>

        <div className="mt-5 rounded-lg bg-surface-container-low p-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-on-surface-variant">Stablecoin Liquidity</div>
          <div className="mt-2 text-2xl font-bold ai-shimmer">{balance}</div>
        </div>
      </div>

      <div className="rounded-xl bg-surface-container-high p-5 ghost-border">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-semibold">NFT Holdings</span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">2 Assets</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {nfts.map(nft => (
            <article key={nft.id} className="rounded-lg bg-surface-container-low overflow-hidden">
              <img src={nft.thumbnail} alt={nft.name} className="h-44 w-full object-cover" />
              <div className="p-3 space-y-1">
                <p className="text-sm font-semibold truncate">{nft.name}</p>
                <p className="text-xs font-mono text-on-surface-variant">Last Sale: {nft.lastSale}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WalletSummary;
