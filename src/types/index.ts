/**
 * AgentReady Core Data Architecture Types
 * Built for Razorpay AI Buildathon — Track 1: AI Growth & Agentic Commerce
 */

export interface Merchant {
  id: string;
  email: string;
  name: string;
  companyName: string;
  phone?: string;
  website?: string;
  businessDescription?: string;
  isOnboarded?: boolean;
  createdAt: string;
  isDemo: boolean;
}

export interface ShippingRule {
  id: string;
  name: string;
  cost: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isExpress: boolean;
}

export interface StoreProfile {
  id: string;
  merchantId: string;
  name: string;
  slug: string;
  tagline: string;
  websiteUrl: string;
  currency: string; // e.g. "INR"
  country: string; // e.g. "IN"
  description: string;
  contactName?: string;
  email?: string;
  phone?: string;
  returnPolicyDays: number;
  returnPolicyDescription: string;
  restockingFee?: number;
  hasFreeReturns?: boolean;
  freeShippingThreshold: number;
  standardDeliveryDays?: number;
  expressShippingCost?: number;
  shippingRules: ShippingRule[];
  supportedPaymentMethods: Array<'card' | 'upi' | 'netbanking' | 'agent_token' | 'cod'>;
  schemaOrgEnabled: boolean;
  hasAgentManifest: boolean;
  hasAgentCheckoutApi: boolean;
  hasStockApi: boolean;
  hasPriceParityGuarantee: boolean;
  captchaOnCheckout: boolean; // Agent blocker!
  isTaxInclusive?: boolean;
  hasCaptchaBypassForAgents?: boolean;
  monthlySimulatedAiTraffic: number; // For revenue calculations
  averageOrderValue: number;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  title: string; // e.g. "Size 9 / Onyx Black"
  price: number;
  compareAtPrice?: number;
  inventoryCount: number;
  attributes: Record<string, string>; // e.g. { size: "9", color: "Onyx Black" }
  isAvailable: boolean;
}

export interface ProductSpec {
  key: string;
  value: string;
  category?: string;
}

export interface Product {
  id: string;
  merchantId: string;
  title: string;
  sku?: string;
  handle: string;
  description: string;
  category: string;
  basePrice: number;
  currency: string;
  imageUrl?: string;
  specs: ProductSpec[];
  variants: ProductVariant[];
  hasStructuredData: boolean; // JSON-LD schema
  tags: string[];
  stockQuantity: number;
  isAgentPurchasable: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PersonaType = 
  | 'strict_spec_matcher'
  | 'budget_optimizer'
  | 'rapid_autonomous_agent'
  | 'multi_variant_explorer'
  | 'policy_sensitive_corporate'
  | 'high_velocity_bundler';

export interface BuyerPersona {
  id: string;
  type: PersonaType;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  purchasingGoal: string;
  budgetConstraints: string;
  evaluationCriteria: string[];
  behaviorRules: string[];
  maxBudget: number; // e.g. ₹10,000
  specStrictness: number; // 0-100 scale (how strictly specs must be machine-verifiable)
  inventoryTolerance: number; // 0-100 (reject if stock < threshold or ambiguous)
  policySensitivity: number; // 0-100 (needs clear return days & free returns)
  maxLatencyToleranceMs: number; // ms before timeout
  prefersAgentCheckoutToken: boolean;
  disallowsCaptcha: boolean;
  samplePromptQuery: string;
}

export type StepStage =
  | 'intent_discovery'
  | 'catalog_parsing'
  | 'spec_validation'
  | 'inventory_check'
  | 'pricing_tax_eval'
  | 'policy_shipping_check'
  | 'payment_negotiation'
  | 'checkout_confirmation';

export type StepStatus = 'pass' | 'fail' | 'friction' | 'skipped';

export interface JourneyStep {
  id: string;
  stepIndex: number;
  stage: StepStage;
  title: string;
  status: StepStatus;
  durationMs: number;
  buyerThought: string;
  technicalInsight: string;
  requestPayload?: Record<string, any>;
  responsePayload?: Record<string, any>;
  frictionId?: string;
}

export interface FrictionPoint {
  id: string;
  stage: StepStage;
  severity: 'critical' | 'moderate' | 'minor';
  title: string;
  explanation: string;
  technicalRootCause: string;
  affectedProduct?: string;
  estimatedDropoffRate: number; // 0.0 - 1.0 (e.g., 0.65 = 65% dropoff)
  revenueImpactMonthly: number; // Deterministic calculation
  suggestedFixId: string;
  recommendedFix?: string;
}

export interface RevenueImpact {
  simulatedMonthlyAiTraffic: number;
  averageOrderValue: number;
  baselineAiConversionRate: number; // e.g., 4.2%
  actualSimulatedConversionRate: number; // e.g., 0.8%
  estimatedMonthlyRevenueLoss: number; // (baseline - actual) * traffic * AOV
  potentialRevenueRecovery: number;
  currency: string;
}

export interface ReadinessScores {
  overallScore: number; // 0-100
  machineReadability: number; // 0-100
  apiCompleteness: number; // 0-100
  policyClarity: number; // 0-100
  pricingTransparency: number; // 0-100
  checkoutViability: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  passedChecksCount?: number;
  warningsCount?: number;
  criticalCount?: number;
  frictionCount?: number;
}

export interface AgentReadyFix {
  id: string;
  title: string;
  category: 'metadata' | 'catalog' | 'policy' | 'api' | 'payment';
  priority: 'P0' | 'P1' | 'P2';
  effort: '5 mins' | '15 mins' | '30 mins' | '1 hour';
  impactPoints: number; // e.g., +18 Readiness Score
  estimatedRevenueGain: number; // e.g., ₹45,000 / mo
  explanation: string;
  fileTarget: string; // e.g. "public/.well-known/agent-commerce.json"
  beforeSnippet: string;
  afterSnippet: string;
  applied: boolean;
}

export interface SimulationInput {
  merchantId: string;
  personaId: string;
  productIds?: string[];
  intentQuery?: string;
  scenarioOverrides?: {
    forceCaptchaBlock?: boolean;
    simulateStockOut?: boolean;
    simulateMissingJsonLd?: boolean;
    simulateVagueReturnPolicy?: boolean;
    simulateHiddenTaxes?: boolean;
  };
  counterfactualFixes?: string[]; // IDs of fixes to test in "What-if"
}

export interface SimulationReport {
  id: string;
  createdAt: string;
  merchantId: string;
  storeName: string;
  persona: BuyerPersona;
  evaluatedProducts: Product[];
  overallStatus: 'SUCCESS' | 'FAILED' | 'BLOCKED_BY_FRICTION';
  score: ReadinessScores;
  journeySteps: JourneyStep[];
  frictionPoints: FrictionPoint[];
  revenueImpact: RevenueImpact;
  recommendations: AgentReadyFix[];
  executionTimeMs: number;
  aiBuyerSummary: string;
  executionMode?: 'gemini_ai' | 'deterministic_fallback';
  aiModelUsed?: string;
  isCounterfactual?: boolean;
  comparedToBaselineId?: string;
}

export interface SimulationHistoryItem {
  id: string;
  createdAt: string;
  storeName: string;
  personaName: string;
  personaType: PersonaType;
  productTitle?: string;
  productId?: string;
  overallScore: number;
  grade: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED_BY_FRICTION';
  revenueLoss: number;
  frictionCount: number;
  executionTimeMs: number;
  executionMode?: 'gemini_ai' | 'deterministic_fallback';
}

export interface AgentManifest {
  version: string;
  protocol: 'UCP-1.0' | 'AgentCommerce-v1';
  merchant: {
    name: string;
    id: string;
    website: string;
    country: string;
    currency: string;
  };
  endpoints: {
    catalogJson: string;
    inventoryCheck: string;
    pricingEstimate: string;
    agentCheckout: string;
    orderStatusWebhook: string;
  };
  capabilities: {
    realtimeInventory: boolean;
    programmaticDiscount: boolean;
    autonomousPaymentTokens: boolean;
    instantFulfillmentSla: boolean;
  };
  policies: {
    returnWindowDays: number;
    freeReturnsThreshold: number;
    supportContact: string;
  };
  products: Array<{
    id: string;
    title: string;
    sku: string;
    price: number;
    currency: string;
    stock: number;
    variants: Array<{ id: string; sku: string; price: number; attributes: Record<string, string> }>;
  }>;
}

export interface RazorpayOrder {
  id?: string;
  orderId: string;
  amount: number; // in smallest unit (paise for INR)
  amountDisplay: number; // in INR
  currency: string;
  receipt: string;
  status: 'created' | 'attempted' | 'paid' | 'failed';
  notes: Record<string, string>;
  createdAt: number;
}

export interface PaymentAttempt {
  id: string;
  orderId: string;
  paymentId: string;
  merchantId?: string;
  amount: number;
  currency: string;
  method: 'razorpay_agent_token' | 'razorpay_test_card' | 'razorpay_test_upi';
  status: 'SUCCESS' | 'FAILED' | 'REQUIRES_CHALLENGE';
  signatureVerified: boolean;
  idempotencyKey: string;
  createdAt: string;
  errorMessage?: string;
  retryCount: number;
  agentSignature: string;
  isTestMode?: boolean;
  webhookDelivered?: boolean;
}

export interface MerchantPaymentConfig {
  merchantId: string;
  razorpayEnabled: boolean;
  isTestMode: boolean;
  keyIdConfigured: boolean;
  maskedKeyId?: string;
  webhookConfigured: boolean;
  webhookUrl?: string;
  paymentReadinessStatus: 'READY' | 'DEGRADED' | 'NOT_CONFIGURED';
  paymentReadinessScore: number;
  supportedMethods: string[];
  lastDiagnosticsAt?: string;
}

export interface PaymentDiagnosticCheck {
  id: string;
  name: string;
  category: 'credentials' | 'api' | 'security' | 'agent_compatibility' | 'webhooks';
  passed: boolean;
  severity: 'critical' | 'moderate' | 'minor';
  message: string;
  technicalDetails?: string;
  recommendation?: string;
  suggestedFixId?: string;
}

export interface PaymentReadinessReport {
  overallScore: number; // 0-100
  status: 'READY' | 'DEGRADED' | 'NOT_CONFIGURED';
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  isTestMode: boolean;
  checks: PaymentDiagnosticCheck[];
  passedCount: number;
  warningsCount: number;
  criticalCount: number;
  agentCompatibility: {
    autonomousTokenSupported: boolean;
    zeroIframeDirectSettlement: boolean;
    idempotencySupported: boolean;
    webhookDeliveryWorking: boolean;
    noInteractiveCaptcha: boolean;
  };
  summary: string;
  evaluatedAt: string;
}

export interface PaymentTestSuiteStep {
  stepId: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIPPED';
  durationMs: number;
  details: string;
  payload?: Record<string, any>;
}

export interface PaymentTestSuiteResult {
  suiteId: string;
  executedAt: string;
  overallStatus: 'PASS' | 'FAIL';
  passedSteps: number;
  totalSteps: number;
  steps: PaymentTestSuiteStep[];
  orderId?: string;
  paymentId?: string;
  signatureVerified?: boolean;
  webhookDelivered?: boolean;
}

export interface WebhookEventRecord {
  id: string;
  eventId: string;
  event: string;
  entity: string;
  source?: string;
  merchantId?: string;
  orderId?: string;
  paymentId?: string;
  signatureVerified: boolean;
  receivedAt: string;
  processed: boolean;
  status: 'PROCESSED' | 'FAILED' | 'DUPLICATE_IGNORED';
  processingDurationMs?: number;
  errorMessage?: string;
  retryCount?: number;
  idempotencyKey?: string;
  payload?: Record<string, any>;
}

export type DiagnosticStatus = 'healthy' | 'warning' | 'error';

export interface SystemDiagnosticItem {
  id: string;
  name: string;
  subsystem?: string;
  category?: 'ai' | 'database' | 'store' | 'catalog' | 'manifest' | 'simulation' | 'payment' | 'webhook' | 'auth';
  status: DiagnosticStatus;
  message: string;
  latencyMs?: number;
  lastCheckedAt: string;
  recommendation?: string;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface SystemHealthReport {
  status: 'healthy' | 'degraded' | 'critical' | DiagnosticStatus;
  overallStatus?: DiagnosticStatus;
  healthyCount: number;
  warningCount: number;
  errorCount: number;
  totalChecks: number;
  timestamp?: string;
  evaluatedAt?: string;
  executionDurationMs?: number;
  checks: SystemDiagnosticItem[];
  uptimeSeconds?: number;
  systemUptimeSeconds?: number;
  environment?: any;
}

export type NotificationType =
  | 'critical_readiness_failure'
  | 'payment_failure'
  | 'webhook_failure'
  | 'simulation_failure'
  | 'high_severity_friction'
  | 'critical_fix_resolved'
  | 'revenue_leak_detected'
  | 'revenue_recovered'
  | 'revenue_leak_resolved'
  | 'order_created'
  | 'order_paid'
  | 'order_cancelled'
  | 'checkout_failed'
  | 'inventory_conflict'
  | 'duplicate_replay_detected'
  | 'system_alert';

export type NotificationSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface MerchantNotification {
  id: string;
  merchantId: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  isRead: boolean;
  createdAt: string;
  relatedEntityType?: 'simulation' | 'payment' | 'fix' | 'webhook' | 'store' | 'revenue_leak' | 'order';
  relatedEntityId?: string;
  actionUrl?: string;
  dedupKey?: string;
}

export type RevenueLeakCategory =
  | 'catalog_discovery'
  | 'spec_microdata'
  | 'inventory_stock'
  | 'pricing_tax_shipping'
  | 'return_policy'
  | 'checkout_api'
  | 'payment_readiness'
  | 'captcha_blocker'
  | 'simulation_failure'
  | 'webhook_delivery';

export type RevenueLeakSeverity = 'critical' | 'high' | 'medium' | 'low';

export type RevenueLeakStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface RevenueLeakItem {
  id: string;
  merchantId: string;
  category: RevenueLeakCategory;
  severity: RevenueLeakSeverity;
  status: RevenueLeakStatus;
  title: string;
  affectedEntity: string; // e.g. "AI-ready Running Shoes", "Commercial Policy", "Razorpay Checkout Gateway"
  entityType: 'product' | 'store_profile' | 'payment' | 'simulation' | 'webhook' | 'manifest';
  entityId?: string;
  evidence: string;
  whyAiBuyerFails: string;
  estimatedRevenueAtRisk: number; // monthly ₹ amount
  potentialMonthlyLoss: number;
  confidenceScore: number; // 0.0 to 1.0
  recommendedRemediation: string;
  relatedFixId?: string;
  relatedSimulationStage?: StepStage;
  relatedSimulationId?: string;
  relatedPaymentAttemptId?: string;
  readinessImpactPoints?: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface RevenueLeakSummary {
  totalRevenueAtRisk: number;
  revenueRecovered: number;
  potentialRecovery: number;
  activeLeaksCount: number;
  resolvedLeaksCount: number;
  inProgressLeaksCount: number;
  recoveryPercentage: number;
  leaksByCategory: Record<string, { count: number; revenueAtRisk: number }>;
  leaksBySeverity: Record<string, { count: number; revenueAtRisk: number }>;
  currency: string;
  evaluatedAt: string;
}

export interface CounterfactualComparison {
  baselineReport: SimulationReport;
  counterfactualReport: SimulationReport;
  appliedFixes: AgentReadyFix[];
  scoreDelta: number;
  revenueRecoveredMonthly: number;
  conversionRateGainPercentage: number;
  resolvedFrictionCount: number;
}

// -------------------------------------------------------------
// AUTONOMOUS ORDER & CHECKOUT LIFECYCLE DOMAIN MODEL
// -------------------------------------------------------------

export type OrderStatus =
  | 'PENDING'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED'
  | 'REFUNDED';

export type PaymentStatus =
  | 'UNPAID'
  | 'PENDING'
  | 'AUTHORIZED'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

export type OrderSource =
  | 'simulation'
  | 'sandbox_test'
  | 'direct_agent'
  | 'api'
  | 'manual';

export type OrderTimelineEventType =
  | 'ORDER_CREATED'
  | 'INVENTORY_VALIDATED'
  | 'CHECKOUT_STARTED'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_AUTHORIZED'
  | 'PAYMENT_FAILED'
  | 'WEBHOOK_RECEIVED'
  | 'ORDER_CONFIRMED'
  | 'INVENTORY_UPDATED'
  | 'ORDER_CANCELLED'
  | 'REFUND_INITIATED';

export interface OrderTimelineEvent {
  id: string;
  orderId: string;
  type: OrderTimelineEventType;
  title: string;
  description: string;
  status: 'SUCCESS' | 'FAILED' | 'INFO' | 'WARNING';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface OrderCustomer {
  name: string;
  email: string;
  phone?: string;
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface OrderItem {
  productId: string;
  variantId?: string;
  title: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl?: string;
  attributes?: Record<string, string>;
}

export interface OrderPricing {
  subtotal: number;
  tax: number;
  taxRate: number; // e.g. 0.18
  isTaxInclusive: boolean;
  shippingCost: number;
  discount: number;
  totalAmount: number;
  currency: string;
}

export interface OrderAiMetadata {
  personaId?: string;
  personaType?: PersonaType;
  personaName?: string;
  simulationId?: string;
  agentProtocol?: 'UCP-1.0' | 'AgentCommerce-v1' | 'DirectRest-v1';
  autonomyLevel?: 'L4_FULLY_AUTONOMOUS' | 'L3_CONDITIONAL_DELEGATION' | 'L2_HUMAN_IN_LOOP';
  idempotencyKey?: string;
  paymentAttemptId?: string;
  razorpayOrderId?: string;
  verificationHash?: string;
  clientUserAgent?: string;
}

export interface Order {
  id: string;
  merchantId: string;
  orderNumber: string; // e.g. "ORD-2026-9041"
  customer: OrderCustomer;
  items: OrderItem[];
  pricing: OrderPricing;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  source: OrderSource;
  aiMetadata?: OrderAiMetadata;
  idempotencyKey?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  notes?: string;
  timeline: OrderTimelineEvent[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  isSimulated?: boolean;
  isTestMode?: boolean;
}

export interface OrderSummary {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  failedOrders: number;
  cancelledOrders: number;
  totalOrderValue: number;
  averageOrderValue: number;
  simulatedOrdersCount: number;
  testModeOrdersCount: number;
  currency: string;
}

export interface CreateOrderInput {
  merchantId?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  customer?: Partial<OrderCustomer>;
  shippingMethodId?: string;
  discountCode?: string;
  source?: OrderSource;
  personaId?: string;
  simulationId?: string;
  idempotencyKey?: string;
  notes?: string;
}

export interface CheckoutExecutionInput {
  orderId: string;
  paymentMethod?: 'razorpay_agent_token' | 'razorpay_test_card' | 'razorpay_test_upi';
  idempotencyKey?: string;
  simulatePaymentFailure?: boolean;
  failureReason?: string;
  agentSignature?: string;
}

export interface CheckoutExecutionResult {
  success: boolean;
  order: Order;
  paymentAttempt?: PaymentAttempt;
  timelineEvent: OrderTimelineEvent;
  error?: string;
  errorCode?: string;
}

// -------------------------------------------------------------
// MERCHANT ANALYTICS & REPORTING DOMAIN
// -------------------------------------------------------------

export type AnalyticsTimeRange = '7d' | '30d' | '90d' | 'all';

export interface AnalyticsFilterParams {
  timeRange?: AnalyticsTimeRange;
  personaId?: string;
  productId?: string;
  orderStatus?: string;
  paymentStatus?: string;
  leakCategory?: string;
}

export interface AnalyticsPillarScores {
  machineReadability: number;
  apiCompleteness: number;
  policyClarity: number;
  pricingTransparency: number;
  checkoutViability: number;
}

export interface AnalyticsOverviewMetrics {
  totalOrders: number;
  successfulOrders: number;
  failedOrders: number;
  cancelledOrders: number;
  totalGmv: number;
  averageOrderValue: number;
  paymentSuccessRate: number;
  checkoutSuccessRate: number;
  simulationSuccessRate: number;
  aiBuyerConversionRate: number;
  revenueAtRisk: number;
  revenueRecovered: number;
  revenueRecoveryPercentage: number;
  activeRevenueLeaks: number;
  resolvedRevenueLeaks: number;
  totalSimulations: number;
  successfulSimulations: number;
  failedSimulations: number;
  currentReadinessScore: number;
  previousReadinessScore?: number;
  readinessScoreDelta: number;
  readinessGrade: string;
  pillarScores: AnalyticsPillarScores;
  currency: string;
}

export interface AnalyticsTimeSeriesPoint {
  date: string;
  formattedDate: string;
  ordersCount: number;
  gmv: number;
  simulationPasses: number;
  simulationFails: number;
  paymentsSuccessful: number;
  paymentsFailed: number;
  revenueAtRisk: number;
  revenueRecovered: number;
  readinessScore: number;
}

export interface PersonaAnalytics {
  personaId: string;
  name: string;
  role: string;
  avatar?: string;
  badge?: string;
  maxBudget: number;
  simulationCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgReadinessScore: number;
  mostCommonFailureStage: string;
  revenueImpact: number;
  topTargetedProducts: string[];
  keyFrictionSummary: string;
}

export interface ProductAnalytics {
  productId: string;
  title: string;
  sku: string;
  category: string;
  stockQuantity: number;
  basePrice: number;
  currency: string;
  simulationAttempts: number;
  successfulPurchases: number;
  failedPurchases: number;
  conversionRate: number;
  revenueGenerated: number;
  revenueAtRisk: number;
  catalogReadiness: number;
  inventoryReadiness: number;
  isHighFriction: boolean;
  topFrictionReason?: string;
}

export interface SimulationStageFailureMetric {
  stage: StepStage;
  stageTitle: string;
  failureCount: number;
  frictionCount: number;
  passCount: number;
  dropoffRate: number;
  financialLossEstimated: number;
}

export interface DeterministicRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'product' | 'leak' | 'checkout' | 'persona' | 'fix';
  severity: 'critical' | 'high' | 'medium' | 'info';
  estimatedImpact: string;
  actionText: string;
  targetTab: string;
}

export interface MerchantAnalyticsReport {
  generatedAt: string;
  merchantId: string;
  merchantName: string;
  storeName: string;
  currency: string;
  timeRange: AnalyticsTimeRange;
  overview: AnalyticsOverviewMetrics;
  timeSeries: AnalyticsTimeSeriesPoint[];
  personas: PersonaAnalytics[];
  products: ProductAnalytics[];
  stageFailures: SimulationStageFailureMetric[];
  recommendations: DeterministicRecommendation[];
}

