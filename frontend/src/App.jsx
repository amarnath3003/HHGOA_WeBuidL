import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';
import CreditScoreSpeedometer from './CreditScoreSpeedometer.jsx';
import WalletSummary from './WalletSummary.jsx';
import ScoreBreakdown from './ScoreBreakdown.jsx';
import ScoreAnalysis from './ScoreAnalysis.jsx';
import './App.css';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

function App() {
  const [web3, setWeb3] = useState(null);
  const [address, setAddress] = useState('');
  const [creditScore, setCreditScore] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [isLoadingScore, setIsLoadingScore] = useState(false);
  const [scoreError, setScoreError] = useState('');
  const [hasRequestedScore, setHasRequestedScore] = useState(false);

  useEffect(() => {
    const init = async () => {
      const provider = await detectEthereumProvider();
      if (provider) {
        const web3Instance = new Web3(provider);
        setWeb3(web3Instance);
      } else {
        console.log('Please install MetaMask!');
      }
    };

    init();
  }, []);

  const connectWallet = async () => {
    if (web3) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3.eth.getAccounts();
        setAddress(accounts[0]);
        setHasRequestedScore(false);
        setScoreError('');
      } catch (error) {
        console.error("User denied account access");
      }
    } else {
      alert('Please install MetaMask to use this feature');
    }
  };

  const getCreditScore = async () => {
    if (!address) {
      return;
    }

    setHasRequestedScore(true);
    setIsLoadingScore(true);
    setScoreError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || payload.error || 'Unable to calculate credit score.');
      }

      setCreditScore(payload.score);
      setWalletData(payload);
    } catch (error) {
      setScoreError(error.message || 'Unable to calculate credit score.');
      setCreditScore(null);
      setWalletData(null);
    } finally {
      setIsLoadingScore(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body pb-32 selection:bg-primary selection:text-on-primary">
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 sm:px-6 py-4 bg-background/80 backdrop-blur-xl shadow-[0px_0px_40px_0px_rgba(177,197,255,0.06)]">
        <div className="mx-auto w-full max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="brand-logo-orb material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>security</span>
            <h1 className="brand-title text-2xl sm:text-[1.7rem] font-black tracking-tight">EtherScore</h1>
          </div>

          <div className="flex items-center gap-3">
            {!address ? (
              <button
                onClick={connectWallet}
                className="rounded-full px-6 sm:px-8 py-3 sm:py-3.5 bg-tertiary-container text-tertiary-fixed text-sm sm:text-base font-semibold shadow-[0_8px_28px_rgba(98,42,228,0.45),inset_0_1px_rgba(255,255,255,0.2)] hover:shadow-[0_10px_34px_rgba(98,42,228,0.62),inset_0_1px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300 flex items-center gap-2 border border-tertiary/30"
              >
                <span className="material-symbols-outlined text-base sm:text-lg">shield</span>
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-surface-container-high/60 backdrop-blur-md px-4 py-2 rounded-full border border-outline-variant/30 shadow-[inset_0_1px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.1)] hover:bg-surface-container-highest/80 hover:border-outline-variant/50 hover:shadow-[inset_0_1px_rgba(255,255,255,0.1),0_6px_16px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer">
                <span className="material-symbols-outlined text-sm text-tertiary-fixed-dim drop-shadow-[0_0_8px_rgba(205,189,255,0.5)]" style={{fontVariationSettings: "'FILL' 1"}}>account_balance_wallet</span>
                <span className="font-mono text-sm tracking-tight text-on-surface-variant group-hover:text-on-surface transition-colors font-medium">{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="mx-auto w-full max-w-7xl space-y-8">
          {!address && (
            <section className="flex justify-center opacity-0 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
              <div className="flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-2.5 sm:py-3 bg-tertiary/5 backdrop-blur-md rounded-full border border-tertiary/30 shadow-[inset_0_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(205,189,255,0.15)] group hover:bg-tertiary/10 hover:border-tertiary/50 transition-all duration-500">
                <span className="material-symbols-outlined text-tertiary-fixed-dim text-base sm:text-lg drop-shadow-[0_0_8px_rgba(205,189,255,0.5)] group-hover:scale-110 transition-transform duration-300" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
                <span className="text-tertiary-fixed-dim text-sm sm:text-base uppercase tracking-[0.2em] font-mono font-bold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-tertiary-fixed to-primary-fixed">Nada AI Protected</span>
              </div>
            </section>
          )}

          {address && !hasRequestedScore && (
            <section className="flex justify-center opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <button
                onClick={getCreditScore}
                disabled={isLoadingScore}
                className="score-cta-button relative overflow-hidden group w-full max-w-lg rounded-full py-4 sm:py-5 px-8 bg-tertiary-container transition-all text-tertiary-fixed text-base sm:text-lg font-bold tracking-wide hover:-translate-y-1 active:scale-95 active:translate-y-0 duration-300"
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <span className="relative z-10">
                  {isLoadingScore ? 'Calculating Score...' : 'Generate Credit Score'}
                </span>
              </button>
            </section>
          )}

          {scoreError && (
            <section className="max-w-2xl mx-auto text-center">
              <p className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">{scoreError}</p>
            </section>
          )}

          {!address && (
            <section className="mt-12 sm:mt-16 max-w-4xl mx-auto text-center opacity-0 animate-fade-in-up" style={{ animationDelay: '140ms' }}>
              <div className="relative inline-block mb-6">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary to-tertiary opacity-20 blur-xl group-hover:opacity-40 transition duration-1000 animate-pulse"></div>
                <h2 className="relative text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-on-surface-variant to-surface-variant drop-shadow-sm">
                  Decentralized Credit. <br className="hidden sm:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-fixed to-tertiary-fixed">Zero Compromise.</span>
                </h2>
              </div>
              <p className="text-lg sm:text-xl lg:text-2xl leading-relaxed sm:leading-relaxed text-on-surface-variant font-medium">Connect your wallet to initialize privacy-preserving score computation and unlock your on-chain credit intelligence dashboard.</p>
            </section>
          )}

          {creditScore && (
            <>
              <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <CreditScoreSpeedometer score={creditScore} />
              </div>

              <section className="grid grid-cols-2 gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <div className="p-5 rounded-2xl bg-surface-container-high/40 backdrop-blur-xl border border-outline-variant/30 shadow-[inset_0_1px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.2)] group hover:border-outline-variant/50 hover:bg-surface-container-highest/40 hover:shadow-[inset_0_1px_rgba(255,255,255,0.1),0_8px_24px_rgba(0,0,0,0.3)] transition-all duration-500 space-y-1">
                  <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest block">Total Assets</span>
                  <div className="text-xl sm:text-2xl font-black text-on-surface tracking-tight group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-surface-variant transition-all duration-300">{walletData?.summary?.total_assets_display || '$0.00'}</div>
                </div>
                <div className="p-5 rounded-2xl bg-surface-container-high/40 backdrop-blur-xl border border-outline-variant/30 shadow-[inset_0_1px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.2)] group hover:border-outline-variant/50 hover:bg-surface-container-highest/40 hover:shadow-[inset_0_1px_rgba(255,255,255,0.1),0_8px_24px_rgba(0,0,0,0.3)] transition-all duration-500 space-y-1">
                  <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest block">Trust Score</span>
                  <div className="text-xl sm:text-2xl font-black text-tertiary-fixed-dim tracking-tight group-hover:shadow-glow transition-all duration-300">{walletData?.trust_level || 'Pending'}</div>
                </div>
              </section>

              <section className="space-y-3 max-w-4xl opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 shadow-[inset_0_1px_rgba(255,255,255,0.1)] mb-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">Nada Risk Engine</p>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-on-surface-variant drop-shadow-sm">Deep Credit Diagnostics</h2>
                <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl leading-relaxed">Your score intelligence prioritizes behavioral quality, consistency, and peer-relative resilience. Breakdown and peer analytics are now primary.</p>
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start opacity-0 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                <div className="lg:col-span-8 space-y-8">
                  <ScoreBreakdown factors={walletData?.factors} summary={walletData?.summary} warnings={walletData?.meta?.warnings} />
                  <ScoreAnalysis payload={walletData} />
                </div>

                <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-28">
                  <WalletSummary summary={walletData?.summary} featuredCollections={walletData?.featured_collections} />
                </aside>
              </section>
            </>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center pb-safe pt-2 px-4 pb-4 bg-background/70 backdrop-blur-3xl rounded-t-[2.5rem] border-t border-outline-variant/30 shadow-[0_-8px_32px_rgba(0,0,0,0.4),inset_0_1px_rgba(255,255,255,0.05)] text-center w-full max-w-lg mx-auto sm:mb-6 sm:rounded-full sm:border">
        <div className="w-full flex justify-around items-center gap-1 sm:gap-4 px-2">
          <button className="group relative flex flex-col items-center justify-center text-tertiary-fixed-dim bg-tertiary/15 shadow-[inset_0_1px_rgba(255,255,255,0.2)] rounded-2xl sm:rounded-full px-5 py-2.5 sm:px-6 sm:py-3 transition-all duration-300 hover:shadow-[0_0_24px_rgba(205,189,255,0.4),inset_0_1px_rgba(255,255,255,0.3)] hover:-translate-y-1 active:scale-95">
            <span className="material-symbols-outlined text-xl sm:text-2xl transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(205,189,255,0.6)]" style={{fontVariationSettings: "'FILL' 1"}}>home</span>
            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest mt-1.5 font-bold">Home</span>
          </button>
          <button className="group flex flex-col items-center justify-center text-on-surface-variant hover:text-primary-fixed-dim rounded-2xl sm:rounded-full px-5 py-2.5 sm:px-6 sm:py-3 transition-all duration-300 hover:bg-primary/5 hover:shadow-[inset_0_1px_rgba(255,255,255,0.05)] hover:-translate-y-1 active:scale-95">
            <span className="material-symbols-outlined text-xl sm:text-2xl transition-transform duration-300 group-hover:scale-110">history</span>
            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest mt-1.5 font-semibold group-hover:font-bold transition-all">History</span>
          </button>
          <button className="group flex flex-col items-center justify-center text-on-surface-variant hover:text-tertiary-fixed-dim rounded-2xl sm:rounded-full px-5 py-2.5 sm:px-6 sm:py-3 transition-all duration-300 hover:bg-tertiary/5 hover:shadow-[inset_0_1px_rgba(255,255,255,0.05)] hover:-translate-y-1 active:scale-95">
            <span className="material-symbols-outlined text-xl sm:text-2xl transition-transform duration-300 group-hover:scale-110">verified_user</span>
            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest mt-1.5 font-semibold group-hover:font-bold transition-all">Security</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
