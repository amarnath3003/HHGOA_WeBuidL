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
    return Math.max(0, Math.min(100, normalized * 100));
  }
  const score = Number(factor?.score);
  if (Number.isFinite(score)) {
    return Math.max(0, Math.min(100, score));
  }
  return 0;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toSeries = (factor, normalizedPercent) => {
  if (Array.isArray(factor?.trend) && factor.trend.length > 1) {
    return factor.trend.map((point) => {
      const numeric = Number(point);
      if (!Number.isFinite(numeric)) {
        return normalizedPercent;
      }
      return Math.max(0, Math.min(100, numeric));
    });
  }
  if (Array.isArray(factor?.trend) && factor.trend.length === 1) {
    const onlyPoint = Number(factor.trend[0]);
    if (Number.isFinite(onlyPoint)) {
      const bounded = Math.max(0, Math.min(100, onlyPoint));
      return [bounded, bounded];
    }
  }
  return [];
};

const chartOptionsForSeries = (series) => {
  const numericSeries = series.filter((point) => Number.isFinite(Number(point))).map(Number);
  const minRaw = numericSeries.length ? Math.min(...numericSeries) : 0;
  const maxRaw = numericSeries.length ? Math.max(...numericSeries) : 100;

  const span = maxRaw - minRaw;
  const minSpan = 8;
  const padding = Math.max(1, span * 0.25);

  let minY = clamp(minRaw - padding, 0, 100);
  let maxY = clamp(maxRaw + padding, 0, 100);

  if ((maxY - minY) < minSpan) {
    const center = (maxY + minY) / 2;
    minY = clamp(center - (minSpan / 2), 0, 100);
    maxY = clamp(center + (minSpan / 2), 0, 100);
    if ((maxY - minY) < minSpan) {
      if (minY === 0) {
        maxY = minSpan;
      } else if (maxY === 100) {
        minY = 100 - minSpan;
      }
    }
  }

  return {
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
          title: () => 'Historical Signal',
          label: (ctx) => `Factor level: ${ctx.parsed.y.toFixed(1)} / 100`,
        },
      },
      legend: {
        display: false,
      },
    },
    scales: {
      x: { display: false },
      y: { display: false, min: minY, max: maxY },
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
};

const compactText = (value, maxLength = 140) => {
  if (typeof value !== 'string' || !value.trim()) {
    return 'No rationale text returned for this factor in the current model response.';
  }
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength).trimEnd()}...`;
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

  const confidenceText = safeWarnings.length > 0 ? 'Monitoring' : 'Stable';

  return (
    <section className="relative max-w-5xl mx-auto rounded-2xl bg-surface-container/80 backdrop-blur-[20px] p-4 sm:p-6 md:p-7 shadow-ambient overflow-hidden border border-outline-variant/15">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-tertiary/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 sm:mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="material-symbols-outlined text-primary text-sm">equalizer</span>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Score Breakdown</p>
          </div>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-tr from-primary to-tertiary bg-clip-text text-transparent">
            Score Factor Matrix
          </h3>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 max-w-xl">Detailed factor attribution with quality indicators and historical signal trend for each input.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant/15 bg-surface-container-highest backdrop-blur-md self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-tertiary" />
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-on-surface-variant">Backend Driven</span>
        </div>
      </div>

      <div className="relative z-10 mb-6 sm:mb-8 rounded-2xl bg-surface-container-low/50 backdrop-blur-xl p-3 sm:p-5 border border-outline-variant/10 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-xl bg-surface-container-highest/80 backdrop-blur-md p-4 border border-outline-variant/10 shadow-[inset_0_1px_rgba(255,255,255,0.05)] hover:border-primary/40 hover:bg-surface-container-highest hover:shadow-[0_8px_24px_rgba(177,197,255,0.12)] hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
            <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/80 mb-2 group-hover:text-primary/80 transition-colors">Top Factor</p>
            <p className="text-base sm:text-lg font-extrabold text-on-surface mb-1 truncate">{topFactor?.name || 'N/A'}</p>
            <p className="text-xs text-primary/90 font-medium">{topFactor?.weighted_points ?? '0'} weighted pts</p>
          </div>

          <div className="rounded-xl bg-surface-container-highest/80 backdrop-blur-md p-4 border border-outline-variant/10 shadow-[inset_0_1px_rgba(255,255,255,0.05)] hover:border-tertiary/40 hover:bg-surface-container-highest hover:shadow-[0_8px_24px_rgba(205,189,255,0.12)] hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
            <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/80 mb-2 group-hover:text-tertiary/80 transition-colors">Data Coverage</p>
            <p className="text-base sm:text-lg font-extrabold text-on-surface mb-1">{coverageText}</p>
            <p className="text-xs text-on-surface-variant/80">{safeWarnings.length} Warnings</p>
          </div>

          <div className="rounded-xl bg-surface-container-highest/80 backdrop-blur-md p-4 border border-outline-variant/10 shadow-[inset_0_1px_rgba(255,255,255,0.05)] hover:border-primary/40 hover:bg-surface-container-highest hover:shadow-[0_8px_24px_rgba(177,197,255,0.12)] hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
            <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/80 mb-2 group-hover:text-primary/80 transition-colors">Signal Trust</p>
            <p className="text-base sm:text-lg font-extrabold text-on-surface mb-1">{confidenceText}</p>
            <p className="text-xs text-on-surface-variant/80">Idx: {volatilityIndex}</p>
          </div>

          <div className="rounded-xl bg-surface-container-highest/80 backdrop-blur-md p-4 border border-outline-variant/10 shadow-[inset_0_1px_rgba(255,255,255,0.05)] hover:border-tertiary/40 hover:bg-surface-container-highest hover:shadow-[0_8px_24px_rgba(205,189,255,0.12)] hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
            <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/80 mb-2 group-hover:text-tertiary/80 transition-colors">Volatility</p>
            <p className="text-base sm:text-lg font-extrabold text-on-surface mb-1">{volatilityIndex}</p>
            <p className="text-xs text-on-surface-variant/80">Lower is steadier</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative z-10">
        {safeFactors.map((factor, index) => {
          const accent = factor?.color || '#b1c5ff';
          const normalizedPercent = toPercent(factor);
          const series = toSeries(factor, normalizedPercent);
          const displayPercent = Number.isFinite(Number(factor?.percentage)) ? Number(factor.percentage) : Math.round(normalizedPercent);
          const chartOptions = chartOptionsForSeries(series);
          const firstPoint = series.length > 1 ? Number(series[0]) : Number(normalizedPercent);
          const lastPoint = series.length > 1 ? Number(series[series.length - 1]) : Number(normalizedPercent);
          const trendDelta = Number.isFinite(firstPoint) && Number.isFinite(lastPoint) ? lastPoint - firstPoint : 0;
          const trendLabel = trendDelta > 0.5 ? 'Uptrend' : trendDelta < -0.5 ? 'Downtrend' : 'Stable';

          const chartData = {
            labels: Array.from({ length: series.length }, () => ''),
            datasets: [
              {
                data: series,
                borderColor: accent,
                backgroundColor: (context) => {
                  const ctx = context.chart.ctx;
                  const gradient = ctx.createLinearGradient(0, 0, 0, 70);
                  gradient.addColorStop(0, `${accent}66`);
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
              className="group relative flex flex-col rounded-2xl bg-surface-container-high/60 backdrop-blur-md p-4 sm:p-5 border border-outline-variant/15 shadow-[inset_0_1px_rgba(255,255,255,0.03)] hover:border-outline-variant/60 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all duration-500 overflow-hidden cursor-default"
            >
              <div className="absolute -top-14 -right-12 h-32 w-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ backgroundColor: `${accent}2e` }} />

              <div className="relative z-10 flex justify-between items-start mb-4 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-container border border-outline-variant/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] group-hover:scale-105 transition-transform duration-300"
                    style={{ color: accent }}
                  >
                    <span className="material-symbols-outlined text-[20px]">{factor.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base font-semibold text-on-surface truncate">{factor.name}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5 truncate">{factor.impact || 'Measured contribution to overall credit profile.'}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/15 backdrop-blur-sm" style={{ color: accent }}>
                    <span className="text-sm font-bold">{displayPercent}%</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-on-surface-variant">{trendLabel}</span>
                </div>
              </div>

              <div className="relative h-2.5 w-full bg-surface-container rounded-full overflow-hidden mb-4">
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${normalizedPercent}%`,
                    backgroundColor: accent,
                    boxShadow: `0 0 14px ${accent}`,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div className="rounded-lg bg-surface-container p-3 border border-outline-variant/10">
                  <p className="text-on-surface-variant font-mono uppercase tracking-wider mb-1">Current Value</p>
                  <p className="text-on-surface font-semibold">{factor.value ?? 'N/A'}</p>
                </div>
                <div className="rounded-lg bg-surface-container p-3 border border-outline-variant/10">
                  <p className="text-on-surface-variant font-mono uppercase tracking-wider mb-1">Factor Score</p>
                  <p className="text-on-surface font-semibold">{factor.score ?? 'N/A'}</p>
                </div>
                <div className="rounded-lg bg-surface-container p-3 col-span-2 border border-outline-variant/10">
                  <p className="text-on-surface-variant font-mono uppercase tracking-wider mb-1">Model Interpretation</p>
                  <p className="text-on-surface-variant leading-relaxed">{compactText(factor.rationale)}</p>
                </div>
              </div>

              <div className="rounded-lg bg-surface-container p-3 border border-outline-variant/10">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">All-Time Factor Graph</p>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Delta {trendDelta >= 0 ? '+' : ''}{trendDelta.toFixed(1)}</p>
                </div>
                <div className="h-[68px] sm:h-[74px] w-full">
                  {series.length > 1 ? (
                    <Line data={chartData} options={chartOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-start text-[11px] text-on-surface-variant leading-relaxed">
                      No verified all-time history returned for this factor by current providers.
                    </div>
                  )}
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
