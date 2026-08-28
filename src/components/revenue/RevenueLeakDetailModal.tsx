import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Code2,
  ExternalLink,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { RevenueLeakItem, RevenueLeakStatus } from '../../types/index';

interface RevenueLeakDetailModalProps {
  leak: RevenueLeakItem;
  currency?: string;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: RevenueLeakStatus) => Promise<void>;
  onNavigateToFixes?: (fixId?: string) => void;
  onNavigateToSimulations?: (simId?: string) => void;
  onNavigateToProducts?: (productId?: string) => void;
}

export function RevenueLeakDetailModal({
  leak,
  currency = 'INR',
  onClose,
  onStatusChange,
  onNavigateToFixes,
  onNavigateToSimulations,
  onNavigateToProducts,
}: RevenueLeakDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

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

  const getStatusBadge = (status: RevenueLeakStatus) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'IN_PROGRESS':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    }
  };

  const handleStatusClick = async (status: RevenueLeakStatus) => {
    setIsUpdating(true);
    try {
      await onStatusChange(leak.id, status);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      id="revenue-leak-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="revenue-leak-modal-container"
        className="w-full max-w-2xl bg-[#0e0e11] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-start justify-between bg-[#121216]/50">
          <div className="space-y-2 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-md border ${getSeverityBadge(
                  leak.severity
                )}`}
              >
                {leak.severity} Priority
              </span>
              <span
                className={`px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-md border ${getStatusBadge(
                  leak.status
                )}`}
              >
                {leak.status.replace('_', ' ')}
              </span>
              <span className="px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-800/60 rounded border border-slate-700/50">
                {leak.category.replace(/_/g, ' ')}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{leak.title}</h2>
          </div>
          <button
            id="close-leak-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm text-slate-300">
          {/* Key Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gradient-to-r from-rose-950/20 via-slate-900 to-[#121216] border border-rose-900/30 rounded-xl">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-rose-400 font-semibold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                Monthly Revenue at Risk
              </p>
              <p className="text-2xl font-black text-rose-200 tracking-tight">
                {formatCurrency(leak.estimatedRevenueAtRisk)}
                <span className="text-xs font-normal text-rose-400/70 ml-1">/ mo</span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                Readiness Score Impact
              </p>
              <p className="text-2xl font-black text-violet-300 tracking-tight">
                +{leak.readinessImpactPoints || 12} pts
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Detection Confidence
              </p>
              <p className="text-2xl font-black text-emerald-300 tracking-tight">
                {Math.round((leak.confidenceScore || 0.95) * 100)}%
              </p>
            </div>
          </div>

          {/* Section 1: Affected Entity & Technical Evidence */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" />
              Target Entity & Diagnostic Evidence
            </h3>
            <div className="p-4 bg-[#141419] border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Affected Component:</span>
                <span className="text-xs font-semibold text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                  {leak.affectedEntity}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/60 font-mono text-xs text-rose-300/90 bg-black/40 p-3 rounded-lg border border-rose-950/40 leading-relaxed">
                {leak.evidence}
              </div>
            </div>
          </div>

          {/* Section 2: Why AI Buyer Drops Off */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Autonomous AI Agent Behavior & Drop-Off Cause
            </h3>
            <div className="p-4 bg-amber-950/15 border border-amber-500/20 rounded-xl text-xs text-amber-200/90 leading-relaxed">
              {leak.whyAiBuyerFails}
            </div>
          </div>

          {/* Section 3: Recommended Remediation */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Actionable Remediation Strategy
            </h3>
            <div className="p-4 bg-emerald-950/15 border border-emerald-500/20 rounded-xl space-y-3">
              <p className="text-xs text-emerald-200 leading-relaxed">
                {leak.recommendedRemediation}
              </p>
              {leak.relatedFixId && (
                <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20 text-xs">
                  <span className="text-slate-400">Available in Fix Priority Queue:</span>
                  <button
                    id="goto-fix-queue-btn"
                    onClick={() => {
                      onClose();
                      onNavigateToFixes?.(leak.relatedFixId);
                    }}
                    className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
                  >
                    Deploy Code Fix in 1-Click
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 border-t border-slate-800 bg-[#121216]/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Status:</span>
            <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800">
              <button
                id="set-leak-open-btn"
                disabled={isUpdating}
                onClick={() => handleStatusClick('OPEN')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  leak.status === 'OPEN'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Open
              </button>
              <button
                id="set-leak-inprogress-btn"
                disabled={isUpdating}
                onClick={() => handleStatusClick('IN_PROGRESS')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  leak.status === 'IN_PROGRESS'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                In Progress
              </button>
              <button
                id="set-leak-resolved-btn"
                disabled={isUpdating}
                onClick={() => handleStatusClick('RESOLVED')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  leak.status === 'RESOLVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Resolved
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {leak.status !== 'RESOLVED' && (
              <button
                id="resolve-and-recover-btn"
                disabled={isUpdating}
                onClick={() => handleStatusClick('RESOLVED')}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Resolved & Recover {formatCurrency(leak.estimatedRevenueAtRisk)}</span>
              </button>
            )}
            <button
              id="close-detail-modal-btn"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
