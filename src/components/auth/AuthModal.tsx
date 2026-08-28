import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bot, Mail, Lock, Building, User, Phone, Globe, X, ArrowRight, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { loginWithEmail, registerMerchant, launchDemo, isLoading } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regWebsite, setRegWebsite] = useState('');
  const [regDescription, setRegDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await loginWithEmail(loginEmail, loginPassword || undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPassword || !regName || !regCompanyName) {
      setError('Please fill in all required fields.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await registerMerchant({
        email: regEmail,
        password: regPassword,
        name: regName,
        companyName: regCompanyName,
        phone: regPhone || undefined,
        website: regWebsite || undefined,
        businessDescription: regDescription || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLaunchDemo = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await launchDemo();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to launch demo sandbox');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0D0D0E] border border-slate-800/60 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl space-y-4 p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Merchant Authentication</h3>
              <p className="text-xs text-slate-400">Manage your store workspace and autonomous AI buyer profiling</p>
            </div>
          </div>

          <button
            id="btn-close-auth-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1 bg-[#080809] border border-slate-800/60 rounded-xl gap-1">
          <button
            id="btn-tab-auth-login"
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tab === 'login' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            id="btn-tab-auth-register"
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tab === 'register' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register Merchant Workspace
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* 1-Click NovaGear Demo Option */}
        <div className="p-3.5 bg-violet-950/20 border border-violet-500/30 rounded-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              1-Click NovaGear Demo Sandbox
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold">
              Instant
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Pre-loaded with <strong>NovaGear</strong> catalog, machine-readable specifications, friction baselines, and test payment credentials.
          </p>
          <button
            id="btn-auth-launch-demo"
            onClick={handleLaunchDemo}
            disabled={isSubmitting}
            className="w-full mt-1 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-900/20"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Launch NovaGear Demo</span>
          </button>
        </div>

        {tab === 'login' ? (
          /* Sign In Form */
          <form onSubmit={handleLogin} className="space-y-3 pt-2">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Merchant Email *</label>
              <div className="relative">
                <input
                  id="input-login-email"
                  type="email"
                  required
                  placeholder="founder@yourstore.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-[#080809] border border-slate-800/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-slate-400">Password</label>
                <span className="text-[10px] text-slate-500">(Optional for demo login)</span>
              </div>
              <div className="relative">
                <input
                  id="input-login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-[#080809] border border-slate-800/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              id="btn-submit-email-login"
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700/60 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          /* Registration Form */
          <form onSubmit={handleRegister} className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Contact Name *</label>
                <div className="relative">
                  <input
                    id="input-reg-name"
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-[#080809] border border-slate-800/60 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <User className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Company / Store Name *</label>
                <div className="relative">
                  <input
                    id="input-reg-company"
                    type="text"
                    required
                    placeholder="Apex Apparel"
                    value={regCompanyName}
                    onChange={(e) => setRegCompanyName(e.target.value)}
                    className="w-full bg-[#080809] border border-slate-800/60 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <Building className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Merchant Email *</label>
                <div className="relative">
                  <input
                    id="input-reg-email"
                    type="email"
                    required
                    placeholder="founder@apex.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-[#080809] border border-slate-800/60 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Password (Min. 6) *</label>
                <div className="relative">
                  <input
                    id="input-reg-password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-[#080809] border border-slate-800/60 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Phone Number</label>
                <div className="relative">
                  <input
                    id="input-reg-phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-[#080809] border border-slate-800/60 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Website URL</label>
                <div className="relative">
                  <input
                    id="input-reg-website"
                    type="url"
                    placeholder="https://apexstore.in"
                    value={regWebsite}
                    onChange={(e) => setRegWebsite(e.target.value)}
                    className="w-full bg-[#080809] border border-slate-800/60 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <Globe className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Store / Business Description</label>
              <textarea
                id="input-reg-description"
                rows={2}
                placeholder="Brief description of your products, category, and target audience..."
                value={regDescription}
                onChange={(e) => setRegDescription(e.target.value)}
                className="w-full bg-[#080809] border border-slate-800/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>

            <button
              id="btn-submit-registration"
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-900/20 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Creating Workspace...' : 'Create Merchant Workspace'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
