import React, { useState, useEffect } from 'react';
import {
  X,
  Bot,
  Package,
  CreditCard,
  AlertTriangle,
  Play,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Product, BuyerPersona } from '../../types/index';

interface SimulateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onOrderSimulated: () => void;
}

export function SimulateOrderModal({
  isOpen,
  onClose,
  products,
  onOrderSimulated,
}: SimulateOrderModalProps) {
  const [personas, setPersonas] = useState<BuyerPersona[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);
  const [failureReason, setFailureReason] = useState<string>(
    'Issuer 3DS mandatory verification failed on autonomous token'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/buyer-personas')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setPersonas(data);
            if (data.length > 0) setSelectedPersonaId(data[0].id);
          }
        })
        .catch((err) => console.error('Failed to load personas:', err));

      if (products.length > 0 && !selectedProductId) {
        setSelectedProductId(products[0].id);
      }
      setResultMessage(null);
    }
  }, [isOpen, products]);

  if (!isOpen) return null;

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    setIsSubmitting(true);
    setResultMessage(null);

    try {
      const res = await fetch('/api/orders/simulate-ai-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          personaId: selectedPersonaId,
          simulatePaymentFailure: simulateFailure,
          failureReason: simulateFailure ? failureReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to simulate order');
      }

      setResultMessage({
        type: 'success',
        text: `Successfully executed autonomous AI order ${data.order?.orderNumber || ''} (${data.order?.status})!`,
      });

      setTimeout(() => {
        onOrderSimulated();
        onClose();
      }, 1200);
    } catch (err: any) {
      setResultMessage({
        type: 'error',
        text: err.message || 'Autonomous checkout simulation failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const selectedPersona = personas.find((p) => p.id === selectedPersonaId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        id="simulate-order-modal"
        className="relative w-full max-w-lg bg-[#0D0D0E] border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#080809]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-950/60 border border-violet-800/50 text-violet-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Trigger Autonomous AI Order</h2>
              <p className="text-xs text-slate-400">
                Execute an authentic end-to-end checkout with Razorpay token authorization.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSimulate} className="p-6 space-y-4">
          {resultMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                resultMessage.type === 'success'
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-800/60'
              }`}
            >
              {resultMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{resultMessage.text}</span>
            </div>
          )}

          {/* Persona Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Bot className="w-3.5 h-3.5 text-violet-400" />
              <span>Simulated AI Buyer Persona</span>
            </label>
            <select
              value={selectedPersonaId}
              onChange={(e) => setSelectedPersonaId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#141416] border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500"
            >
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.role})
                </option>
              ))}
            </select>
            {selectedPersona && (
              <p className="text-[11px] text-slate-400 italic px-1">
                "{selectedPersona.searchQuery}" • {selectedPersona.urgency} urgency
              </p>
            )}
          </div>

          {/* Product Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target Catalog Product</span>
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#141416] border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500"
            >
              {products.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.title} — {prod.currency} {prod.basePrice.toLocaleString('en-IN')} ({prod.stockQuantity} in stock)
                </option>
              ))}
            </select>
            {selectedProduct && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                <span>SKU: {selectedProduct.sku || 'N/A'}</span>
                <span>Stock Available: {selectedProduct.stockQuantity} unit(s)</span>
              </div>
            )}
          </div>

          {/* Failure Injection Simulation */}
          <div className="p-3.5 bg-[#141416] border border-slate-800/80 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate Payment Failure Scenario</span>
              </div>
              <input
                type="checkbox"
                id="toggle-simulate-failure"
                checked={simulateFailure}
                onChange={(e) => setSimulateFailure(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 bg-slate-800 border-slate-700 focus:ring-rose-500"
              />
            </div>

            {simulateFailure && (
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] text-slate-400">Failure Rejection Reason:</label>
                <input
                  type="text"
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#0D0D0E] border border-slate-700 rounded-lg text-rose-300 focus:outline-none focus:border-rose-500"
                />
                <p className="text-[10px] text-slate-500">
                  Tests how AgentReady handles payment drops, automatically recovers inventory, and logs audit entries.
                </p>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedProductId}
              className="px-5 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Executing Agent Checkout...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  Execute Autonomous Order
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
