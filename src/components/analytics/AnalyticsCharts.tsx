import React, { useState } from 'react';
import { AnalyticsTimeSeriesPoint, SimulationStageFailureMetric, AnalyticsPillarScores } from '../../types/index';
import { TrendingUp, TrendingDown, DollarSign, Activity, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface TimeSeriesChartProps {
  data: AnalyticsTimeSeriesPoint[];
  metric: 'gmv' | 'orders' | 'revenue' | 'readiness';
  currency?: string;
}

export function TimeSeriesChart({ data, metric, currency = 'INR' }: TimeSeriesChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
        No time-series data available for the selected range.
      </div>
    );
  }

  // Calculate scales
  let values: number[] = [];
  if (metric === 'gmv') values = data.map((d) => d.gmv);
  else if (metric === 'orders') values = data.map((d) => d.ordersCount);
  else if (metric === 'revenue') values = data.map((d) => Math.max(d.revenueAtRisk, d.revenueRecovered));
  else if (metric === 'readiness') values = data.map((d) => d.readinessScore);

  const maxValue = Math.max(...values, metric === 'readiness' ? 100 : 10);
  const minValue = metric === 'readiness' ? Math.min(30, ...values) : 0;
  const range = maxValue - minValue || 1;

  const width = 600;
  const height = 200;
  const padding = 20;

  // Generate SVG path points
  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * (width - padding * 2);
    let val = 0;
    if (metric === 'gmv') val = d.gmv;
    else if (metric === 'orders') val = d.ordersCount;
    else if (metric === 'readiness') val = d.readinessScore;
    else if (metric === 'revenue') val = d.revenueRecovered;
    const y = height - padding - ((val - minValue) / range) * (height - padding * 2);
    return { x, y, data: d, val };
  });

  const pathString = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaString = `${pathString} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  // For Revenue Recovery comparison (Risk path)
  let riskPoints: Array<{ x: number; y: number; val: number }> = [];
  let riskPathString = '';
  if (metric === 'revenue') {
    riskPoints = data.map((d, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * (width - padding * 2);
      const val = d.revenueAtRisk;
      const y = height - padding - ((val - minValue) / range) * (height - padding * 2);
      return { x, y, val };
    });
    riskPathString = riskPoints.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');
  }

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

  return (
    <div className="relative w-full">
      {/* Active tooltip snapshot */}
      {activePoint && (
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Date:</span>
            <span className="text-slate-200 font-semibold">{activePoint.data.formattedDate}</span>
          </div>
          <div className="flex items-center gap-4">
            {metric === 'gmv' && (
              <span className="text-emerald-400 font-semibold">
                GMV: ₹{activePoint.data.gmv.toLocaleString('en-IN')}
              </span>
            )}
            {metric === 'orders' && (
              <span className="text-violet-400 font-semibold">
                Orders: {activePoint.data.ordersCount}
              </span>
            )}
            {metric === 'revenue' && (
              <>
                <span className="text-emerald-400 font-semibold">
                  Recovered: ₹{activePoint.data.revenueRecovered.toLocaleString('en-IN')}
                </span>
                <span className="text-amber-400 font-semibold">
                  At Risk: ₹{activePoint.data.revenueAtRisk.toLocaleString('en-IN')}
                </span>
              </>
            )}
            {metric === 'readiness' && (
              <span className="text-violet-400 font-semibold">
                Score: {activePoint.data.readinessScore}/100
              </span>
            )}
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <div className="w-full overflow-hidden bg-[#0A0A0C] border border-slate-800/80 rounded-xl p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={
                  metric === 'gmv'
                    ? '#10b981'
                    : metric === 'orders'
                    ? '#8b5cf6'
                    : metric === 'readiness'
                    ? '#6366f1'
                    : '#10b981'
                }
                stopOpacity="0.25"
              />
              <stop
                offset="100%"
                stopColor={
                  metric === 'gmv'
                    ? '#10b981'
                    : metric === 'orders'
                    ? '#8b5cf6'
                    : metric === 'readiness'
                    ? '#6366f1'
                    : '#10b981'
                }
                stopOpacity="0.0"
              />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padding}
            y1={padding}
            x2={width - padding}
            y2={padding}
            stroke="#1e293b"
            strokeDasharray="4 4"
          />
          <line
            x1={padding}
            y1={height / 2}
            x2={width - padding}
            y2={height / 2}
            stroke="#1e293b"
            strokeDasharray="4 4"
          />
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#334155"
          />

          {/* Area fill */}
          <path d={areaString} fill="url(#metricGradient)" />

          {/* Secondary Risk Line for Revenue metric */}
          {metric === 'revenue' && riskPathString && (
            <path
              d={riskPathString}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}

          {/* Primary Trend Line */}
          <path
            d={pathString}
            fill="none"
            stroke={
              metric === 'gmv'
                ? '#10b981'
                : metric === 'orders'
                ? '#8b5cf6'
                : metric === 'readiness'
                ? '#6366f1'
                : '#10b981'
            }
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((p, index) => (
            <g key={index}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === index ? 6 : 3.5}
                fill={
                  metric === 'gmv'
                    ? '#10b981'
                    : metric === 'orders'
                    ? '#8b5cf6'
                    : metric === 'readiness'
                    ? '#6366f1'
                    : '#10b981'
                }
                stroke="#080809"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredIndex(index)}
              />
            </g>
          ))}
        </svg>

        {/* X-Axis labels */}
        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 px-2">
          <span>{data[0]?.formattedDate}</span>
          <span>{data[Math.floor(data.length / 2)]?.formattedDate}</span>
          <span>{data[data.length - 1]?.formattedDate}</span>
        </div>
      </div>
    </div>
  );
}

interface PillarRadarProps {
  scores: AnalyticsPillarScores;
}

export function PillarBreakdown({ scores }: PillarRadarProps) {
  const pillars = [
    { label: 'Machine Readability', score: scores.machineReadability, weight: '25%', color: 'bg-emerald-500' },
    { label: 'API & Checkout Endpoints', score: scores.apiCompleteness, weight: '20%', color: 'bg-violet-500' },
    { label: 'Policy & Shipping SLA', score: scores.policyClarity, weight: '15%', color: 'bg-blue-500' },
    { label: 'Pricing Transparency', score: scores.pricingTransparency, weight: '15%', color: 'bg-cyan-500' },
    { label: 'Checkout Viability & Zero-CAPTCHA', score: scores.checkoutViability, weight: '25%', color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-3">
      {pillars.map((p) => (
        <div key={p.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">{p.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">Weight {p.weight}</span>
              <span className="font-semibold text-slate-200">{p.score}/100</span>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${p.color}`}
              style={{ width: `${Math.min(100, Math.max(0, p.score))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface StageFunnelProps {
  stages: SimulationStageFailureMetric[];
}

export function StageDropoffFunnel({ stages }: StageFunnelProps) {
  return (
    <div className="space-y-2.5">
      {stages.map((stage, idx) => {
        const hasBlocker = stage.failureCount > 0;
        const hasFriction = stage.frictionCount > 0;
        const isHealthy = !hasBlocker && !hasFriction;

        return (
          <div
            key={stage.stage}
            className={`p-3 rounded-xl border transition-all ${
              hasBlocker
                ? 'bg-rose-950/15 border-rose-500/30'
                : hasFriction
                ? 'bg-amber-950/10 border-amber-500/30'
                : 'bg-slate-900/40 border-slate-800/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-[10px] font-bold text-slate-300">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">{stage.stageTitle}</h4>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                    <span>Passed: {stage.passCount}</span>
                    {hasFriction && <span className="text-amber-400">Friction: {stage.frictionCount}</span>}
                    {hasBlocker && <span className="text-rose-400 font-semibold">Dropoffs: {stage.failureCount}</span>}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  {isHealthy ? (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 0% Dropoff
                    </span>
                  ) : (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md flex items-center gap-1 border ${
                        hasBlocker
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3" /> {stage.dropoffRate}% Dropoff
                    </span>
                  )}
                </div>
                {stage.financialLossEstimated > 0 && (
                  <p className="text-[10px] text-rose-400/80 mt-1">
                    ~₹{stage.financialLossEstimated.toLocaleString('en-IN')} Loss
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
