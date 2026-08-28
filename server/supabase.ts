/**
 * AgentReady Supabase Integration Service
 * 
 * Secure Server-Side Architecture:
 * - Keeps SUPABASE_SERVICE_ROLE_KEY strictly server-side.
 * - Uses lazy initialization so startup never crashes when credentials are not yet configured.
 * - Performs runtime environment-variable validation before executing remote queries.
 * - Seamlessly integrates with the server database engine.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Merchant,
  StoreProfile,
  Product,
  SimulationReport,
  SimulationHistoryItem,
  PaymentAttempt,
  MerchantNotification,
  WebhookEventRecord,
  RevenueLeakItem,
  Order,
  OrderTimelineEvent,
} from '../src/types/index';

let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  mode: 'connected' | 'unconfigured';
}

/**
 * Validate Supabase environment variables at runtime
 */
export function getSupabaseStatus(): SupabaseConfigStatus {
  const url = process.env.SUPABASE_URL?.trim();
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const hasUrl = Boolean(url && url.startsWith('http'));
  const hasAnonKey = Boolean(anonKey && anonKey.length > 10);
  const hasServiceRoleKey = Boolean(serviceRoleKey && serviceRoleKey.length > 10);

  const isConfigured = hasUrl && (hasAnonKey || hasServiceRoleKey);

  return {
    isConfigured,
    hasUrl,
    hasAnonKey,
    hasServiceRoleKey,
    mode: isConfigured ? 'connected' : 'unconfigured',
  };
}

/**
 * Get standard Supabase client with lazy initialization and runtime validation
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const { isConfigured, hasUrl, hasAnonKey } = getSupabaseStatus();
  if (!isConfigured || !hasUrl || !hasAnonKey) {
    return null;
  }

  try {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_ANON_KEY!;
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return supabaseClient;
  } catch (error) {
    console.error('[Supabase] Failed to initialize standard client:', error);
    return null;
  }
}

/**
 * Get Supabase Service-Role Admin client (Strictly Server-Side Only)
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (supabaseAdminClient) return supabaseAdminClient;

  const { isConfigured, hasUrl, hasServiceRoleKey } = getSupabaseStatus();
  if (!isConfigured || !hasUrl || !hasServiceRoleKey) {
    return null;
  }

  try {
    const url = process.env.SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    supabaseAdminClient = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return supabaseAdminClient;
  } catch (error) {
    console.error('[Supabase] Failed to initialize service role admin client:', error);
    return null;
  }
}

/**
 * High-Level Relational Database Layer for Supabase
 */
export const supabaseDb = {
  // Merchant Operations
  async saveMerchant(merchant: Merchant): Promise<boolean> {
    const client = getSupabaseAdminClient();
    if (!client) return false;
    try {
      const { error } = await client.from('merchants').upsert({
        id: merchant.id,
        email: merchant.email,
        name: merchant.name,
        company_name: merchant.companyName,
        phone: merchant.phone || null,
        website: merchant.website || null,
        business_description: merchant.businessDescription || null,
        is_onboarded: merchant.isOnboarded ?? false,
        created_at: merchant.createdAt,
        is_demo: merchant.isDemo,
      });
      if (error) console.warn('[Supabase] saveMerchant warning:', error.message);
      return !error;
    } catch (e) {
      console.warn('[Supabase] saveMerchant error:', e);
      return false;
    }
  },

  async getMerchant(id: string): Promise<Merchant | null> {
    const client = getSupabaseAdminClient();
    if (!client) return null;
    try {
      const { data, error } = await client.from('merchants').select('*').eq('id', id).single();
      if (error || !data) return null;
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        companyName: data.company_name,
        phone: data.phone || undefined,
        website: data.website || undefined,
        businessDescription: data.business_description || undefined,
        isOnboarded: data.is_onboarded ?? false,
        createdAt: data.created_at,
        isDemo: data.is_demo,
      };
    } catch {
      return null;
    }
  },

  async getMerchantByEmail(email: string): Promise<Merchant | null> {
    const client = getSupabaseAdminClient();
    if (!client) return null;
    try {
      const { data, error } = await client.from('merchants').select('*').eq('email', email.toLowerCase()).single();
      if (error || !data) return null;
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        companyName: data.company_name,
        phone: data.phone || undefined,
        website: data.website || undefined,
        businessDescription: data.business_description || undefined,
        isOnboarded: data.is_onboarded ?? false,
        createdAt: data.created_at,
        isDemo: data.is_demo,
      };
    } catch {
      return null;
    }
  },

  // Store Profile Operations
  async saveStoreProfile(store: StoreProfile): Promise<boolean> {
    const client = getSupabaseAdminClient();
    if (!client) return false;
    try {
      const { error } = await client.from('store_profiles').upsert({
        id: store.id,
        merchant_id: store.merchantId,
        name: store.name,
        slug: store.slug,
        tagline: store.tagline,
        website_url: store.websiteUrl,
        currency: store.currency,
        country: store.country,
        description: store.description,
        return_policy_days: store.returnPolicyDays,
        return_policy_description: store.returnPolicyDescription,
        free_shipping_threshold: store.freeShippingThreshold,
        shipping_rules: store.shippingRules,
        supported_payment_methods: store.supportedPaymentMethods,
        schema_org_enabled: store.schemaOrgEnabled,
        has_agent_manifest: store.hasAgentManifest,
        has_agent_checkout_api: store.hasAgentCheckoutApi,
        has_stock_api: store.hasStockApi,
        has_price_parity_guarantee: store.hasPriceParityGuarantee,
        captcha_on_checkout: store.captchaOnCheckout,
        monthly_simulated_ai_traffic: store.monthlySimulatedAiTraffic,
        average_order_value: store.averageOrderValue,
        updated_at: store.updatedAt,
      });
      if (error) console.warn('[Supabase] saveStoreProfile warning:', error.message);
      return !error;
    } catch (e) {
      console.warn('[Supabase] saveStoreProfile error:', e);
      return false;
    }
  },

  async getStoreProfile(merchantId: string): Promise<StoreProfile | null> {
    const client = getSupabaseAdminClient();
    if (!client) return null;
    try {
      const { data, error } = await client.from('store_profiles').select('*').eq('merchant_id', merchantId).single();
      if (error || !data) return null;
      return {
        id: data.id,
        merchantId: data.merchant_id,
        name: data.name,
        slug: data.slug,
        tagline: data.tagline || '',
        websiteUrl: data.website_url || '',
        currency: data.currency || 'INR',
        country: data.country || 'IN',
        description: data.description || '',
        returnPolicyDays: data.return_policy_days ?? 14,
        returnPolicyDescription: data.return_policy_description || '',
        freeShippingThreshold: Number(data.free_shipping_threshold) || 999,
        shippingRules: data.shipping_rules || [],
        supportedPaymentMethods: data.supported_payment_methods || ['card', 'upi', 'agent_token'],
        schemaOrgEnabled: data.schema_org_enabled ?? true,
        hasAgentManifest: data.has_agent_manifest ?? true,
        hasAgentCheckoutApi: data.has_agent_checkout_api ?? true,
        hasStockApi: data.has_stock_api ?? true,
        hasPriceParityGuarantee: data.has_price_parity_guarantee ?? true,
        captchaOnCheckout: data.captcha_on_checkout ?? false,
        monthlySimulatedAiTraffic: data.monthly_simulated_ai_traffic ?? 24000,
        averageOrderValue: Number(data.average_order_value) || 3499,
        updatedAt: data.updated_at || new Date().toISOString(),
      };
    } catch {
      return null;
    }
  },

  // Products Operations
  async saveProduct(product: Product): Promise<boolean> {
    const client = getSupabaseAdminClient();
    if (!client) return false;
    try {
      const { error } = await client.from('products').upsert({
        id: product.id,
        merchant_id: product.merchantId,
        title: product.title,
        handle: product.handle,
        description: product.description,
        category: product.category,
        base_price: product.basePrice,
        currency: product.currency,
        image_url: product.imageUrl,
        specs: product.specs,
        has_structured_data: product.hasStructuredData,
        tags: product.tags,
        stock_quantity: product.stockQuantity,
        is_agent_purchasable: product.isAgentPurchasable,
        created_at: product.createdAt,
        updated_at: product.updatedAt,
      });

      // Save product variants relationally if present
      if (!error && product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
          await client.from('product_variants').upsert({
            id: variant.id,
            product_id: product.id,
            sku: variant.sku,
            title: variant.title,
            price: variant.price,
            compare_at_price: variant.compareAtPrice,
            inventory_count: variant.inventoryCount,
            attributes: variant.attributes,
            is_available: variant.isAvailable,
          });
        }
      }

      if (error) console.warn('[Supabase] saveProduct warning:', error.message);
      return !error;
    } catch (e) {
      console.warn('[Supabase] saveProduct error:', e);
      return false;
    }
  },

  async getProducts(merchantId: string): Promise<Product[] | null> {
    const client = getSupabaseAdminClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('products')
        .select(`
          *,
          variants:product_variants(*)
        `)
        .eq('merchant_id', merchantId);
      if (error || !data) return null;

      return data.map((row: any) => ({
        id: row.id,
        merchantId: row.merchant_id,
        title: row.title,
        handle: row.handle,
        description: row.description || '',
        category: row.category || 'General',
        basePrice: Number(row.base_price),
        currency: row.currency || 'INR',
        imageUrl: row.image_url,
        specs: row.specs || [],
        variants: (row.variants || []).map((v: any) => ({
          id: v.id,
          productId: v.product_id,
          sku: v.sku,
          title: v.title,
          price: Number(v.price),
          compareAtPrice: v.compare_at_price ? Number(v.compare_at_price) : undefined,
          inventoryCount: v.inventory_count ?? 0,
          attributes: v.attributes || {},
          isAvailable: v.is_available ?? true,
        })),
        hasStructuredData: row.has_structured_data ?? true,
        tags: row.tags || [],
        stockQuantity: row.stock_quantity ?? 0,
        isAgentPurchasable: row.is_agent_purchasable ?? true,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch {
      return null;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    const client = getSupabaseAdminClient();
    if (!client) return false;
    try {
      const { error } = await client.from('products').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  // Simulations Operations (Relational Breakdown)
  async saveSimulation(report: SimulationReport): Promise<boolean> {
    const client = getSupabaseAdminClient();
    if (!client) return false;
    try {
      // 1. Insert/Update parent simulation entity
      const { error: simError } = await client.from('simulations').upsert({
        id: report.id,
        merchant_id: report.merchantId,
        store_name: report.storeName,
        persona_id: report.persona.id,
        overall_status: report.overallStatus,
        overall_score: report.score.overallScore,
        grade: report.score.grade,
        subscores: report.score,
        revenue_impact: report.revenueImpact,
        recommendations: report.recommendations,
        execution_time_ms: report.executionTimeMs,
        ai_buyer_summary: report.aiBuyerSummary,
        is_counterfactual: report.isCounterfactual || false,
        compared_to_baseline_id: report.comparedToBaselineId,
        created_at: report.createdAt,
      });

      if (simError) {
        console.warn('[Supabase] saveSimulation parent warning:', simError.message);
        return false;
      }

      // 2. Insert journey steps relationally
      if (report.journeySteps && report.journeySteps.length > 0) {
        const stepRows = report.journeySteps.map((step) => ({
          simulation_id: report.id,
          step_index: step.stepIndex,
          stage: step.stage,
          title: step.title,
          status: step.status,
          duration_ms: step.durationMs,
          buyer_thought: step.buyerThought,
          technical_insight: step.technicalInsight,
          request_payload: step.requestPayload,
          response_payload: step.responsePayload,
        }));
        await client.from('simulation_journey_steps').upsert(stepRows);
      }

      // 3. Insert friction points relationally
      if (report.frictionPoints && report.frictionPoints.length > 0) {
        const frictionRows = report.frictionPoints.map((f) => ({
          simulation_id: report.id,
          stage: f.stage,
          severity: f.severity,
          title: f.title,
          explanation: f.explanation,
          technical_root_cause: f.technicalRootCause,
          estimated_dropoff_rate: f.estimatedDropoffRate,
          revenue_impact_monthly: f.revenueImpactMonthly,
          suggested_fix_id: f.suggestedFixId,
        }));
        await client.from('friction_points').upsert(frictionRows);
      }

      return true;
    } catch (e) {
      console.warn('[Supabase] saveSimulation relational write error:', e);
      return false;
    }
  },

  async getSimulation(id: string): Promise<SimulationReport | null> {
    const client = getSupabaseAdminClient();
    if (!client) return null;
    try {
      const { data: sim, error: simError } = await client
        .from('simulations')
        .select(`
          *,
          journey_steps:simulation_journey_steps(*),
          friction_points:friction_points(*)
        `)
        .eq('id', id)
        .single();

      if (simError || !sim) return null;

      return {
        id: sim.id,
        createdAt: sim.created_at,
        merchantId: sim.merchant_id,
        storeName: sim.store_name,
        persona: {
          id: sim.persona_id,
          type: 'rapid_autonomous_agent',
          name: sim.persona_id,
          tagline: 'Autonomous AI Buyer',
          description: 'Autonomous Buyer Agent',
          purchasingGoal: 'Automated procurement and validation of target products against strict merchant standards.',
          budgetConstraints: `Authorized for transactions up to ₹10,000 without manual human re-approval.`,
          evaluationCriteria: [
            'Machine-readable Schema.org and JSON-LD markup',
            'Real-time inventory and pricing parity',
            'Frictionless server-to-server tokenized checkout',
          ],
          behaviorRules: [
            'Immediately abort upon encountering Cloudflare or human CAPTCHA gates',
            'Reject stores with return windows under 14 days',
            'Require verified HTTPS protocol endpoints',
          ],
          icon: 'Bot',
          maxBudget: 10000,
          specStrictness: 80,
          inventoryTolerance: 80,
          policySensitivity: 80,
          maxLatencyToleranceMs: 2000,
          prefersAgentCheckoutToken: true,
          disallowsCaptcha: true,
          samplePromptQuery: '',
        },
        evaluatedProducts: [],
        overallStatus: sim.overall_status,
        score: sim.subscores,
        journeySteps: (sim.journey_steps || []).sort((a: any, b: any) => a.step_index - b.step_index).map((s: any) => ({
          id: s.id,
          stepIndex: s.step_index,
          stage: s.stage,
          title: s.title,
          status: s.status,
          durationMs: s.duration_ms,
          buyerThought: s.buyer_thought,
          technicalInsight: s.technical_insight,
          requestPayload: s.request_payload,
          responsePayload: s.response_payload,
        })),
        frictionPoints: (sim.friction_points || []).map((f: any) => ({
          id: f.id,
          stage: f.stage,
          severity: f.severity,
          title: f.title,
          explanation: f.explanation,
          technicalRootCause: f.technical_root_cause,
          estimatedDropoffRate: Number(f.estimated_dropoff_rate),
          revenueImpactMonthly: Number(f.revenue_impact_monthly),
          suggestedFixId: f.suggested_fix_id,
        })),
        revenueImpact: sim.revenue_impact,
        recommendations: sim.recommendations || [],
        executionTimeMs: sim.execution_time_ms,
        aiBuyerSummary: sim.ai_buyer_summary,
        isCounterfactual: sim.is_counterfactual,
        comparedToBaselineId: sim.compared_to_baseline_id,
      };
    } catch {
      return null;
    }
  },

  async getSimulationHistory(merchantId: string): Promise<SimulationHistoryItem[] | null> {
    const client = getSupabaseAdminClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('simulations')
        .select(`
          id,
          created_at,
          store_name,
          persona_id,
          overall_status,
          overall_score,
          grade,
          revenue_impact,
          execution_time_ms,
          friction_points(count)
        `)
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error || !data) return null;

      return data.map((row: any) => ({
        id: row.id,
        createdAt: row.created_at,
        storeName: row.store_name,
        personaName: row.persona_id,
        personaType: 'rapid_autonomous_agent',
        overallScore: row.overall_score,
        grade: row.grade,
        status: row.overall_status,
        revenueLoss: row.revenue_impact?.estimatedMonthlyRevenueLoss || 0,
        frictionCount: row.friction_points?.[0]?.count || 0,
        executionTimeMs: row.execution_time_ms || 0,
      }));
    } catch {
      return null;
    }
  },

  // Payment Simulation Records
  async savePaymentAttempt(attempt: PaymentAttempt, merchantId?: string): Promise<boolean> {
    const client = getSupabaseAdminClient();
    if (!client) return false;
    try {
      const { error } = await client.from('payment_records').upsert({
        id: attempt.id,
        order_id: attempt.orderId,
        payment_id: attempt.paymentId,
        merchant_id: merchantId || attempt.merchantId,
        amount: attempt.amount,
        currency: attempt.currency,
        method: attempt.method,
        status: attempt.status,
        signature_verified: attempt.signatureVerified,
        idempotency_key: attempt.idempotencyKey,
        retry_count: attempt.retryCount,
        agent_signature: attempt.agentSignature,
        error_message: attempt.errorMessage,
        created_at: attempt.createdAt,
      });
      return !error;
    } catch {
      return false;
    }
  },

  async getPaymentRecords(merchantId: string): Promise<PaymentAttempt[] | null> {
    const client = getSupabaseAdminClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('payment_records')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error || !data) return null;

      return data.map((row: any) => ({
        id: row.id,
        orderId: row.order_id,
        paymentId: row.payment_id,
        merchantId: row.merchant_id,
        amount: Number(row.amount),
        currency: row.currency || 'INR',
        method: row.method || 'razorpay_agent_token',
        status: row.status,
        signatureVerified: row.signature_verified ?? true,
        idempotencyKey: row.idempotency_key || '',
        errorMessage: row.error_message || undefined,
        retryCount: row.retry_count ?? 0,
        agentSignature: row.agent_signature || '',
        createdAt: row.created_at,
        isTestMode: true,
      }));
    } catch {
      return null;
    }
  },

  // Notification Operations
  async saveNotification(notification: MerchantNotification): Promise<boolean> {
    const client = getSupabaseAdminClient();
    if (!client) return false;
    try {
      const { error } = await client.from('merchant_notifications').upsert({
        id: notification.id,
        merchant_id: notification.merchantId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        severity: notification.severity,
        is_read: notification.isRead,
        related_entity_type: notification.relatedEntityType || null,
        related_entity_id: notification.relatedEntityId || null,
        action_url: notification.actionUrl || null,
        dedup_key: notification.dedupKey || null,
        created_at: notification.createdAt,
      });
      return !error;
    } catch {
      return false;
    }
  },

  async getNotifications(merchantId: string): Promise<MerchantNotification[] | null> {
    const client = getSupabaseAdminClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('merchant_notifications')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error || !data) return null;

      return data.map((row: any) => ({
        id: row.id,
        merchantId: row.merchant_id,
        type: row.type,
        title: row.title,
        message: row.message,
        severity: row.severity,
        isRead: Boolean(row.is_read),
        createdAt: row.created_at,
        relatedEntityType: row.related_entity_type || undefined,
        relatedEntityId: row.related_entity_id || undefined,
        actionUrl: row.action_url || undefined,
        dedupKey: row.dedup_key || undefined,
      }));
    } catch {
      return null;
    }
  },

  async markNotificationRead(id: string, merchantId: string): Promise<boolean> {
    const client = getSupabaseAdminClient();
    if (!client) return false;
    try {
      const { error } = await client
        .from('merchant_notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('merchant_id', merchantId);
      return !error;
    } catch {
      return false;
    }
  },

  async markAllNotificationsRead(merchantId: string): Promise<boolean> {
    const client = getSupabaseAdminClient();
    if (!client) return false;
    try {
      const { error } = await client
        .from('merchant_notifications')
        .update({ is_read: true })
        .eq('merchant_id', merchantId)
        .eq('is_read', false);
      return !error;
    } catch {
      return false;
    }
  },

  // Revenue Leaks Operations
  async saveRevenueLeak(leak: RevenueLeakItem): Promise<boolean> {
    const client = getSupabaseAdminClient();
    if (!client) return false;
    try {
      const { error } = await client.from('revenue_leaks').upsert(
        {
          id: leak.id,
          merchant_id: leak.merchantId,
          category: leak.category,
          severity: leak.severity,
          status: leak.status,
          title: leak.title,
          affected_entity: leak.affectedEntity,
          entity_type: leak.entityType,
          entity_id: leak.entityId || null,
          evidence: leak.evidence,
          why_ai_buyer_fails: leak.whyAiBuyerFails,
          estimated_revenue_at_risk: leak.estimatedRevenueAtRisk,
          potential_monthly_loss: leak.potentialMonthlyLoss,
          confidence_score: leak.confidenceScore,
          recommended_remediation: leak.recommendedRemediation,
          related_fix_id: leak.relatedFixId || null,
          related_simulation_stage: leak.relatedSimulationStage || null,
          related_simulation_id: leak.relatedSimulationId || null,
          related_payment_attempt_id: leak.relatedPaymentAttemptId || null,
          readiness_impact_points: leak.readinessImpactPoints || 0,
          created_at: leak.createdAt,
          updated_at: leak.updatedAt,
          resolved_at: leak.resolvedAt || null,
        },
        { onConflict: 'id' }
      );
      return !error;
    } catch {
      return false;
    }
  },

  async getRevenueLeaks(merchantId: string): Promise<RevenueLeakItem[] | null> {
    const client = getSupabaseAdminClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('revenue_leaks')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });
      if (error || !data) return null;
      return data.map((d: any) => ({
        id: d.id,
        merchantId: d.merchant_id,
        category: d.category,
        severity: d.severity,
        status: d.status,
        title: d.title,
        affectedEntity: d.affected_entity,
        entityType: d.entity_type,
        entityId: d.entity_id || undefined,
        evidence: d.evidence,
        whyAiBuyerFails: d.why_ai_buyer_fails,
        estimatedRevenueAtRisk: Number(d.estimated_revenue_at_risk || 0),
        potentialMonthlyLoss: Number(d.potential_monthly_loss || 0),
        confidenceScore: Number(d.confidence_score || 0.95),
        recommendedRemediation: d.recommended_remediation,
        relatedFixId: d.related_fix_id || undefined,
        relatedSimulationStage: d.related_simulation_stage || undefined,
        relatedSimulationId: d.related_simulation_id || undefined,
        relatedPaymentAttemptId: d.related_payment_attempt_id || undefined,
        readinessImpactPoints: Number(d.readiness_impact_points || 0),
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        resolvedAt: d.resolved_at || undefined,
      }));
    } catch {
      return null;
    }
  },

  // Orders Operations (Autonomous Order & Checkout Lifecycle)
  async saveOrder(order: Order): Promise<boolean> {
    const client = getSupabaseAdminClient();
    if (!client) return false;
    try {
      const { error } = await client.from('orders').upsert(
        {
          id: order.id,
          merchant_id: order.merchantId,
          order_number: order.orderNumber,
          customer: order.customer,
          items: order.items,
          pricing: order.pricing,
          status: order.status,
          payment_status: order.paymentStatus,
          source: order.source,
          ai_metadata: order.aiMetadata || null,
          idempotency_key: order.idempotencyKey || null,
          razorpay_order_id: order.razorpayOrderId || null,
          razorpay_payment_id: order.razorpayPaymentId || null,
          notes: order.notes || null,
          timeline: order.timeline,
          created_at: order.createdAt,
          updated_at: order.updatedAt,
          completed_at: order.completedAt || null,
          cancelled_at: order.cancelledAt || null,
          cancellation_reason: order.cancellationReason || null,
          is_simulated: order.isSimulated ?? false,
          is_test_mode: order.isTestMode ?? true,
        },
        { onConflict: 'id' }
      );
      return !error;
    } catch {
      return false;
    }
  },

  async getOrders(merchantId: string): Promise<Order[] | null> {
    const client = getSupabaseAdminClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('orders')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });
      if (error || !data) return null;
      return data.map((d: any) => ({
        id: d.id,
        merchantId: d.merchant_id,
        orderNumber: d.order_number,
        customer: d.customer,
        items: d.items,
        pricing: d.pricing,
        status: d.status,
        paymentStatus: d.payment_status,
        source: d.source,
        aiMetadata: d.ai_metadata || undefined,
        idempotencyKey: d.idempotency_key || undefined,
        razorpayOrderId: d.razorpay_order_id || undefined,
        razorpayPaymentId: d.razorpay_payment_id || undefined,
        notes: d.notes || undefined,
        timeline: Array.isArray(d.timeline) ? d.timeline : [],
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        completedAt: d.completed_at || undefined,
        cancelledAt: d.cancelled_at || undefined,
        cancellationReason: d.cancellation_reason || undefined,
        isSimulated: Boolean(d.is_simulated),
        isTestMode: Boolean(d.is_test_mode),
      }));
    } catch {
      return null;
    }
  },

  async getOrder(id: string): Promise<Order | null> {
    const client = getSupabaseAdminClient();
    if (!client) return null;
    try {
      const { data, error } = await client.from('orders').select('*').eq('id', id).single();
      if (error || !data) return null;
      return {
        id: data.id,
        merchantId: data.merchant_id,
        orderNumber: data.order_number,
        customer: data.customer,
        items: data.items,
        pricing: data.pricing,
        status: data.status,
        paymentStatus: data.payment_status,
        source: data.source,
        aiMetadata: data.ai_metadata || undefined,
        idempotencyKey: data.idempotency_key || undefined,
        razorpayOrderId: data.razorpay_order_id || undefined,
        razorpayPaymentId: data.razorpay_payment_id || undefined,
        notes: data.notes || undefined,
        timeline: Array.isArray(data.timeline) ? data.timeline : [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        completedAt: data.completed_at || undefined,
        cancelledAt: data.cancelled_at || undefined,
        cancellationReason: data.cancellation_reason || undefined,
        isSimulated: Boolean(data.is_simulated),
        isTestMode: Boolean(data.is_test_mode),
      };
    } catch {
      return null;
    }
  },
};

/**
 * Health check for Supabase connectivity (safe, non-sensitive)
 */
export async function checkSupabaseHealth(): Promise<{
  healthy: boolean;
  status: 'healthy' | 'warning' | 'error';
  latencyMs: number;
  message: string;
  recommendation?: string;
  metadata?: Record<string, any>;
}> {
  const start = Date.now();
  const { isConfigured, hasUrl, hasServiceRoleKey } = getSupabaseStatus();

  if (!isConfigured) {
    return {
      healthy: true, // Graceful fallback
      status: 'warning',
      latencyMs: 0,
      message: 'Supabase credentials not configured in environment. Hybrid in-memory storage fallback is active.',
      recommendation: 'Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable multi-node durable cloud persistence.',
      metadata: { mode: 'in_memory_fallback', isConfigured: false },
    };
  }

  try {
    const client = getSupabaseAdminClient();
    if (!client) {
      return {
        healthy: false,
        status: 'error',
        latencyMs: Date.now() - start,
        message: 'Supabase admin client failed to initialize.',
        recommendation: 'Check URL and key formatting in environment variables.',
        metadata: { isConfigured: true },
      };
    }

    // Fast lightweight ping
    const { data, error } = await client.from('merchants').select('id', { count: 'exact', head: true }).limit(1);
    const latencyMs = Date.now() - start;

    if (error) {
      return {
        healthy: true,
        status: 'warning',
        latencyMs,
        message: `Supabase reached (${latencyMs}ms), but table check returned: ${error.message}. In-memory caching active.`,
        recommendation: 'Ensure standard database migrations have executed in your Supabase project.',
        metadata: { latencyMs },
      };
    }

    return {
      healthy: true,
      status: 'healthy',
      latencyMs,
      message: `Supabase cloud database connected and operational (${latencyMs}ms).`,
      metadata: { latencyMs },
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return {
      healthy: true, // Non-fatal
      status: 'warning',
      latencyMs,
      message: `Supabase network check warning (${latencyMs}ms): ${err?.message || 'Connection timeout'}. Fallback active.`,
      recommendation: 'Application is operating safely using in-memory transactional storage.',
    };
  }
}


