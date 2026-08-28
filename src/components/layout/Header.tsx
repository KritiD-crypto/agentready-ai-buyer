import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bot, Sparkles, ShieldCheck, RefreshCw, LogOut, Store, Bell, Activity, User } from 'lucide-react';
import { TabType } from './Sidebar';
import { NotificationDrawer } from '../notifications/NotificationDrawer';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenQueryBox: () => void;
  onNavigate?: (tab: TabType) => void;
}

export function Header({ onOpenAuth, onOpenQueryBox, onNavigate }: HeaderProps) {
  const { merchant, store, isDemoMode, launchDemo, logout, resetDemoData, isLoading } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'error'>('healthy');

  const handleReset = async () => {
    setIsResetting(true);
    await resetDemoData();
    setIsResetting(false);
  };

  // Poll system health and unread count
  useEffect(() => {
    const fetchQuickStatus = async () => {
      try {
        const [hRes, uRes] = await Promise.all([
          fetch('/api/system/health'),
          fetch('/api/notifications/unread-count'),
        ]);
        if (hRes.ok) {
          const hData = await hRes.json();
          setSystemStatus(hData.status === 'healthy' ? 'healthy' : hData.status === 'degraded' ? 'warning' : 'error');
        }
        if (uRes.ok) {
          const uData = await uRes.json();
          setUnreadCount(uData.count || 0);
        }
      } catch (err) {
        // silent
      }
    };
    fetchQuickStatus();
    const interval = setInterval(fetchQuickStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="h-16 border-b border-slate-800/50 bg-[#080809] sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-900/20 shrink-0">
            <span className="text-white font-bold text-xs tracking-wider">AR</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg tracking-tight text-white">Agent<span className="text-violet-500">Ready</span></span>
              <span className="px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-violet-950/30 text-violet-400 border border-violet-500/30 rounded-full">
                Razorpay Track 1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              AI Buyer Simulation Infrastructure for Merchants
            </p>
          </div>
        </div>

        {/* Actions & Merchant Session */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Ask AI Buyer Button */}
          <button
            id="btn-header-query-box"
            onClick={onOpenQueryBox}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Ask AI Buyer</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-950 text-slate-400 border border-slate-800 rounded">⌘K</kbd>
          </button>

          {/* System Health Pill */}
          <button
            id="btn-header-system-health"
            onClick={() => onNavigate && onNavigate('diagnostics')}
            title="System & Integration Health"
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium bg-[#0D0D0E] hover:bg-slate-800 border border-slate-800/70 rounded-xl transition-colors text-slate-300"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                systemStatus === 'healthy'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse'
                  : systemStatus === 'warning'
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`}
            />
            <span className="text-[11px] font-medium">
              {systemStatus === 'healthy' ? 'Healthy' : systemStatus === 'warning' ? 'Degraded' : 'Attention'}
            </span>
          </button>

          {/* Notification Bell */}
          <button
            id="btn-header-notifications"
            onClick={() => setIsNotificationOpen(true)}
            title="Notifications & Alerts"
            className="relative p-2 text-slate-300 hover:text-white bg-[#0D0D0E] hover:bg-slate-800 border border-slate-800/70 rounded-xl transition-colors"
          >
            <Bell className="w-4 h-4 text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-violet-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center ring-2 ring-[#080809] animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {merchant ? (
            <div className="flex items-center gap-2">
              {/* Active Store Badge */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#0D0D0E] border border-slate-800/60 rounded-xl">
                <Store className="w-3.5 h-3.5 text-violet-400" />
                <div className="text-left">
                  <p className="text-xs font-medium text-slate-200 leading-none">{store?.name || 'NovaGear'}</p>
                  <p className="text-[10px] text-slate-500 leading-none mt-1">{store?.currency || 'INR'} • {isDemoMode ? 'Demo Sandbox' : 'Live Store'}</p>
                </div>
              </div>

              {isDemoMode && (
                <button
                  id="btn-reset-demo-header"
                  onClick={handleReset}
                  disabled={isResetting}
                  title="Reset NovaGear Demo State"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#0D0D0E] hover:bg-slate-800 border border-slate-800/60 rounded-xl transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isResetting ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Reset Demo</span>
                </button>
              )}

              <button
                id="btn-logout-header"
                onClick={logout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="btn-launch-demo-header"
                onClick={() => launchDemo()}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all shadow-lg shadow-violet-900/20"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Launch Demo (NovaGear)</span>
              </button>

              <button
                id="btn-login-modal-header"
                onClick={onOpenAuth}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#0D0D0E] hover:bg-slate-800 border border-slate-800/60 rounded-xl transition-colors"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Merchant Sign In</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNavigate={onNavigate}
        onUnreadCountChange={(count) => setUnreadCount(count)}
      />
    </>
  );
}
