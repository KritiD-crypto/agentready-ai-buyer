import React from 'react';
import {
  Bot,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Flame,
  Wrench,
  GitCompare,
  CreditCard,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileCode2,
  BarChart3,
  TrendingDown,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LandingViewProps {
  onLaunchDemo: () => void;
  onExploreLab: () => void;
  onViewRevenue: () => void;
}

export function LandingView({ onLaunchDemo, onExploreLab, onViewRevenue }: LandingViewProps) {
  const { isDemoMode } = useAuth();

  return (
    <div className="space-y-10 pb-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0B0B0E] border border-slate-800/80 p-6 md:p-10 lg:p-12 shadow-2xl">
        {/* Subtle radial ambient background */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-950/40 border border-violet-500/30 rounded-full text-violet-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Agentic Commerce Readiness Engine (Razorpay Track 1)</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
              Before AI buyers arrive, test whether your business is ready.
            </h1>
            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
              AgentReady is the testing, diagnosis, and remediation platform for the next era of commerce: autonomous AI agents purchasing on behalf of consumers and enterprises.
            </p>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="btn-landing-launch-demo"
              onClick={onLaunchDemo}
              className="px-6 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm rounded-xl flex items-center gap-2.5 transition-all shadow-xl shadow-violet-900/30 group"
            >
              <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
              <span>Launch NovaGear Interactive Demo</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              id="btn-landing-explore-lab"
              onClick={onExploreLab}
              className="px-5 py-3.5 bg-[#141419] hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm rounded-xl flex items-center gap-2 transition-colors"
            >
              <Bot className="w-4 h-4 text-violet-400" />
              <span>Explore AI Buyer Lab</span>
            </button>
          </div>

          {/* Quick highlights pill row */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Zero Live Credentials Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Preloaded NovaGear Catalog
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Razorpay Agent Tokenization
            </span>
          </div>
        </div>
      </section>

      {/* Problem, Solution, Value Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pillar 1: The Problem */}
        <div className="p-6 rounded-2xl bg-[#0D0D10] border border-rose-950/40 hover:border-rose-900/60 transition-all space-y-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-rose-400">The Problem</span>
            <h3 className="text-lg font-bold text-white tracking-tight">Traditional Commerce is Built for Humans</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Existing storefronts rely on visual cues, marketing copy, interactive CAPTCHAs, and multi-step 3DS browser redirects. When autonomous AI shopping agents (ChatGPT Operator, Google Project Mariner, Perplexity Shopping) encounter missing JSON-LD schemas or untracked variants, they immediately abandon the cart.
          </p>
        </div>

        {/* Pillar 2: The Solution */}
        <div className="p-6 rounded-2xl bg-[#0D0D10] border border-violet-950/40 hover:border-violet-900/60 transition-all space-y-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Bot className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-violet-400">The Solution</span>
            <h3 className="text-lg font-bold text-white tracking-tight">Autonomous AI Buyer Simulation</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            AgentReady simulates diverse AI buyer personas against your live commerce endpoints. It verifies catalog parsability, machine readability, inventory APIs, and machine-to-machine Razorpay tokenized payments under strict deterministic evaluation.
          </p>
        </div>

        {/* Pillar 3: The Value */}
        <div className="p-6 rounded-2xl bg-[#0D0D10] border border-emerald-950/40 hover:border-emerald-900/60 transition-all space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">The Value</span>
            <h3 className="text-lg font-bold text-white tracking-tight">Discover Friction → Simulate Recovery</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Uncover silent revenue bottlenecks, calculate exact monthly GMV at risk, deploy one-click schema/policy fixes, and run counterfactual "What-If" simulations to project recovered sales before live autonomous buyer traffic arrives.
          </p>
        </div>
      </section>

      {/* The 4-Step Remediation Workflow */}
      <section className="rounded-2xl bg-[#0D0D10] border border-slate-800/80 p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">The Autonomous Commerce Readiness Loop</h2>
            <p className="text-xs text-slate-400 mt-1">Four deterministic steps from friction discovery to revenue recovery.</p>
          </div>
          <button
            onClick={onViewRevenue}
            className="text-xs text-violet-400 hover:text-violet-300 font-semibold inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Revenue Leaks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
            <span className="text-xs font-mono font-bold text-violet-400">01. SIMULATE</span>
            <h4 className="text-sm font-semibold text-white">AI Buyer Lab</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              5 autonomous personas audit your catalog across 8 realistic purchasing stages.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
            <span className="text-xs font-mono font-bold text-amber-400">02. QUANTIFY</span>
            <h4 className="text-sm font-semibold text-white">Revenue Intelligence</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deterministic financial calculations calculate monthly revenue at risk per bottleneck.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
            <span className="text-xs font-mono font-bold text-emerald-400">03. REMEDIATE</span>
            <h4 className="text-sm font-semibold text-white">1-Click Code Fixes</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Apply JSON-LD schemas, policy updates, and Razorpay token integrations in one click.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
            <span className="text-xs font-mono font-bold text-sky-400">04. PROJECT</span>
            <h4 className="text-sm font-semibold text-white">Counterfactual "What-If"</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instantly simulate recovery score lifts and revenue gains with before/after delta views.
            </p>
          </div>
        </div>
      </section>

      {/* Built for Razorpay Hackathon Track 1 */}
      <section className="p-6 rounded-2xl bg-gradient-to-r from-violet-950/30 via-[#0E0E12] to-slate-900 border border-violet-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white">Razorpay Agent Tokenization & M2M Checkout</h3>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Eliminate human-oriented 3DS popups and CAPTCHA walls. AgentReady implements machine authorization tokens with cryptographic HMAC-SHA256 signature verification and idempotency keys.
          </p>
        </div>

        <button
          onClick={onLaunchDemo}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shrink-0 transition-colors shadow-lg shadow-violet-950/50"
        >
          <span>Open Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>
    </div>
  );
}
