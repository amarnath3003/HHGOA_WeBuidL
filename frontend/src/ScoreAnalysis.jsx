import React from 'react';

const ScoreAnalysis = ({ score }) => {
  const insights = [
    { factor: 'Wallet Balance', impact: 'High', suggestion: 'Maintain a stable balance to improve your score.', icon: '💰' },
    { factor: 'Transaction History', impact: 'Medium', suggestion: 'Increase your transaction frequency for a better score.', icon: '📊' },
    { factor: 'NFT Holdings', impact: 'Low', suggestion: 'Diversify your NFT portfolio to potentially boost your score.', icon: '🖼️' },
  ];

  const averageScore = 720;

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'High': return '#EF4444';
      case 'Medium': return '#F59E0B';
      case 'Low': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Score Analysis</h2>
      
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Factor Insights</h3>
        <div style={styles.insightsGrid}>
          {insights.map((insight, index) => (
            <div key={index} style={styles.insightCard}>
              <span style={styles.icon}>{insight.icon}</span>
              <div>
                <div style={styles.factorName}>{insight.factor}</div>
                <div style={{...styles.impactBadge, backgroundColor: getImpactColor(insight.impact)}}>
                  Impact: {insight.impact}
                </div>
                <p style={styles.suggestion}>{insight.suggestion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Peer Comparison</h3>
        <div style={styles.comparisonCard}>
          <div style={styles.scoreComparison}>
            <div style={styles.scoreBox}>
              <div style={{...styles.scoreValue, color: '#10B981'}}>{score}</div>
              <div style={styles.scoreLabel}>Your Score</div>
            </div>
            <div style={styles.scoreBox}>
              <div style={{...styles.scoreValue, color: '#3B82F6'}}>{averageScore}</div>
              <div style={styles.scoreLabel}>Average Score</div>
            </div>
          </div>
          <div style={styles.progressBars}>
            <div>
              <div style={styles.progressLabel}>
                <span>Your Score</span>
                <span>{score}/850</span>
              </div>
              <div style={styles.progressBarBg}>
                <div style={{...styles.progressBarFill, width: `${(score / 850) * 100}%`, backgroundColor: '#10B981'}}></div>
              </div>
            </div>
            <div style={{marginTop: '1rem'}}>
              <div style={styles.progressLabel}>
                <span>Average Score</span>
                <span>{averageScore}/850</span>
              </div>
              <div style={styles.progressBarBg}>
                <div style={{...styles.progressBarFill, width: `${(averageScore / 850) * 100}%`, backgroundColor: '#3B82F6'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#1F2937',
    color: '#FFFFFF',
    padding: '2rem',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
  },
  section: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1rem',
  },
  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
  },
  insightCard: {
    backgroundColor: '#374151',
    padding: '1rem',
    borderRadius: '0.375rem',
    display: 'flex',
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: '1.5rem',
    marginRight: '1rem',
  },
  factorName: {
    fontWeight: '600',
    marginBottom: '0.25rem',
  },
  impactBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
  },
  suggestion: {
    fontSize: '0.875rem',
    color: '#D1D5DB',
  },
  comparisonCard: {
    backgroundColor: '#374151',
    padding: '1.5rem',
    borderRadius: '0.375rem',
  },
  scoreComparison: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
  },
  scoreBox: {
    textAlign: 'center',
  },
  scoreValue: {
    fontSize: '2.25rem',
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: '0.875rem',
    color: '#D1D5DB',
    marginTop: '0.5rem',
  },
  progressBars: {
    marginTop: '1rem',
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    marginBottom: '0.25rem',
  },
  progressBarBg: {
    height: '0.5rem',
    backgroundColor: '#4B5563',
    borderRadius: '9999px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '9999px',
    transition: 'width 0.5s ease-in-out',
  },
};

export default ScoreAnalysis;
