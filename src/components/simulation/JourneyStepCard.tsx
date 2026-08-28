import React, { useState } from 'react';
import { JourneyStep } from '../../types/index';
import { CheckCircle2, XCircle, AlertTriangle, SkipForward, ChevronDown, ChevronUp, Code2, Brain } from 'lucide-react';

interface JourneyStepCardProps {
  step: JourneyStep;
  key?: string | number;
}

export function JourneyStepCard({ step }: JourneyStepCardProps) {
  const [showPayload, setShowPayload] = useState(false);

  const getStatusBadge = (status: JourneyStep['status']) => {
    switch (status) {
      case 'pass':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/30',
          label: 'PASSED',
        };
      case 'fail':
        return {
          icon: XCircle,
          color: 'text-rose-400',
          bg: 'bg-rose-500/10 border-rose-500/30',
          label: 'ABORTED',
        };
      case 'friction':
        return {
          icon: AlertTriangle,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/30',
          label: 'FRICTION DETECTED',
        };
      default:
        return {
          icon: SkipForward,
          color: 'text-slate-500',
          bg: 'bg-slate-800/40 border-slate-700/40',
          label: 'SKIPPED',
        };
    }
  };

  const statusConfig = getStatusBadge(step.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      step.status === 'fail'
        ? 'bg-rose-950/20 border-rose-800/40'
        : step.status === 'friction'
        ? 'bg-amber-950/20 border-amber-800/40'
        : step.status === 'pass'
        ? 'bg-slate-950/70 border-slate-800/90'
        : 'bg-slate-950/30 border-slate-900/50 opacity-60'
    }`}>
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
            {step.stepIndex}
          </span>
          <h4 className="text-xs md:text-sm font-semibold text-white">{step.title}</h4>
        </div>

        <div className="flex items-center gap-2">
          {step.durationMs > 0 && (
            <span className="text-[11px] text-slate-400 font-mono">
              {step.durationMs}ms
            </span>
          )}
          <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-md flex items-center gap-1 ${statusConfig.bg} ${statusConfig.color}`}>
            <StatusIcon className="w-3 h-3" />
            <span>{statusConfig.label}</span>
          </span>
        </div>
      </div>

      {/* Buyer Reasoning & Structured Failure Analysis */}
      <div className="space-y-2 text-xs">
        {step.buyerThought && (
          <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg flex items-start gap-2">
            <Brain className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">AI Buyer Thought Chain</p>
              <p className="text-slate-200 italic leading-relaxed">"{step.buyerThought}"</p>
            </div>
          </div>
        )}

        {/* Explicit 5-Point Analysis for Friction or Failed Steps */}
        {(step.status === 'fail' || step.status === 'friction') && (
          <div className="p-3 bg-black/40 border border-slate-800/80 rounded-lg space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-violet-400 block mb-0.5">What AI Expected</span>
                <span className="text-slate-300">
                  {step.stage === 'intent_discovery' && 'Valid UCP manifest or JSON-LD discovery endpoint'}
                  {step.stage === 'catalog_parsing' && 'Structured Schema.org Product markup with price & availability'}
                  {step.stage === 'spec_validation' && 'Machine-parsable technical attributes (RAM, weight, battery, etc.)'}
                  {step.stage === 'inventory_check' && 'Real-time stock API with deterministic quantity confirmation'}
                  {step.stage === 'pricing_tax_eval' && 'Transparent tax-inclusive price with no unexpected checkout surcharges'}
                  {step.stage === 'policy_shipping_check' && 'Explicit return window (≥14 days) and free shipping threshold'}
                  {step.stage === 'payment_negotiation' && 'Razorpay Agent Token or frictionless server-to-server API (no 3DS redirect)'}
                  {step.stage === 'checkout_confirmation' && 'Direct machine-to-machine checkout webhook with zero CAPTCHA blockers'}
                  {!['intent_discovery','catalog_parsing','spec_validation','inventory_check','pricing_tax_eval','policy_shipping_check','payment_negotiation','checkout_confirmation'].includes(step.stage) && 'Strict machine-readable protocol conformance'}
                </span>
              </div>

              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">What It Found</span>
                <span className="text-slate-300">{step.technicalInsight || 'Missing or ambiguous machine response'}</span>
              </div>
            </div>

            <div className="p-2 rounded bg-rose-950/20 border border-rose-900/40 text-[11px] text-rose-200">
              <span className="text-[10px] uppercase font-bold text-rose-400 block mb-0.5">Why It Failed / Abandonment Cause</span>
              <span>{step.buyerThought ? step.buyerThought : 'Autonomous buyer cannot proceed without deterministic schema response.'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-indigo-950/20 border border-indigo-900/30">
                <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-0.5">Business Impact</span>
                <span className="text-slate-300">High drop-off rate (~60–85%) for agentic shoppers (ChatGPT Operator, Google Mariner).</span>
              </div>
              <div className="p-2 rounded bg-emerald-950/20 border border-emerald-900/30">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">Recommended Fix</span>
                <span className="text-slate-300">
                  {step.stage === 'payment_negotiation' ? 'Enable Razorpay Agent Token checkout API.' :
                   step.stage === 'spec_validation' ? 'Populate structured specs in Product Manager.' :
                   step.stage === 'catalog_parsing' ? 'Deploy Schema.org JSON-LD microdata.' :
                   'Apply one-click fix from Priority Queue.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {step.status === 'pass' && step.technicalInsight && (
          <div className="p-2.5 bg-slate-950/90 border border-slate-800/80 rounded-lg text-slate-400">
            <span className="text-slate-300 font-medium">Technical Evaluation: </span>
            {step.technicalInsight}
          </div>
        )}
      </div>

      {/* Expandable Technical Payloads */}
      {(step.requestPayload || step.responsePayload) && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/60">
          <button
            id={`btn-toggle-payload-${step.id}`}
            onClick={() => setShowPayload(!showPayload)}
            className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{showPayload ? 'Hide Technical Protocol Payloads' : 'Inspect JSON Request / Response'}</span>
            {showPayload ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showPayload && (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
              {step.requestPayload && (
                <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg overflow-x-auto">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Agent Request</p>
                  <pre className="text-emerald-400/90">{JSON.stringify(step.requestPayload, null, 2)}</pre>
                </div>
              )}
              {step.responsePayload && (
                <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg overflow-x-auto">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Merchant Response</p>
                  <pre className="text-indigo-400/90">{JSON.stringify(step.responsePayload, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
