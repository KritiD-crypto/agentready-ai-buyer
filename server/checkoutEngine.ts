/**
 * AgentReady Autonomous Order & Checkout Engine
 * Manages the full lifecycle of AI buyer orders, inventory reservation,
 * Razorpay agent payment execution, idempotency, timeline tracking, and notifications.
 */

import {
  Order,
  OrderStatus,
  PaymentStatus,
  OrderSource,
  OrderItem,
  OrderPricing,
  OrderTimelineEvent,
  CreateOrderInput,
  CheckoutExecutionInput,
  CheckoutExecutionResult,
  SimulationReport,
  MerchantNotification,
} from '../src/types/index';
import { db, DEMO_MERCHANT_ID } from './db';
import { paymentService } from './payment';
import { notificationService } from './notifications';

export class CheckoutEngineService {
  /**
   * Create an Autonomous Order from an AI agent or test suite
   */
  async createOrder(input: CreateOrderInput, merchantId: string = DEMO_MERCHANT_ID): Promise<Order> {
    const store = (await db.getStoreProfileAsync(merchantId)) || db.getStoreProfile(merchantId);
    const currency = store?.currency || 'INR';

    // 1. Validate items & build OrderItems
    if (!input.items || input.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const itemInput of input.items) {
      const product = db.getProduct(itemInput.productId);
      if (!product) {
        throw new Error(`Product not found with ID: ${itemInput.productId}`);
      }

      let unitPrice = product.basePrice;
      let variantTitle: string | undefined = undefined;
      const attributes: Record<string, string> = {};

      if (itemInput.variantId && product.variants) {
        const variant = product.variants.find((v) => v.id === itemInput.variantId);
        if (variant) {
          unitPrice = variant.price;
          variantTitle = variant.title;
          if (variant.attributes) {
            Object.assign(attributes, variant.attributes);
          }
        }
      }

      const itemSubtotal = unitPrice * itemInput.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product.id,
        variantId: itemInput.variantId,
        title: variantTitle ? `${product.title} (${variantTitle})` : product.title,
        sku: product.sku || `SKU-${product.id}`,
        quantity: itemInput.quantity,
        unitPrice,
        subtotal: itemSubtotal,
        imageUrl: product.imageUrl,
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      });
    }

    // 2. Atomic Inventory Safety: Reserve stock
    const reserveResult = db.reserveInventory(merchantId, input.items);
    if (!reserveResult.success) {
      // Emit conflict notification
      notificationService.notifyInventoryConflict(
        merchantId,
        reserveResult.error || 'Inventory allocation failed during autonomous order creation.'
      );
      throw new Error(reserveResult.error || 'Failed to reserve inventory for order');
    }

    // 3. Compute Pricing (Taxes, Shipping, Discounts)
    const freeShippingThreshold = store?.freeShippingThreshold ?? 999;
    const shippingCost = subtotal >= freeShippingThreshold ? 0 : (store?.expressShippingCost || 149);
    const discount = 0; // standard zero unless promo rule applies
    const taxRate = 0.18; // standard GST inclusive rate
    const tax = Math.round(subtotal * (taxRate / (1 + taxRate))); // 18% inclusive GST
    const totalAmount = subtotal + shippingCost - discount;

    const pricing: OrderPricing = {
      subtotal,
      tax,
      taxRate,
      isTaxInclusive: true,
      shippingCost,
      discount,
      totalAmount,
      currency,
    };

    // 4. Resolve Customer Profile
    let personaName = 'Autonomous AI Buyer';
    if (input.personaId) {
      const persona = db.getPersona(input.personaId);
      if (persona) {
        personaName = persona.name;
      }
    }

    const customer = {
      name: input.customer?.name || personaName,
      email: input.customer?.email || `ai.buyer.${Date.now()}@agentready.internal`,
      phone: input.customer?.phone || '+91 98765 00000',
      shippingAddress: input.customer?.shippingAddress || {
        line1: 'Autonomous Logistics Hub, Cyber City',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'IN',
      },
    };

    // 5. Generate Order Identity & Timelines
    const orderId = `ord_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-2026-${randomSuffix}`;
    const nowIso = new Date().toISOString();

    const initialTimeline: OrderTimelineEvent[] = [
      {
        id: `tl_${Date.now()}_1`,
        orderId,
        type: 'ORDER_CREATED',
        title: 'Order Created by AI Agent',
        description: `Draft order generated with ${orderItems.length} item(s) totaling ${currency} ${totalAmount.toLocaleString('en-IN')}.`,
        status: 'SUCCESS',
        timestamp: nowIso,
      },
      {
        id: `tl_${Date.now()}_2`,
        orderId,
        type: 'INVENTORY_VALIDATED',
        title: 'Real-time Stock Locked',
        description: `Successfully allocated inventory across ${orderItems.length} catalog item(s).`,
        status: 'SUCCESS',
        timestamp: new Date(Date.now() + 100).toISOString(),
      },
    ];

    const order: Order = {
      id: orderId,
      merchantId,
      orderNumber,
      customer,
      items: orderItems,
      pricing,
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      source: input.source || 'simulation',
      aiMetadata: {
        personaId: input.personaId,
        simulationId: input.simulationId,
        agentProtocol: 'UCP-1.0',
        autonomyLevel: 'L4_FULLY_AUTONOMOUS',
        idempotencyKey: input.idempotencyKey || `idemp_${orderId}`,
        clientUserAgent: 'AgentReady-Autonomous-Buyer/1.0',
      },
      idempotencyKey: input.idempotencyKey || `idemp_${orderId}`,
      notes: input.notes,
      timeline: initialTimeline,
      createdAt: nowIso,
      updatedAt: nowIso,
      isSimulated: input.source === 'simulation' || input.source === 'sandbox_test',
      isTestMode: true,
    };

    const savedOrder = db.saveOrder(order);

    // Notify Merchant
    notificationService.notifyOrderCreated(savedOrder);

    return savedOrder;
  }

  /**
   * Execute Autonomous Checkout & Settle Payment with Razorpay Agent Token
   */
  async executeCheckout(input: CheckoutExecutionInput, merchantId: string = DEMO_MERCHANT_ID): Promise<CheckoutExecutionResult> {
    const order = (await db.getOrderAsync(input.orderId, merchantId)) || db.getOrder(input.orderId, merchantId);

    if (!order) {
      return {
        success: false,
        order: null as any,
        timelineEvent: {
          id: `tl_${Date.now()}`,
          orderId: input.orderId,
          type: 'PAYMENT_FAILED',
          title: 'Order Not Found',
          description: 'Cannot checkout non-existent order.',
          status: 'FAILED',
          timestamp: new Date().toISOString(),
        },
        error: `Order with ID "${input.orderId}" not found.`,
        errorCode: 'ORDER_NOT_FOUND',
      };
    }

    if (order.status === 'PAID') {
      return {
        success: true,
        order,
        timelineEvent: {
          id: `tl_${Date.now()}`,
          orderId: order.id,
          type: 'ORDER_CONFIRMED',
          title: 'Order Already Settled',
          description: 'This order was previously settled and confirmed.',
          status: 'INFO',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Add CHECKOUT_STARTED timeline
    db.addOrderTimelineEvent(order.id, {
      orderId: order.id,
      type: 'CHECKOUT_STARTED',
      title: 'Zero-Iframe Agent Checkout Initiated',
      description: `Initiating ${input.paymentMethod || 'razorpay_agent_token'} for ${order.pricing.currency} ${order.pricing.totalAmount.toLocaleString('en-IN')}.`,
      status: 'INFO',
    }, merchantId);

    // Process Payment via Payment Service
    const paymentAttempt = await paymentService.processPayment({
      orderId: order.id,
      merchantId,
      method: input.paymentMethod || 'razorpay_agent_token',
      amount: order.pricing.totalAmount,
      currency: order.pricing.currency,
      idempotencyKey: input.idempotencyKey || order.idempotencyKey || `idemp_chk_${order.id}`,
      simulateFailure: !!input.simulatePaymentFailure,
      failureReason: input.failureReason,
      agentSignature: input.agentSignature,
    });

    if (paymentAttempt.status === 'SUCCESS') {
      // Transition Order to PAID
      const updatedOrder = db.updateOrderStatus(
        order.id,
        'PAID',
        'PAID',
        {
          razorpayPaymentId: paymentAttempt.paymentId,
          timelineTitle: 'Payment Authorized & Settled',
          timelineDescription: `Autonomous Razorpay settlement completed. Payment ID: ${paymentAttempt.paymentId}`,
        },
        merchantId
      )!;

      // Add INVENTORY_UPDATED event
      db.addOrderTimelineEvent(updatedOrder.id, {
        orderId: updatedOrder.id,
        type: 'INVENTORY_UPDATED',
        title: 'Inventory Decremented',
        description: 'Catalog inventory locked and updated for fulfilled order.',
        status: 'SUCCESS',
      }, merchantId);

      // Trigger Merchant Notification
      notificationService.notifyOrderPaid(updatedOrder);

      return {
        success: true,
        order: updatedOrder,
        paymentAttempt,
        timelineEvent: {
          id: `tl_${Date.now()}`,
          orderId: updatedOrder.id,
          type: 'PAYMENT_AUTHORIZED',
          title: 'Payment Successful',
          description: `Authorized with payment reference ${paymentAttempt.paymentId}.`,
          status: 'SUCCESS',
          timestamp: new Date().toISOString(),
        },
      };
    } else {
      // Payment Failed -> Restore Inventory
      db.restoreInventory(
        merchantId,
        order.items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity }))
      );

      const failedOrder = db.updateOrderStatus(
        order.id,
        'FAILED',
        'FAILED',
        {
          cancellationReason: paymentAttempt.errorMessage || 'Payment authorization rejected by gateway.',
          timelineTitle: 'Payment Authorization Failed',
          timelineDescription: paymentAttempt.errorMessage || 'Payment failed during gateway processing. Reserved stock returned to catalog.',
        },
        merchantId
      )!;

      // Trigger Failure Notification
      notificationService.notifyCheckoutFailed(
        failedOrder,
        paymentAttempt.errorMessage || 'Autonomous token settlement failed'
      );

      return {
        success: false,
        order: failedOrder,
        paymentAttempt,
        timelineEvent: {
          id: `tl_${Date.now()}`,
          orderId: failedOrder.id,
          type: 'PAYMENT_FAILED',
          title: 'Payment Failed',
          description: paymentAttempt.errorMessage || 'Payment authorization rejected.',
          status: 'FAILED',
          timestamp: new Date().toISOString(),
        },
        error: paymentAttempt.errorMessage,
        errorCode: 'PAYMENT_FAILED',
      };
    }
  }

  /**
   * Cancel an order and safely return inventory to catalog
   */
  async cancelOrder(orderId: string, reason: string = 'Merchant requested cancellation', merchantId: string = DEMO_MERCHANT_ID): Promise<Order> {
    const order = (await db.getOrderAsync(orderId, merchantId)) || db.getOrder(orderId, merchantId);
    if (!order) {
      throw new Error(`Order with ID "${orderId}" not found.`);
    }

    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      return order;
    }

    // Safely return reserved stock to catalog
    db.restoreInventory(
      merchantId,
      order.items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity }))
    );

    // Update status to CANCELLED and REFUNDED if paid
    const updatedOrder = db.updateOrderStatus(
      order.id,
      'CANCELLED',
      order.paymentStatus === 'PAID' ? 'REFUNDED' : 'UNPAID',
      {
        cancellationReason: reason,
        timelineTitle: 'Order Cancelled',
        timelineDescription: reason,
      },
      merchantId
    )!;

    if (order.paymentStatus === 'PAID') {
      db.addOrderTimelineEvent(updatedOrder.id, {
        orderId: updatedOrder.id,
        type: 'REFUND_INITIATED',
        title: 'Automated Refund Processed',
        description: `Refund credited to agent balance for order amount ${order.pricing.currency} ${order.pricing.totalAmount.toLocaleString('en-IN')}.`,
        status: 'INFO',
      }, merchantId);
    }

    // Trigger Notification
    notificationService.notifyOrderCancelled(updatedOrder, reason);

    return updatedOrder;
  }

  /**
   * Create an autonomous test order from a successful AI Buyer Simulation run
   */
  async createOrderFromSimulation(simulationReport: SimulationReport, merchantId: string = DEMO_MERCHANT_ID): Promise<Order | null> {
    if (simulationReport.overallStatus !== 'SUCCESS') {
      return null;
    }

    const productId = simulationReport.evaluatedProducts?.[0]?.id || (db.getProducts(merchantId)[0]?.id);
    const personaId = simulationReport.persona?.id || 'persona_spec_inspector';

    if (!productId) return null;

    try {
      const order = await this.createOrder(
        {
          items: [{ productId, quantity: 1 }],
          personaId,
          simulationId: simulationReport.id,
          source: 'simulation',
          idempotencyKey: `idemp_sim_${simulationReport.id}`,
          notes: `Auto-generated from successful simulation #${simulationReport.id.substring(0, 8)} (${simulationReport.persona?.name || 'AI Buyer'})`,
        },
        merchantId
      );

      // Settle checkout automatically for successful simulation
      const result = await this.executeCheckout(
        {
          orderId: order.id,
          paymentMethod: 'razorpay_agent_token',
          idempotencyKey: `idemp_sim_chk_${order.id}`,
        },
        merchantId
      );

      return result.order;
    } catch (err) {
      console.warn('[CheckoutEngine] Auto-order creation from simulation skipped:', err);
      return null;
    }
  }
}

export const checkoutEngine = new CheckoutEngineService();
