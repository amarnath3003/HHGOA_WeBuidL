import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';
import CreditScoreSpeedometer from './CreditScoreSpeedometer.jsx';
import WalletSummary from './WalletSummary.jsx';
import ScoreBreakdown from './ScoreBreakdown.jsx';
import ScoreAnalysis from './ScoreAnalysis.jsx';
import './App.css';

function App() {
  const [web3, setWeb3] = useState(null);
  const [address, setAddress] = useState('');
  const [creditScore, setCreditScore] = useState(null);

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
      } catch (error) {
        console.error("User denied account access");
      }
    } else {
      alert('Please install MetaMask to use this feature');
    }
  };

  const getCreditScore = () => {
    const score = Math.floor(Math.random() * (850 - 300 + 1)) + 300;
    setCreditScore(score);
  };

  return (
    <div className="min-h-screen bg-[#131313] text-on-surface font-body pb-32 selection:bg-primary selection:text-on-primary">
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-[#131313]/80 backdrop-blur-xl shadow-[0px_0px_40px_0px_rgba(177,197,255,0.06)]">
        <div className="mx-auto w-full max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary-fixed-dim" style={{fontVariationSettings: "'FILL' 1"}}>security</span>
            <h1 className="text-xl font-bold tracking-tighter text-tertiary-fixed-dim">EtherScore</h1>
          </div>

          <div className="flex items-center gap-3">
            {!address ? (
              <button
                onClick={connectWallet}
                className="rounded-full px-4 py-2 bg-primary-container text-on-surface text-xs font-semibold hover:shadow-glow transition-shadow duration-300 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">shield</span>
                Connect
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-[#2a2a2a] px-3 py-1.5 rounded-full hover:bg-[#2a2a2a] transition-colors duration-300 group cursor-pointer">
                <span className="material-symbols-outlined text-xs text-tertiary-fixed-dim" style={{fontVariationSettings: "'FILL' 1"}}>account_balance_wallet</span>
                <span className="font-mono text-xs tracking-tight text-on-surface-variant">{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
              </div>
            )}

            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#2a2a2a] transition-colors duration-300 active:opacity-80 scale-95" type="button" aria-label="Settings">
              <span className="material-symbols-outlined text-on-surface-variant">settings</span>
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="mx-auto w-full max-w-7xl space-y-8">
          <section className="flex justify-center">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-tertiary-container/20 rounded-full border border-tertiary/30 shadow-[0_0_15px_rgba(98,42,228,0.3)]">
              <span className="material-symbols-outlined text-tertiary-fixed-dim text-sm" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
              <span className="text-tertiary-fixed-dim text-[11px] sm:text-xs uppercase tracking-widest font-mono">Nada AI Protected</span>
            </div>
          </section>

          {address && (
            <section className="flex justify-center">
              <button
                onClick={getCreditScore}
                className="w-full max-w-md rounded-full py-3 px-6 bg-primary hover:bg-primary-container transition-colors text-background font-semibold tracking-wide"
              >
                {creditScore ? 'Recalculate Credit Score' : 'Generate Credit Score'}
              </button>
            </section>
          )}

          {!address && (
            <section className="mt-10 max-w-2xl mx-auto text-center text-on-surface-variant">
              <p className="text-sm md:text-base">Connect your wallet to initialize privacy-preserving score computation and unlock your on-chain credit intelligence dashboard.</p>
            </section>
          )}

          {creditScore && (
            <>
              <CreditScoreSpeedometer score={creditScore} />

              <section className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-surface-container-high border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest block">Total Assets</span>
                  <div className="text-lg font-bold text-on-surface">$45,230</div>
                </div>
                <div className="p-5 rounded-xl bg-surface-container-high border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest block">Trust Score</span>
                  <div className="text-lg font-bold text-tertiary-fixed-dim">High</div>
                </div>
              </section>

              <section className="space-y-3 max-w-4xl">
                <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-on-surface-variant">Nada Risk Engine</p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Deep Credit Diagnostics</h2>
                <p className="text-sm text-on-surface-variant max-w-2xl">Your score intelligence prioritizes behavioral quality, consistency, and peer-relative resilience. Breakdown and peer analytics are now primary.</p>
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-8">
                  <ScoreBreakdown />
                  <ScoreAnalysis score={creditScore} />
                </div>

                <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-28">
                  <WalletSummary />
                </aside>
              </section>
            </>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center pb-safe pt-2 px-4 pb-4 bg-[#131313]/90 backdrop-blur-2xl rounded-t-3xl border-t border-[#b1c5ff]/15 shadow-2xl">
        <div className="max-w-7xl w-full mx-auto flex justify-around sm:justify-center sm:gap-16">
          <button className="flex flex-col items-center justify-center text-tertiary-fixed-dim bg-tertiary/10 rounded-xl px-4 py-2 scale-110 duration-200">
            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>home</span>
            <span className="font-mono text-[10px] uppercase tracking-widest mt-1">Home</span>
          </button>
          <button className="flex flex-col items-center justify-center text-gray-500 hover:text-gray-300 px-4 py-2 hover:text-[#cdbdff] transition-all">
            <span className="material-symbols-outlined">history</span>
            <span className="font-mono text-[10px] uppercase tracking-widest mt-1">History</span>
          </button>
          <button className="flex flex-col items-center justify-center text-gray-500 hover:text-gray-300 px-4 py-2 hover:text-[#cdbdff] transition-all">
            <span className="material-symbols-outlined">verified_user</span>
            <span className="font-mono text-[10px] uppercase tracking-widest mt-1">Security</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
