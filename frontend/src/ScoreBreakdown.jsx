import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ScoreBreakdown = () => {
  const factors = [
    { name: 'Wallet Balance', percentage: 30, color: '#4CAF50' },
    { name: 'Transaction History', percentage: 25, color: '#2196F3' },
    { name: 'NFT Holdings', percentage: 20, color: '#FFC107' },
    { name: 'Account Age', percentage: 15, color: '#E91E63' },
    { name: 'Network Diversity', percentage: 10, color: '#9C27B0' },
  ];

  const generateMockData = () => {
    return Array.from({ length: 7 }, () => Math.floor(Math.random() * 50) + 50);
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
        min: 0,
        max: 100,
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 0,
      },
    },
  };

  return (
    <div className="bg-gray-900 text-white p-4">
      <h2 className="text-xl font-semibold mb-4">Score Breakdown</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {factors.map((factor, index) => {
          const mockData = generateMockData();
          const chartData = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
              {
                data: mockData,
                borderColor: factor.color,
                backgroundColor: factor.color,
                fill: false,
              },
            ],
          };

          return (
            <div key={index} className="bg-gray-800 p-4 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">{factor.name}</span>
                <span className="text-sm font-bold">{factor.percentage}%</span>
              </div>
              <div style={{ height: '50px' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScoreBreakdown;
