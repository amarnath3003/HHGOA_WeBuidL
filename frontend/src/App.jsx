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
                className="rounded-full px-6 sm:px-8 py-3 sm:py-3.5 bg-tertiary-container text-tertiary-fixed text-sm sm:text-base font-semibold shadow-[0_8px_28px_rgba(98,42,228,0.45)] hover:shadow-[0_10px_34px_rgba(98,42,228,0.62)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base sm:text-lg">shield</span>
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-full hover:bg-surface-container-highest hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 group cursor-pointer">
                <span className="material-symbols-outlined text-xs text-tertiary-fixed-dim" style={{fontVariationSettings: "'FILL' 1"}}>account_balance_wallet</span>
                <span className="font-mono text-xs tracking-tight text-on-surface-variant group-hover:text-on-surface transition-colors">{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="mx-auto w-full max-w-7xl space-y-8">
          {!address && (
            <section className="flex justify-center opacity-0 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
              <div className="flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-2.5 sm:py-3 bg-tertiary-container/20 rounded-full border border-tertiary/30 shadow-[0_0_22px_rgba(205,189,255,0.38)]">
                <span className="material-symbols-outlined text-tertiary-fixed-dim text-base sm:text-lg" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
                <span className="text-tertiary-fixed-dim text-sm sm:text-base uppercase tracking-[0.2em] font-mono">Nada AI Protected</span>
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
            <section className="mt-8 sm:mt-10 max-w-3xl mx-auto text-center text-on-surface-variant opacity-0 animate-fade-in-up" style={{ animationDelay: '140ms' }}>
              <p className="text-lg sm:text-2xl leading-relaxed sm:leading-relaxed">Connect your wallet to initialize privacy-preserving score computation and unlock your on-chain credit intelligence dashboard.</p>
            </section>
          )}

          {creditScore && (
            <>
              <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <CreditScoreSpeedometer score={creditScore} />
              </div>

              <section className="grid grid-cols-2 gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <div className="p-5 rounded-xl bg-surface-container-high border border-white/5 space-y-1 hover:border-white/20 transition-colors duration-300">
                  <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest block">Total Assets</span>
                  <div className="text-lg font-bold text-on-surface">{walletData?.summary?.total_assets_display || '$0.00'}</div>
                </div>
                <div className="p-5 rounded-xl bg-surface-container-high border border-white/5 space-y-1 hover:border-white/20 transition-colors duration-300">
                  <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest block">Trust Score</span>
                  <div className="text-lg font-bold text-tertiary-fixed-dim">{walletData?.trust_level || 'Pending'}</div>
                </div>
              </section>

              <section className="space-y-3 max-w-4xl opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-on-surface-variant">Nada Risk Engine</p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Deep Credit Diagnostics</h2>
                <p className="text-sm text-on-surface-variant max-w-2xl">Your score intelligence prioritizes behavioral quality, consistency, and peer-relative resilience. Breakdown and peer analytics are now primary.</p>
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

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center pb-safe pt-2 px-4 pb-4 bg-background/90 backdrop-blur-2xl rounded-t-3xl border-t border-primary/15 shadow-2xl">
        <div className="max-w-7xl w-full mx-auto flex justify-around sm:justify-center sm:gap-16">
          <button className="group flex flex-col items-center justify-center text-tertiary-fixed-dim bg-tertiary/10 rounded-xl px-4 py-2 scale-110 duration-300 hover:shadow-glow hover:-translate-y-1 active:scale-95">
            <span className="material-symbols-outlined transition-transform duration-300 group-hover:scale-110" style={{fontVariationSettings: "'FILL' 1"}}>home</span>
            <span className="font-mono text-[10px] uppercase tracking-widest mt-1">Home</span>
          </button>
          <button className="group flex flex-col items-center justify-center text-on-surface-variant hover:text-tertiary px-4 py-2 transition-all duration-300 hover:-translate-y-1 active:scale-95">
            <span className="material-symbols-outlined transition-transform duration-300 group-hover:scale-110">history</span>
            <span className="font-mono text-[10px] uppercase tracking-widest mt-1 group-hover:text-tertiary transition-colors">History</span>
          </button>
          <button className="group flex flex-col items-center justify-center text-on-surface-variant hover:text-tertiary px-4 py-2 transition-all duration-300 hover:-translate-y-1 active:scale-95">
            <span className="material-symbols-outlined transition-transform duration-300 group-hover:scale-110">verified_user</span>
            <span className="font-mono text-[10px] uppercase tracking-widest mt-1 group-hover:text-tertiary transition-colors">Security</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
