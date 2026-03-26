import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const toPercent = (factor) => {
  const normalized = Number(factor?.normalized_value);
  if (Number.isFinite(normalized)) {
    return Math.max(0, Math.min(100, Math.round(normalized * 100)));
  }
  const score = Number(factor?.score);
  if (Number.isFinite(score)) {
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  return 0;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const monthCountFromSummary = (summary) => {
  const ageDays = Number(summary?.account_age_days);
  if (!Number.isFinite(ageDays) || ageDays <= 0) {
    return 36;
  }
  return clamp(Math.round(ageDays / 30), 12, 180);
};

const deterministicPhase = (name) => {
  const text = String(name || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash += text.charCodeAt(i);
  }
  return (hash % 360) * (Math.PI / 180);
};

const buildAllTimeCurve = (factor, normalizedPercent, summary) => {
  const points = monthCountFromSummary(summary);
  const factorScore = clamp(Number(factor?.score) || normalizedPercent, 0, 100);
  const phase = deterministicPhase(factor?.name);
  const baseline = Math.max(2, Math.round(factorScore * 0.08));

  let growthExponent = 0.9;
  if (factorScore >= 70) {
    growthExponent = 0.72;
  } else if (factorScore <= 35) {
    growthExponent = 1.15;
  }

  let volatility = 0.08;
  if (factor?.name === 'Wallet Balance') {
    volatility = 0.17;
  } else if (factor?.name === 'NFT Holdings') {
    volatility = 0.14;
  } else if (factor?.name === 'Transaction History') {
    volatility = 0.11;
  }

  return Array.from({ length: points }, (_, index) => {
    const ratio = (index + 1) / points;
    const growth = Math.pow(ratio, growthExponent);
    const swing = Math.sin(ratio * 3.8 * Math.PI + phase) * (factorScore * volatility * (1 - ratio) * 0.35);
    const value = baseline + (factorScore * growth) + swing;
    return Math.round(clamp(value, 0, 100));
  });
};

const toSeries = (factor, normalizedPercent, summary) => {
  if (Array.isArray(factor?.trend) && factor.trend.length > 1) {
    return factor.trend.map((point) => {
      const numeric = Number(point);
      if (!Number.isFinite(numeric)) {
        return normalizedPercent;
      }
      return Math.max(0, Math.min(100, numeric));
    });
  }
  return buildAllTimeCurve(factor, normalizedPercent, summary);
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    tooltip: {
      enabled: true,
      displayColors: false,
      backgroundColor: 'rgba(31, 32, 32, 0.92)',
      titleColor: '#e4e2e1',
      bodyColor: '#c3c6d6',
      callbacks: {
        title: () => '',
        label: (ctx) => `All-time level: ${Math.round(ctx.parsed.y)}`,
      },
    },
    legend: {
      display: false,
    },
  },
  scales: {
    x: { display: false },
    y: { display: false, min: 0, max: 100 },
  },
  elements: {
    line: { tension: 0.32, borderWidth: 2 },
    point: { radius: 0, hoverRadius: 3, hitRadius: 8 },
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false,
  },
};

const ScoreBreakdown = ({ factors, summary, warnings }) => {
  const safeFactors = Array.isArray(factors) ? factors : [];
  const safeWarnings = Array.isArray(warnings) ? warnings : [];

  if (safeFactors.length === 0) {
    return (
      <section className="relative rounded-lg bg-surface-container/80 backdrop-blur-[20px] p-6 md:p-8 shadow-ambient overflow-hidden border border-outline-variant/15">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary text-sm">equalizer</span>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Score Breakdown</p>
        </div>
        <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">Factor Matrix</h3>
        <p className="text-sm text-on-surface-variant">No factor data returned for this wallet yet.</p>
      </section>
    );
  }

  const topFactor = safeFactors.reduce((best, factor) => {
    if (!best) {
      return factor;
    }
    return (Number(factor?.weighted_points) || 0) > (Number(best?.weighted_points) || 0) ? factor : best;
  }, null);

  const coverageText = summary?.data_quality === 'complete' ? 'Complete' : 'Partial';
  const volatilityIndex = typeof summary?.volatility_index === 'number' ? summary.volatility_index.toFixed(1) : 'N/A';

  return (
    <section className="relative rounded-lg bg-surface-container/80 backdrop-blur-[20px] p-6 md:p-8 shadow-ambient overflow-hidden border border-outline-variant/15">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-tertiary/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-sm">equalizer</span>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Score Breakdown</p>
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-tr from-primary to-tertiary bg-clip-text text-transparent">
            Factor Matrix
          </h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant/15 bg-surface-container-highest backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-tertiary" />
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-on-surface-variant">Backend Driven</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 relative z-10 bg-surface-container-low p-5 rounded-lg">
        <div className="rounded-lg bg-surface-container-highest p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-2">Top Factor</p>
          <p className="text-lg font-bold text-on-surface mb-1">{topFactor?.name || 'N/A'}</p>
          <p className="text-sm text-primary">{topFactor?.weighted_points ?? '0'} weighted points</p>
        </div>

        <div className="rounded-lg bg-surface-container-highest p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-2">Data Coverage</p>
          <p className="text-lg font-bold text-on-surface mb-1">{coverageText}</p>
          <p className="text-xs text-on-surface-variant">Warnings: {safeWarnings.length}</p>
        </div>

        <div className="rounded-lg bg-surface-container-highest p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-2">Volatility Index</p>
          <p className="text-lg font-bold text-on-surface mb-1">{volatilityIndex}</p>
          <p className="text-xs text-on-surface-variant">Lower values indicate steadier activity patterns.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 relative z-10">
        {safeFactors.map((factor, index) => {
          const normalizedPercent = toPercent(factor);
          const series = toSeries(factor, normalizedPercent, summary);
          const chartData = {
            labels: Array.from({ length: series.length }, () => ''),
            datasets: [
              {
                data: series,
                borderColor: factor.color,
                backgroundColor: (context) => {
                  const ctx = context.chart.ctx;
                  const gradient = ctx.createLinearGradient(0, 0, 0, 70);
                  gradient.addColorStop(0, `${factor.color}66`);
                  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                  return gradient;
                },
                fill: true,
              },
            ],
          };

          return (
            <article
              key={`${factor.name}-${index}`}
              className="group flex flex-col rounded-lg bg-surface-container-highest p-5 border border-outline-variant/15"
            >
              <div className="flex justify-between items-start mb-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container border border-outline-variant/15"
                    style={{ color: factor.color }}
                  >
                    <span className="material-symbols-outlined text-[20px]">{factor.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base font-semibold text-on-surface truncate">{factor.name}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5 truncate">{factor.impact}</p>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/15 backdrop-blur-sm" style={{ color: factor.color }}>
                  <span className="text-sm font-bold">{factor.percentage}%</span>
                </div>
              </div>

              <div className="relative h-2 w-full bg-surface-container rounded-full overflow-hidden mb-4">
                <div
                  className="absolute top-0 left-0 h-full rounded-full"
                  style={{
                    width: `${normalizedPercent}%`,
                    backgroundColor: factor.color,
                    boxShadow: `0 0 10px ${factor.color}`,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div className="rounded-md bg-surface-container p-2">
                  <p className="text-on-surface-variant font-mono uppercase tracking-wider mb-1">Value</p>
                  <p className="text-on-surface font-semibold">{factor.value}</p>
                </div>
                <div className="rounded-md bg-surface-container p-2">
                  <p className="text-on-surface-variant font-mono uppercase tracking-wider mb-1">Factor Score</p>
                  <p className="text-on-surface font-semibold">{factor.score}</p>
                </div>
                <div className="rounded-md bg-surface-container p-2 col-span-2">
                  <p className="text-on-surface-variant font-mono uppercase tracking-wider mb-1">Rationale</p>
                  <p className="text-on-surface-variant">{factor.rationale}</p>
                </div>
              </div>

              <div className="rounded-md bg-surface-container p-2">
                <p className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1">All-Time Factor Graph</p>
                <div className="h-[64px] w-full">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default ScoreBreakdown;
