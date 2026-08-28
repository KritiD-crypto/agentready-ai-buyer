import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AgentReadyFix } from '../../types/index';
import { api } from '../../lib/api';
import { Wrench, CheckCircle2, Copy, Check, Sparkles, ArrowRight, ShieldAlert, Code2, RefreshCw } from 'lucide-react';

export function FixPriorityQueue() {
  const { merchant, store, refreshSession } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fixes, setFixes] = useState<AgentReadyFix[]>([
    {
      id: 'fix_manifest_01',
      title: 'Deploy Universal Commerce Protocol Manifest (/.well-known/agent-commerce.json)',
      category: 'metadata',
      priority: 'P0',
      effort: '5 mins',
      impactPoints: 18,
      estimatedRevenueGain: 65000,
      explanation: 'Exposes direct JSON catalog schema and checkout API bindings for AI shopping agents (ChatGPT Operator, Google Project Mariner, Perplexity Shopping).',
      fileTarget: 'public/.well-known/agent-commerce.json',
      beforeSnippet: `<!-- No machine-readable discovery manifest detected on host -->\nHTTP 404 Not Found on /.well-known/agent-commerce.json`,
      afterSnippet: `{\n  "version": "1.0.0",\n  "protocol": "UCP-1.0",\n  "merchant": {\n    "name": "${store?.name || 'NovaGear'}",\n    "currency": "${store?.currency || 'INR'}"\n  },\n  "endpoints": {\n    "catalogJson": "/api/products",\n    "agentCheckout": "/api/payments/create-order"\n  }\n}`,
      applied: Boolean(store?.hasAgentManifest),
    },
    {
      id: 'fix_agent_token_02',
      title: 'Enable Razorpay Agentic Payment Tokenization & Remove Iframe Redirects',
      category: 'payment',
      priority: 'P0',
      effort: '15 mins',
      impactPoints: 24,
      estimatedRevenueGain: 95000,
      explanation: 'Allows autonomous agents with pre-authorized spending caps to commit orders without failing on 3DS browser redirects or human CAPTCHAs.',
      fileTarget: 'server/payment.ts',
      beforeSnippet: `// Standard Web redirect flow requiring human browser session\nres.redirect('/checkout/razorpay-hosted');`,
      afterSnippet: `// Server-to-server Agent Token settlement\nconst payment = await razorpay.orders.create({\n  amount: order.amount,\n  currency: "${store?.currency || 'INR'}",\n  notes: { agent_token: req.headers['x-agent-auth-token'] }\n});`,
      applied: Boolean(store?.hasAgentCheckoutApi),
    },
    {
      id: 'fix_return_policy_03',
      title: 'Publish Machine-Readable 14-Day MerchantReturnPolicy Schema',
      category: 'policy',
      priority: 'P1',
      effort: '5 mins',
      impactPoints: 12,
      estimatedRevenueGain: 35000,
      explanation: 'Autonomous corporate and consumer bots mandate a verifiable return policy (≥14 days) before authorizing automated transactions.',
      fileTarget: 'public/index.html',
      beforeSnippet: `<p>Returns accepted within our discretion.</p>`,
      afterSnippet: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "MerchantReturnPolicy",\n  "applicableCountry": "${store?.country || 'IN'}",\n  "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteDays",\n  "merchantReturnDays": ${store?.returnPolicyDays && store.returnPolicyDays >= 14 ? store.returnPolicyDays : 14}\n}\n</script>`,
      applied: Boolean(store?.returnPolicyDays && store.returnPolicyDays >= 14),
    },
    {
      id: 'fix_stock_api_04',
      title: 'Provide Real-time Stock Allocation & Lock Webhook',
      category: 'api',
      priority: 'P1',
      effort: '30 mins',
      impactPoints: 14,
      estimatedRevenueGain: 45000,
      explanation: 'Guarantees inventory reservation during the agent settlement phase to eliminate post-transaction out-of-stock cancellations.',
      fileTarget: 'server/routes/inventory.ts',
      beforeSnippet: `// Static stock query\nSELECT stock FROM products WHERE id = $1;`,
      afterSnippet: `// Atomic stock reservation for AI agent\nUPDATE products SET stock = stock - 1 WHERE id = $1 AND stock > 0 RETURNING true;`,
      applied: Boolean(store?.hasStockApi),
    },
  ]);

  const fetchFixes = async () => {
    try {
      setIsLoading(true);
      const loadedFixes = await api.getFixes(merchant?.id);
      if (Array.isArray(loadedFixes) && loadedFixes.length > 0) {
        setFixes(loadedFixes);
      }
    } catch (err) {
      console.warn('Failed to load fixes from API, using store profile defaults:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFixes();
  }, [merchant, store]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleApply = async (id: string) => {
    const currentFix = fixes.find((f) => f.id === id);
    const newAppliedState = !currentFix?.applied;

    // Optimistically update
    setFixes((prev) =>
      prev.map((f) => (f.id === id ? { ...f, applied: newAppliedState } : f))
    );

    try {
      await api.applyFix(id, newAppliedState, merchant?.id);
      if (refreshSession) {
        await refreshSession();
      }
    } catch (err) {
      console.error('Failed to apply fix on backend:', err);
      // Revert if failed
      setFixes((prev) =>
        prev.map((f) => (f.id === id ? { ...f, applied: !newAppliedState } : f))
      );
    }
  };

  const totalGain = fixes
    .filter((f) => !f.applied)
    .reduce((acc, x) => acc + x.estimatedRevenueGain, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-6 h-6 text-violet-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Agent-Ready Fix Priority Queue
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Prioritized engineering fixes with verified before/after code patches and estimated revenue upside.
          </p>
        </div>

        <div className="px-3.5 py-2 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-emerald-400">Total Unlocked Revenue Upside</p>
          <p className="text-sm font-bold text-emerald-300">
            +₹{totalGain.toLocaleString('en-IN')} <span className="text-[10px] font-normal text-emerald-400/80">/ mo</span>
          </p>
        </div>
      </div>

      {/* List of Fixes */}
      <div className="space-y-4">
        {fixes.map((fix) => (
          <div
            key={fix.id}
            id={`fix-card-${fix.id}`}
            className={`p-5 md:p-6 rounded-2xl border transition-all ${
              fix.applied
                ? 'bg-[#080809] border-slate-800/40 opacity-60'
                : 'bg-[#0D0D0E] border-slate-800/50'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2 py-0.5 text-[10px] font-extrabold rounded border ${
                    fix.priority === 'P0'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : fix.priority === 'P1'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}
                >
                  {fix.priority}
                </span>
                <span className="text-xs font-mono text-violet-400">{fix.fileTarget}</span>
                <span className="text-[10px] text-slate-500">({fix.effort} effort)</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  +₹{fix.estimatedRevenueGain.toLocaleString('en-IN')}/mo
                </span>
                <button
                  id={`btn-apply-fix-${fix.id}`}
                  onClick={() => toggleApply(fix.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl border flex items-center gap-1.5 transition-colors ${
                    fix.applied
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-[#080809] hover:bg-slate-800 text-slate-200 border-slate-700/60'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{fix.applied ? 'Applied' : 'Mark as Applied'}</span>
                </button>
              </div>
            </div>

            <div className="py-3 space-y-1">
              <h3 className="text-sm font-semibold text-white">{fix.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{fix.explanation}</p>
            </div>

            {/* Before / After Code Diff */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-[#080809] border border-slate-800/60 rounded-xl space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-rose-400">Current (Fails AI Agent)</span>
                <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto p-2.5 bg-[#0D0D0E] border border-slate-800/50 rounded-lg">
                  {fix.beforeSnippet}
                </pre>
              </div>

              <div className="p-3.5 bg-[#080809] border border-violet-500/30 rounded-xl space-y-1 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">Agent-Ready Code Patch</span>
                  <button
                    id={`btn-copy-patch-${fix.id}`}
                    onClick={() => handleCopy(fix.id, fix.afterSnippet)}
                    className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-white"
                  >
                    {copiedId === fix.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === fix.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-violet-200/90 overflow-x-auto p-2.5 bg-[#0D0D0E] border border-violet-500/20 rounded-lg">
                  {fix.afterSnippet}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
