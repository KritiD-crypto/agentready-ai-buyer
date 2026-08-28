import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BuyerPersona, Product, SimulationReport, SimulationInput } from '../../types/index';
import { api } from '../../lib/api';
import { ReadinessScoreCard } from './ReadinessScoreCard';
import { RevenueLeakMap } from './RevenueLeakMap';
import { JourneyStepCard } from './JourneyStepCard';
import { JourneyReplayModal } from './JourneyReplayModal';
import {
  Bot,
  Play,
  Settings2,
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  Sliders,
} from 'lucide-react';

interface AiBuyerLabProps {
  onNavigateFixes?: () => void;
  onNavigateManifest?: () => void;
}

export function AiBuyerLab({ onNavigateFixes, onNavigateManifest }: AiBuyerLabProps) {
  const { merchant, store } = useAuth();
  const [personas, setPersonas] = useState<BuyerPersona[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('persona_spec_inspector');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [customPromptQuery, setCustomPromptQuery] = useState<string>('');

  // Scenario toggles for stress testing
  const [forceCaptcha, setForceCaptcha] = useState<boolean>(false);
  const [simulateStockOut, setSimulateStockOut] = useState<boolean>(false);
  const [simulateMissingJsonLd, setSimulateMissingJsonLd] = useState<boolean>(false);
  const [simulateVagueReturn, setSimulateVagueReturn] = useState<boolean>(false);
  const [simulateHiddenTaxes, setSimulateHiddenTaxes] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [latestReport, setLatestReport] = useState<SimulationReport | null>(null);
  const [showReplayModal, setShowReplayModal] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [loadedPersonas, loadedProducts] = await Promise.all([
          api.getBuyerPersonas(),
          api.getProducts(merchant?.id),
        ]);
        setPersonas(loadedPersonas);
        setProducts(loadedProducts);
        if (loadedProducts.length > 0) {
          setSelectedProductId(loadedProducts[0].id);
        }
        if (loadedPersonas.length > 0) {
          setSelectedPersonaId(loadedPersonas[0].id);
        }
      } catch (err) {
        console.error('Failed to load personas/products in lab:', err);
      }
    }
    loadData();
  }, [merchant]);

  const handleRunSimulation = async () => {
    if (!merchant) return;
    setIsLoading(true);
    try {
      const input: SimulationInput = {
        merchantId: merchant.id,
        personaId: selectedPersonaId,
        productIds: selectedProductId ? [selectedProductId] : undefined,
        intentQuery: customPromptQuery || undefined,
        scenarioOverrides: {
          forceCaptchaBlock: forceCaptcha,
          simulateStockOut: simulateStockOut,
          simulateMissingJsonLd: simulateMissingJsonLd,
          simulateVagueReturnPolicy: simulateVagueReturn,
          simulateHiddenTaxes: simulateHiddenTaxes,
        },
      };

      const report = await api.runSimulation(input);
      setLatestReport(report);
    } catch (err) {
      console.error('Simulation execution failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPersona = personas.find((p) => p.id === selectedPersonaId) || personas[0];
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-violet-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">AI Buyer Simulation Lab</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Execute deterministic buyer agent journeys against <span className="text-slate-200 font-medium">{store?.name || 'NovaGear'}</span> catalog and checkout protocol.
          </p>
        </div>

        <button
          id="btn-run-main-sim"
          onClick={handleRunSimulation}
          disabled={isLoading}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-900/20 disabled:opacity-50"
        >
          <Play className={`w-4 h-4 ${isLoading ? 'animate-spin' : 'fill-current'}`} />
          <span>{isLoading ? 'Simulating Autonomous Buyer...' : 'Run Simulation'}</span>
        </button>
      </div>

      {/* Control Matrix: Persona, Product & Scenario Stress-Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. Select AI Persona */}
        <div className="bg-[#0D0D0E] border border-slate-800/50 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">1. Select AI Buyer Persona</span>
            <span className="text-[10px] text-violet-400 font-mono">{personas.length} Personas</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {personas.map((persona) => {
              const isSelected = persona.id === selectedPersonaId;
              return (
                <div
                  key={persona.id}
                  id={`persona-card-${persona.id}`}
                  onClick={() => setSelectedPersonaId(persona.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-violet-900/15 border-violet-500/50 text-white'
                      : 'bg-[#080809] border-slate-800/60 text-slate-400 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-200">{persona.name}</p>
                    <span className="text-[10px] font-mono text-violet-300">Max ₹{persona.maxBudget.toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight mt-1">{persona.tagline}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Select Target Product */}
        <div className="bg-[#0D0D0E] border border-slate-800/50 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">2. Select Product Target</span>
            <span className="text-[10px] text-violet-400 font-mono">{products.length} Products</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {products.map((product) => {
              const isSelected = product.id === selectedProductId;
              return (
                <div
                  key={product.id}
                  id={`product-card-${product.id}`}
                  onClick={() => setSelectedProductId(product.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-violet-900/15 border-violet-500/50 text-white'
                      : 'bg-[#080809] border-slate-800/60 text-slate-400 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-200 truncate">{product.title}</p>
                    <span className="text-xs font-bold text-emerald-400">₹{product.basePrice.toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight mt-1 truncate">
                    {product.variants?.length || 1} variants • {product.stockQuantity} in stock
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Scenario Stress Testing */}
        <div className="bg-[#0D0D0E] border border-slate-800/50 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">3. Stress-Test Overrides</span>
            <span className="text-[10px] text-amber-400 font-mono">Friction Injection</span>
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between p-2 rounded-lg bg-[#080809] border border-slate-800/60 cursor-pointer">
              <span className="text-slate-300">Force Anti-Bot CAPTCHA Gate</span>
              <input
                id="toggle-stress-captcha"
                type="checkbox"
                checked={forceCaptcha}
                onChange={(e) => setForceCaptcha(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-violet-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-[#080809] border border-slate-800/60 cursor-pointer">
              <span className="text-slate-300">Simulate Out of Stock</span>
              <input
                id="toggle-stress-stockout"
                type="checkbox"
                checked={simulateStockOut}
                onChange={(e) => setSimulateStockOut(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-violet-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-[#080809] border border-slate-800/60 cursor-pointer">
              <span className="text-slate-300">Simulate Missing JSON-LD Schema</span>
              <input
                id="toggle-stress-schema"
                type="checkbox"
                checked={simulateMissingJsonLd}
                onChange={(e) => setSimulateMissingJsonLd(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-violet-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-[#080809] border border-slate-800/60 cursor-pointer">
              <span className="text-slate-300">Simulate Hidden Checkout Fees</span>
              <input
                id="toggle-stress-fees"
                type="checkbox"
                checked={simulateHiddenTaxes}
                onChange={(e) => setSimulateHiddenTaxes(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-violet-600 focus:ring-0"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Simulation Results Section */}
      {latestReport ? (
        <div className="space-y-6">
          {/* Summary Status Header */}
          <div className="p-4 md:p-5 rounded-2xl bg-[#0D0D0E] border border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start md:items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                latestReport.overallStatus === 'SUCCESS'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}>
                {latestReport.overallStatus === 'SUCCESS' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    Simulation Status: {latestReport.overallStatus}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full border flex items-center gap-1 ${
                      latestReport.executionMode === 'gemini_ai'
                        ? 'bg-violet-950/30 text-violet-300 border-violet-500/30'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
                    }`}
                  >
                    {latestReport.executionMode === 'gemini_ai' ? (
                      <>
                        <Sparkles className="w-3 h-3 text-violet-400" />
                        <span>AI Analysis ({latestReport.aiModelUsed || 'gemini-3.7-flash'})</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3 h-3 text-slate-400" />
                        <span>Deterministic Fallback Mode</span>
                      </>
                    )}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">({latestReport.executionTimeMs}ms)</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{latestReport.aiBuyerSummary}</p>
              </div>
            </div>

            <button
              id="btn-open-journey-replay"
              onClick={() => setShowReplayModal(true)}
              className="px-4 py-2 bg-violet-950/30 hover:bg-violet-900/40 text-violet-300 text-xs font-semibold rounded-xl border border-violet-500/30 flex items-center gap-2 transition-colors shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current text-violet-400" />
              <span>Launch 8-Step Replay Modal</span>
            </button>
          </div>

          {/* Readiness Score Card */}
          <ReadinessScoreCard score={latestReport.score} storeName={latestReport.storeName} />

          {/* Revenue Leak Map */}
          <RevenueLeakMap
            revenueImpact={latestReport.revenueImpact}
            frictionPoints={latestReport.frictionPoints}
            onSelectFix={onNavigateFixes}
          />

          {/* 8-Stage Step Breakdown */}
          <div className="bg-[#0D0D0E] border border-slate-800/50 rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-violet-400" />
                <h3 className="text-base font-semibold text-white">8-Stage AI Buyer Journey Breakdown</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {latestReport.journeySteps.filter((s) => s.status === 'pass').length}/{latestReport.journeySteps.length} Stages Passed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {latestReport.journeySteps.map((step) => (
                <JourneyStepCard key={step.id} step={step} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State / Initial Guide */
        <div className="p-8 text-center bg-[#0D0D0E] border border-slate-800/50 rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-900/20 border border-violet-500/30 text-violet-400 flex items-center justify-center mx-auto shadow-lg shadow-violet-900/20">
            <Bot className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-semibold text-white">Ready to simulate autonomous buyer traffic</h3>
            <p className="text-xs text-slate-400">
              Select an AI Buyer persona and click <span className="text-violet-300 font-medium">"Run Simulation"</span> to audit machine-readability, catalog schemas, and Razorpay checkout readiness.
            </p>
          </div>
          <button
            id="btn-run-sim-empty-state"
            onClick={handleRunSimulation}
            disabled={isLoading}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition-all shadow-lg shadow-violet-900/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Simulation Now</span>
          </button>
        </div>
      )}

      {/* Modal */}
      {showReplayModal && latestReport && (
        <JourneyReplayModal report={latestReport} onClose={() => setShowReplayModal(false)} />
      )}
    </div>
  );
}
