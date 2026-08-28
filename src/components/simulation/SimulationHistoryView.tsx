import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SimulationHistoryItem, SimulationReport } from '../../types/index';
import { api } from '../../lib/api';
import { JourneyReplayModal } from './JourneyReplayModal';
import {
  History,
  ShieldCheck,
  Play,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Sparkles,
  Bot,
  RefreshCw,
} from 'lucide-react';

export function SimulationHistoryView() {
  const { merchant } = useAuth();
  const [history, setHistory] = useState<SimulationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedReport, setSelectedReport] = useState<SimulationReport | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED' | 'BLOCKED_BY_FRICTION'>('ALL');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'gemini_ai' | 'deterministic_fallback'>('ALL');

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSimulationHistory(merchant?.id);
      setHistory(data);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [merchant]);

  const handleOpenDetail = async (id: string) => {
    try {
      const report = await api.getSimulation(id);
      setSelectedReport(report);
    } catch (err) {
      console.error('Error fetching simulation report:', err);
    }
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.personaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.productTitle && item.productTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.storeName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesMode = modeFilter === 'ALL' || item.executionMode === modeFilter;

    return matchesSearch && matchesStatus && matchesMode;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-violet-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Simulation Audit Trail & History
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete record of autonomous buyer audits, score progressions, and deterministic friction logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">
            {filteredHistory.length} of {history.length} Audits
          </span>
          <button
            id="btn-refresh-history"
            onClick={fetchHistory}
            disabled={isLoading}
            className="p-2 bg-[#0D0D0E] border border-slate-800/60 hover:bg-slate-900 text-slate-300 rounded-xl transition-colors"
            title="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0D0D0E] border border-slate-800/50 rounded-2xl p-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-sim-history"
            type="text"
            placeholder="Search by product, persona, or store..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#080809] border border-slate-800/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#080809] border border-slate-800/60 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              id="select-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Passed / Success</option>
              <option value="BLOCKED_BY_FRICTION">Blocked by Friction</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#080809] border border-slate-800/60 rounded-xl px-2.5 py-1.5">
            <select
              id="select-mode-filter"
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value as any)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Modes</option>
              <option value="gemini_ai">Gemini AI</option>
              <option value="deterministic_fallback">Deterministic Fallback</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table / List */}
      <div className="bg-[#0D0D0E] border border-slate-800/50 rounded-2xl overflow-hidden">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-900/20 text-violet-400 flex items-center justify-center mx-auto">
              <Bot className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-400">
              {history.length === 0
                ? 'No simulations logged yet. Run a simulation in the AI Buyer Lab.'
                : 'No audits match your search and filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                id={`history-row-${item.id}`}
                className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.status === 'SUCCESS'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {item.status === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs font-semibold text-white">{item.personaName}</h4>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${
                          item.executionMode === 'gemini_ai'
                            ? 'bg-violet-950/30 text-violet-300 border-violet-500/30'
                            : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
                        }`}
                      >
                        {item.executionMode === 'gemini_ai' ? 'Gemini AI' : 'Deterministic Fallback'}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Product: <span className="text-slate-200">{item.productTitle || 'Catalog item'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Readiness</span>
                    <span className="text-xs font-bold text-white">
                      {item.overallScore}/100 <span className="text-[11px] font-semibold text-violet-400">({item.grade})</span>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Est. Leakage</span>
                    <span className="text-xs font-bold text-red-400 font-mono">
                      -₹{item.revenueLoss.toLocaleString('en-IN')}<span className="text-[10px] font-normal text-slate-500">/mo</span>
                    </span>
                  </div>

                  <button
                    id={`btn-view-hist-detail-${item.id}`}
                    onClick={() => handleOpenDetail(item.id)}
                    className="px-3.5 py-1.5 bg-violet-950/30 hover:bg-violet-900/40 text-violet-300 text-xs font-semibold rounded-xl border border-violet-500/30 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Replay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Replay Modal */}
      {selectedReport && (
        <JourneyReplayModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </div>
  );
}
