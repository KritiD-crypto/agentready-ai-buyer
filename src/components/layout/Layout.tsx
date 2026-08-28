import React, { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar, TabType } from './Sidebar';
import {
  LayoutDashboard,
  Bot,
  GitCompare,
  Wrench,
  FileCode2,
  Sparkles,
  Flame,
  ShoppingBag,
  BarChart3,
  CreditCard,
} from 'lucide-react';

interface LayoutProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenAuth: () => void;
  onOpenQueryBox: () => void;
  children: ReactNode;
}

export function Layout({ activeTab, onSelectTab, onOpenAuth, onOpenQueryBox, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col font-sans selection:bg-violet-600/30 selection:text-violet-200">
      <Header onOpenAuth={onOpenAuth} onOpenQueryBox={onOpenQueryBox} onNavigate={onSelectTab} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} onSelectTab={onSelectTab} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#050505] pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#080809]/95 border-t border-slate-800/50 backdrop-blur-lg flex items-center gap-1 overflow-x-auto px-2 z-40 no-scrollbar">
        <button
          id="mob-nav-landing"
          onClick={() => onSelectTab('landing')}
          className={`flex flex-col items-center justify-center min-w-[58px] gap-1 text-[10px] font-medium p-1 shrink-0 ${
            activeTab === 'landing' ? 'text-violet-400' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Overview</span>
        </button>
        <button
          id="mob-nav-dashboard"
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center min-w-[58px] gap-1 text-[10px] font-medium p-1 shrink-0 ${
            activeTab === 'dashboard' ? 'text-violet-400' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <button
          id="mob-nav-buyer_lab"
          onClick={() => onSelectTab('buyer_lab')}
          className={`flex flex-col items-center justify-center min-w-[58px] gap-1 text-[10px] font-medium p-1 shrink-0 ${
            activeTab === 'buyer_lab' ? 'text-violet-400' : 'text-slate-400'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Buyer Lab</span>
        </button>
        <button
          id="mob-nav-revenue_intelligence"
          onClick={() => onSelectTab('revenue_intelligence')}
          className={`flex flex-col items-center justify-center min-w-[58px] gap-1 text-[10px] font-medium p-1 shrink-0 ${
            activeTab === 'revenue_intelligence' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Leaks</span>
        </button>
        <button
          id="mob-nav-counterfactual"
          onClick={() => onSelectTab('counterfactual')}
          className={`flex flex-col items-center justify-center min-w-[58px] gap-1 text-[10px] font-medium p-1 shrink-0 ${
            activeTab === 'counterfactual' ? 'text-violet-400' : 'text-slate-400'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          <span>What-If</span>
        </button>
        <button
          id="mob-nav-fixes"
          onClick={() => onSelectTab('fixes')}
          className={`flex flex-col items-center justify-center min-w-[58px] gap-1 text-[10px] font-medium p-1 shrink-0 ${
            activeTab === 'fixes' ? 'text-rose-400' : 'text-slate-400'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Fixes</span>
        </button>
        <button
          id="mob-nav-orders"
          onClick={() => onSelectTab('orders')}
          className={`flex flex-col items-center justify-center min-w-[58px] gap-1 text-[10px] font-medium p-1 shrink-0 ${
            activeTab === 'orders' ? 'text-violet-400' : 'text-slate-400'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Orders</span>
        </button>
        <button
          id="mob-nav-analytics"
          onClick={() => onSelectTab('analytics')}
          className={`flex flex-col items-center justify-center min-w-[58px] gap-1 text-[10px] font-medium p-1 shrink-0 ${
            activeTab === 'analytics' ? 'text-indigo-400' : 'text-slate-400'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>
        <button
          id="mob-nav-payment_sandbox"
          onClick={() => onSelectTab('payment_sandbox')}
          className={`flex flex-col items-center justify-center min-w-[58px] gap-1 text-[10px] font-medium p-1 shrink-0 ${
            activeTab === 'payment_sandbox' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment</span>
        </button>
      </nav>
    </div>
  );
}
