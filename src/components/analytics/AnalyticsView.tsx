import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  AnalyticsTimeRange,
  AnalyticsFilterParams,
  AnalyticsOverviewMetrics,
  AnalyticsTimeSeriesPoint,
  PersonaAnalytics,
  ProductAnalytics,
  SimulationStageFailureMetric,
  DeterministicRecommendation,
  MerchantAnalyticsReport,
} from '../../types/index';
import { api } from '../../lib/api';
import { TimeSeriesChart, PillarBreakdown, StageDropoffFunnel } from './AnalyticsCharts';
import { AnalyticsReportModal } from './AnalyticsReportModal';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Flame,
  ShieldCheck,
  Bot,
  Package,
  Activity,
  Calendar,
  Filter,
  RefreshCw,
  FileText,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Layers,
  BarChart3,
  PieChart,
  SlidersHorizontal,
} from 'lucide-react';

interface AnalyticsViewProps {
  onNavigateToTab?: (tab: any) => void;
}

export function AnalyticsView({ onNavigateToTab }: AnalyticsViewProps) {
  const { merchant } = useAuth();
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('30d');
  const [selectedPersona, setSelectedPersona] = useState<string>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'trends' | 'personas' | 'products' | 'funnel' | 'recommendations'>('trends');
  const [chartMetric, setChartMetric] = useState<'gmv' | 'orders' | 'revenue' | 'readiness'>('gmv');

  const [overview, setOverview] = useState<AnalyticsOverviewMetrics | null>(null);
  const [timeSeries, setTimeSeries] = useState<AnalyticsTimeSeriesPoint[]>([]);
  const [personas, setPersonas] = useState<PersonaAnalytics[]>([]);
  const [products, setProducts] = useState<ProductAnalytics[]>([]);
  const [stageFailures, setStageFailures] = useState<SimulationStageFailureMetric[]>([]);
  const [recommendations, setRecommendations] = useState<DeterministicRecommendation[]>([]);
  const [report, setReport] = useState<MerchantAnalyticsReport | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const filters: AnalyticsFilterParams = {
        timeRange,
        personaId: selectedPersona !== 'ALL' ? selectedPersona : undefined,
        productId: selectedProduct !== 'ALL' ? selectedProduct : undefined,
      };

      const [overviewData, timeSeriesData, personasData, productsData, stagesData, recsData, fullReport] =
        await Promise.all([
          api.getAnalyticsOverview(filters),
          api.getAnalyticsTimeSeries(filters),
          api.getPersonaAnalytics(filters),
          api.getProductAnalytics(filters),
          api.getStageFailureAnalytics(filters),
          api.getAnalyticsRecommendations(filters),
          api.getAnalyticsReport(filters),
        ]);

      setOverview(overviewData);
      setTimeSeries(timeSeriesData);
      setPersonas(personasData);
      setProducts(productsData);
      setStageFailures(stagesData);
      setRecommendations(recsData);
      setReport(fullReport);
    } catch (err) {
      console.error('Failed to load merchant analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [merchant, timeRange, selectedPersona, selectedProduct]);

  return (
    <div className="space-y-6 text-slate-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#080809] border border-slate-800/80 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-slate-100">
              Merchant Analytics & Intelligence
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md">
              Real Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated performance across AI Buyer simulations, autonomous checkouts, revenue leak recovery, and SKU readiness.
          </p>
        </div>

        {/* Controls: Time Range & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center bg-[#0D0D0F] border border-slate-800 p-1 rounded-xl">
            {(['7d', '30d', '90d', 'all'] as AnalyticsTimeRange[]).map((range) => (
              <button
                key={range}
                id={`time-range-${range}`}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  timeRange === range
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range === 'all' ? 'All Time' : range.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            id="analytics-refresh-btn"
            onClick={loadAnalyticsData}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-slate-200 bg-[#0D0D0F] hover:bg-slate-800 border border-slate-800 rounded-xl transition-all disabled:opacity-50"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-violet-400' : ''}`} />
          </button>

          <button
            id="analytics-export-report-btn"
            onClick={() => setIsReportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Autonomous GMV & Orders */}
        <div className="bg-[#080809] border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Autonomous GMV
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">
              ₹{(overview?.totalGmv || 0).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> {overview?.successfulOrders || 0} Paid Orders
              </span>
              <span className="text-slate-500">• AOV: ₹{(overview?.averageOrderValue || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/60 flex justify-between text-[11px] text-slate-400">
            <span>Checkout Success</span>
            <span className="font-semibold text-slate-200">{overview?.checkoutSuccessRate || 0}%</span>
          </div>
        </div>

        {/* Card 2: Payment Gateway & Token Settlement */}
        <div className="bg-[#080809] border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Payment Success
            </span>
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">
              {overview?.paymentSuccessRate || 100}%
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-violet-400 font-semibold">Razorpay Agent Token</span>
              <span className="text-slate-500">• Zero 3DS Drop</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/60 flex justify-between text-[11px] text-slate-400">
            <span>Simulation Success</span>
            <span className="font-semibold text-slate-200">{overview?.simulationSuccessRate || 0}%</span>
          </div>
        </div>

        {/* Card 3: Revenue Capital Recovery */}
        <div className="bg-[#080809] border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Revenue Recovered
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">
              ₹{(overview?.revenueRecovered || 0).toLocaleString('en-IN')}
              <span className="text-xs text-slate-400 font-normal">/mo</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-amber-400 font-medium">
                ₹{(overview?.revenueAtRisk || 0).toLocaleString('en-IN')} At Risk
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Recovery Progress</span>
            <span className="font-semibold text-emerald-400">
              {overview?.revenueRecoveryPercentage || 0}%
            </span>
          </div>
        </div>

        {/* Card 4: AgentReadiness Score & Grade */}
        <div className="bg-[#080809] border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              AgentReadiness Score
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-100">
              {overview?.currentReadinessScore || 70}
              <span className="text-xs text-slate-400 font-normal">/100</span>
            </div>
            <span
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                overview?.readinessGrade === 'A+' || overview?.readinessGrade === 'A'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : overview?.readinessGrade === 'B'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              Grade {overview?.readinessGrade || 'B'}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800/60 flex justify-between text-[11px] text-slate-400">
            <span>Score Delta</span>
            <span
              className={`font-semibold flex items-center gap-0.5 ${
                (overview?.readinessScoreDelta || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {(overview?.readinessScoreDelta || 0) >= 0 ? '+' : ''}
              {overview?.readinessScoreDelta || 0} pts
            </span>
          </div>
        </div>
      </div>

      {/* 5-Pillar Score Bar Summary */}
      {overview && (
        <div className="bg-[#080809] border border-slate-800/80 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                AgentReadiness Architecture (5 Pillars)
              </h3>
            </div>
            <span className="text-xs text-slate-500">Autonomous Compliance Benchmark</span>
          </div>
          <PillarBreakdown scores={overview.pillarScores} />
        </div>
      )}

      {/* Tabbed Analytical Deep Dives */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-2 gap-2">
          <div className="flex items-center gap-1.5 bg-[#0D0D0F] p-1 rounded-xl border border-slate-800">
            <button
              id="subtab-trends"
              onClick={() => setActiveSubTab('trends')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeSubTab === 'trends'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Time-Series Trends</span>
            </button>

            <button
              id="subtab-personas"
              onClick={() => setActiveSubTab('personas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeSubTab === 'personas'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Buyer Personas ({personas.length})</span>
            </button>

            <button
              id="subtab-products"
              onClick={() => setActiveSubTab('products')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeSubTab === 'products'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Catalog SKUs ({products.length})</span>
            </button>

            <button
              id="subtab-funnel"
              onClick={() => setActiveSubTab('funnel')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeSubTab === 'funnel'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Stage Dropoffs</span>
            </button>

            <button
              id="subtab-recommendations"
              onClick={() => setActiveSubTab('recommendations')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeSubTab === 'recommendations'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommendations ({recommendations.length})</span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 text-xs">
            <select
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value)}
              className="bg-[#0D0D0F] border border-slate-800 text-slate-300 px-2.5 py-1.5 rounded-xl text-xs focus:outline-none focus:border-violet-500"
            >
              <option value="ALL">All Personas</option>
              {personas.map((p) => (
                <option key={p.personaId} value={p.personaId}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="bg-[#0D0D0F] border border-slate-800 text-slate-300 px-2.5 py-1.5 rounded-xl text-xs focus:outline-none focus:border-violet-500"
            >
              <option value="ALL">All Products</option>
              {products.map((prod) => (
                <option key={prod.productId} value={prod.productId}>
                  {prod.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab 1: Time-Series Trends */}
        {activeSubTab === 'trends' && (
          <div className="bg-[#080809] border border-slate-800/80 p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Autonomous Commerce Velocity</h3>
                <p className="text-xs text-slate-400">
                  Tracking GMV, order volume, revenue recovery, and readiness score milestones.
                </p>
              </div>

              {/* Metric Selector */}
              <div className="flex items-center gap-1 bg-[#0D0D0F] p-1 rounded-xl border border-slate-800">
                {(
                  [
                    { id: 'gmv', label: 'GMV (₹)' },
                    { id: 'orders', label: 'Orders' },
                    { id: 'revenue', label: 'Revenue Recovered / Risk' },
                    { id: 'readiness', label: 'Readiness Score' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setChartMetric(m.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      chartMetric === m.id
                        ? 'bg-slate-800 text-slate-100 border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <TimeSeriesChart data={timeSeries} metric={chartMetric} currency={overview?.currency} />
          </div>
        )}

        {/* Tab 2: AI Buyer Personas */}
        {activeSubTab === 'personas' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personas.map((persona) => {
                const isHealthy = persona.successRate >= 75;
                const isFriction = persona.successRate > 0 && persona.successRate < 75;
                const isBlocked = persona.successRate === 0 && persona.simulationCount > 0;

                return (
                  <div
                    key={persona.personaId}
                    className="bg-[#080809] border border-slate-800/80 p-4 rounded-2xl space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-100">{persona.name}</h4>
                            {persona.badge && (
                              <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-violet-900/30 text-violet-300 border border-violet-500/30 rounded">
                                {persona.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">{persona.role}</p>
                        </div>

                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${
                            isHealthy
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isFriction
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {persona.successRate}% Pass
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 my-3 pt-3 border-t border-slate-800/60 text-center">
                        <div className="bg-[#0D0D0F] p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-500 uppercase block">Runs</span>
                          <span className="text-xs font-bold text-slate-200">{persona.simulationCount}</span>
                        </div>
                        <div className="bg-[#0D0D0F] p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-500 uppercase block">Avg Score</span>
                          <span className="text-xs font-bold text-violet-400">{persona.avgReadinessScore}</span>
                        </div>
                        <div className="bg-[#0D0D0F] p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-500 uppercase block">Max Budget</span>
                          <span className="text-xs font-bold text-slate-200">₹{persona.maxBudget.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span>Key Dropoff Stage:</span>
                          <span className="font-semibold text-slate-200">{persona.mostCommonFailureStage}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 bg-[#0D0D0F] p-2 rounded-lg border border-slate-800/80">
                          {persona.keyFrictionSummary}
                        </p>
                      </div>
                    </div>

                    {onNavigateToTab && (
                      <button
                        onClick={() => onNavigateToTab('buyer_lab')}
                        className="w-full py-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 bg-violet-950/20 hover:bg-violet-900/30 border border-violet-500/30 rounded-xl transition-all flex items-center justify-center gap-1.5 mt-2"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>Simulate in Buyer Lab</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Catalog SKUs */}
        {activeSubTab === 'products' && (
          <div className="bg-[#080809] border border-slate-800/80 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Product Machine-Readability & Autonomous Readiness</h3>
                <p className="text-xs text-slate-400">
                  Ensures all SKUs contain Schema.org JSON-LD microdata, locked inventory stock, and structured specs.
                </p>
              </div>
              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab('products')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-sm"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Manage Catalog</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0D0D0F] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 font-semibold">SKU & Title</th>
                    <th className="p-3.5 font-semibold">Price</th>
                    <th className="p-3.5 font-semibold">Stock Quantity</th>
                    <th className="p-3.5 font-semibold">Catalog Readiness</th>
                    <th className="p-3.5 font-semibold">Autonomous Purchases</th>
                    <th className="p-3.5 font-semibold">Revenue Generated</th>
                    <th className="p-3.5 font-semibold">Friction Diagnostic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {products.map((prod) => (
                    <tr key={prod.productId} className="hover:bg-[#0D0D0F]/50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-100">{prod.title}</div>
                        <span className="text-[10px] text-slate-500">{prod.sku} • {prod.category}</span>
                      </td>
                      <td className="p-3.5 font-semibold">₹{prod.basePrice.toLocaleString('en-IN')}</td>
                      <td className="p-3.5">
                        <span
                          className={`font-semibold ${
                            prod.stockQuantity > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {prod.stockQuantity} in stock
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                prod.catalogReadiness >= 80
                                  ? 'bg-emerald-500'
                                  : prod.catalogReadiness >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${prod.catalogReadiness}%` }}
                            />
                          </div>
                          <span className="font-semibold">{prod.catalogReadiness}%</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-200">
                        {prod.successfulPurchases} orders ({prod.conversionRate}%)
                      </td>
                      <td className="p-3.5 font-semibold text-emerald-400">
                        ₹{prod.revenueGenerated.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5">
                        {prod.isHighFriction ? (
                          <div className="flex items-center gap-1.5 text-rose-400 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{prod.topFrictionReason || 'Friction detected on agent checkout'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Optimal machine structured data</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Stage Dropoffs Funnel */}
        {activeSubTab === 'funnel' && (
          <div className="bg-[#080809] border border-slate-800/80 p-5 rounded-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">8-Stage Autonomous Agent Checkout Funnel</h3>
              <p className="text-xs text-slate-400">
                Identifies the exact phase where autonomous bots encounter friction, drop off, or abort purchases.
              </p>
            </div>
            <StageDropoffFunnel stages={stageFailures} />
          </div>
        )}

        {/* Tab 5: Deterministic Recommendations */}
        {activeSubTab === 'recommendations' && (
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div
                key={rec.id}
                className="bg-[#080809] border border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      rec.severity === 'critical'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : rec.severity === 'high'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-violet-500/10 text-violet-400 border border-violet-500/30'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-100">{rec.title}</h4>
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded border ${
                          rec.severity === 'critical'
                            ? 'bg-rose-900/30 text-rose-300 border-rose-500/30'
                            : 'bg-amber-900/30 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {rec.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{rec.description}</p>
                    <span className="inline-block text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mt-1">
                      {rec.estimatedImpact}
                    </span>
                  </div>
                </div>

                {onNavigateToTab && (
                  <button
                    onClick={() => onNavigateToTab(rec.targetTab)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-sm shrink-0 justify-center"
                  >
                    <span>{rec.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Printable Report Modal */}
      {isReportOpen && (
        <AnalyticsReportModal report={report} onClose={() => setIsReportOpen(false)} />
      )}
    </div>
  );
}
