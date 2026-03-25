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
        throw new Error(payload.error || 'Unable to calculate credit score.');
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
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mt-4 max-w-7xl glass-panel ghost-outline rounded-xl shadow-ambient">
          <div className="flex items-center justify-between px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
              <h1 className="text-xl font-semibold tracking-tight text-on-surface">EtherScore</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {!address ? (
                <button
                  onClick={connectWallet}
                  className="rounded-full px-4 py-2 bg-primary-container text-on-primary text-xs font-semibold hover:bg-inverse-primary hover:shadow-glow transition-all duration-300 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">shield</span>
                  Connect
                </button>
              ) : (
                <div className="rounded-full px-3 py-1.5 bg-surface-container-high ghost-outline flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                  <span className="font-mono text-xs tracking-tight text-on-surface-variant">{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
                </div>
              )}

              <button className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors" type="button" aria-label="Settings">
                <span className="material-symbols-outlined text-base">settings</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mx-auto w-full max-w-7xl space-y-14 md:space-y-20">
          <section className="flex justify-center">
            <div className="glass-panel ghost-outline rounded-full px-4 py-1.5 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary-fixed-dim text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">Nada AI Protected</span>
            </div>
          </section>

          {address && (
            <section className="flex justify-center opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <button
                onClick={getCreditScore}
                disabled={isLoadingScore}
                className={`w-full max-w-md rounded-full py-3 px-6 text-sm font-semibold tracking-wide transition-all duration-300 ${isLoadingScore ? 'shimmer-loading bg-surface-container-high text-on-surface' : 'bg-primary text-on-primary hover:bg-primary-fixed hover:-translate-y-0.5 hover:shadow-glow'}`}
              >
                {isLoadingScore ? 'Calculating Score...' : creditScore ? 'Recalculate Credit Score' : 'Generate Credit Score'}
              </button>
            </section>
          )}

          {scoreError && (
            <section className="max-w-2xl mx-auto text-center">
              <p className="rounded-xl px-4 py-3 text-sm text-error bg-error/10 ghost-outline">{scoreError}</p>
            </section>
          )}

          {!address && (
            <section className="max-w-2xl mx-auto text-center text-on-surface-variant">
              <p className="text-sm md:text-base">Connect your wallet to initialize privacy-preserving score computation and unlock your on-chain credit intelligence dashboard.</p>
            </section>
          )}

          {creditScore && (
            <>
              <section className="opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <CreditScoreSpeedometer score={creditScore} />
              </section>

              <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <div className="tonal-panel p-5 space-y-1 bg-surface-container-low hover:bg-surface-container-high transition-colors duration-300">
                  <span className="section-kicker block">Total Assets</span>
                  <div className="text-lg font-semibold text-on-surface">{walletData?.summary?.total_assets_display || '$0.00'}</div>
                </div>
                <div className="tonal-panel p-5 space-y-1 bg-surface-container-low hover:bg-surface-container-high transition-colors duration-300">
                  <span className="section-kicker block">Trust Score</span>
                  <div className="text-lg font-semibold text-tertiary">{walletData?.trust_level || 'Pending'}</div>
                </div>
              </section>

              <section className="space-y-3 max-w-4xl opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <p className="section-kicker">Nada Risk Engine</p>
                <h2 className="editorial-heading">Deep Credit Diagnostics</h2>
                <p className="text-sm text-on-surface-variant max-w-2xl">Your score intelligence prioritizes behavioral quality, consistency, and peer-relative resilience. Breakdown and peer analytics are now primary.</p>
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 items-start opacity-0 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                <div className="lg:col-span-8 space-y-8 md:space-y-10">
                  <ScoreBreakdown factors={walletData?.factors} />
                  <ScoreAnalysis score={creditScore} />
                </div>

                <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-28">
                  <WalletSummary summary={walletData?.summary} featuredCollections={walletData?.featured_collections} />
                </aside>
              </section>
            </>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pb-4">
        <div className="max-w-7xl mx-auto glass-panel ghost-outline rounded-t-3xl px-4 py-2">
          <div className="w-full mx-auto flex justify-around sm:justify-center sm:gap-16">
            <button className="group flex flex-col items-center justify-center text-tertiary-fixed-dim bg-surface-container-high rounded-lg px-4 py-2 transition-colors duration-300">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
              <span className="font-mono text-[10px] uppercase tracking-widest mt-1">Home</span>
            </button>
            <button className="group flex flex-col items-center justify-center text-on-surface-variant hover:text-tertiary px-4 py-2 transition-colors duration-300">
              <span className="material-symbols-outlined">history</span>
              <span className="font-mono text-[10px] uppercase tracking-widest mt-1">History</span>
            </button>
            <button className="group flex flex-col items-center justify-center text-on-surface-variant hover:text-tertiary px-4 py-2 transition-colors duration-300">
              <span className="material-symbols-outlined">verified_user</span>
              <span className="font-mono text-[10px] uppercase tracking-widest mt-1">Security</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default App;
