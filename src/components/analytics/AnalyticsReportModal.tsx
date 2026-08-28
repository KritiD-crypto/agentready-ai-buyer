import React from 'react';
import { MerchantAnalyticsReport } from '../../types/index';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  Flame,
  Bot,
  Package,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
  TrendingUp,
} from 'lucide-react';

interface AnalyticsReportModalProps {
  report: MerchantAnalyticsReport | null;
  onClose: () => void;
}

export function AnalyticsReportModal({ report, onClose }: AnalyticsReportModalProps) {
  if (!report) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `agentready_analytics_report_${report.timeRange}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const { overview, personas, products, stageFailures, recommendations } = report;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#09090B] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#0C0C0E]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Merchant Readiness & Commerce Audit Report
              </h2>
              <p className="text-xs text-slate-400">
                {report.merchantName} ({report.storeName}) • Generated on {new Date(report.generatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#09090B] text-slate-200">
          {/* Executive Summary */}
          <div className="border border-slate-800/80 bg-[#0C0C0E] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">
                  Executive Briefing
                </span>
                <h3 className="text-lg font-bold text-slate-100">
                  AgentReadiness Score: {overview.currentReadinessScore}/100 (Grade {overview.readinessGrade})
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-500/10 text-violet-300 border border-violet-500/30">
                Window: {report.timeRange.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
              <div className="bg-[#111114] p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Settled AI GMV</span>
                <p className="text-base font-bold text-emerald-400 mt-0.5">
                  ₹{overview.totalGmv.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-slate-500">{overview.successfulOrders} autonomous orders</span>
              </div>

              <div className="bg-[#111114] p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Payment Success</span>
                <p className="text-base font-bold text-violet-400 mt-0.5">
                  {overview.paymentSuccessRate}%
                </p>
                <span className="text-[10px] text-slate-500">Razorpay Agent Token</span>
              </div>

              <div className="bg-[#111114] p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Revenue at Risk</span>
                <p className="text-base font-bold text-amber-400 mt-0.5">
                  ₹{overview.revenueAtRisk.toLocaleString('en-IN')}/mo
                </p>
                <span className="text-[10px] text-slate-500">{overview.activeRevenueLeaks} active leaks</span>
              </div>

              <div className="bg-[#111114] p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Revenue Recovered</span>
                <p className="text-base font-bold text-emerald-400 mt-0.5">
                  ₹{overview.revenueRecovered.toLocaleString('en-IN')}/mo
                </p>
                <span className="text-[10px] text-slate-500">{overview.revenueRecoveryPercentage}% recovered</span>
              </div>
            </div>
          </div>

          {/* 5-Pillar Score Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              AgentReadiness 5-Pillar Breakdown
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="p-3 bg-[#0C0C0E] border border-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Machine Readability</span>
                <span className="text-base font-bold text-emerald-400 mt-1 block">
                  {overview.pillarScores.machineReadability}/100
                </span>
                <span className="text-[10px] text-slate-500">Schema.org & Manifest</span>
              </div>
              <div className="p-3 bg-[#0C0C0E] border border-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[11px]">API Completeness</span>
                <span className="text-base font-bold text-violet-400 mt-1 block">
                  {overview.pillarScores.apiCompleteness}/100
                </span>
                <span className="text-[10px] text-slate-500">Stock & Checkout APIs</span>
              </div>
              <div className="p-3 bg-[#0C0C0E] border border-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Policy Clarity</span>
                <span className="text-base font-bold text-blue-400 mt-1 block">
                  {overview.pillarScores.policyClarity}/100
                </span>
                <span className="text-[10px] text-slate-500">Return SLA & Shipping</span>
              </div>
              <div className="p-3 bg-[#0C0C0E] border border-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Pricing Transparency</span>
                <span className="text-base font-bold text-cyan-400 mt-1 block">
                  {overview.pillarScores.pricingTransparency}/100
                </span>
                <span className="text-[10px] text-slate-500">Taxes & Parity</span>
              </div>
              <div className="p-3 bg-[#0C0C0E] border border-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Checkout Viability</span>
                <span className="text-base font-bold text-amber-400 mt-1 block">
                  {overview.pillarScores.checkoutViability}/100
                </span>
                <span className="text-[10px] text-slate-500">Zero-CAPTCHA & Token</span>
              </div>
            </div>
          </div>

          {/* AI Buyer Persona Evaluation Matrix */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              AI Buyer Persona Diagnostics
            </h4>
            <div className="overflow-x-auto border border-slate-800 rounded-xl bg-[#0C0C0E]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111114] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3 font-semibold">Persona</th>
                    <th className="p-3 font-semibold">Role</th>
                    <th className="p-3 font-semibold">Simulations</th>
                    <th className="p-3 font-semibold">Success Rate</th>
                    <th className="p-3 font-semibold">Avg Score</th>
                    <th className="p-3 font-semibold">Key Failure Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {personas.map((p) => (
                    <tr key={p.personaId}>
                      <td className="p-3 font-medium text-slate-200">{p.name}</td>
                      <td className="p-3 text-slate-400">{p.role}</td>
                      <td className="p-3">{p.simulationCount} runs</td>
                      <td className="p-3">
                        <span
                          className={`font-semibold ${
                            p.successRate >= 80
                              ? 'text-emerald-400'
                              : p.successRate >= 50
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {p.successRate}%
                        </span>
                      </td>
                      <td className="p-3 font-semibold">{p.avgReadinessScore}/100</td>
                      <td className="p-3 text-slate-400">{p.mostCommonFailureStage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Catalog SKU Health */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Catalog SKUs Machine-Readability & Conversion
            </h4>
            <div className="overflow-x-auto border border-slate-800 rounded-xl bg-[#0C0C0E]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111114] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3 font-semibold">Product SKU</th>
                    <th className="p-3 font-semibold">Price</th>
                    <th className="p-3 font-semibold">Stock</th>
                    <th className="p-3 font-semibold">Catalog Readiness</th>
                    <th className="p-3 font-semibold">Conversion</th>
                    <th className="p-3 font-semibold">Revenue Generated</th>
                    <th className="p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {products.map((prod) => (
                    <tr key={prod.productId}>
                      <td className="p-3 font-medium text-slate-200">
                        <div>{prod.title}</div>
                        <span className="text-[10px] text-slate-500">{prod.sku}</span>
                      </td>
                      <td className="p-3">₹{prod.basePrice.toLocaleString('en-IN')}</td>
                      <td className="p-3">
                        <span
                          className={`font-semibold ${
                            prod.stockQuantity > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {prod.stockQuantity} in stock
                        </span>
                      </td>
                      <td className="p-3 font-semibold">{prod.catalogReadiness}%</td>
                      <td className="p-3 font-semibold">{prod.conversionRate}%</td>
                      <td className="p-3 font-semibold text-emerald-400">
                        ₹{prod.revenueGenerated.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3">
                        {prod.isHighFriction ? (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-md">
                            Friction Detected
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md">
                            Autonomous Ready
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Remediation Priorities */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Prioritized Remediation Directives
            </h4>
            <div className="space-y-2.5">
              {recommendations.map((rec, i) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl border border-slate-800 bg-[#0C0C0E] flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-violet-900/40 text-violet-400 flex items-center justify-center text-[10px] font-bold">
                        {i + 1}
                      </span>
                      <h5 className="text-xs font-bold text-slate-200">{rec.title}</h5>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-7">{rec.description}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 shrink-0 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                    {rec.estimatedImpact}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-[#0C0C0E] flex justify-between items-center text-xs text-slate-500">
          <span>AgentReady Commerce Intelligence Engine • Strictly Isolated Tenant</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
