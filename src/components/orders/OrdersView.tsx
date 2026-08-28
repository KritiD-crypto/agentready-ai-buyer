import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Bot,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Package,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Order, OrderStatus, OrderSummary, Product } from '../../types/index';
import { OrderDetailModal } from './OrderDetailModal';
import { SimulateOrderModal } from './SimulateOrderModal';

interface OrdersViewProps {
  onNavigateToCatalog?: () => void;
}

export function OrdersView({ onNavigateToCatalog }: OrdersViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isSimulateOpen, setIsSimulateOpen] = useState<boolean>(false);
  const [isActionProcessing, setIsActionProcessing] = useState<boolean>(false);

  const fetchOrdersData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [ordersRes, summaryRes, productsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/orders/summary'),
        fetch('/api/products'),
      ]);

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data);
        if (selectedOrder) {
          const fresh = data.find((o: Order) => o.id === selectedOrder.id);
          if (fresh) setSelectedOrder(fresh);
        }
      }

      if (summaryRes.ok) {
        const sumData = await summaryRes.json();
        setSummary(sumData);
      }

      if (productsRes.ok) {
        const prods = await productsRes.json();
        setProducts(prods);
      }
    } catch (err) {
      console.error('Failed to load orders data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrdersData();
  }, []);

  const handleExecuteCheckout = async (orderId: string, simulateFailure: boolean = false) => {
    setIsActionProcessing(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'razorpay_agent_token',
          simulatePaymentFailure: simulateFailure,
          failureReason: simulateFailure ? 'Simulated issuer authorization rejection' : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.order) {
        setSelectedOrder(data.order);
      }
      await fetchOrdersData(true);
    } catch (err) {
      console.error('Checkout execution error:', err);
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    setIsActionProcessing(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();
      if (res.ok && data.order) {
        setSelectedOrder(data.order);
      }
      await fetchOrdersData(true);
    } catch (err) {
      console.error('Cancel order error:', err);
    } finally {
      setIsActionProcessing(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchNumber = order.orderNumber.toLowerCase().includes(query);
        const matchCustomer = order.customer.name.toLowerCase().includes(query);
        const matchEmail = order.customer.email.toLowerCase().includes(query);
        const matchItems = order.items.some(
          (i) => i.title.toLowerCase().includes(query) || i.sku.toLowerCase().includes(query)
        );
        if (!matchNumber && !matchCustomer && !matchEmail && !matchItems) return false;
      }

      // Status match
      if (statusFilter !== 'ALL' && order.status !== statusFilter) {
        return false;
      }

      // Source match
      if (sourceFilter !== 'ALL' && order.source !== sourceFilter) {
        return false;
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter, sourceFilter]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PAID':
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            {status}
          </span>
        );
      case 'PENDING':
      case 'PROCESSING':
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            {status}
          </span>
        );
      case 'FAILED':
      case 'CANCELLED':
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div id="orders-dashboard-view" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-950/60 border border-violet-800/50 text-violet-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Autonomous Order & Checkout Lifecycle
              </h1>
              <p className="text-xs text-slate-400">
                Real-time tracking of AI buyer purchases, inventory reservations, and Razorpay agent settlements.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-refresh-orders"
            onClick={() => fetchOrdersData(true)}
            disabled={isRefreshing}
            className="p-2 text-slate-400 hover:text-slate-200 bg-[#141416] hover:bg-[#1C1C1F] border border-slate-800 rounded-xl transition-all"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-violet-400' : ''}`} />
          </button>

          <button
            id="btn-simulate-order-trigger"
            onClick={() => setIsSimulateOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Zap className="w-3.5 h-3.5" />
            Simulate AI Order
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[#0D0D0E] border border-slate-800/80 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total AI Orders</span>
              <ShoppingBag className="w-4 h-4 text-violet-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100">{summary.totalOrders}</p>
            <p className="text-[11px] text-slate-500">
              {summary.paidOrders} settled • {summary.pendingOrders} pending
            </p>
          </div>

          <div className="p-4 bg-[#0D0D0E] border border-slate-800/80 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Settled Gross Revenue</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {summary.currency} {summary.totalRevenue.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500">
              Avg Order: {summary.currency} {Math.round(summary.averageOrderValue).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-4 bg-[#0D0D0E] border border-slate-800/80 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Settlement Rate</span>
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100">{summary.conversionRate.toFixed(1)}%</p>
            <p className="text-[11px] text-slate-500">
              {summary.failedOrders} failed attempts caught
            </p>
          </div>

          <div className="p-4 bg-[#0D0D0E] border border-slate-800/80 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Friction Dropoffs</span>
              <AlertCircle className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-rose-400">
              {summary.failedOrders + summary.cancelledOrders}
            </p>
            <p className="text-[11px] text-slate-500">
              Stock automatically restored
            </p>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 bg-[#0D0D0E] border border-slate-800/80 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, customer, SKU..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#141416] border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {['ALL', 'PAID', 'PENDING', 'PROCESSING', 'FAILED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  statusFilter === status
                    ? 'bg-violet-900/40 text-violet-300 border border-violet-700/60 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 bg-[#141416] border border-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#0D0D0E] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-violet-400 mx-auto" />
            <p className="text-xs text-slate-400">Loading autonomous orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-950/40 border border-violet-800/40 text-violet-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">No Orders Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No orders matched the current filter. Trigger a simulated AI Buyer order or run a live simulation to generate transactions.
            </p>
            <button
              onClick={() => setIsSimulateOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-all inline-flex items-center gap-2"
            >
              <Zap className="w-3.5 h-3.5" />
              Simulate AI Order Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#080809] border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Order</th>
                  <th className="px-5 py-3.5">AI Buyer / Customer</th>
                  <th className="px-5 py-3.5">Purchased Items</th>
                  <th className="px-5 py-3.5">Total & Method</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Created</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-[#141416]/60 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsDetailOpen(true);
                    }}
                  >
                    {/* Order ID & Source */}
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-100">{order.orderNumber}</span>
                          {order.isSimulated && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-violet-950/60 text-violet-300 border border-violet-800/60 rounded">
                              AI Sim
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">{order.id}</p>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-violet-400" />
                          <span className="font-semibold text-slate-200">{order.customer.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate max-w-[160px]">
                          {order.customer.email}
                        </p>
                      </div>
                    </td>

                    {/* Line Items */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 text-xs text-slate-300 bg-[#141416] px-2 py-1 rounded-lg border border-slate-800"
                          >
                            <span className="font-semibold text-slate-200">{item.quantity}x</span>
                            <span className="truncate max-w-[140px]">{item.title}</span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <span className="text-[10px] text-slate-500 font-semibold">
                            +{order.items.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total & Payment */}
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-100">
                          {order.pricing.currency} {order.pricing.totalAmount.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-slate-500" />
                          <span>Razorpay Token</span>
                        </p>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-4">{getStatusBadge(order.status)}</td>

                    {/* Created Time */}
                    <td className="px-5 py-4 text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDetailOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-violet-400 hover:text-violet-300 bg-violet-950/40 hover:bg-violet-900/60 border border-violet-800/50 rounded-lg transition-all"
                      >
                        View Lifecycle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onExecuteCheckout={handleExecuteCheckout}
        onCancelOrder={handleCancelOrder}
        isProcessing={isActionProcessing}
      />

      {/* Simulate Order Modal */}
      <SimulateOrderModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        products={products}
        onOrderSimulated={() => fetchOrdersData(true)}
      />
    </div>
  );
}
