import React from 'react';
import { RevenueImpact, FrictionPoint } from '../../types/index';
import { TrendingDown, Sparkles, AlertTriangle, ArrowUpRight, DollarSign, Users, ShoppingBag } from 'lucide-react';

interface RevenueLeakMapProps {
  revenueImpact: RevenueImpact;
  frictionPoints: FrictionPoint[];
  onSelectFix?: (fixId: string) => void;
}

export function RevenueLeakMap({ revenueImpact, frictionPoints, onSelectFix }: RevenueLeakMapProps) {
  const {
    simulatedMonthlyAiTraffic,
    averageOrderValue,
    baselineAiConversionRate,
    actualSimulatedConversionRate,
    estimatedMonthlyRevenueLoss,
    potentialRevenueRecovery,
    currency,
  } = revenueImpact;

  const formatCurrency = (val: number) => {
    return `${currency === 'INR' ? '₹' : '$'}${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-[#0D0D0E] border border-slate-800/50 rounded-2xl p-6 md:p-7 backdrop-blur-md space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <h3 className="text-base font-semibold text-white">Revenue Leak Map</h3>
            <span className="px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-red-950/20 text-red-400 border border-red-500/30 rounded-full">
              Deterministic Impact
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quantifying lost AI buyer transactions caused by machine-readability & checkout friction.
          </p>
        </div>

        {/* Potential Recovery Badge */}
        <div className="px-3.5 py-2 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <div>
            <p className="text-[10px] uppercase font-bold text-emerald-400 leading-none">Recoverable Revenue</p>
            <p className="text-sm font-bold text-emerald-300 leading-none mt-1">
              +{formatCurrency(potentialRevenueRecovery)} <span className="text-[10px] font-normal text-emerald-400/80">/ mo</span>
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-[#080809] border border-slate-800/60 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Users className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Simulated AI Traffic</span>
          </div>
          <p className="text-base font-bold text-white">
            {simulatedMonthlyAiTraffic.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">bots/mo</span>
          </p>
        </div>

        <div className="p-4 bg-[#080809] border border-slate-800/60 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <ShoppingBag className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Average Order Value</span>
          </div>
          <p className="text-base font-bold text-white">{formatCurrency(averageOrderValue)}</p>
        </div>

        <div className="p-4 bg-[#080809] border border-slate-800/60 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Realized Conversion</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-base font-bold text-amber-400">
              {(actualSimulatedConversionRate * 100).toFixed(1)}%
            </p>
            <p className="text-[10px] text-slate-600 line-through">
              {(baselineAiConversionRate * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="p-4 bg-red-950/10 border border-red-500/20 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs text-red-300 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-red-400">Est. Monthly Revenue Loss</span>
          </div>
          <p className="text-base font-bold text-red-400 font-mono">
            -{formatCurrency(estimatedMonthlyRevenueLoss)}
          </p>
        </div>
      </div>

      {/* Friction Breakdown List */}
      <div className="space-y-2.5">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">
          Friction Breakdown & Financial Impact
        </p>

        {frictionPoints.length === 0 ? (
          <div className="p-4 text-center bg-[#080809] border border-slate-800/60 rounded-xl">
            <p className="text-xs text-emerald-400 font-medium">No friction points detected! Zero revenue leakage.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {frictionPoints.map((fric) => (
              <div
                key={fric.id}
                className="p-3.5 bg-[#080809] border border-slate-800/60 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${
                        fric.severity === 'critical'
                          ? 'bg-red-500/10 text-red-400 border-red-500/30'
                          : fric.severity === 'moderate'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {fric.severity}
                    </span>
                    <span className="text-xs font-semibold text-white">{fric.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{fric.explanation}</p>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500">Est. Monthly Leak</p>
                    <p className="text-xs font-bold text-red-400 font-mono">-{formatCurrency(fric.revenueImpactMonthly)}</p>
                  </div>

                  {onSelectFix && (
                    <button
                      id={`btn-fix-fric-${fric.id}`}
                      onClick={() => onSelectFix(fric.suggestedFixId)}
                      className="px-3 py-1.5 text-xs font-medium bg-violet-950/30 hover:bg-violet-900/40 text-violet-300 border border-violet-500/30 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <span>Fix</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
