import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ReadinessScores, RevenueImpact, SimulationHistoryItem, SimulationReport, RevenueLeakSummary } from '../../types/index';
import { api } from '../../lib/api';
import { ReadinessScoreCard } from '../simulation/ReadinessScoreCard';
import { RevenueLeakMap } from '../simulation/RevenueLeakMap';
import {
  LayoutDashboard,
  Bot,
  Play,
  GitCompare,
  FileCode2,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Package,
  Wrench,
  CheckCircle2,
  Flame,
  TrendingUp,
  ShoppingBag,
  BarChart3,
} from 'lucide-react';

interface MerchantDashboardProps {
  onNavigate: (tab: any) => void;
}

export function MerchantDashboard({ onNavigate }: MerchantDashboardProps) {
  const { merchant, store, isDemoMode, launchDemo } = useAuth();
  const [history, setHistory] = useState<SimulationHistoryItem[]>([]);
  const [latestReport, setLatestReport] = useState<SimulationReport | null>(null);
  const [leakSummary, setLeakSummary] = useState<RevenueLeakSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [hist, summaryRes] = await Promise.all([
          api.getSimulationHistory(merchant?.id),
          fetch('/api/revenue-leaks/summary').then((r) => (r.ok ? r.json() : null)),
        ]);
        setHistory(hist);
        if (summaryRes) setLeakSummary(summaryRes);

        if (hist.length > 0) {
          const report = await api.getSimulation(hist[0].id);
          setLatestReport(report);
        } else {
          // If no history yet, trigger one baseline simulation for smooth immediate experience
          if (merchant) {
            const report = await api.runSimulation({
              merchantId: merchant.id,
              personaId: 'persona_spec_inspector',
            });
            setLatestReport(report);
            const newHist = await api.getSimulationHistory(merchant.id);
            setHistory(newHist);
          }
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, [merchant]);

  // Fallback initial score if loading
  const currentScore: ReadinessScores = latestReport?.score || {
    overallScore: 58,
    machineReadability: 60,
    apiCompleteness: 55,
    policyClarity: 70,
    pricingTransparency: 65,
    checkoutViability: 40,
    grade: 'C',
  };

  const currentRevenueImpact: RevenueImpact = latestReport?.revenueImpact || {
    simulatedMonthlyAiTraffic: 2500,
    averageOrderValue: 3499,
    baselineAiConversionRate: 0.045,
    actualSimulatedConversionRate: 0.016,
    estimatedMonthlyRevenueLoss: 253677,
    potentialRevenueRecovery: 185000,
    currency: 'INR',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0D0D0E] border border-slate-800/50 rounded-2xl p-6 md:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        {/* Subtle violet gradient glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 via-transparent to-transparent pointer-events-none" />

        <div className="space-y-2 max-w-2xl z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-violet-950/30 border border-violet-500/30 rounded-full text-violet-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Agentic Commerce Readiness Engine (Razorpay Track 1)</span>
          </div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tight">
            Before AI buyers arrive, test whether <span className="text-violet-400">{store?.name || 'NovaGear'}</span> is ready.
          </h1>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
            Autonomous AI shopping agents (ChatGPT Operator, Google Project Mariner, Perplexity Shopping) reject stores with missing JSON-LD schemas, untracked inventory, and human CAPTCHA popups.
          </p>
        </div>

        {/* Quick Action Matrix */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 z-10">
          <button
            id="btn-dash-run-sim"
            onClick={() => onNavigate('buyer_lab')}
            className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-900/20"
          >
            <Bot className="w-4 h-4" />
            <span>Open AI Buyer Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            id="btn-dash-run-whatif"
            onClick={() => onNavigate('counterfactual')}
            className="px-4 py-2 bg-[#080809] hover:bg-slate-800 text-violet-300 border border-violet-500/30 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <GitCompare className="w-4 h-4" />
            <span>Simulate What-If Lift</span>
          </button>
        </div>
      </div>

      {/* Primary Score & Leak Visualizer */}
      <ReadinessScoreCard score={currentScore} storeName={store?.name || 'NovaGear'} />

      {/* Real-time Revenue Leak & Remediation Widget */}
      {leakSummary && (
        <div
          id="dash-revenue-intelligence-banner"
          onClick={() => onNavigate('revenue_intelligence')}
          className="p-5 bg-gradient-to-r from-[#171015] via-[#121218] to-[#0e1613] border border-amber-500/30 hover:border-amber-500/60 rounded-2xl cursor-pointer transition-all shadow-xl space-y-3 group relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Merchant Revenue Leak & Remediation Analytics
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {leakSummary.activeLeaksCount} Active Bottlenecks
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  AI shopping agents encounter drop-offs on schema validation and 3DS redirects.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <p className="text-[10px] uppercase font-semibold text-rose-400">Monthly Revenue at Risk</p>
                <p className="text-lg font-black text-rose-200">
                  ₹{leakSummary.totalRevenueAtRisk.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="text-right pl-3 border-l border-slate-800">
                <p className="text-[10px] uppercase font-semibold text-emerald-400">Recovered</p>
                <p className="text-lg font-black text-emerald-300">
                  +₹{leakSummary.revenueRecovered.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      )}

      <RevenueLeakMap
        revenueImpact={currentRevenueImpact}
        frictionPoints={latestReport?.frictionPoints || []}
        onSelectFix={() => onNavigate('fixes')}
      />

      {/* Quick Launchpad Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Analytics & Intelligence Card */}
        <div
          id="dash-card-analytics"
          onClick={() => onNavigate('analytics')}
          className="p-5 bg-[#0D0D0E] border border-indigo-500/20 hover:border-indigo-500/40 rounded-2xl cursor-pointer transition-all space-y-3 group bg-gradient-to-br from-indigo-950/20 via-transparent to-transparent"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              <span>View Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Merchant Analytics</h3>
            <p className="text-xs text-slate-400 mt-1">
              Track autonomous GMV velocity, AI buyer persona conversion rates, and printable commerce reports.
            </p>
          </div>
        </div>

        {/* Fix Priority Queue */}
        <div
          id="dash-card-fixes"
          onClick={() => onNavigate('fixes')}
          className="p-5 bg-[#0D0D0E] border border-slate-800/50 hover:border-slate-700 rounded-2xl cursor-pointer transition-all space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Wrench className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-rose-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              <span>View Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Fix Priority Queue</h3>
            <p className="text-xs text-slate-400 mt-1">
              Inspect P0/P1 code patches with before/after snippets for UCP manifest and Razorpay agent tokens.
            </p>
          </div>
        </div>

        {/* Manifest Inspector */}
        <div
          id="dash-card-manifest"
          onClick={() => onNavigate('manifest')}
          className="p-5 bg-[#0D0D0E] border border-slate-800/50 hover:border-slate-700 rounded-2xl cursor-pointer transition-all space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <FileCode2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-violet-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              <span>Inspect Schema</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Agent Manifest</h3>
            <p className="text-xs text-slate-400 mt-1">
              Verify your live <code className="text-violet-300">/.well-known/agent-commerce.json</code> protocol endpoints.
            </p>
          </div>
        </div>

        {/* Orders & Checkout Lifecycle */}
        <div
          id="dash-card-orders"
          onClick={() => onNavigate('orders')}
          className="p-5 bg-[#0D0D0E] border border-slate-800/50 hover:border-slate-700 rounded-2xl cursor-pointer transition-all space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-violet-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              <span>View Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Autonomous Orders</h3>
            <p className="text-xs text-slate-400 mt-1">
              Track real-time AI purchases, inventory locks, and machine-to-machine Razorpay tokens.
            </p>
          </div>
        </div>

        {/* Razorpay Sandbox */}
        <div
          id="dash-card-payment"
          onClick={() => onNavigate('payment_sandbox')}
          className="p-5 bg-[#0D0D0E] border border-slate-800/50 hover:border-slate-700 rounded-2xl cursor-pointer transition-all space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              <span>Test Checkout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Razorpay Agent Token</h3>
            <p className="text-xs text-slate-400 mt-1">
              Simulate instant machine-to-machine checkout without browser popups or 3DS failures.
            </p>
          </div>
        </div>

        {/* Integration Diagnostics */}
        <div
          id="dash-card-diagnostics"
          onClick={() => onNavigate('diagnostics')}
          className="p-5 bg-[#0D0D0E] border border-slate-800/50 hover:border-slate-700 rounded-2xl cursor-pointer transition-all space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-sky-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              <span>System Health</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">System Diagnostics</h3>
            <p className="text-xs text-slate-400 mt-1">
              Monitor AI Gemini engine, database, webhooks, and multi-tenant isolation status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
