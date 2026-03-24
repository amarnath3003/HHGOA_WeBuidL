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
    <div className="min-h-screen bg-background text-on-surface app-safe-bottom">
      <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 pt-4">
        <div className="mx-auto max-w-6xl rounded-xl bg-background/80 backdrop-blur-glass shadow-ambient ghost-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">security</span>
            <h1 className="text-xl font-bold tracking-tight text-tertiary">EtherScore</h1>
          </div>

          {!address ? (
            <button
              onClick={connectWallet}
              className="rounded-full px-4 py-2 bg-primary-container text-on-surface text-sm font-semibold hover:shadow-glow transition-shadow duration-300 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">shield</span>
              Connect Wallet
            </button>
          ) : (
            <div className="rounded-full px-4 py-2 bg-surface-container-high text-sm text-on-surface-variant font-mono flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">verified_user</span>
              {`${address.slice(0, 6)}...${address.slice(-4)}`}
            </div>
          )}
        </div>
      </header>

      <main className="pt-24 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <section className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tertiary-container/20 text-tertiary ghost-border shadow-ambient">
              <span className="material-symbols-outlined text-sm">verified</span>
              <span className="text-xs uppercase tracking-widest font-mono">Nada AI Protected</span>
            </div>
          </section>

          {address && (
            <section className="mt-8 flex justify-center">
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

              <section className="editorial-section grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl bg-surface-container-high p-5 ghost-border">
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-on-surface-variant">Model Integrity</p>
                  <p className="text-lg font-bold mt-2">98.2%</p>
                </div>
                <div className="rounded-xl bg-surface-container-high p-5 ghost-border">
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-on-surface-variant">Wallet Cohesion</p>
                  <p className="text-lg font-bold mt-2 text-secondary">Strong</p>
                </div>
                <div className="rounded-xl bg-surface-container-high p-5 ghost-border">
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-on-surface-variant">Risk Band</p>
                  <p className="text-lg font-bold mt-2 text-tertiary">Prime</p>
                </div>
              </section>

              <section className="editorial-section grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <div className="xl:col-span-5">
                  <WalletSummary />
                </div>
                <div className="xl:col-span-7 space-y-8">
                  <ScoreBreakdown />
                  <ScoreAnalysis score={creditScore} />
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 sm:px-6 pb-4">
        <div className="mx-auto max-w-6xl rounded-t-xl rounded-b-xl bg-background/90 backdrop-blur-glass ghost-border px-4 py-2 flex items-center justify-around shadow-ambient">
          <button className="flex flex-col items-center text-tertiary px-3 py-1.5 rounded-lg bg-tertiary/10">
            <span className="material-symbols-outlined">home</span>
            <span className="text-[10px] uppercase tracking-widest font-mono">Home</span>
          </button>
          <button className="flex flex-col items-center text-on-surface-variant px-3 py-1.5 rounded-lg hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">history</span>
            <span className="text-[10px] uppercase tracking-widest font-mono">History</span>
          </button>
          <button className="flex flex-col items-center text-on-surface-variant px-3 py-1.5 rounded-lg hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">verified_user</span>
            <span className="text-[10px] uppercase tracking-widest font-mono">Security</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
