import React from 'react';
import { ReadinessScores } from '../../types/index';
import { ShieldCheck, FileText, Server, Scale, DollarSign, CreditCard } from 'lucide-react';

interface ReadinessScoreCardProps {
  score: ReadinessScores;
  storeName?: string;
  onViewDetails?: () => void;
}

export function ReadinessScoreCard({ score, storeName = 'Store' }: ReadinessScoreCardProps) {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
      case 'B':
        return 'text-blue-400 border-blue-500/40 bg-blue-500/10';
      case 'C':
        return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
      default:
        return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
    }
  };

  const pillars = [
    {
      name: 'Machine Readability',
      score: score.machineReadability,
      icon: FileText,
      description: 'JSON-LD, Schema.org Product & UCP Manifest detection',
    },
    {
      name: 'API Completeness',
      score: score.apiCompleteness,
      icon: Server,
      description: 'Live inventory endpoints & price parity guarantees',
    },
    {
      name: 'Policy Clarity',
      score: score.policyClarity,
      icon: Scale,
      description: 'Machine-verifiable return window & shipping SLAs',
    },
    {
      name: 'Pricing Transparency',
      score: score.pricingTransparency,
      icon: DollarSign,
      description: 'Zero hidden surcharges & deterministic tax matrix',
    },
    {
      name: 'Agent Checkout Viability',
      score: score.checkoutViability,
      icon: CreditCard,
      description: 'Razorpay Agent Token protocol & CAPTCHA bypass',
    },
  ];

  return (
    <div className="bg-[#0D0D0E] border border-slate-800/50 rounded-2xl p-6 md:p-7 backdrop-blur-md relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-violet-400" />
            <h3 className="text-base font-semibold text-white">AI Commerce Readiness Score</h3>
          </div>
          <p className="text-xs text-slate-400">
            Autonomous agent transaction compatibility audit for <span className="text-slate-200 font-medium">{storeName}</span>
          </p>
        </div>

        {/* Big Score Gauge */}
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 border rounded-xl flex items-center gap-3 ${getGradeColor(score.grade)}`}>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-80 leading-none">Grade</p>
              <p className="text-2xl font-black leading-none mt-1">{score.grade}</p>
            </div>
            <div className="h-8 w-[1px] bg-current opacity-20" />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-80 leading-none">Overall Score</p>
              <p className="text-2xl font-black leading-none mt-1">{score.overallScore}<span className="text-xs font-normal opacity-70">/100</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Architectural Sub-Score Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-6">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          const getBarColor = (val: number) => {
            if (val >= 80) return 'bg-emerald-500';
            if (val >= 60) return 'bg-violet-500';
            if (val >= 40) return 'bg-amber-500';
            return 'bg-rose-500';
          };

          return (
            <div key={pillar.name} className="p-3.5 bg-[#080809] border border-slate-800/60 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Icon className="w-3.5 h-3.5 text-violet-400" />
                  <span className="truncate">{pillar.name}</span>
                </div>
                <span className="font-bold text-white text-xs">{pillar.score}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getBarColor(pillar.score)}`}
                  style={{ width: `${pillar.score}%` }}
                />
              </div>

              <p className="text-[10px] text-slate-400 leading-tight">
                {pillar.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
