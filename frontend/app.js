import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';
import CreditScoreSpeedometer from './CreditScoreSpeedometer';
import WalletSummary from './WalletSummary';
import ScoreBreakdown from './ScoreBreakdown';
import ScoreAnalysis from './ScoreAnalysis';
import './App.css';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

function App() {
  const [web3, setWeb3] = useState(null);
  const [address, setAddress] = useState('');
  const [creditScore, setCreditScore] = useState(null);
  const [walletData, setWalletData] = useState(null);

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

  const getCreditScore = async () => {
    if (!address) {
      return;
    }
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
        throw new Error(payload.error || payload.message || 'Unable to calculate credit score.');
      }
      setCreditScore(payload.score);
      setWalletData(payload);
    } catch (error) {
      console.error(error);
      alert(error.message || 'Unable to calculate credit score.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-6 flex flex-col items-center">
      <div className="w-full max-w-4xl px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">EtherScore</h1>
          {!address ? (
            <button 
              onClick={connectWallet}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
              </svg>
              Connect
            </button>
          ) : (
            <div className="bg-gray-800 rounded-full px-4 py-2 text-sm">
              {`${address.slice(0, 6)}...${address.slice(-4)}`}
            </div>
          )}
        </div>

        {address && (
          <button 
            onClick={getCreditScore} 
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 mb-6"
          >
            Get Credit Score
          </button>
        )}

        {creditScore && (
          <>
            <CreditScoreSpeedometer score={creditScore} />
            <WalletSummary summary={walletData?.summary} featuredCollections={walletData?.featured_collections} />
            <ScoreBreakdown factors={walletData?.factors} summary={walletData?.summary} warnings={walletData?.meta?.warnings} />
            <ScoreAnalysis payload={walletData} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
