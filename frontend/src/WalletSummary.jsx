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
    <div className="wallet-summary">
      <h2>Wallet Summary</h2>
      <div className="balance">
        <span>Balance: {balance}</span>
      </div>
      <div className="nft-holdings">
        <span>NFT Holdings:</span>
        <div className="nft-grid">
          {nfts.map(nft => (
            <div key={nft.id} className="nft-card">
              <img src={nft.thumbnail} alt={nft.name} className="nft-image" />
              <div className="nft-info">
                <p>{nft.name}</p>
                <p>Last sale: {nft.lastSale}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletSummary;
