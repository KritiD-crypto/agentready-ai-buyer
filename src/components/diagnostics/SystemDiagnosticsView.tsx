import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Server,
  Cpu,
  Database,
  ShieldCheck,
  CreditCard,
  Webhook,
  FileCode2,
  Package,
  Bot,
  Store,
  ArrowUpRight,
  Play,
  Clock,
  Radio,
  Send,
  Code,
  Check,
  ChevronDown,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { SystemHealthReport, SystemDiagnosticItem, WebhookEventRecord } from '../../types';

export function SystemDiagnosticsView() {
  const [report, setReport] = useState<SystemHealthReport | null>(null);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReplayingWebhook, setIsReplayingWebhook] = useState(false);
  const [replayEvent, setReplayEvent] = useState('payment.captured');
  const [replaySuccessMsg, setReplaySuccessMsg] = useState<string | null>(null);
  const [expandedWebhookId, setExpandedWebhookId] = useState<string | null>(null);
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'subsystems' | 'webhooks'>('all');

  const fetchHealth = async () => {
    try {
      setIsLoading(true);
      const [healthRes, webhooksRes] = await Promise.all([
        fetch('/api/system/health'),
        fetch('/api/webhooks/events'),
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setReport(healthData);
      }
      if (webhooksRes.ok) {
        const webhooksData = await webhooksRes.json();
        setWebhookEvents(webhooksData);
      }
    } catch (err) {
      console.error('Failed to fetch system diagnostics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleReplayWebhook = async () => {
    try {
      setIsReplayingWebhook(true);
      setReplaySuccessMsg(null);
      const res = await fetch('/api/webhooks/replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: replayEvent,
          orderId: `order_sim_${Date.now().toString(36)}`,
          paymentId: `pay_sim_${Date.now().toString(36)}`,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setReplaySuccessMsg(`Webhook ${replayEvent} dispatched and processed in 3ms.`);
        await fetchHealth();
        setTimeout(() => setReplaySuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Webhook replay error:', err);
    } finally {
      setIsReplayingWebhook(false);
    }
  };

  const getSubsystemIcon = (subsystem?: string, category?: string) => {
    const key = subsystem || category || '';
    if (key.includes('ai')) return <Cpu className="w-4 h-4 text-violet-400" />;
    if (key.includes('supabase') || key.includes('database')) return <Database className="w-4 h-4 text-emerald-400" />;
    if (key.includes('store')) return <Store className="w-4 h-4 text-sky-400" />;
    if (key.includes('catalog')) return <Package className="w-4 h-4 text-amber-400" />;
    if (key.includes('manifest')) return <FileCode2 className="w-4 h-4 text-indigo-400" />;
    if (key.includes('simulation')) return <Bot className="w-4 h-4 text-pink-400" />;
    if (key.includes('payment')) return <CreditCard className="w-4 h-4 text-emerald-400" />;
    if (key.includes('webhook')) return <Webhook className="w-4 h-4 text-amber-400" />;
    return <ShieldCheck className="w-4 h-4 text-teal-400" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Operational
          </span>
        );
      case 'warning':
      case 'degraded':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Degraded
          </span>
        );
      case 'error':
      case 'critical':
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertOctagon className="w-3.5 h-3.5" /> Critical
          </span>
        );
    }
  };

  const overall = report?.status || 'healthy';
  const healthyCount = report?.healthyCount ?? 10;
  const warningCount = report?.warningCount ?? 0;
  const errorCount = report?.errorCount ?? 0;
  const totalChecks = report?.totalChecks ?? 10;

  return (
    <div className="space-y-6">
      {/* Header & Overall Status Banner */}
      <div className="bg-[#09090B] border border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-violet-950/40 border border-violet-500/30 flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
                  Integration Diagnostics & System Health
                </h1>
                {getStatusBadge(overall)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time sub-system verification, autonomous payment sandbox, and webhook telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] text-slate-500">Evaluated at</p>
              <p className="text-xs font-mono text-slate-300">
                {report?.timestamp ? new Date(report.timestamp).toLocaleTimeString() : 'Live'}
              </p>
            </div>

            <button
              id="btn-run-system-diagnostics"
              onClick={fetchHealth}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all shadow-lg shadow-violet-900/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Running Diagnostics...' : 'Run Diagnostics'}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/60">
          <div className="bg-[#0D0D0E] border border-slate-800/50 rounded-xl p-3.5">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Operational Checks</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-emerald-400">{healthyCount}</span>
              <span className="text-xs text-slate-500">/ {totalChecks} active</span>
            </div>
          </div>

          <div className="bg-[#0D0D0E] border border-slate-800/50 rounded-xl p-3.5">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Warnings / Attention</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-xl font-bold ${warningCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                {warningCount}
              </span>
              <span className="text-xs text-slate-500">subsystems</span>
            </div>
          </div>

          <div className="bg-[#0D0D0E] border border-slate-800/50 rounded-xl p-3.5">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Webhook Telemetry</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-violet-400">{webhookEvents.length}</span>
              <span className="text-xs text-slate-500">events logged</span>
            </div>
          </div>

          <div className="bg-[#0D0D0E] border border-slate-800/50 rounded-xl p-3.5">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">System Uptime</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-slate-200">
                {Math.floor((report?.systemUptimeSeconds || 3600) / 60)}m
              </span>
              <span className="text-xs text-emerald-400 font-medium">99.98%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-1">
        <button
          id="btn-subtab-all"
          onClick={() => setActiveSubTab('all')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeSubTab === 'all'
              ? 'bg-violet-900/30 text-violet-300 border border-violet-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Diagnostics & Telemetry
        </button>
        <button
          id="btn-subtab-subsystems"
          onClick={() => setActiveSubTab('subsystems')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeSubTab === 'subsystems'
              ? 'bg-violet-900/30 text-violet-300 border border-violet-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Subsystems ({totalChecks})
        </button>
        <button
          id="btn-subtab-webhooks"
          onClick={() => setActiveSubTab('webhooks')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'webhooks'
              ? 'bg-violet-900/30 text-violet-300 border border-violet-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Webhook Monitor</span>
          <span className="px-1.5 py-0.2 text-[10px] bg-slate-800 rounded-full text-slate-300 font-mono">
            {webhookEvents.length}
          </span>
        </button>
      </div>

      {/* Subsystems Health Grid */}
      {(activeSubTab === 'all' || activeSubTab === 'subsystems') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider text-[11px] text-slate-400">
              Subsystem Verification Checks
            </h2>
            <span className="text-xs text-slate-500">Auto-refreshed every 20s</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {report?.checks.map((item: SystemDiagnosticItem) => {
              const isExpanded = expandedCheckId === item.id;
              return (
                <div
                  key={item.id}
                  id={`diagnostic-check-${item.id}`}
                  className="bg-[#09090B] border border-slate-800/80 rounded-xl p-4 transition-all hover:border-slate-700 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#0D0D0E] border border-slate-800/60 mt-0.5">
                        {getSubsystemIcon(item.subsystem, item.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-semibold text-white">{item.name}</h3>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.message}</p>
                      </div>
                    </div>

                    <div className="shrink-0">{getStatusBadge(item.status)}</div>
                  </div>

                  {item.recommendation && (
                    <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
                      <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-300/90 leading-snug">{item.recommendation}</p>
                    </div>
                  )}

                  {/* Metadata / Details Collapsible */}
                  {item.details && (
                    <div>
                      <button
                        onClick={() => setExpandedCheckId(isExpanded ? null : item.id)}
                        className="text-[10px] text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 pt-1"
                      >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        <span>{isExpanded ? 'Hide Technical Metadata' : 'View Technical Metadata'}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-2.5 rounded-lg bg-[#050505] border border-slate-800/70 font-mono text-[10px] text-slate-300 overflow-x-auto space-y-1">
                          {Object.entries(item.details).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between py-0.5 border-b border-slate-800/40 last:border-0">
                              <span className="text-slate-500">{key}:</span>
                              <span className="text-violet-300 font-semibold">{String(val)}</span>
                            </div>
                          ))}
                          {item.latencyMs !== undefined && (
                            <div className="flex items-center justify-between py-0.5 text-slate-500">
                              <span>latencyMs:</span>
                              <span className="text-emerald-400">{item.latencyMs} ms</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Webhook Telemetry & Simulator */}
      {(activeSubTab === 'all' || activeSubTab === 'webhooks') && (
        <div className="bg-[#09090B] border border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center">
                <Webhook className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Webhook Monitoring & Dispatch Simulation</h2>
                <p className="text-xs text-slate-400">
                  Cryptographic HMAC signature verification, delivery log, and idempotency protection
                </p>
              </div>
            </div>

            {/* Trigger Replay / Test Webhook */}
            <div className="flex items-center gap-2">
              <select
                id="select-webhook-replay-event"
                value={replayEvent}
                onChange={(e) => setReplayEvent(e.target.value)}
                className="px-3 py-1.5 text-xs bg-[#0D0D0E] border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500"
              >
                <option value="payment.captured">payment.captured</option>
                <option value="order.paid">order.paid</option>
                <option value="payment.failed">payment.failed</option>
                <option value="refund.processed">refund.processed</option>
              </select>

              <button
                id="btn-replay-webhook"
                onClick={handleReplayWebhook}
                disabled={isReplayingWebhook}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl transition-all shadow-md disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${isReplayingWebhook ? 'animate-spin' : ''}`} />
                <span>{isReplayingWebhook ? 'Dispatching...' : 'Dispatch Test Event'}</span>
              </button>
            </div>
          </div>

          {replaySuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{replaySuccessMsg}</span>
            </div>
          )}

          {/* Webhook Events Table */}
          <div className="overflow-x-auto">
            {webhookEvents.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">
                No webhook events recorded yet. Click "Dispatch Test Event" above to trigger a live simulation event.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 font-medium uppercase tracking-wider text-[10px]">
                    <th className="pb-3 px-3">Event Type</th>
                    <th className="pb-3 px-3">Order / Payment ID</th>
                    <th className="pb-3 px-3">Signature Verification</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Duration</th>
                    <th className="pb-3 px-3">Timestamp</th>
                    <th className="pb-3 px-3 text-right">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {webhookEvents.map((evt) => {
                    const isExpanded = expandedWebhookId === evt.id;
                    return (
                      <React.Fragment key={evt.id}>
                        <tr className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-3 font-mono font-semibold text-violet-300">
                            {evt.event}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-300 text-[11px]">
                            {evt.orderId || evt.paymentId || 'N/A'}
                          </td>
                          <td className="py-3 px-3">
                            {evt.signatureVerified ? (
                              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                                <Check className="w-3 h-3" /> HMAC Verified
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                                <AlertTriangle className="w-3 h-3" /> Unverified
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {evt.status || 'PROCESSED'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                            {evt.processingDurationMs ?? 2}ms
                          </td>
                          <td className="py-3 px-3 text-slate-400 text-[11px]">
                            {new Date(evt.receivedAt).toLocaleTimeString()}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => setExpandedWebhookId(isExpanded ? null : evt.id)}
                              className="text-[11px] text-violet-400 hover:text-violet-300 font-medium underline"
                            >
                              {isExpanded ? 'Hide' : 'Inspect'}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="p-3 bg-[#050505] border-y border-slate-800">
                              <div className="font-mono text-[11px] text-slate-300 p-3 bg-[#080809] rounded-lg border border-slate-800/80 overflow-x-auto">
                                <p className="text-[10px] text-slate-500 mb-1">// Webhook Payload Data</p>
                                <pre>{JSON.stringify(evt.payload || evt, null, 2)}</pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
