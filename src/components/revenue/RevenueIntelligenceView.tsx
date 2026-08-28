import React, { useState, useEffect } from 'react';
import {
  Flame,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Zap,
  AlertTriangle,
  Clock,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Package,
  CreditCard,
  FileCode2,
  Bot,
  Percent,
} from 'lucide-react';
import {
  RevenueLeakItem,
  RevenueLeakSummary,
  RevenueLeakCategory,
  RevenueLeakSeverity,
  RevenueLeakStatus,
} from '../../types/index';
import { RevenueLeakDetailModal } from './RevenueLeakDetailModal';

interface RevenueIntelligenceViewProps {
  onNavigateToTab?: (tab: any, subId?: string) => void;
}

export function RevenueIntelligenceView({ onNavigateToTab }: RevenueIntelligenceViewProps) {
  const [leaks, setLeaks] = useState<RevenueLeakItem[]>([]);
  const [summary, setSummary] = useState<RevenueLeakSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [inspectingLeak, setInspectingLeak] = useState<RevenueLeakItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchLeaksAndSummary = async () => {
    try {
      setIsLoading(true);
      const [leaksRes, summaryRes] = await Promise.all([
        fetch('/api/revenue-leaks'),
        fetch('/api/revenue-leaks/summary'),
      ]);

      if (leaksRes.ok && summaryRes.ok) {
        const leaksData = await leaksRes.json();
        const summaryData = await summaryRes.json();
        setLeaks(leaksData);
        setSummary(summaryData);
      }
    } catch (err) {
      console.error('Failed to load revenue leaks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaksAndSummary();
  }, []);

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/revenue-leaks/analyze', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setLeaks(data.leaks || []);
        setSummary(data.summary || null);
        showToast('Deep Revenue Leak scan completed successfully. Diagnostics synchronized.');
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: RevenueLeakStatus) => {
    try {
      const res = await fetch(`/api/revenue-leaks/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setLeaks((prev) => prev.map((l) => (l.id === id ? data.leak : l)));
        setSummary(data.summary);
        if (inspectingLeak && inspectingLeak.id === id) {
          setInspectingLeak(data.leak);
        }
        if (newStatus === 'RESOLVED') {
          showToast(`Leak marked as RESOLVED! Revenue recovery recorded.`);
        } else {
          showToast(`Status updated to ${newStatus}.`);
        }
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const formatCurrency = (val: number, cur: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: cur || 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Filter leaks
  const filteredLeaks = leaks.filter((leak) => {
    if (selectedStatus !== 'ALL' && leak.status !== selectedStatus) return false;
    if (selectedCategory !== 'ALL' && leak.category !== selectedCategory) return false;
    if (selectedSeverity !== 'ALL' && leak.severity !== selectedSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        leak.title.toLowerCase().includes(q) ||
        leak.affectedEntity.toLowerCase().includes(q) ||
        leak.evidence.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'high':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'medium':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusPill = (status: RevenueLeakStatus) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'IN_PROGRESS':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'product':
        return Package;
      case 'payment':
        return CreditCard;
      case 'manifest':
        return FileCode2;
      case 'simulation':
        return Bot;
      default:
        return Layers;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="revenue-toast-notification"
          className="fixed bottom-6 right-6 z-50 bg-[#16161c] border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom-5"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 tracking-wide uppercase">
              Financial Impact Engine
            </span>
            <span className="text-xs text-slate-400">Strict Tenant Isolated</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Flame className="w-7 h-7 text-amber-400" />
            Merchant Revenue Leak & Remediation Analytics
          </h1>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            Continuously monitors and quantifies lost revenue across autonomous AI Buyer purchase
            journeys (UCP discovery, machine specs, policy thresholds, and Razorpay M2M token settlements).
          </p>
        </div>

        <button
          id="run-leak-scan-btn"
          disabled={isScanning}
          onClick={handleRunScan}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition-all shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Scanning Telemetry...' : 'Run Deep Leak Analysis'}</span>
        </button>
      </div>

      {/* Top Summary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue at Risk */}
        <div className="p-5 bg-gradient-to-b from-[#141014] to-[#0d0d10] border border-rose-900/30 rounded-2xl space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Monthly Revenue At Risk
            </p>
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <Flame className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-100 tracking-tight">
            {formatCurrency(summary?.totalRevenueAtRisk || 0, summary?.currency)}
          </p>
          <p className="text-[11px] text-slate-400">
            Across {summary?.activeLeaksCount || 0} unmitigated drop-off point(s)
          </p>
        </div>

        {/* Card 2: Revenue Recovered */}
        <div className="p-5 bg-gradient-to-b from-[#0e1713] to-[#0d0d10] border border-emerald-900/30 rounded-2xl space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Revenue Recovered
            </p>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-200 tracking-tight">
            +{formatCurrency(summary?.revenueRecovered || 0, summary?.currency)}
          </p>
          <p className="text-[11px] text-slate-400">
            {summary?.resolvedLeaksCount || 0} friction bottleneck(s) resolved
          </p>
        </div>

        {/* Card 3: Recovery Progress */}
        <div className="p-5 bg-gradient-to-b from-[#12121c] to-[#0d0d10] border border-violet-900/30 rounded-2xl space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
              Recovery Efficiency
            </p>
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Percent className="w-4 h-4 text-violet-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-violet-200 tracking-tight">
              {summary?.recoveryPercentage || 0}%
            </p>
            <span className="text-xs text-slate-400">of potential captured</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${summary?.recoveryPercentage || 0}%` }}
            />
          </div>
        </div>

        {/* Card 4: Leak Distribution */}
        <div className="p-5 bg-[#0e0e12] border border-slate-800 rounded-2xl space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Friction Bottlenecks
            </p>
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-black text-white tracking-tight">
              {summary?.activeLeaksCount || 0}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-semibold">
              <span>{summary?.leaksBySeverity?.critical?.count || 0} Critical</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            {summary?.inProgressLeaksCount || 0} in active remediation
          </p>
        </div>
      </div>

      {/* Category Breakdown Horizontal Pills */}
      {summary && Object.keys(summary.leaksByCategory || {}).length > 0 && (
        <div className="p-4 bg-[#0d0d10] border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-violet-400" />
              Revenue Loss Distribution by Protocol Stage
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Evaluated {new Date(summary.evaluatedAt).toLocaleTimeString()}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {Object.entries(summary.leaksByCategory as Record<string, { count: number; revenueAtRisk: number }>).map(([cat, data]) => {
              if (data.count === 0 && data.revenueAtRisk === 0) return null;
              return (
                <div
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? 'ALL' : cat)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-violet-950/30 border-violet-500/50 shadow-md'
                      : 'bg-[#141419] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <p className="text-[11px] text-slate-400 capitalize truncate font-medium">
                    {cat.replace(/_/g, ' ')}
                  </p>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xs font-bold text-rose-300">
                      {formatCurrency(data.revenueAtRisk, summary.currency)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {data.count} issue{data.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 bg-[#0d0d10] border border-slate-800 rounded-2xl">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((status) => {
            const count =
              status === 'ALL'
                ? leaks.length
                : leaks.filter((l) => l.status === status).length;
            const isActive = selectedStatus === status;
            return (
              <button
                key={status}
                id={`filter-status-${status}`}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-[#141419] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{status === 'ALL' ? 'All Leaks' : status.replace('_', ' ')}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                    isActive ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Search & Selects */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Dropdown */}
          <select
            id="filter-severity-select"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-[#141419] border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-violet-500"
          >
            <option value="ALL">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Category Dropdown */}
          <select
            id="filter-category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-[#141419] border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-violet-500"
          >
            <option value="ALL">All Categories</option>
            <option value="catalog_discovery">Catalog Discovery</option>
            <option value="spec_microdata">Spec Microdata</option>
            <option value="inventory_stock">Inventory & Stock</option>
            <option value="return_policy">Return Policy</option>
            <option value="payment_readiness">Payment Readiness</option>
            <option value="captcha_blocker">CAPTCHA Blocker</option>
            <option value="simulation_failure">Simulation Failure</option>
            <option value="webhook_delivery">Webhook Delivery</option>
          </select>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="search-leaks-input"
              type="text"
              placeholder="Search bottlenecks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-[#141419] border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 w-44 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Leaks Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
          <p className="text-xs">Computing real-time revenue leak telemetry...</p>
        </div>
      ) : filteredLeaks.length === 0 ? (
        <div className="p-12 text-center bg-[#0d0d10] border border-slate-800 rounded-2xl space-y-3">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Revenue Leaks Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {searchQuery || selectedCategory !== 'ALL' || selectedSeverity !== 'ALL' || selectedStatus !== 'ALL'
              ? 'No issues match the selected filters. Try clearing your search parameters.'
              : 'All AI Buyer transaction touchpoints are operating at zero detected revenue friction!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLeaks.map((leak) => {
            const EntityIcon = getEntityIcon(leak.entityType);
            const isResolved = leak.status === 'RESOLVED';

            return (
              <div
                key={leak.id}
                id={`leak-card-${leak.id}`}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  isResolved
                    ? 'bg-[#0d120f] border-emerald-900/30 hover:border-emerald-500/40'
                    : leak.severity === 'critical'
                    ? 'bg-gradient-to-b from-[#161014] to-[#0e0e11] border-rose-900/40 hover:border-rose-500/50'
                    : 'bg-[#0e0e12] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${getSeverityBadge(
                          leak.severity
                        )}`}
                      >
                        {leak.severity}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${getStatusPill(
                          leak.status
                        )}`}
                      >
                        {leak.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className={`text-base font-black tracking-tight ${isResolved ? 'text-emerald-400 line-through' : 'text-rose-300'}`}>
                        {formatCurrency(leak.estimatedRevenueAtRisk, summary?.currency)}
                        <span className="text-[10px] font-normal text-slate-400 ml-1">/mo</span>
                      </p>
                    </div>
                  </div>

                  {/* Title & Entity */}
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight leading-snug">
                      {leak.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5">
                      <EntityIcon className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      <span className="truncate">{leak.affectedEntity}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        +{leak.readinessImpactPoints || 10} pts
                      </span>
                    </div>
                  </div>

                  {/* Evidence snippet */}
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed bg-black/20 p-2.5 rounded-xl border border-slate-800/60 font-mono text-[11px]">
                    {leak.evidence}
                  </p>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    id={`inspect-leak-${leak.id}`}
                    onClick={() => setInspectingLeak(leak)}
                    className="px-3 py-1.5 bg-[#141419] hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700/60 transition-all flex items-center gap-1.5"
                  >
                    <span>Inspect Diagnostic</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {leak.relatedFixId && !isResolved && (
                      <button
                        id={`deploy-fix-${leak.id}`}
                        onClick={() => {
                          if (onNavigateToTab) {
                            onNavigateToTab('fixes', leak.relatedFixId);
                          }
                        }}
                        className="px-3 py-1.5 bg-violet-900/30 hover:bg-violet-900/50 text-violet-300 text-xs font-semibold rounded-xl border border-violet-500/30 transition-all flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5 text-violet-400" />
                        <span>Deploy Fix</span>
                      </button>
                    )}

                    {!isResolved ? (
                      <button
                        id={`quick-resolve-${leak.id}`}
                        onClick={() => handleStatusChange(leak.id, 'RESOLVED')}
                        title="Mark Resolved"
                        className="px-3 py-1.5 bg-emerald-950/30 hover:bg-emerald-950/60 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/30 transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Resolve</span>
                      </button>
                    ) : (
                      <button
                        id={`reopen-leak-${leak.id}`}
                        onClick={() => handleStatusChange(leak.id, 'OPEN')}
                        className="px-2.5 py-1.5 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Modal */}
      {inspectingLeak && (
        <RevenueLeakDetailModal
          leak={inspectingLeak}
          currency={summary?.currency || 'INR'}
          onClose={() => setInspectingLeak(null)}
          onStatusChange={handleStatusChange}
          onNavigateToFixes={(fixId) => onNavigateToTab?.('fixes', fixId)}
          onNavigateToSimulations={(simId) => onNavigateToTab?.('buyer_lab')}
          onNavigateToProducts={() => onNavigateToTab?.('products')}
        />
      )}
    </div>
  );
}
