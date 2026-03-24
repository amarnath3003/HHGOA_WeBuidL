import React from 'react';

const CreditScoreSpeedometer = ({ score }) => {
  const angle = (score - 300) / (850 - 300) * 180 - 90;

  const getColor = (score) => {
    if (score < 580) return 'red';
    if (score < 670) return 'orange';
    if (score < 740) return 'yellow';
    return 'green';
  };

  return (
    <div className="flex flex-col items-center justify-center mt-10">
      <svg width="400" height="240" viewBox="0 0 200 120">
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="20"
        />
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray="251.2"
          strokeDashoffset="251.2"
          style={{
            strokeDashoffset: `${251.2 - (score - 300) / (850 - 300) * 251.2}`,
            transition: 'stroke-dashoffset 0.5s ease-in-out',
          }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="red" />
            <stop offset="40%" stopColor="orange" />
            <stop offset="60%" stopColor="yellow" />
            <stop offset="100%" stopColor="green" />
          </linearGradient>
        </defs>
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="40"
          stroke="black"
          strokeWidth="2"
          transform={`rotate(${angle}, 100, 100)`}
          style={{ transition: 'transform 0.5s ease-in-out' }}
        />
      </svg>
      <div className="text-6xl font-bold mt-4" style={{ color: getColor(score) }}>
        {score}
      </div>
      <div className="text-2xl mt-2">
        {score < 580 ? 'Poor' :
         score < 670 ? 'Fair' :
         score < 740 ? 'Good' :
         'Excellent'}
      </div>
    </div>
  );
};

export default CreditScoreSpeedometer;
