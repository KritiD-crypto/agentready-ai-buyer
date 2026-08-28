import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CounterfactualComparison, AgentReadyFix, SimulationReport } from '../../types/index';
import { api } from '../../lib/api';
import { GitCompare, Sparkles, ArrowRight, CheckCircle2, TrendingUp, ShieldCheck, DollarSign, Wrench } from 'lucide-react';

export function CounterfactualLab() {
  const { merchant, store } = useAuth();
  const [selectedFixIds, setSelectedFixIds] = useState<string[]>([
    'fix_manifest_01',
    'fix_agent_token_02',
  ]);
  const [comparison, setComparison] = useState<CounterfactualComparison | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const availableFixes: Array<{ id: string; title: string; category: string; impactPoints: number; estRecovery: number; desc: string }> = [
    {
      id: 'fix_manifest_01',
      title: 'Publish .well-known/agent-commerce.json (UCP-1.0)',
      category: 'Protocol',
      impactPoints: 18,
      estRecovery: 65000,
      desc: 'Machine-readable endpoint for AI agents to discover catalog & payment schemas.',
    },
    {
      id: 'fix_agent_token_02',
      title: 'Enable Razorpay Agent Tokenization (Zero Iframe)',
      category: 'Payment',
      impactPoints: 24,
      estRecovery: 95000,
      desc: 'Direct server-to-server token checkout without 3DS browser popups.',
    },
    {
      id: 'fix_return_policy_03',
      title: 'Declare Standardized 14-Day MerchantReturnPolicy',
      category: 'Policy',
      impactPoints: 12,
      estRecovery: 35000,
      desc: 'Machine-verifiable JSON-LD return window for corporate & consumer bots.',
    },
    {
      id: 'fix_stock_api_04',
      title: 'Deploy Real-Time Inventory Reservation Webhook',
      category: 'API',
      impactPoints: 14,
      estRecovery: 45000,
      desc: 'Guarantees real-time stock allocation before payment authorization.',
    },
    {
      id: 'fix_captcha_05',
      title: 'Bypass Anti-Bot CAPTCHA for Signed Agent Headers',
      category: 'Security',
      impactPoints: 20,
      estRecovery: 70000,
      desc: 'Whitelists cryptographic Razorpay agent signatures from visual challenges.',
    },
  ];

  const handleRunWhatIf = async () => {
    if (!merchant) return;
    setIsLoading(true);
    try {
      const res = await api.runCounterfactual('base_sim', selectedFixIds, merchant.id);
      setComparison(res);
    } catch (err) {
      console.error('Error running counterfactual what-if:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleRunWhatIf();
  }, [merchant]);

  const toggleFix = (fixId: string) => {
    setSelectedFixIds((prev) =>
      prev.includes(fixId) ? prev.filter((id) => id !== fixId) : [...prev, fixId]
    );
  };

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-violet-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Counterfactual "What-If" Lab
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate revenue recovery and readiness score gains before writing production code.
          </p>
        </div>

        <button
          id="btn-run-whatif-sim"
          onClick={handleRunWhatIf}
          disabled={isLoading}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-violet-900/20 disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Recalculating What-If...' : 'Recalculate Projections'}</span>
        </button>
      </div>

      {/* Fix Selection Matrix */}
      <div className="bg-[#0D0D0E] border border-slate-800/50 rounded-2xl p-5 space-y-3">
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">
          Select Candidate Fixes to Simulate
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableFixes.map((fix) => {
            const isChecked = selectedFixIds.includes(fix.id);
            return (
              <div
                key={fix.id}
                id={`whatif-fix-${fix.id}`}
                onClick={() => toggleFix(fix.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isChecked
                    ? 'bg-violet-900/15 border-violet-500/50 text-white shadow-sm'
                    : 'bg-[#080809] border-slate-800/60 text-slate-400 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-violet-400">{fix.category}</span>
                    <p className="text-xs font-semibold text-slate-200">{fix.title}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="rounded bg-slate-800 border-slate-700 text-violet-600 focus:ring-0 mt-0.5"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{fix.desc}</p>
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                  <span className="text-emerald-400 font-bold">+{fix.impactPoints} Score pts</span>
                  <span className="text-violet-300 font-medium">+{formatCurrency(fix.estRecovery)}/mo</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison Metrics */}
      {comparison && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Readiness Score Delta */}
          <div className="bg-[#0D0D0E] border border-slate-800/50 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <ShieldCheck className="w-4 h-4 text-violet-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Readiness Score Gain</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-white">
                {comparison.counterfactualReport.score.overallScore}
                <span className="text-xs text-slate-500 font-normal">/100</span>
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                +{comparison.scoreDelta} pts
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Upgrades store grade from{' '}
              <span className="text-rose-400 font-bold">{comparison.baselineReport.score.grade}</span> to{' '}
              <span className="text-emerald-400 font-bold">{comparison.counterfactualReport.score.grade}</span>.
            </p>
          </div>

          {/* Revenue Recovered */}
          <div className="bg-[#0D0D0E] border border-slate-800/50 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Monthly Revenue Recovery</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-black text-emerald-400">
                +{formatCurrency(comparison.revenueRecoveredMonthly)}
              </span>
              <span className="text-xs text-slate-500">/mo</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Estimated annual upside of{' '}
              <span className="text-emerald-300 font-bold">
                +{formatCurrency(comparison.revenueRecoveredMonthly * 12)}
              </span>.
            </p>
          </div>

          {/* Frictions Resolved */}
          <div className="bg-[#0D0D0E] border border-slate-800/50 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-violet-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Frictions Eliminated</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-violet-300">
                {comparison.resolvedFrictionCount}
              </span>
              <span className="text-xs text-slate-500">frictions cleared</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Resolves {selectedFixIds.length} candidate architectural friction points.
            </p>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison */}
      {comparison && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Baseline Store */}
          <div className="p-5 bg-[#0D0D0E] border border-slate-800/50 rounded-2xl space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/50">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Current Baseline</span>
                <h4 className="text-sm font-semibold text-white mt-0.5">{store?.name || 'NovaGear'} (Unoptimized)</h4>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg">
                Score {comparison.baselineReport.score.overallScore}/100
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-400">
                Monthly Leakage: <span className="text-rose-400 font-bold font-mono">-{formatCurrency(comparison.baselineReport.revenueImpact.estimatedMonthlyRevenueLoss)}</span>
              </p>
              <p className="text-slate-400">
                Active Frictions: <span className="text-amber-400 font-bold">{comparison.baselineReport.frictionPoints.length}</span>
              </p>
              <div className="p-3 bg-[#080809] border border-slate-800/60 rounded-xl space-y-1">
                <p className="text-[11px] text-slate-300 font-mono">Agent Token Protocol: <span className="text-rose-400">Missing</span></p>
                <p className="text-[11px] text-slate-300 font-mono">Manifest Discovery: <span className="text-amber-400">Scraped Only</span></p>
              </div>
            </div>
          </div>

          {/* Counterfactual Optimized Store */}
          <div className="p-5 bg-[#0D0D0E] border border-violet-500/30 rounded-2xl space-y-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 via-transparent to-transparent pointer-events-none" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/50">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-violet-400">Counterfactual Projection</span>
                <h4 className="text-sm font-semibold text-white mt-0.5">{store?.name || 'NovaGear'} (With {selectedFixIds.length} Fixes)</h4>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg">
                Score {comparison.counterfactualReport.score.overallScore}/100
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-300">
                Projected Leakage: <span className="text-emerald-400 font-bold font-mono">-{formatCurrency(comparison.counterfactualReport.revenueImpact.estimatedMonthlyRevenueLoss)}</span>
              </p>
              <p className="text-slate-300">
                Remaining Frictions: <span className="text-violet-300 font-bold">{comparison.counterfactualReport.frictionPoints.length}</span>
              </p>
              <div className="p-3 bg-[#080809] border border-violet-500/20 rounded-xl space-y-1">
                <p className="text-[11px] text-slate-300 font-mono">Agent Token Protocol: <span className="text-emerald-400">Active (UCP-1.0)</span></p>
                <p className="text-[11px] text-slate-300 font-mono">Manifest Discovery: <span className="text-emerald-400">Direct Endpoint 200 OK</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
