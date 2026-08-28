import React, { useState } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Package,
  CreditCard,
  Bot,
  Truck,
  RotateCcw,
  ShieldCheck,
  Hash,
  MapPin,
  ExternalLink,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Order, OrderStatus, PaymentStatus, OrderTimelineEvent } from '../../types/index';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onExecuteCheckout?: (orderId: string, simulateFailure?: boolean) => Promise<void>;
  onCancelOrder?: (orderId: string, reason: string) => Promise<void>;
  isProcessing?: boolean;
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onExecuteCheckout,
  onCancelOrder,
  isProcessing = false,
}: OrderDetailModalProps) {
  const [cancelReason, setCancelReason] = useState('Customer requested order cancellation');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  if (!isOpen || !order) return null;

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PAID':
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      case 'PENDING':
      case 'PROCESSING':
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      case 'FAILED':
      case 'CANCELLED':
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
            <ShieldCheck className="w-3 h-3" /> Settled
          </span>
        );
      case 'UNPAID':
      case 'AUTHORIZED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md bg-amber-950/60 text-amber-400 border border-amber-800/60">
            <Clock className="w-3 h-3" /> {status}
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md bg-rose-950/60 text-rose-400 border border-rose-800/60">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md bg-purple-950/60 text-purple-400 border border-purple-800/60">
            <RotateCcw className="w-3 h-3" /> Refunded
          </span>
        );
      default:
        return null;
    }
  };

  const getTimelineIcon = (type: OrderTimelineEvent['type'], status: OrderTimelineEvent['status']) => {
    if (status === 'FAILED') return <XCircle className="w-4 h-4 text-rose-400" />;
    if (status === 'WARNING') return <AlertCircle className="w-4 h-4 text-amber-400" />;
    
    switch (type) {
      case 'ORDER_CREATED':
      case 'INVENTORY_VALIDATED':
      case 'INVENTORY_UPDATED':
        return <Package className="w-4 h-4 text-violet-400" />;
      case 'CHECKOUT_STARTED':
      case 'PAYMENT_AUTHORIZED':
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'ORDER_CONFIRMED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'REFUND_INITIATED':
      case 'ORDER_CANCELLED':
        return <RotateCcw className="w-4 h-4 text-rose-400" />;
      default:
        return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        id="order-detail-modal"
        className="relative w-full max-w-4xl bg-[#0D0D0E] border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#080809]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-950/60 border border-violet-800/50 text-violet-300">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">{order.orderNumber}</h2>
                {getStatusBadge(order.status)}
                {getPaymentStatusBadge(order.paymentStatus)}
                {order.isSimulated && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-violet-950/40 text-violet-400 border border-violet-800/50 rounded">
                    AI Sim
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Created on {new Date(order.createdAt).toLocaleString()} • ID: <span className="font-mono text-slate-300">{order.id}</span>
              </p>
            </div>
          </div>
          <button
            id="btn-close-order-detail"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Top Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer & Buyer */}
            <div className="p-4 bg-[#141416] border border-slate-800/60 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Bot className="w-4 h-4 text-violet-400" />
                <span>AI Buyer & Customer</span>
              </div>
              <div className="text-xs space-y-1">
                <p className="font-medium text-slate-200">{order.customer.name}</p>
                <p className="text-slate-400 font-mono">{order.customer.email}</p>
                {order.customer.phone && <p className="text-slate-400">{order.customer.phone}</p>}
                {order.aiMetadata?.agentProtocol && (
                  <p className="text-[11px] text-violet-400 pt-1">
                    Protocol: {order.aiMetadata.agentProtocol} ({order.aiMetadata.autonomyLevel || 'L4'})
                  </p>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="p-4 bg-[#141416] border border-slate-800/60 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Shipping Destination</span>
              </div>
              <div className="text-xs text-slate-300 space-y-0.5">
                <p>{order.customer.shippingAddress?.line1 || 'Autonomous Delivery Hub'}</p>
                {order.customer.shippingAddress?.line2 && <p>{order.customer.shippingAddress.line2}</p>}
                <p>
                  {order.customer.shippingAddress?.city || 'Bengaluru'}, {order.customer.shippingAddress?.state || 'KA'} {order.customer.shippingAddress?.postalCode || '560001'}
                </p>
                <p className="text-slate-500 font-medium">{order.customer.shippingAddress?.country || 'India (IN)'}</p>
              </div>
            </div>

            {/* Payment & Security */}
            <div className="p-4 bg-[#141416] border border-slate-800/60 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span>Payment & Security</span>
              </div>
              <div className="text-xs space-y-1">
                <p className="text-slate-300">
                  Method: <span className="font-semibold text-slate-200">Razorpay Agent Token</span>
                </p>
                {order.razorpayPaymentId ? (
                  <p className="text-slate-400">
                    Payment ID: <span className="font-mono text-emerald-400">{order.razorpayPaymentId}</span>
                  </p>
                ) : (
                  <p className="text-amber-400/90 text-[11px]">Zero-Iframe direct token pending</p>
                )}
                {order.idempotencyKey && (
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    Idemp: {order.idempotencyKey}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Ordered Line Items */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Purchased Line Items ({order.items.length})
            </h3>
            <div className="bg-[#141416] border border-slate-800/60 rounded-xl divide-y divide-slate-800/60 overflow-hidden">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-lg object-cover bg-slate-800 border border-slate-700/50"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-500">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        SKU: {item.sku} • Qty: {item.quantity}
                      </p>
                      {item.attributes && Object.keys(item.attributes).length > 0 && (
                        <div className="flex gap-1.5 mt-1">
                          {Object.entries(item.attributes).map(([k, v]) => (
                            <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-100">
                      {order.pricing.currency} {item.subtotal.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      @{order.pricing.currency} {item.unitPrice.toLocaleString('en-IN')} each
                    </p>
                  </div>
                </div>
              ))}

              {/* Price Breakdown Footer */}
              <div className="p-4 bg-[#0A0A0C] space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-300">{order.pricing.currency} {order.pricing.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping (Autonomous SLA)</span>
                  <span className="text-slate-300">
                    {order.pricing.shippingCost === 0 ? 'FREE' : `${order.pricing.currency} ${order.pricing.shippingCost}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Taxes (GST 18% inclusive)</span>
                  <span className="text-slate-300">{order.pricing.currency} {order.pricing.tax.toLocaleString('en-IN')}</span>
                </div>
                {order.pricing.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span>-{order.pricing.currency} {order.pricing.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold text-slate-100">
                  <span>Total Settled</span>
                  <span className="text-violet-400">{order.pricing.currency} {order.pricing.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lifecycle & Audit Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Autonomous Lifecycle & Audit Timeline
            </h3>
            <div className="bg-[#141416] border border-slate-800/60 rounded-xl p-4 space-y-4">
              {order.timeline && order.timeline.length > 0 ? (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {order.timeline.map((event, idx) => (
                    <div key={event.id || idx} className="relative group">
                      <div className="absolute -left-6 top-0.5 p-0.5 rounded-full bg-[#141416] border border-slate-700">
                        {getTimelineIcon(event.type, event.status)}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-slate-200">{event.title}</h4>
                          <span className="text-[10px] text-slate-500">
                            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No timeline events recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-[#080809] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {order.status === 'PENDING' && onExecuteCheckout && (
              <button
                id="btn-settle-order"
                disabled={isProcessing}
                onClick={() => onExecuteCheckout(order.id, false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                Authorize & Settle Payment
              </button>
            )}

            {order.status === 'PENDING' && onExecuteCheckout && (
              <button
                id="btn-simulate-fail-order"
                disabled={isProcessing}
                onClick={() => onExecuteCheckout(order.id, true)}
                className="px-3 py-2 text-xs font-semibold text-rose-400 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-xl transition-all disabled:opacity-50"
              >
                Simulate Payment Failure
              </button>
            )}

            {(order.status === 'PENDING' || order.status === 'PAID' || order.status === 'PROCESSING') && onCancelOrder && (
              showCancelPrompt ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason for cancellation..."
                    className="px-3 py-1.5 text-xs bg-[#141416] border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    disabled={isProcessing}
                    onClick={() => {
                      onCancelOrder(order.id, cancelReason);
                      setShowCancelPrompt(false);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg disabled:opacity-50"
                  >
                    Confirm Cancel & Restock
                  </button>
                  <button
                    onClick={() => setShowCancelPrompt(false)}
                    className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                  >
                    Back
                  </button>
                </div>
              ) : (
                <button
                  id="btn-prompt-cancel"
                  onClick={() => setShowCancelPrompt(true)}
                  className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-800/40 rounded-xl transition-all"
                >
                  Cancel Order & Return Stock
                </button>
              )
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
