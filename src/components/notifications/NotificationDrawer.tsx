import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Check,
  CheckCheck,
  ExternalLink,
  Sparkles,
  RefreshCw,
  X,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { MerchantNotification, NotificationSeverity } from '../../types';
import { TabType } from '../layout/Sidebar';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: TabType) => void;
  onUnreadCountChange?: (count: number) => void;
}

export function NotificationDrawer({ isOpen, onClose, onNavigate, onUnreadCountChange }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<MerchantNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isDispatchingTest, setIsDispatchingTest] = useState(false);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        const unread = data.filter((n: MerchantNotification) => !n.isRead).length;
        if (onUnreadCountChange) onUnreadCountChange(unread);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Periodic unread check
  useEffect(() => {
    const checkCount = async () => {
      try {
        const res = await fetch('/api/notifications/unread-count');
        if (res.ok) {
          const data = await res.json();
          if (onUnreadCountChange) onUnreadCountChange(data.count || 0);
        }
      } catch (err) {
        // silent
      }
    };
    checkCount();
    const interval = setInterval(checkCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        const unread = notifications.filter((n) => n.id !== id && !n.isRead).length;
        if (onUnreadCountChange) onUnreadCountChange(unread);
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'PUT' });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        if (onUnreadCountChange) onUnreadCountChange(0);
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const dispatchTestAlert = async () => {
    try {
      setIsDispatchingTest(true);
      const res = await fetch('/api/notifications/test', { method: 'POST' });
      if (res.ok) {
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to trigger test notification:', err);
    } finally {
      setIsDispatchingTest(false);
    }
  };

  const handleNotificationClick = (n: MerchantNotification) => {
    if (!n.isRead) {
      markAsRead(n.id);
    }
    if (onNavigate) {
      if (n.relatedEntityType === 'simulation') {
        onNavigate('buyer_lab');
      } else if (n.relatedEntityType === 'fix') {
        onNavigate('fixes');
      } else if (n.relatedEntityType === 'payment' || n.relatedEntityType === 'webhook') {
        onNavigate('payment_sandbox');
      } else {
        onNavigate('diagnostics');
      }
      onClose();
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'critical') return n.severity === 'critical';
    return true;
  });

  const getSeverityIcon = (sev: NotificationSeverity) => {
    switch (sev) {
      case 'critical':
        return <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-sky-400 shrink-0" />;
    }
  };

  const getSeverityBadge = (sev: NotificationSeverity) => {
    switch (sev) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'success':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'info':
      default:
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-[#09090B] border-l border-slate-800/80 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#0D0D0E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-950/40 border border-violet-500/30 flex items-center justify-center">
              <Bell className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">System Alerts & Notifications</h2>
              <p className="text-[11px] text-slate-400">Tenant-isolated event delivery</p>
            </div>
          </div>

          <button
            id="btn-close-notification-drawer"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter bar & Actions */}
        <div className="px-4 py-2.5 border-b border-slate-800/60 bg-[#070708] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {(['all', 'unread', 'critical'] as const).map((tab) => (
              <button
                key={tab}
                id={`btn-filter-notif-${tab}`}
                onClick={() => setFilter(tab)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg capitalize transition-colors ${
                  filter === tab
                    ? 'bg-violet-900/30 text-violet-300 border border-violet-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-mark-all-read"
              onClick={markAllRead}
              title="Mark all as read"
              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Read all</span>
            </button>

            <button
              id="btn-refresh-notifications"
              onClick={fetchNotifications}
              disabled={isLoading}
              title="Refresh"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-xs font-medium text-slate-300">All clear! No alerts</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                No active {filter !== 'all' ? filter : ''} notifications for your merchant store.
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                id={`notification-card-${n.id}`}
                onClick={() => handleNotificationClick(n)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                  n.isRead
                    ? 'bg-[#0D0D0E]/60 border-slate-800/40 opacity-75 hover:opacity-100 hover:border-slate-700'
                    : 'bg-[#101014] border-violet-500/20 hover:border-violet-500/40 shadow-sm'
                }`}
              >
                {!n.isRead && (
                  <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-violet-400 ring-4 ring-violet-950" />
                )}

                <div className="flex items-start gap-2.5">
                  {getSeverityIcon(n.severity)}
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider border rounded ${getSeverityBadge(
                          n.severity
                        )}`}
                      >
                        {n.severity}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-xs font-medium text-slate-200 leading-snug">{n.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{n.message}</p>

                    {n.relatedEntityType && (
                      <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800/50">
                        <span className="text-[10px] text-violet-400 flex items-center gap-1 font-medium">
                          View details <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                        {!n.isRead && (
                          <button
                            id={`btn-mark-read-${n.id}`}
                            onClick={(e) => markAsRead(n.id, e)}
                            className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Mark read
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Test Trigger */}
        <div className="p-3.5 border-t border-slate-800/80 bg-[#0D0D0E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] text-slate-400">Diagnostic Channel Test</span>
          </div>

          <button
            id="btn-dispatch-test-alert"
            onClick={dispatchTestAlert}
            disabled={isDispatchingTest}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg transition-colors"
          >
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span>{isDispatchingTest ? 'Dispatching...' : 'Dispatch Test Alert'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
