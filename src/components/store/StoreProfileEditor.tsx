import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StoreProfile } from '../../types/index';
import { api } from '../../lib/api';
import {
  Store,
  ShieldCheck,
  Scale,
  Truck,
  DollarSign,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Globe,
  User,
  Mail,
  Phone,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';

export function StoreProfileEditor() {
  const { merchant, store, refreshStore } = useAuth();
  const [formData, setFormData] = useState<Partial<StoreProfile>>({});
  const [originalData, setOriginalData] = useState<Partial<StoreProfile>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (store) {
      const initial: Partial<StoreProfile> = {
        ...store,
        contactName: store.contactName || merchant?.name || '',
        email: store.email || merchant?.email || '',
        phone: store.phone || merchant?.phone || '',
        websiteUrl: store.websiteUrl || merchant?.website || '',
        description: store.description || merchant?.businessDescription || '',
        returnPolicyDays: store.returnPolicyDays ?? 14,
        freeShippingThreshold: store.freeShippingThreshold ?? 999,
        restockingFee: store.restockingFee ?? 0,
        hasFreeReturns: store.hasFreeReturns ?? true,
        standardDeliveryDays: store.standardDeliveryDays ?? 3,
        expressShippingCost: store.expressShippingCost ?? 149,
        isTaxInclusive: store.isTaxInclusive ?? true,
        hasCaptchaBypassForAgents: store.hasCaptchaBypassForAgents ?? true,
      };
      setFormData(initial);
      setOriginalData(initial);
    }
  }, [store, merchant]);

  const validate = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.name || formData.name.trim().length === 0) {
      errors.name = 'Store name is required.';
    }

    if (formData.email && !formData.email.includes('@')) {
      errors.email = 'Please enter a valid email address.';
    }

    if (formData.returnPolicyDays !== undefined && (isNaN(Number(formData.returnPolicyDays)) || Number(formData.returnPolicyDays) < 0)) {
      errors.returnPolicyDays = 'Return policy window must be a non-negative number of days.';
    }

    if (formData.freeShippingThreshold !== undefined && (isNaN(Number(formData.freeShippingThreshold)) || Number(formData.freeShippingThreshold) < 0)) {
      errors.freeShippingThreshold = 'Free shipping threshold must be a non-negative number.';
    }

    if (formData.restockingFee !== undefined && (isNaN(Number(formData.restockingFee)) || Number(formData.restockingFee) < 0)) {
      errors.restockingFee = 'Restocking fee must be a non-negative number.';
    }

    if (formData.standardDeliveryDays !== undefined && (isNaN(Number(formData.standardDeliveryDays)) || Number(formData.standardDeliveryDays) < 0)) {
      errors.standardDeliveryDays = 'Delivery SLA must be a non-negative number.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) {
      return;
    }

    setIsSaving(true);
    try {
      await api.updateStore({
        merchantId: merchant?.id,
        ...formData,
      });
      await refreshStore();
      setOriginalData({ ...formData });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      console.error('Error saving store profile:', err);
      setErrorMessage(err?.message || 'Failed to save store profile. Please check your network connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...originalData });
    setFormErrors({});
    setErrorMessage(null);
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Store Profile & AI Commerce Policies
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your store identity, contact info, return rules, and machine-readable agent policies.
              </p>
            </div>
          </div>
        </div>

        {savedSuccess && (
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-400 flex items-center gap-2 shadow-lg shadow-emerald-950/30 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Store Profile & Policies Saved & Published</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to Save Store Changes</p>
            <p className="text-slate-300 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Store Identity & Contact Details */}
        <div className="bg-[#0D0D0E] border border-slate-800/60 rounded-2xl p-5 md:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300 flex items-center gap-2">
              <Store className="w-4 h-4 text-violet-400" />
              <span>Store Identity & Contact Information</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Workspace ID: {merchant?.id || 'demo'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                <span>Store / Brand Name *</span>
              </label>
              <input
                id="input-store-name"
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. NovaGear Performance"
                className={`w-full bg-[#080809] border ${
                  formErrors.name ? 'border-rose-500/70' : 'border-slate-800/80'
                } rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors`}
              />
              {formErrors.name && <p className="text-[11px] text-rose-400 mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Primary Contact Person</span>
              </label>
              <input
                id="input-contact-name"
                type="text"
                value={formData.contactName || ''}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="e.g. Karan Sharma"
                className="w-full bg-[#080809] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Support / Merchant Email</span>
              </label>
              <input
                id="input-store-email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. support@novagear.in"
                className={`w-full bg-[#080809] border ${
                  formErrors.email ? 'border-rose-500/70' : 'border-slate-800/80'
                } rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors`}
              />
              {formErrors.email && <p className="text-[11px] text-rose-400 mt-1">{formErrors.email}</p>}
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Contact Phone</span>
              </label>
              <input
                id="input-store-phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                className="w-full bg-[#080809] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Store Website URL</span>
              </label>
              <input
                id="input-store-website"
                type="url"
                value={formData.websiteUrl || ''}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder="https://novagear.in"
                className="w-full bg-[#080809] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 font-medium block mb-1.5">Currency</label>
                <select
                  id="select-store-currency"
                  value={formData.currency || 'INR'}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full bg-[#080809] border border-slate-800/80 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="SGD">SGD (S$)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 font-medium block mb-1.5">Country</label>
                <select
                  id="select-store-country"
                  value={formData.country || 'IN'}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full bg-[#080809] border border-slate-800/80 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors"
                >
                  <option value="IN">India (IN)</option>
                  <option value="US">United States (US)</option>
                  <option value="GB">United Kingdom (GB)</option>
                  <option value="SG">Singapore (SG)</option>
                  <option value="AE">United Arab Emirates (AE)</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="text-slate-300 font-medium block mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Business & Brand Description (Parsed by Agent Reasoners)</span>
              </label>
              <textarea
                id="input-business-description"
                rows={2}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your product catalog, specialties, and brand guarantees..."
                className="w-full bg-[#080809] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* 2. Return & Refund Policies */}
        <div className="bg-[#0D0D0E] border border-slate-800/60 rounded-2xl p-5 md:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300 flex items-center gap-2">
              <Scale className="w-4 h-4 text-violet-400" />
              <span>Return & Refund Policies (Schema.org Verified)</span>
            </h3>
            <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
              High Buyer Trust Signal
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Return Window (Days) *</span>
              </label>
              <input
                id="input-return-days"
                type="number"
                min="0"
                value={formData.returnPolicyDays ?? 14}
                onChange={(e) => setFormData({ ...formData, returnPolicyDays: Number(e.target.value) })}
                className={`w-full bg-[#080809] border ${
                  formErrors.returnPolicyDays ? 'border-rose-500/70' : 'border-slate-800/80'
                } rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500 font-mono`}
              />
              {formErrors.returnPolicyDays && <p className="text-[11px] text-rose-400 mt-1">{formErrors.returnPolicyDays}</p>}
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span>Restocking Fee (₹)</span>
              </label>
              <input
                id="input-restocking-fee"
                type="number"
                min="0"
                value={formData.restockingFee ?? 0}
                onChange={(e) => setFormData({ ...formData, restockingFee: Number(e.target.value) })}
                className="w-full bg-[#080809] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1.5">Return Shipping Covered By</label>
              <select
                id="select-free-returns"
                value={formData.hasFreeReturns ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, hasFreeReturns: e.target.value === 'true' })}
                className="w-full bg-[#080809] border border-slate-800/80 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="true">Store (Free Customer Returns)</option>
                <option value="false">Customer (Buyer Pays Return Shipping)</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="text-slate-300 font-medium block mb-1.5">Return Policy Description (Summary for LLM Bots)</label>
              <input
                id="input-return-description"
                type="text"
                value={formData.returnPolicyDescription || ''}
                onChange={(e) => setFormData({ ...formData, returnPolicyDescription: e.target.value })}
                placeholder="e.g. 14-day hassle-free pickup. Items must be in original condition with tags intact."
                className="w-full bg-[#080809] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>

        {/* 3. Shipping & Delivery SLAs */}
        <div className="bg-[#0D0D0E] border border-slate-800/60 rounded-2xl p-5 md:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300 flex items-center gap-2">
              <Truck className="w-4 h-4 text-violet-400" />
              <span>Shipping & Delivery SLAs</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Real-time Calculation Matrix</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1.5">Free Shipping Threshold (₹)</label>
              <input
                id="input-free-shipping-threshold"
                type="number"
                min="0"
                value={formData.freeShippingThreshold ?? 999}
                onChange={(e) => setFormData({ ...formData, freeShippingThreshold: Number(e.target.value) })}
                className={`w-full bg-[#080809] border ${
                  formErrors.freeShippingThreshold ? 'border-rose-500/70' : 'border-slate-800/80'
                } rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500 font-mono`}
              />
              {formErrors.freeShippingThreshold && (
                <p className="text-[11px] text-rose-400 mt-1">{formErrors.freeShippingThreshold}</p>
              )}
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1.5">Standard Delivery SLA (Days)</label>
              <input
                id="input-standard-sla"
                type="number"
                min="1"
                value={formData.standardDeliveryDays ?? 3}
                onChange={(e) => setFormData({ ...formData, standardDeliveryDays: Number(e.target.value) })}
                className="w-full bg-[#080809] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1.5">Priority Air Express Cost (₹)</label>
              <input
                id="input-express-cost"
                type="number"
                min="0"
                value={formData.expressShippingCost ?? 149}
                onChange={(e) => setFormData({ ...formData, expressShippingCost: Number(e.target.value) })}
                className="w-full bg-[#080809] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* 4. Pricing Transparency & Bot Policy Handling */}
        <div className="bg-[#0D0D0E] border border-slate-800/60 rounded-2xl p-5 md:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-violet-400" />
              <span>Pricing Transparency & Autonomous Agent Permissions</span>
            </h3>
            <span className="text-[11px] text-violet-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Agent Protocol v1.2</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-start justify-between p-4 rounded-xl bg-[#080809] border border-slate-800/70 cursor-pointer hover:border-slate-700 transition-colors">
              <div className="pr-4">
                <p className="text-xs font-semibold text-slate-200">Catalog Prices Are Tax Inclusive</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Eliminates unexpected price divergence during automated agent checkout evaluations.
                </p>
              </div>
              <input
                id="toggle-tax-inclusive"
                type="checkbox"
                checked={formData.isTaxInclusive ?? true}
                onChange={(e) => setFormData({ ...formData, isTaxInclusive: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-0"
              />
            </label>

            <label className="flex items-start justify-between p-4 rounded-xl bg-[#080809] border border-slate-800/70 cursor-pointer hover:border-slate-700 transition-colors">
              <div className="pr-4">
                <p className="text-xs font-semibold text-slate-200">Enable Cryptographic Agent Token CAPTCHA Bypass</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Allows validated AI agents with Razorpay signature authorization to proceed without interactive CAPTCHA blocks.
                </p>
              </div>
              <input
                id="toggle-captcha-bypass"
                type="checkbox"
                checked={formData.hasCaptchaBypassForAgents ?? true}
                onChange={(e) => setFormData({ ...formData, hasCaptchaBypassForAgents: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-0"
              />
            </label>

            <label className="flex items-start justify-between p-4 rounded-xl bg-[#080809] border border-slate-800/70 cursor-pointer hover:border-slate-700 transition-colors">
              <div className="pr-4">
                <p className="text-xs font-semibold text-slate-200">Emit JSON-LD Schema.org Structured Markup</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Injects machine-readable product metadata directly into discovery endpoints.
                </p>
              </div>
              <input
                id="toggle-schema-org"
                type="checkbox"
                checked={formData.schemaOrgEnabled ?? true}
                onChange={(e) => setFormData({ ...formData, schemaOrgEnabled: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-0"
              />
            </label>

            <label className="flex items-start justify-between p-4 rounded-xl bg-[#080809] border border-slate-800/70 cursor-pointer hover:border-slate-700 transition-colors">
              <div className="pr-4">
                <p className="text-xs font-semibold text-slate-200">Price Parity Guarantee</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Guarantees AI buyers receive the lowest publicized retail price across all channels.
                </p>
              </div>
              <input
                id="toggle-price-parity"
                type="checkbox"
                checked={formData.hasPriceParityGuarantee ?? true}
                onChange={(e) => setFormData({ ...formData, hasPriceParityGuarantee: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            id="btn-save-store-profile"
            type="submit"
            disabled={isSaving || !hasChanges}
            className="w-full sm:flex-1 py-3 px-5 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Store Profile...' : hasChanges ? 'Save Changes' : 'All Changes Saved'}</span>
          </button>

          <button
            id="btn-cancel-store-profile"
            type="button"
            onClick={handleCancel}
            disabled={isSaving || !hasChanges}
            className="w-full sm:w-auto py-3 px-5 bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border border-slate-700/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Cancel Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
}
