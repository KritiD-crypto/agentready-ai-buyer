/**
 * AgentReady Merchant Notification Dispatcher & Service
 * 
 * Manages real-time and persistent alerts for:
 * - Critical AI Buyer simulation friction points and dropoffs
 * - Payment gateway failures and token verification issues
 * - Webhook delivery or signature failures
 * - Fix Priority Queue resolutions
 * - System health status alerts
 * 
 * Supports deduplication keys to prevent alarm fatigue and spam.
 */

import { MerchantNotification, SimulationReport, PaymentAttempt, RevenueLeakItem, Order } from '../src/types/index';
import { db, DEMO_MERCHANT_ID } from './db';

export class NotificationService {
  /**
   * Dispatch a structured notification with tenant scoping
   */
  dispatch(params: {
    merchantId: string;
    type: MerchantNotification['type'];
    title: string;
    message: string;
    severity: MerchantNotification['severity'];
    relatedEntityType?: MerchantNotification['relatedEntityType'];
    relatedEntityId?: string;
    actionUrl?: string;
    dedupKey?: string;
  }): MerchantNotification {
    const {
      merchantId = DEMO_MERCHANT_ID,
      type,
      title,
      message,
      severity,
      relatedEntityType,
      relatedEntityId,
      actionUrl,
      dedupKey,
    } = params;

    const notif: MerchantNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      merchantId,
      type,
      title,
      message,
      severity,
      isRead: false,
      createdAt: new Date().toISOString(),
      relatedEntityType,
      relatedEntityId,
      actionUrl,
      dedupKey,
    };

    return db.saveNotification(notif);
  }

  /**
   * Order created notification
   */
  notifyOrderCreated(order: Order) {
    this.dispatch({
      merchantId: order.merchantId,
      type: 'order_created',
      title: `New Autonomous Order: ${order.orderNumber}`,
      message: `${order.customer.name} placed order for ${order.items.length} item(s) (${order.pricing.currency} ${order.pricing.totalAmount.toLocaleString('en-IN')}).`,
      severity: 'info',
      relatedEntityType: 'order',
      relatedEntityId: order.id,
      actionUrl: `/orders/${order.id}`,
      dedupKey: `ord_created_${order.id}`,
    });
  }

  /**
   * Order paid notification
   */
  notifyOrderPaid(order: Order) {
    this.dispatch({
      merchantId: order.merchantId,
      type: 'order_paid',
      title: `Payment Settled: ${order.orderNumber}`,
      message: `Received ${order.pricing.currency} ${order.pricing.totalAmount.toLocaleString('en-IN')} via Razorpay Agent Token. Order is now processing.`,
      severity: 'success',
      relatedEntityType: 'order',
      relatedEntityId: order.id,
      actionUrl: `/orders/${order.id}`,
      dedupKey: `ord_paid_${order.id}`,
    });
  }

  /**
   * Order cancelled notification
   */
  notifyOrderCancelled(order: Order, reason?: string) {
    this.dispatch({
      merchantId: order.merchantId,
      type: 'order_cancelled',
      title: `Order Cancelled: ${order.orderNumber}`,
      message: `Order was cancelled (${reason || 'Customer request'}). Reserved inventory has been restored to catalog.`,
      severity: 'warning',
      relatedEntityType: 'order',
      relatedEntityId: order.id,
      actionUrl: `/orders/${order.id}`,
      dedupKey: `ord_cancel_${order.id}`,
    });
  }

  /**
   * Checkout failed notification
   */
  notifyCheckoutFailed(order: Order, error: string) {
    this.dispatch({
      merchantId: order.merchantId,
      type: 'checkout_failed',
      title: `Autonomous Checkout Failed: ${order.orderNumber}`,
      message: `Payment authorization rejected: ${error}. Stock has been automatically restored.`,
      severity: 'critical',
      relatedEntityType: 'order',
      relatedEntityId: order.id,
      actionUrl: `/orders/${order.id}`,
      dedupKey: `chk_fail_${order.id}`,
    });
  }

  /**
   * Inventory conflict alert
   */
  notifyInventoryConflict(merchantId: string, error: string) {
    this.dispatch({
      merchantId,
      type: 'inventory_conflict',
      title: 'Inventory Allocation Conflict',
      message: error,
      severity: 'warning',
      relatedEntityType: 'store',
      actionUrl: '/catalog',
      dedupKey: `inv_conflict_${Date.now().toString().slice(0, 8)}`,
    });
  }

  /**
   * Auto-trigger notifications from simulation reports if critical friction is detected
   */
  notifyOnSimulationResult(merchantId: string, report: SimulationReport) {
    if (report.overallStatus === 'FAILED') {
      const topFriction = report.frictionPoints[0];
      const frictionTitle = topFriction ? topFriction.title : 'Agent checkout aborted';
      const frictionDesc = topFriction ? topFriction.explanation : 'Simulation encountered blocking friction.';

      this.dispatch({
        merchantId,
        type: 'critical_readiness_failure',
        title: `Agent Simulation Failed: ${frictionTitle}`,
        message: `${report.persona.name} aborted simulated purchase. ${frictionDesc}`,
        severity: 'critical',
        relatedEntityType: 'simulation',
        relatedEntityId: report.id,
        actionUrl: `/simulation/${report.id}`,
        dedupKey: `sim_fail_${report.persona.id}_${topFriction?.stage || 'general'}`,
      });
    } else if (report.frictionPoints.length > 0) {
      const topFriction = report.frictionPoints[0];
      this.dispatch({
        merchantId,
        type: 'high_severity_friction',
        title: `Friction Warning: ${topFriction.title}`,
        message: `${topFriction.explanation} (Estimated loss: ₹${report.revenueImpact.estimatedMonthlyRevenueLoss.toLocaleString('en-IN')})`,
        severity: 'warning',
        relatedEntityType: 'simulation',
        relatedEntityId: report.id,
        actionUrl: `/simulation/${report.id}`,
        dedupKey: `sim_fric_${topFriction.id || topFriction.stage}`,
      });
    }
  }

  /**
   * Notify merchant when a payment attempt fails
   */
  notifyOnPaymentFailure(merchantId: string, attempt: PaymentAttempt) {
    if (attempt.status === 'FAILED') {
      this.dispatch({
        merchantId,
        type: 'payment_failure',
        title: 'Autonomous Payment Failed',
        message: `Payment order ${attempt.orderId} failed: ${attempt.errorMessage || 'Unknown issuer rejection'}.`,
        severity: 'critical',
        relatedEntityType: 'payment',
        relatedEntityId: attempt.orderId,
        actionUrl: '/payment_sandbox',
        dedupKey: `pay_fail_${attempt.orderId}`,
      });
    }
  }

  /**
   * Notify merchant when a fix has been successfully applied
   */
  notifyOnFixApplied(merchantId: string, fixTitle: string, fixId: string) {
    this.dispatch({
      merchantId,
      type: 'critical_fix_resolved',
      title: `Fix Deployed: ${fixTitle}`,
      message: `The optimization has been committed to your store profile. Re-run simulations to evaluate readiness gain.`,
      severity: 'success',
      relatedEntityType: 'fix',
      relatedEntityId: fixId,
      actionUrl: '/fixes',
      dedupKey: `fix_applied_${fixId}`,
    });
  }

  /**
   * Notify merchant when a critical revenue leak is detected
   */
  notifyOnRevenueLeakDetected(merchantId: string, leak: RevenueLeakItem) {
    this.dispatch({
      merchantId,
      type: 'revenue_leak_detected',
      title: `Revenue Leak Identified: ${leak.title}`,
      message: `₹${leak.estimatedRevenueAtRisk.toLocaleString('en-IN')}/mo at risk on ${leak.affectedEntity}. Remediation available in Revenue Intelligence.`,
      severity: leak.severity === 'critical' ? 'critical' : 'warning',
      relatedEntityType: 'revenue_leak',
      relatedEntityId: leak.id,
      actionUrl: '/revenue_intelligence',
      dedupKey: `leak_detected_${leak.id}`,
    });
  }

  /**
   * Notify merchant when revenue is successfully recovered via remediation
   */
  notifyOnRevenueRecovered(merchantId: string, recoveredAmount: number, leakTitle: string) {
    this.dispatch({
      merchantId,
      type: 'revenue_recovered',
      title: `Revenue Recovered: +₹${recoveredAmount.toLocaleString('en-IN')}/mo`,
      message: `Remediation completed for "${leakTitle}". AI Buyer transaction bottleneck resolved.`,
      severity: 'success',
      relatedEntityType: 'revenue_leak',
      actionUrl: '/revenue_intelligence',
      dedupKey: `revenue_recov_${Date.now()}`,
    });
  }

  /**
   * Notify merchant when system health degrades
   */
  notifyOnHealthDegraded(merchantId: string, warningCount: number, errorCount: number) {
    if (errorCount > 0) {
      this.dispatch({
        merchantId,
        type: 'system_alert',
        title: 'System Health Alert: Critical Subsystem Error',
        message: `${errorCount} diagnostic health check(s) failed. Check Integration Diagnostics for details.`,
        severity: 'critical',
        actionUrl: '/diagnostics',
        dedupKey: `sys_health_critical_${Date.now().toString().slice(0, 7)}`,
      });
    }
  }
}

export const notificationService = new NotificationService();
