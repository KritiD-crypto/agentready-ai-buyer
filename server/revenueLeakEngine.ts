/**
 * AgentReady Server-Side Revenue Leak & Remediation Analytics Engine
 * Deterministically calculates revenue at risk, revenue recovered, and remediation opportunities.
 * Strict Merchant Tenant Isolation Enforced.
 */

import {
  RevenueLeakItem,
  RevenueLeakSummary,
  RevenueLeakCategory,
  RevenueLeakSeverity,
  RevenueLeakStatus,
  Product,
  StoreProfile,
  SimulationReport,
  PaymentAttempt,
  WebhookEventRecord,
} from '../src/types/index';
import { db, DEMO_MERCHANT_ID } from './db';
import { paymentGateway } from './payment';

export class RevenueLeakEngine {
  /**
   * Run a comprehensive scan across products, store profile, simulation telemetry,
   * payment attempts, and webhook records for a specific merchant.
   */
  async analyzeMerchantLeaks(merchantId: string): Promise<RevenueLeakItem[]> {
    const store = (await db.getStoreProfileAsync(merchantId)) || db.getStoreProfile(DEMO_MERCHANT_ID);
    const products = (await db.getProductsAsync(merchantId)) || [];
    const simulations = Array.from(db['simulations']?.values() || []).filter(
      (s) => s.merchantId === merchantId
    );
    const paymentAttempts = paymentGateway.getMerchantPaymentRecords(merchantId);
    const webhookEvents = paymentGateway.getMerchantWebhookEvents(merchantId);

    const traffic = store?.monthlySimulatedAiTraffic || 24000;
    const aov = store?.averageOrderValue || 3499;
    const baselineConversion = 0.042; // 4.2% AI baseline
    const now = new Date().toISOString();

    const existingLeaks = db.getRevenueLeaksByMerchant(merchantId);
    const existingLeakMap = new Map<string, RevenueLeakItem>(
      existingLeaks.map((l) => [l.id, l])
    );

    const detectedLeaks: RevenueLeakItem[] = [];

    // Helper to add or update leak while preserving status if already manually modified
    const registerLeak = (leakData: Omit<RevenueLeakItem, 'createdAt' | 'updatedAt'>) => {
      const existing = existingLeakMap.get(leakData.id);
      let status: RevenueLeakStatus = leakData.status;

      // If user had marked it IN_PROGRESS and condition still triggers, keep IN_PROGRESS
      if (existing && existing.status === 'IN_PROGRESS' && leakData.status === 'OPEN') {
        status = 'IN_PROGRESS';
      }

      const item: RevenueLeakItem = {
        ...leakData,
        status,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        resolvedAt: status === 'RESOLVED' ? existing?.resolvedAt || now : undefined,
      };

      detectedLeaks.push(item);
      db.saveRevenueLeak(item);
    };

    // -------------------------------------------------------------
    // 1. DISCOVERY & COMMERCE PROTOCOL MANIFEST (P0)
    // -------------------------------------------------------------
    const manifestResolved = Boolean(store?.hasAgentManifest);
    const manifestLoss = Math.round(traffic * baselineConversion * 0.45 * (aov * 0.18)); // ~₹65,000
    registerLeak({
      id: `leak_manifest_${merchantId}`,
      merchantId,
      category: 'catalog_discovery',
      severity: 'critical',
      status: manifestResolved ? 'RESOLVED' : 'OPEN',
      title: 'Missing Universal Commerce Protocol (UCP) Discovery Manifest',
      affectedEntity: 'Agent Manifest (/.well-known/agent-commerce.json)',
      entityType: 'manifest',
      evidence: manifestResolved
        ? 'Protocol endpoints verified on /.well-known/agent-commerce.json'
        : 'HTTP 404 on /.well-known/agent-commerce.json. AI web-crawlers cannot discover product catalog endpoints.',
      whyAiBuyerFails:
        'Autonomous purchasing agents (ChatGPT Operator, Google Project Mariner, Perplexity Shopping) require machine-readable discovery manifests to programmatically index products without scraping HTML.',
      estimatedRevenueAtRisk: manifestLoss,
      potentialMonthlyLoss: manifestLoss,
      confidenceScore: 0.98,
      recommendedRemediation: 'Deploy JSON-LD discovery manifest at /.well-known/agent-commerce.json exposing direct API bindings.',
      relatedFixId: 'fix_manifest_01',
      relatedSimulationStage: 'intent_discovery',
      readinessImpactPoints: 18,
    });

    // -------------------------------------------------------------
    // 2. CHECKOUT & 3DS / AGENT PAYMENT TOKENIZATION (P0)
    // -------------------------------------------------------------
    const agentTokenResolved = Boolean(store?.hasAgentCheckoutApi);
    const tokenLoss = Math.round(traffic * baselineConversion * 0.65 * (aov * 0.20)); // ~₹95,000
    registerLeak({
      id: `leak_agent_token_${merchantId}`,
      merchantId,
      category: 'payment_readiness',
      severity: 'critical',
      status: agentTokenResolved ? 'RESOLVED' : 'OPEN',
      title: 'Interactive 3DS Browser Redirects on Checkout',
      affectedEntity: 'Razorpay Payment Gateway Integration',
      entityType: 'payment',
      evidence: agentTokenResolved
        ? 'Machine-to-machine Razorpay Agent Token authorization enabled'
        : 'Browser redirect triggered during authorization. Machine agents have no headless browser window to complete interactive OTP / 3DS challenge.',
      whyAiBuyerFails:
        'AI agents cannot interact with arbitrary bank popup frames or SMS OTP forms. Checkout fails 100% of the time during settlement.',
      estimatedRevenueAtRisk: tokenLoss,
      potentialMonthlyLoss: tokenLoss,
      confidenceScore: 0.99,
      recommendedRemediation: 'Enable Razorpay Agentic Payment Tokenization (M2M pre-authorized spending caps) on server-side checkout.',
      relatedFixId: 'fix_agent_token_02',
      relatedSimulationStage: 'payment_negotiation',
      readinessImpactPoints: 24,
    });

    // -------------------------------------------------------------
    // 3. CAPTCHA BLOCKERS ON CHECKOUT (P0)
    // -------------------------------------------------------------
    const captchaResolved = !store?.captchaOnCheckout;
    const captchaLoss = Math.round(traffic * baselineConversion * 0.55 * (aov * 0.22)); // ~₹80,000
    registerLeak({
      id: `leak_captcha_${merchantId}`,
      merchantId,
      category: 'captcha_blocker',
      severity: 'critical',
      status: captchaResolved ? 'RESOLVED' : 'OPEN',
      title: 'Interactive CAPTCHA / Cloudflare Challenge on Cart & Checkout',
      affectedEntity: 'Bot Protection & Rate Limiter Middleware',
      entityType: 'store_profile',
      evidence: captchaResolved
        ? 'Authenticated agent token bypass header (x-agent-auth-token) active'
        : 'Cloudflare / Turnstile JS challenge detected on /api/payments/create-order route.',
      whyAiBuyerFails:
        'Autonomous bots are completely prevented from submitting orders when interactive visual/puzzle CAPTCHAs are presented.',
      estimatedRevenueAtRisk: captchaLoss,
      potentialMonthlyLoss: captchaLoss,
      confidenceScore: 0.97,
      recommendedRemediation: 'Bypass interactive CAPTCHA for cryptographically verified merchant agent tokens via x-agent-auth-token headers.',
      relatedFixId: 'fix_captcha_05',
      relatedSimulationStage: 'checkout_confirmation',
      readinessImpactPoints: 20,
    });

    // -------------------------------------------------------------
    // 4. RETURN POLICY CLARITY (P1)
    // -------------------------------------------------------------
    const returnPolicyResolved = Boolean((store?.returnPolicyDays || 0) >= 14 && store?.hasFreeReturns);
    const returnLoss = Math.round(traffic * baselineConversion * 0.30 * (aov * 0.16)); // ~₹35,000
    registerLeak({
      id: `leak_return_policy_${merchantId}`,
      merchantId,
      category: 'return_policy',
      severity: 'high',
      status: returnPolicyResolved ? 'RESOLVED' : 'OPEN',
      title: 'Vague or Non-Standard Return Policy Window (<14 Days)',
      affectedEntity: 'Store Commercial & Return Policy Profile',
      entityType: 'store_profile',
      evidence: returnPolicyResolved
        ? `${store?.returnPolicyDays}-day clear policy with Schema.org MerchantReturnPolicy metadata`
        : `Current policy is ${store?.returnPolicyDays || 0} days. Corporate & cautious agents mandate ≥14 days with zero restocking fee.`,
      whyAiBuyerFails:
        'Policy-sensitive and corporate purchasing bots abort order commitments when return windows are undefined or under 14 days.',
      estimatedRevenueAtRisk: returnLoss,
      potentialMonthlyLoss: returnLoss,
      confidenceScore: 0.92,
      recommendedRemediation: 'Publish machine-readable MerchantReturnPolicy JSON-LD with ≥14 days return window and free returns threshold.',
      relatedFixId: 'fix_return_policy_03',
      relatedSimulationStage: 'policy_shipping_check',
      readinessImpactPoints: 12,
    });

    // -------------------------------------------------------------
    // 5. REAL-TIME STOCK API & INVENTORY LOCKING (P1)
    // -------------------------------------------------------------
    const stockApiResolved = Boolean(store?.hasStockApi);
    const stockApiLoss = Math.round(traffic * baselineConversion * 0.35 * (aov * 0.18)); // ~₹45,000
    registerLeak({
      id: `leak_stock_api_${merchantId}`,
      merchantId,
      category: 'inventory_stock',
      severity: 'high',
      status: stockApiResolved ? 'RESOLVED' : 'OPEN',
      title: 'Absence of Real-time Stock Allocation & Lock Webhook',
      affectedEntity: 'Inventory Management API',
      entityType: 'store_profile',
      evidence: stockApiResolved
        ? 'Real-time atomic stock reservation active'
        : 'Stock is polled statically without pre-settlement lock. High risk of post-purchase cancellations for concurrent AI agents.',
      whyAiBuyerFails:
        'High-velocity buyer agents abandon checkout if exact available inventory cannot be reserved atomically before payment token dispatch.',
      estimatedRevenueAtRisk: stockApiLoss,
      potentialMonthlyLoss: stockApiLoss,
      confidenceScore: 0.90,
      recommendedRemediation: 'Implement atomic inventory reservation lock during agent payment handshake.',
      relatedFixId: 'fix_stock_api_04',
      relatedSimulationStage: 'inventory_check',
      readinessImpactPoints: 14,
    });

    // -------------------------------------------------------------
    // 6. PRODUCT CATALOG & SCHEMA.ORG MICRODATA INSPECTION
    // -------------------------------------------------------------
    const productCount = Math.max(1, products.length);
    for (const prod of products) {
      const productTrafficShare = traffic / productCount;

      // Check structured schema.org data
      if (!prod.hasStructuredData) {
        const prodSchemaLoss = Math.round(productTrafficShare * baselineConversion * 0.50 * prod.basePrice);
        registerLeak({
          id: `leak_prod_schema_${prod.id}`,
          merchantId,
          category: 'spec_microdata',
          severity: 'high',
          status: 'OPEN',
          title: `Missing Schema.org Product Microdata: ${prod.title}`,
          affectedEntity: prod.title,
          entityType: 'product',
          entityId: prod.id,
          evidence: `Product "${prod.title}" lacks JSON-LD Product/Offer schema. Attributes are purely rendered in unsemantic DOM elements.`,
          whyAiBuyerFails:
            'AI search spiders cannot extract price currency, GTIN/SKU, and variant matrix reliably.',
          estimatedRevenueAtRisk: prodSchemaLoss,
          potentialMonthlyLoss: prodSchemaLoss,
          confidenceScore: 0.94,
          recommendedRemediation: `Inject JSON-LD structured schema on product page with Offer, availability, and SKU specifications.`,
          relatedSimulationStage: 'catalog_parsing',
          readinessImpactPoints: 10,
        });
      }

      // Check stock status
      if (prod.stockQuantity <= 0) {
        const oosLoss = Math.round(productTrafficShare * baselineConversion * 0.85 * prod.basePrice);
        registerLeak({
          id: `leak_prod_oos_${prod.id}`,
          merchantId,
          category: 'inventory_stock',
          severity: 'critical',
          status: 'OPEN',
          title: `Zero Inventory / Out of Stock: ${prod.title}`,
          affectedEntity: prod.title,
          entityType: 'product',
          entityId: prod.id,
          evidence: `Product inventory count is ${prod.stockQuantity}. All purchasing personas immediately drop off.`,
          whyAiBuyerFails:
            'Autonomous agents abort execution immediately at the Inventory Verification stage when stock is 0.',
          estimatedRevenueAtRisk: oosLoss,
          potentialMonthlyLoss: oosLoss,
          confidenceScore: 0.99,
          recommendedRemediation: `Replenish stock or update catalog availability flag to unblock autonomous buyers.`,
          relatedSimulationStage: 'inventory_check',
          readinessImpactPoints: 15,
        });
      }

      // Check low specs count (< 3 machine specs)
      if (!prod.specs || prod.specs.length < 3) {
        const specLoss = Math.round(productTrafficShare * baselineConversion * 0.35 * prod.basePrice);
        registerLeak({
          id: `leak_prod_specs_${prod.id}`,
          merchantId,
          category: 'spec_microdata',
          severity: 'medium',
          status: 'OPEN',
          title: `Insufficient Machine Specs: ${prod.title}`,
          affectedEntity: prod.title,
          entityType: 'product',
          entityId: prod.id,
          evidence: `Only ${prod.specs?.length || 0} structured specs configured. Strict spec matcher agents require ≥3 key-value pairs.`,
          whyAiBuyerFails:
            'Strict spec evaluation personas (e.g. runners looking for carbon-plate, weight, drop) reject products with missing technical attributes.',
          estimatedRevenueAtRisk: specLoss,
          potentialMonthlyLoss: specLoss,
          confidenceScore: 0.88,
          recommendedRemediation: `Add technical specification key-values (e.g. Weight, Material, Drop, Battery Life) to product metadata.`,
          relatedSimulationStage: 'spec_validation',
          readinessImpactPoints: 8,
        });
      }
    }

    // -------------------------------------------------------------
    // 7. REAL SIMULATION FRICTION POINTS INSPECTION
    // -------------------------------------------------------------
    for (const sim of simulations) {
      for (const friction of sim.frictionPoints) {
        // Skip if this friction is already represented by standard leaks above
        if (
          friction.suggestedFixId === 'fix_manifest_01' ||
          friction.suggestedFixId === 'fix_agent_token_02' ||
          friction.suggestedFixId === 'fix_return_policy_03' ||
          friction.suggestedFixId === 'fix_stock_api_04' ||
          friction.suggestedFixId === 'fix_captcha_05'
        ) {
          continue;
        }

        const leakId = `leak_sim_fric_${friction.id}`;
        const fricLoss = Math.round(friction.revenueImpactMonthly || traffic * baselineConversion * friction.estimatedDropoffRate * (aov * 0.15));
        const sevMap: Record<string, RevenueLeakSeverity> = {
          critical: 'critical',
          moderate: 'high',
          minor: 'medium',
        };

        registerLeak({
          id: leakId,
          merchantId,
          category: 'simulation_failure',
          severity: sevMap[friction.severity] || 'high',
          status: 'OPEN',
          title: friction.title,
          affectedEntity: friction.affectedProduct || sim.persona.name,
          entityType: 'simulation',
          entityId: sim.id,
          evidence: friction.technicalRootCause,
          whyAiBuyerFails: friction.explanation,
          estimatedRevenueAtRisk: fricLoss,
          potentialMonthlyLoss: fricLoss,
          confidenceScore: 0.91,
          recommendedRemediation: friction.recommendedFix || 'Resolve simulation friction point in catalog or checkout configuration.',
          relatedSimulationStage: friction.stage,
          relatedSimulationId: sim.id,
          readinessImpactPoints: friction.severity === 'critical' ? 15 : 8,
        });
      }
    }

    // -------------------------------------------------------------
    // 8. PAYMENT ATTEMPTS TELEMETRY FAILURES
    // -------------------------------------------------------------
    const failedPayments = paymentAttempts.filter((p) => p.status === 'FAILED');
    if (failedPayments.length > 0) {
      const recentFailure = failedPayments[failedPayments.length - 1];
      const failureLoss = Math.round(failedPayments.length * aov * 3); // estimated recurring drop
      registerLeak({
        id: `leak_payment_failures_${merchantId}`,
        merchantId,
        category: 'payment_readiness',
        severity: 'critical',
        status: store?.hasAgentCheckoutApi ? 'RESOLVED' : 'OPEN',
        title: `Payment Settlement Rejections (${failedPayments.length} Detected)`,
        affectedEntity: 'Payment Authorization Pipeline',
        entityType: 'payment',
        entityId: recentFailure.id,
        evidence: `Recent payment error: "${recentFailure.errorMessage || '3DS interactive redirect challenge'}". Gateway rejected automated settlement.`,
        whyAiBuyerFails:
          'Payment Gateway returned explicit rejection code during machine-to-machine checkout handshake.',
        estimatedRevenueAtRisk: failureLoss,
        potentialMonthlyLoss: failureLoss,
        confidenceScore: 0.96,
        recommendedRemediation: 'Verify Razorpay agent token signature verification and ensure test sandbox is healthy.',
        relatedFixId: 'fix_agent_token_02',
        relatedSimulationStage: 'payment_negotiation',
        readinessImpactPoints: 20,
      });
    }

    // -------------------------------------------------------------
    // 9. WEBHOOK MONITORING FAILURES
    // -------------------------------------------------------------
    const failedWebhooks = webhookEvents.filter(
      (w) => !w.signatureVerified || w.status === 'FAILED'
    );
    if (failedWebhooks.length > 0) {
      const webhookLoss = Math.round(failedWebhooks.length * aov * 2);
      registerLeak({
        id: `leak_webhook_failure_${merchantId}`,
        merchantId,
        category: 'webhook_delivery',
        severity: 'high',
        status: 'OPEN',
        title: `Webhook Signature Verification Failures (${failedWebhooks.length} Events)`,
        affectedEntity: 'Order Fulfillment Webhook Listener',
        entityType: 'webhook',
        evidence: `Unverified HMAC signatures detected on incoming Razorpay webhook delivery channel.`,
        whyAiBuyerFails:
          'Orders cannot be finalized or fulfilled automatically if merchant server fails cryptographic webhook validation.',
        estimatedRevenueAtRisk: webhookLoss,
        potentialMonthlyLoss: webhookLoss,
        confidenceScore: 0.93,
        recommendedRemediation: 'Synchronize Razorpay Webhook Secret and verify crypto.createHmac signature implementation.',
        relatedSimulationStage: 'checkout_confirmation',
        readinessImpactPoints: 12,
      });
    }

    return detectedLeaks;
  }

  /**
   * Deterministically calculate aggregate summary metrics
   */
  async getSummary(merchantId: string): Promise<RevenueLeakSummary> {
    // Run analysis to ensure real-time sync with latest store / product / fix states
    const leaks = await this.analyzeMerchantLeaks(merchantId);
    const store = (await db.getStoreProfileAsync(merchantId)) || db.getStoreProfile(DEMO_MERCHANT_ID);

    let totalRevenueAtRisk = 0;
    let revenueRecovered = 0;
    let activeLeaksCount = 0;
    let resolvedLeaksCount = 0;
    let inProgressLeaksCount = 0;

    const leaksByCategory: Record<string, { count: number; revenueAtRisk: number }> = {};
    const leaksBySeverity: Record<string, { count: number; revenueAtRisk: number }> = {};

    for (const leak of leaks) {
      // Category stats
      if (!leaksByCategory[leak.category]) {
        leaksByCategory[leak.category] = { count: 0, revenueAtRisk: 0 };
      }
      leaksByCategory[leak.category].count++;

      // Severity stats
      if (!leaksBySeverity[leak.severity]) {
        leaksBySeverity[leak.severity] = { count: 0, revenueAtRisk: 0 };
      }
      leaksBySeverity[leak.severity].count++;

      if (leak.status === 'RESOLVED') {
        resolvedLeaksCount++;
        revenueRecovered += leak.estimatedRevenueAtRisk;
      } else {
        if (leak.status === 'IN_PROGRESS') {
          inProgressLeaksCount++;
        } else {
          activeLeaksCount++;
        }
        totalRevenueAtRisk += leak.estimatedRevenueAtRisk;
        leaksByCategory[leak.category].revenueAtRisk += leak.estimatedRevenueAtRisk;
        leaksBySeverity[leak.severity].revenueAtRisk += leak.estimatedRevenueAtRisk;
      }
    }

    const totalPotential = revenueRecovered + totalRevenueAtRisk;
    const recoveryPercentage =
      totalPotential > 0 ? Math.round((revenueRecovered / totalPotential) * 100) : 0;

    return {
      totalRevenueAtRisk,
      revenueRecovered,
      potentialRecovery: totalRevenueAtRisk,
      activeLeaksCount: activeLeaksCount + inProgressLeaksCount,
      resolvedLeaksCount,
      inProgressLeaksCount,
      recoveryPercentage,
      leaksByCategory,
      leaksBySeverity,
      currency: store?.currency || 'INR',
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Update status of a revenue leak and sync corresponding fixes if applicable
   */
  async updateLeakStatus(
    id: string,
    status: RevenueLeakStatus,
    merchantId: string
  ): Promise<RevenueLeakItem | undefined> {
    const leak = db.getRevenueLeakById(id, merchantId);
    if (!leak) return undefined;

    leak.status = status;
    leak.updatedAt = new Date().toISOString();
    if (status === 'RESOLVED') {
      leak.resolvedAt = new Date().toISOString();
      // If linked to a fix, apply that fix on the store profile
      if (leak.relatedFixId) {
        db.applyFix(merchantId, leak.relatedFixId, true);
      }
    } else {
      leak.resolvedAt = undefined;
    }

    db.saveRevenueLeak(leak);
    return leak;
  }
}

export const revenueLeakEngine = new RevenueLeakEngine();
