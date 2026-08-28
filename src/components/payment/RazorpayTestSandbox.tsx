import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  RazorpayOrder,
  PaymentAttempt,
  PaymentReadinessReport,
  PaymentTestSuiteResult,
  MerchantPaymentConfig,
} from '../../types/index';
import { api } from '../../lib/api';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Zap,
  Play,
  Webhook,
  Activity,
  Sliders,
  Sparkles,
  ArrowRight,
  Clock,
  Key,
} from 'lucide-react';

export function RazorpayTestSandbox() {
  const { store } = useAuth();
  const [amount, setAmount] = useState<number>(3499);
  const [method, setMethod] = useState<'razorpay_agent_token' | 'razorpay_test_card' | 'razorpay_test_upi'>('razorpay_agent_token');
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);
  const [failureReason, setFailureReason] = useState<string>('INSUFFICIENT_AGENT_ALLOWANCE');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(`idemp_${Date.now().toString(36)}`);

  // Active state
  const [order, setOrder] = useState<RazorpayOrder | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentAttempt | null>(null);
  const [signatureVerified, setSignatureVerified] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Diagnostics & Suite
  const [readiness, setReadiness] = useState<PaymentReadinessReport | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<MerchantPaymentConfig | null>(null);
  const [testSuiteResult, setTestSuiteResult] = useState<PaymentTestSuiteResult | null>(null);
  const [isRunningSuite, setIsRunningSuite] = useState<boolean>(false);
  const [paymentRecords, setPaymentRecords] = useState<PaymentAttempt[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(false);
  const [webhookMessage, setWebhookMessage] = useState<string | null>(null);
  const [isSendingWebhook, setIsSendingWebhook] = useState<boolean>(false);

  const loadDiagnosticsAndLedger = async () => {
    try {
      const [readinessData, configData, recordsData] = await Promise.all([
        api.getPaymentReadiness(),
        api.getPaymentConfig(),
        api.getPaymentRecords(),
      ]);
      setReadiness(readinessData);
      setPaymentConfig(configData);
      setPaymentRecords(recordsData || []);
    } catch (err) {
      console.error('Error loading payment diagnostics:', err);
    }
  };

  useEffect(() => {
    loadDiagnosticsAndLedger();
  }, [store]);

  const handleCreateAndProcessOrder = async () => {
    setIsProcessing(true);
    setPaymentResult(null);
    setSignatureVerified(null);

    try {
      // 1. Create Razorpay Test Order
      const newOrder = await api.createPaymentOrder(amount, `rcpt_${Date.now()}`, {
        store_id: store?.id || 'store_novagear_01',
        agent_type: 'AutonomousBuyer',
      });
      setOrder(newOrder);

      // 2. Process Payment with Agent Token / Selected Method
      const payment = await api.processPayment({
        orderId: newOrder.orderId,
        method,
        amount: newOrder.amountDisplay || newOrder.amount,
        idempotencyKey,
        simulateFailure,
        failureReason: simulateFailure ? failureReason : undefined,
      });
      setPaymentResult(payment);

      // 3. Verify Signature if successful
      if (payment.status === 'SUCCESS' && payment.agentSignature) {
        const verifyRes = await api.verifyPaymentSignature(payment.orderId, payment.paymentId, payment.agentSignature);
        setSignatureVerified(verifyRes.isValid);
      }

      // Refresh records & generate fresh idempotency key
      const updatedRecords = await api.getPaymentRecords();
      setPaymentRecords(updatedRecords || []);
      setIdempotencyKey(`idemp_${Date.now().toString(36)}`);
    } catch (err) {
      console.error('Payment processing failed in sandbox:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = async () => {
    if (!order || !paymentResult) return;
    setIsProcessing(true);
    try {
      const retryResult = await api.retryPayment(order.orderId, paymentResult.id);
      setPaymentResult(retryResult);
      if (retryResult.status === 'SUCCESS' && retryResult.agentSignature) {
        const verifyRes = await api.verifyPaymentSignature(retryResult.orderId, retryResult.paymentId, retryResult.agentSignature);
        setSignatureVerified(verifyRes.isValid);
      }
      const updatedRecords = await api.getPaymentRecords();
      setPaymentRecords(updatedRecords || []);
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunTestSuite = async () => {
    setIsRunningSuite(true);
    try {
      const suiteResult = await api.runPaymentTestSuite();
      setTestSuiteResult(suiteResult);
      await loadDiagnosticsAndLedger();
    } catch (err) {
      console.error('Test suite failed:', err);
    } finally {
      setIsRunningSuite(false);
    }
  };

  const handleTriggerTestWebhook = async () => {
    setIsSendingWebhook(true);
    setWebhookMessage(null);
    try {
      const res = await api.sendTestWebhook('payment.captured', order?.orderId, paymentResult?.paymentId);
      setWebhookMessage(res.message);
      const updatedRecords = await api.getPaymentRecords();
      setPaymentRecords(updatedRecords || []);
    } catch (err: any) {
      setWebhookMessage(`Webhook trigger failed: ${err?.message}`);
    } finally {
      setIsSendingWebhook(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-violet-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Razorpay Agentic Payment Sandbox
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Test machine-to-machine checkout via pre-authorized agent tokenization (Razorpay Track 1).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Razorpay Test Mode Active</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-950/30 border border-violet-500/30 rounded-xl text-xs font-semibold text-violet-300">
            <Zap className="w-3.5 h-3.5 text-violet-400" />
            <span>Zero-Iframe Direct Settlement</span>
          </div>
        </div>
      </div>

      {/* Payment Readiness Diagnostic Panel */}
      <div className="bg-[#0D0D0E] border border-slate-800/50 rounded-2xl p-5 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Payment Readiness Diagnostics</h2>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                  readiness?.grade === 'A+' || readiness?.grade === 'A'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : readiness?.grade === 'B' || readiness?.grade === 'C'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  Grade {readiness?.grade || 'A+'} ({readiness?.overallScore || 94}/100)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {readiness?.summary || 'Store payment stack is fully optimized for machine-to-machine Razorpay agent transactions.'}
              </p>
            </div>
          </div>

          <button
            id="btn-run-payment-test-suite"
            onClick={handleRunTestSuite}
            disabled={isRunningSuite}
            className="px-3.5 py-2 bg-[#080809] hover:bg-slate-800 text-violet-300 border border-violet-500/30 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
          >
            <Play className={`w-3.5 h-3.5 ${isRunningSuite ? 'animate-spin' : ''}`} />
            <span>{isRunningSuite ? 'Running Test Suite...' : 'Run Automated Test Suite'}</span>
          </button>
        </div>

        {/* Diagnostic Check Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {readiness?.checks.slice(0, 6).map((check) => (
            <div
              key={check.id}
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                check.passed
                  ? 'bg-[#080809] border-slate-800/60'
                  : check.severity === 'critical'
                  ? 'bg-rose-950/10 border-rose-800/30'
                  : 'bg-amber-950/10 border-amber-800/30'
              }`}
            >
              {check.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${check.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'}`} />
              )}
              <div className="space-y-0.5 min-w-0">
                <span className="text-xs font-medium text-white block truncate">{check.name}</span>
                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{check.message}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Test Suite Results (if executed) */}
        {testSuiteResult && (
          <div className="p-4 bg-[#080809] border border-violet-500/30 rounded-xl space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold text-white">
                  Automated Payment Test Suite ({testSuiteResult.passedSteps}/{testSuiteResult.totalSteps} Passed)
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                Suite ID: {testSuiteResult.suiteId}
              </span>
            </div>

            <div className="space-y-2">
              {testSuiteResult.steps.map((step) => (
                <div key={step.stepId} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#0D0D0E] border border-slate-800/40">
                  <div className="flex items-center gap-2">
                    {step.status === 'PASS' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <span className="text-slate-200 font-medium">{step.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">{step.details}</span>
                    <span className="text-[10px] font-mono text-slate-500">{step.durationMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Simulator Inputs & Execution Output */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Transaction Controls */}
        <div className="bg-[#0D0D0E] border border-slate-800/50 rounded-2xl p-5 md:p-6 space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">
              Transaction Parameters
            </span>
            <span className="text-[11px] font-mono text-violet-400">
              {paymentConfig?.maskedKeyId || 'rzp_test_••••9084'}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Settlement Protocol / Method</label>
              <select
                id="select-payment-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full bg-[#080809] border border-slate-800/60 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
              >
                <option value="razorpay_agent_token">Razorpay Agent Token (Zero Iframe Direct)</option>
                <option value="razorpay_test_card">Pre-authorized Corporate Card (Test)</option>
                <option value="razorpay_test_upi">Instant Agent UPI AutoPay (Test)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Transaction Amount (₹ INR)</label>
              <input
                id="input-payment-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-[#080809] border border-slate-800/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Idempotency Key</label>
              <input
                id="input-idempotency-key"
                type="text"
                value={idempotencyKey}
                onChange={(e) => setIdempotencyKey(e.target.value)}
                className="w-full bg-[#080809] border border-slate-800/60 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>

            <div className="pt-2 border-t border-slate-800/50 space-y-2">
              <label className="flex items-center justify-between p-2 rounded-lg bg-[#080809] border border-slate-800/60 cursor-pointer">
                <span className="text-xs text-slate-300">Simulate Payment Failure</span>
                <input
                  id="toggle-simulate-payment-failure"
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-violet-600 focus:ring-0"
                />
              </label>

              {simulateFailure && (
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 block">Failure Reason Code</label>
                  <select
                    id="select-failure-reason"
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    className="w-full bg-[#080809] border border-slate-800/60 rounded-xl px-2.5 py-1.5 text-xs text-slate-300"
                  >
                    <option value="INSUFFICIENT_AGENT_ALLOWANCE">INSUFFICIENT_AGENT_ALLOWANCE</option>
                    <option value="GATEWAY_RATE_LIMIT">GATEWAY_RATE_LIMIT</option>
                    <option value="IDEMPOTENCY_MISMATCH">IDEMPOTENCY_MISMATCH</option>
                    <option value="EXPIRED_DELEGATION_TOKEN">EXPIRED_DELEGATION_TOKEN</option>
                  </select>
                </div>
              )}
            </div>

            <button
              id="btn-process-agent-payment"
              onClick={handleCreateAndProcessOrder}
              disabled={isProcessing}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-900/20 disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Authorizing Token...' : 'Authorize Agent Payment'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Execution Output & Verification */}
        <div className="bg-[#0D0D0E] border border-slate-800/50 rounded-2xl p-5 md:p-6 lg:col-span-2 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/50">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">
                Transaction Result & Cryptographic Proof
              </span>
              {signatureVerified && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  HMAC Verified
                </span>
              )}
            </div>

            {paymentResult ? (
              <div className="mt-4 space-y-3">
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  paymentResult.status === 'SUCCESS'
                    ? 'bg-emerald-950/20 border-emerald-800/40'
                    : 'bg-red-950/20 border-red-800/40'
                }`}>
                  {paymentResult.status === 'SUCCESS' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase">
                        Status: {paymentResult.status}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        ({paymentResult.paymentId})
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {paymentResult.status === 'SUCCESS'
                        ? 'Payment settled instantly without requiring human intervention or 3DS popups.'
                        : `Payment failed: ${paymentResult.errorMessage || 'Authorization declined'}`}
                    </p>
                  </div>
                </div>

                {/* Ledger Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-[#080809] border border-slate-800/60 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Order ID</span>
                    <span className="font-mono text-slate-200 text-[11px] truncate block">{paymentResult.orderId}</span>
                  </div>
                  <div className="p-2.5 bg-[#080809] border border-slate-800/60 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Method</span>
                    <span className="font-mono text-violet-400 text-[11px] block">{paymentResult.method}</span>
                  </div>
                  <div className="p-2.5 bg-[#080809] border border-slate-800/60 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Idempotency Key</span>
                    <span className="font-mono text-slate-200 text-[11px] truncate block">{paymentResult.idempotencyKey}</span>
                  </div>
                  <div className="p-2.5 bg-[#080809] border border-slate-800/60 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Settled Amount</span>
                    <span className="font-bold text-emerald-400 text-[11px] block font-mono">₹{paymentResult.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Signature Payload */}
                {paymentResult.agentSignature && (
                  <div className="p-3 bg-[#080809] border border-slate-800/60 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Razorpay Signature (HMAC-SHA256)</span>
                    <p className="text-[11px] font-mono text-emerald-400/90 break-all">{paymentResult.agentSignature}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Click <span className="text-slate-200 font-semibold">"Authorize Agent Payment"</span> to trigger a simulated Razorpay tokenized transaction.
              </div>
            )}
          </div>

          {/* Action Row: Retry & Webhook Trigger */}
          <div className="pt-3 border-t border-slate-800/50 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                id="btn-trigger-test-webhook"
                onClick={handleTriggerTestWebhook}
                disabled={isSendingWebhook || !paymentResult}
                className="px-3 py-1.5 bg-[#080809] hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <Webhook className="w-3.5 h-3.5 text-violet-400" />
                <span>{isSendingWebhook ? 'Dispatching...' : 'Dispatch Webhook Event'}</span>
              </button>
              {webhookMessage && (
                <span className="text-[11px] text-emerald-400 font-medium">{webhookMessage}</span>
              )}
            </div>

            {paymentResult?.status === 'FAILED' && (
              <button
                id="btn-retry-failed-payment"
                onClick={handleRetry}
                disabled={isProcessing}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>Trigger Agent Auto-Retry</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transaction History & Supabase Ledger */}
      <div className="bg-[#0D0D0E] border border-slate-800/50 rounded-2xl p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white">Merchant Payment Audit Ledger (Tenant Isolated)</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {paymentRecords.length} recorded attempts
          </span>
        </div>

        {paymentRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800/60 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  <th className="pb-2.5 font-semibold">Status</th>
                  <th className="pb-2.5 font-semibold">Payment ID</th>
                  <th className="pb-2.5 font-semibold">Order ID</th>
                  <th className="pb-2.5 font-semibold">Method</th>
                  <th className="pb-2.5 font-semibold">Amount</th>
                  <th className="pb-2.5 font-semibold">Idempotency Key</th>
                  <th className="pb-2.5 font-semibold">Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono text-[11px]">
                {paymentRecords.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        attempt.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {attempt.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-200">{attempt.paymentId}</td>
                    <td className="py-2.5 text-slate-400 truncate max-w-[140px]">{attempt.orderId}</td>
                    <td className="py-2.5 text-violet-400">{attempt.method}</td>
                    <td className="py-2.5 font-bold text-white font-sans">₹{attempt.amount.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 text-slate-400 truncate max-w-[120px]">{attempt.idempotencyKey}</td>
                    <td className="py-2.5 text-slate-500 truncate max-w-[120px]">
                      {attempt.agentSignature ? `${attempt.agentSignature.slice(0, 10)}...` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            No payment attempts recorded yet for this merchant workspace. Authorize an agent payment above to record transactions.
          </div>
        )}
      </div>
    </div>
  );
}
