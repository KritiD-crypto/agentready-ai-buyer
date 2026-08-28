import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Sparkles, Bot, X, Send, ShieldCheck, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface BuyerQueryBoxProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BuyerQueryBox({ isOpen, onClose }: BuyerQueryBoxProps) {
  const { merchant } = useAuth();
  const [query, setQuery] = useState('');
  const [personaId, setPersonaId] = useState('persona_spec_inspector');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    answer: string;
    agentVerdict: 'BUY_RECOMMENDED' | 'NEEDS_VERIFICATION' | 'ABORTED';
    reasoning: string[];
  } | null>(null);

  if (!isOpen) return null;

  const sampleQueries = [
    'Can I purchase running shoes under ₹4,000 with express delivery?',
    'What is the machine-verifiable return window and restocking fee?',
    'Does the smartwatch support SpO2 tracking and 5ATM water resistance?',
    'Is tax included in the catalog price or added at cart checkout?',
  ];

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = queryText || query;
    if (!textToSend.trim()) return;
    setIsLoading(true);
    try {
      const res = await api.queryAgent(textToSend, personaId, merchant?.id);
      setResult(res);
    } catch (err) {
      console.error('Agent query error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0D0D0E] border border-slate-800/60 w-full max-w-2xl rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-800/50 flex items-center justify-between bg-[#080809]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Ask AI Buyer Agent</h3>
              <p className="text-xs text-slate-400">Test how an autonomous agent evaluates your store in natural language</p>
            </div>
          </div>

          <button
            id="btn-close-query-box"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Persona selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Evaluating as:</span>
            <select
              id="select-query-persona"
              value={personaId}
              onChange={(e) => setPersonaId(e.target.value)}
              className="bg-[#080809] border border-slate-800/60 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:border-violet-500"
            >
              <option value="persona_spec_inspector">Autonomous Spec Inspector</option>
              <option value="persona_bargain_agent">Discount & Tax Arbitrage Agent</option>
              <option value="persona_speed_shopper">High-Speed Autonomous Shopper</option>
              <option value="persona_compliance_agent">Enterprise Policy Agent</option>
            </select>
          </div>

          {/* Input Box */}
          <div className="relative">
            <input
              id="input-agent-query"
              type="text"
              placeholder="Ask anything (e.g. 'Can I buy running shoes under ₹4,000?')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendQuery();
              }}
              className="w-full bg-[#080809] border border-slate-800/60 rounded-xl pl-4 pr-12 py-3 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
            <button
              id="btn-send-agent-query"
              onClick={() => handleSendQuery()}
              disabled={isLoading || !query.trim()}
              className="absolute right-2 top-2 p-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-40 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Suggestions */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Suggested Queries</span>
            <div className="flex flex-wrap gap-1.5">
              {sampleQueries.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(sample);
                    handleSendQuery(sample);
                  }}
                  className="px-2.5 py-1 text-[11px] bg-[#080809] hover:bg-slate-800/60 text-slate-300 border border-slate-800/60 rounded-lg transition-colors text-left"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Result Output */}
          {isLoading && (
            <div className="p-6 text-center text-xs text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Autonomous AI buyer is evaluating merchant catalog, specifications & policy schemas...</p>
            </div>
          )}

          {result && !isLoading && (
            <div className="p-4 bg-[#080809] border border-slate-800/60 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Agent Verdict</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                  result.agentVerdict === 'BUY_RECOMMENDED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : result.agentVerdict === 'NEEDS_VERIFICATION'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  {result.agentVerdict}
                </span>
              </div>

              <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-sans">
                {result.answer}
              </p>

              {result.reasoning && result.reasoning.length > 0 && (
                <div className="pt-2 border-t border-slate-800/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-violet-400">Agent Decision Trail</span>
                  <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
                    {result.reasoning.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
