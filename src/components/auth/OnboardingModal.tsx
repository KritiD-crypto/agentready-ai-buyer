import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building, Globe, Phone, ShieldCheck, CheckCircle2, ArrowRight, Sparkles, X, Truck, RotateCcw, DollarSign } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { merchant, store, completeOnboarding, isLoading } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [companyName, setCompanyName] = useState(merchant?.companyName || store?.name || '');
  const [contactName, setContactName] = useState(merchant?.name || '');
  const [phone, setPhone] = useState(merchant?.phone || '');
  const [websiteUrl, setWebsiteUrl] = useState(merchant?.website || store?.websiteUrl || '');
  const [businessDescription, setBusinessDescription] = useState(merchant?.businessDescription || store?.description || '');
  const [category, setCategory] = useState('Apparel & Performance Goods');

  const [currency, setCurrency] = useState(store?.currency || 'INR');
  const [country, setCountry] = useState(store?.country || 'IN');
  const [returnPolicyDays, setReturnPolicyDays] = useState(store?.returnPolicyDays || 14);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(store?.freeShippingThreshold || 999);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleComplete = async () => {
    if (!companyName.trim()) {
      setError('Store/Company name is required');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await completeOnboarding({
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        phone: phone.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        businessDescription: businessDescription.trim() || undefined,
        currency,
        country,
        returnPolicyDays: Number(returnPolicyDays),
        freeShippingThreshold: Number(freeShippingThreshold),
        category,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to complete onboarding setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0D0D0E] border border-slate-800/80 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl space-y-5 p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Merchant Workspace Onboarding</h3>
              <p className="text-xs text-slate-400">Configure your store identity and autonomous AI buyer parameters</p>
            </div>
          </div>

          <button
            id="btn-close-onboarding-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper indicator */}
        <div className="grid grid-cols-3 gap-2">
          <div
            className={`p-2 rounded-xl border text-center transition-all ${
              step >= 1 ? 'bg-violet-950/30 border-violet-500/40 text-violet-300' : 'bg-slate-900/30 border-slate-800 text-slate-500'
            }`}
          >
            <span className="text-[10px] uppercase font-bold block">Step 1</span>
            <span className="text-xs font-medium">Store Profile</span>
          </div>

          <div
            className={`p-2 rounded-xl border text-center transition-all ${
              step >= 2 ? 'bg-violet-950/30 border-violet-500/40 text-violet-300' : 'bg-slate-900/30 border-slate-800 text-slate-500'
            }`}
          >
            <span className="text-[10px] uppercase font-bold block">Step 2</span>
            <span className="text-xs font-medium">Commerce Policies</span>
          </div>

          <div
            className={`p-2 rounded-xl border text-center transition-all ${
              step >= 3 ? 'bg-violet-950/30 border-violet-500/40 text-violet-300' : 'bg-slate-900/30 border-slate-800 text-slate-500'
            }`}
          >
            <span className="text-[10px] uppercase font-bold block">Step 3</span>
            <span className="text-xs font-medium">Autonomous Activation</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Step 1: Store & Brand Profile */}
        {step === 1 && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Store / Company Name *</label>
                <div className="relative">
                  <input
                    id="input-onboard-company"
                    type="text"
                    required
                    placeholder="e.g. Apex Athletics"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-[#080809] border border-slate-800/60 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <Building className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Contact Name</label>
                <input
                  id="input-onboard-contact"
                  type="text"
                  placeholder="e.g. Rohan Varma"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-[#080809] border border-slate-800/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Website URL</label>
                <div className="relative">
                  <input
                    id="input-onboard-website"
                    type="url"
                    placeholder="https://apexstore.in"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full bg-[#080809] border border-slate-800/60 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <Globe className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Phone Number</label>
                <div className="relative">
                  <input
                    id="input-onboard-phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#080809] border border-slate-800/60 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Business Description</label>
              <textarea
                id="input-onboard-desc"
                rows={2}
                placeholder="Describe your catalog, USP, and technical product qualities..."
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                className="w-full bg-[#080809] border border-slate-800/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>

            <button
              id="btn-onboard-next-1"
              type="button"
              onClick={() => {
                if (!companyName.trim()) {
                  setError('Store/Company name is required');
                  return;
                }
                setError(null);
                setStep(2);
              }}
              className="w-full mt-3 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-900/20"
            >
              <span>Next: Commerce Policies</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Step 2: Policies & Shipping */}
        {step === 2 && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Default Currency</label>
                <select
                  id="select-onboard-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[#080809] border border-slate-800/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="INR">INR (₹ Indian Rupee)</option>
                  <option value="USD">USD ($ US Dollar)</option>
                  <option value="EUR">EUR (€ Euro)</option>
                  <option value="GBP">GBP (£ British Pound)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Country Base</label>
                <select
                  id="select-onboard-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-[#080809] border border-slate-800/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="IN">India (IN)</option>
                  <option value="US">United States (US)</option>
                  <option value="GB">United Kingdom (GB)</option>
                  <option value="AE">United Arab Emirates (AE)</option>
                  <option value="SG">Singapore (SG)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Return Window (Days)</label>
                <div className="relative">
                  <input
                    id="input-onboard-returns"
                    type="number"
                    min={0}
                    max={90}
                    value={returnPolicyDays}
                    onChange={(e) => setReturnPolicyDays(Number(e.target.value))}
                    className="w-full bg-[#080809] border border-slate-800/60 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Free Shipping Threshold</label>
                <div className="relative">
                  <input
                    id="input-onboard-shipping"
                    type="number"
                    min={0}
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                    className="w-full bg-[#080809] border border-slate-800/60 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <Truck className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                id="btn-onboard-back-1"
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800"
              >
                Back
              </button>

              <button
                id="btn-onboard-next-2"
                type="button"
                onClick={() => setStep(3)}
                className="w-2/3 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20"
              >
                <span>Next: Activate AI Infrastructure</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Verification & Activation */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Autonomous Agent Protocols Ready</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                AgentReady will initialize your isolated store database, machine-readable manifest (<code>/.well-known/agent-commerce.json</code>), starter catalog item, and friction diagnosis algorithms.
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-400 bg-[#080809] border border-slate-800/60 p-3 rounded-xl">
              <div className="flex justify-between">
                <span>Store Name:</span>
                <span className="text-white font-medium">{companyName}</span>
              </div>
              <div className="flex justify-between">
                <span>Currency & Region:</span>
                <span className="text-white font-medium">{currency} ({country})</span>
              </div>
              <div className="flex justify-between">
                <span>Return Window:</span>
                <span className="text-white font-medium">{returnPolicyDays} Days</span>
              </div>
              <div className="flex justify-between">
                <span>Free Shipping Over:</span>
                <span className="text-white font-medium">₹{freeShippingThreshold}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                id="btn-onboard-back-2"
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800"
              >
                Back
              </button>

              <button
                id="btn-onboard-complete"
                type="button"
                disabled={isSubmitting}
                onClick={handleComplete}
                className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Finalizing Setup...' : 'Launch Store Workspace'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
