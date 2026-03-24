import React from 'react';

const WalletSummary = () => {
  const balance = '$12,450.00';
  const ensName = 'etherean.eth';

  const nfts = [
    {
      id: 1,
      name: 'Ethereal Void #42',
      thumbnail: 'https://i.seadn.io/gae/qoR1cWuIZzjlrNVcSMAzhrwDvXNtMxaYuDbNqkc_J5WGGqMSrF0wzO7K2MnSCEBLG8G8pZyJPqV7eTGt4wGwret85sbXJBYoAkypdQ?auto=format&dpr=1&w=1000',
      lastSale: '90 ETH'
    },
    {
      id: 2,
      name: 'Crystal Node #109',
      thumbnail: 'https://i.seadn.io/gae/zhBAmEH_zYzNsK2HRaD_qWV43fBz8B5urR0qxy0rjpy5lGSMz1AU_sLyRxttBuMPt76FkF8k4xqg7NGGRDCps52M3ss_0dxoSUKT?auto=format&dpr=1&w=1000',
      lastSale: '60 ETH'
    },
    {
      id: 3,
      name: 'Pulse Wave #01',
      thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDW_F5Nl2zAVt1ZHB7jfreqiMHzVGzNZ9-M4IEAGubT_4w-RQeA95tJZ5Y-xfh7hFHTZ72C1yr74Qh42HwOSxixgK_yFMeALN_UJPTRLita_oUuyzokNP-awL2L-220y2LCCeIq_tJ893U1ixubjTlG5Z0uAtRHeW0S9WEi-gcbWuEypEJHGMfVw7FhCkNscMtkNYyexfM9g4VRfFz5SWIQge4LW-A688FmfeG3xKU5GuePvYNfK2o1OWG4LSzRFhl_D6KKpnhL-tXu',
      lastSale: '42 ETH'
    },
  ];

  return (
    <section className="space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-base font-bold tracking-tight uppercase">On-Chain Assets</h2>
          <span className="text-[11px] font-mono text-tertiary/70 uppercase tracking-wider">Verified by Nada</span>
        </div>

        <div className="space-y-3">
          <article className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low ghost-border hover:bg-surface-container-high transition-colors gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-tertiary-container/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-tertiary">currency_exchange</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">USDT Balance</div>
                <div className="text-xs font-mono text-on-surface-variant">Tether USD</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm md:text-base font-mono font-bold text-tertiary">{balance}</div>
              <div className="text-xs text-on-surface-variant">ERC-20</div>
            </div>
          </article>

          <article className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low ghost-border hover:bg-surface-container-high transition-colors gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-tertiary">alternate_email</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">ENS Identity</div>
                <div className="text-xs font-mono text-on-surface-variant truncate">{ensName}</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-sm">open_in_new</span>
          </article>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold tracking-tight uppercase">Collections</h2>
          <span className="text-[11px] font-mono text-on-surface-variant">{nfts.length} Assets</span>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {nfts.map((nft) => (
            <article key={nft.id} className="flex-shrink-0 w-40 group cursor-pointer">
              <div className="aspect-square rounded-xl overflow-hidden bg-surface-container-highest mb-2">
                <img src={nft.thumbnail} alt={nft.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="text-xs font-bold truncate">{nft.name}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WalletSummary;
