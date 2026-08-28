import React from 'react';
import {
  LayoutDashboard,
  Bot,
  GitCompare,
  Wrench,
  FileCode2,
  Package,
  Store,
  CreditCard,
  History,
  Activity,
  ShieldAlert,
  Flame,
  ShoppingBag,
  BarChart3,
  Sparkles,
} from 'lucide-react';

export type TabType =
  | 'landing'
  | 'dashboard'
  | 'analytics'
  | 'revenue_intelligence'
  | 'orders'
  | 'buyer_lab'
  | 'counterfactual'
  | 'fixes'
  | 'manifest'
  | 'products'
  | 'store_profile'
  | 'payment_sandbox'
  | 'diagnostics'
  | 'history';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  unresolvedFixCount?: number;
}

export function Sidebar({ activeTab, onSelectTab, unresolvedFixCount = 3 }: SidebarProps) {
  const navItems: Array<{ id: TabType; label: string; icon: React.ElementType; badge?: string | number; badgeColor?: string }> = [
    { id: 'landing', label: 'Platform Overview', icon: Sparkles, badge: 'Track 1', badgeColor: 'bg-violet-500/10 text-violet-300 border-violet-500/30' },
    { id: 'dashboard', label: 'Merchant Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics & Reporting', icon: BarChart3, badge: 'Insights', badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
    { id: 'revenue_intelligence', label: 'Revenue Intelligence', icon: Flame, badge: 'Leaks', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    { id: 'orders', label: 'Orders & Checkout', icon: ShoppingBag, badge: 'Agent', badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/30' },
    { id: 'buyer_lab', label: 'AI Buyer Lab', icon: Bot, badge: 'Live Sim', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    { id: 'counterfactual', label: 'Counterfactual "What-If"', icon: GitCompare, badge: 'Lab', badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/30' },
    { id: 'fixes', label: 'Fix Priority Queue', icon: Wrench, badge: unresolvedFixCount > 0 ? unresolvedFixCount : undefined, badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
    { id: 'manifest', label: 'Agent Manifest (.json)', icon: FileCode2 },
    { id: 'products', label: 'Product Catalog & Specs', icon: Package },
    { id: 'store_profile', label: 'Store Profile & Policies', icon: Store },
    { id: 'payment_sandbox', label: 'Razorpay Payment Test', icon: CreditCard },
    { id: 'diagnostics', label: 'System Diagnostics', icon: Activity, badge: 'Live', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    { id: 'history', label: 'Simulation History', icon: History },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/50 bg-[#080809] p-5 flex flex-col justify-between shrink-0 hidden md:flex">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-3">
            Simulation & Readiness
          </p>
          <nav className="space-y-1">
            {navItems.slice(0, 6).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                    isActive
                      ? 'bg-violet-900/15 text-violet-300 border border-violet-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#0D0D0E]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-semibold border rounded-md ${item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-3">
            Commerce Infrastructure
          </p>
          <nav className="space-y-1">
            {navItems.slice(6).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                    isActive
                      ? 'bg-violet-900/15 text-violet-300 border border-violet-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#0D0D0E]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-semibold border rounded-md ${item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Track 1 Protocol Card */}
      <div className="p-3.5 bg-[#0D0D0E] border border-slate-800/60 rounded-xl space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-violet-300">
          <ShieldAlert className="w-3.5 h-3.5 text-violet-400" />
          <span>Universal Commerce Ready</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Testing against autonomous AI buyer protocols (UCP-1.0 / ACP).
        </p>
      </div>
    </aside>
  );
}
