/**
 * AgentReady In-Memory & Supabase Storage Engine
 * Provides persistent database operations with NovaGear pre-seeded demo state.
 */

import {
  Merchant,
  StoreProfile,
  Product,
  ProductVariant,
  BuyerPersona,
  SimulationReport,
  SimulationHistoryItem,
  PaymentAttempt,
  RazorpayOrder,
  Order,
  OrderStatus,
  PaymentStatus,
  OrderSource,
  OrderItem,
  OrderTimelineEvent,
  OrderSummary,
  AgentReadyFix,
  FrictionPoint,
  MerchantNotification,
  RevenueLeakItem,
  RevenueLeakStatus,
} from '../src/types/index';
import { supabaseDb } from './supabase';

// Initial Demo Merchant Data
export const DEMO_MERCHANT_ID = 'mer_novagear_demo_01';
export const DEMO_STORE_ID = 'store_novagear_demo_01';

export const initialMerchant: Merchant = {
  id: DEMO_MERCHANT_ID,
  email: 'founder@novagear.in',
  name: 'Karan Sharma',
  companyName: 'NovaGear Performance Goods',
  createdAt: '2026-08-01T10:00:00.000Z',
  isDemo: true,
};

export const initialStoreProfile: StoreProfile = {
  id: DEMO_STORE_ID,
  merchantId: DEMO_MERCHANT_ID,
  name: 'NovaGear',
  slug: 'novagear',
  tagline: 'High-performance athletic gear engineered for the next era.',
  websiteUrl: 'https://novagear.in',
  currency: 'INR',
  country: 'IN',
  description: 'NovaGear crafts elite running shoes, wearable smart trackers, and pro audio electronics with machine-verifiable specifications.',
  contactName: 'Karan Sharma',
  email: 'founder@novagear.in',
  phone: '+91 98765 43210',
  returnPolicyDays: 14,
  returnPolicyDescription: 'Hassle-free 14-day return window with instant pickup across 19,000+ Indian pin codes. Item must be unworn with original packaging tags.',
  restockingFee: 0,
  hasFreeReturns: true,
  freeShippingThreshold: 999,
  standardDeliveryDays: 3,
  expressShippingCost: 149,
  shippingRules: [
    {
      id: 'ship_std',
      name: 'Standard Surface Shipping',
      cost: 0,
      estimatedDaysMin: 3,
      estimatedDaysMax: 5,
      isExpress: false,
    },
    {
      id: 'ship_exp',
      name: 'Razorpay Express Air Priority',
      cost: 149,
      estimatedDaysMin: 1,
      estimatedDaysMax: 2,
      isExpress: true,
    },
  ],
  supportedPaymentMethods: ['card', 'upi', 'netbanking', 'agent_token'],
  schemaOrgEnabled: true,
  hasAgentManifest: true,
  hasAgentCheckoutApi: true,
  hasStockApi: true,
  hasPriceParityGuarantee: true,
  captchaOnCheckout: false,
  isTaxInclusive: true,
  hasCaptchaBypassForAgents: true,
  monthlySimulatedAiTraffic: 24000,
  averageOrderValue: 3499,
  updatedAt: new Date().toISOString(),
};

export const initialProducts: Product[] = [
  {
    id: 'prod_shoes_01',
    merchantId: DEMO_MERCHANT_ID,
    title: 'AI-ready Running Shoes',
    handle: 'ai-ready-running-shoes',
    description: 'Engineered with dual-density nitro foam and embedded carbon propulsion plate. Fully profiled with machine-readable biometric specifications.',
    category: 'Footwear',
    basePrice: 3499,
    currency: 'INR',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    tags: ['running', 'carbon-plate', 'marathon', 'performance'],
    stockQuantity: 145,
    hasStructuredData: true,
    isAgentPurchasable: true,
    createdAt: '2026-08-10T12:00:00.000Z',
    updatedAt: '2026-08-20T12:00:00.000Z',
    specs: [
      { key: 'Weight', value: '240g (Size 9)', category: 'Physical' },
      { key: 'Heel-to-Toe Drop', value: '8mm', category: 'Geometry' },
      { key: 'Midsole Technology', value: 'Nitro Foam + Full-Length Carbon Plate', category: 'Engineering' },
      { key: 'Upper Material', value: 'Engineered Jacquard Mesh (Breathability 9.2/10)', category: 'Material' },
      { key: 'Terrain', value: 'Road / Track / Half-Marathon / Full-Marathon', category: 'Usage' },
      { key: 'Outsole', value: 'High-traction Continental Rubber compound', category: 'Durability' },
    ],
    variants: [
      {
        id: 'var_shoes_01',
        productId: 'prod_shoes_01',
        sku: 'NG-SHOE-BLK-08',
        title: 'Size UK 8 / Onyx Black',
        price: 3499,
        compareAtPrice: 4999,
        inventoryCount: 28,
        attributes: { size: 'UK 8', color: 'Onyx Black' },
        isAvailable: true,
      },
      {
        id: 'var_shoes_02',
        productId: 'prod_shoes_01',
        sku: 'NG-SHOE-BLK-09',
        title: 'Size UK 9 / Onyx Black',
        price: 3499,
        compareAtPrice: 4999,
        inventoryCount: 42,
        attributes: { size: 'UK 9', color: 'Onyx Black' },
        isAvailable: true,
      },
      {
        id: 'var_shoes_03',
        productId: 'prod_shoes_01',
        sku: 'NG-SHOE-BLK-10',
        title: 'Size UK 10 / Onyx Black',
        price: 3499,
        compareAtPrice: 4999,
        inventoryCount: 35,
        attributes: { size: 'UK 10', color: 'Onyx Black' },
        isAvailable: true,
      },
      {
        id: 'var_shoes_04',
        productId: 'prod_shoes_01',
        sku: 'NG-SHOE-WHT-09',
        title: 'Size UK 9 / Glacier White',
        price: 3499,
        compareAtPrice: 4999,
        inventoryCount: 40,
        attributes: { size: 'UK 9', color: 'Glacier White' },
        isAvailable: true,
      },
    ],
  },
  {
    id: 'prod_watch_02',
    merchantId: DEMO_MERCHANT_ID,
    title: 'Smart Fitness Watch',
    handle: 'smart-fitness-watch',
    description: 'Precision health tracker with dual-frequency GPS, medical-grade SpO2/ECG optical sensor array, and 14-day continuous battery life.',
    category: 'Wearables',
    basePrice: 5999,
    currency: 'INR',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    tags: ['fitness', 'gps', 'ecg', 'heart-rate', 'waterproof'],
    stockQuantity: 88,
    hasStructuredData: true,
    isAgentPurchasable: true,
    createdAt: '2026-08-12T12:00:00.000Z',
    updatedAt: '2026-08-22T12:00:00.000Z',
    specs: [
      { key: 'Display', value: '1.43" AMOLED 466x466 (1000 nits Peak)', category: 'Display' },
      { key: 'Battery Life', value: '14 Days typical / 38 Hours continuous GPS', category: 'Power' },
      { key: 'Sensors', value: 'Optical PPG 8-channel, SpO2, ECG, Barometer, Gyroscope', category: 'Sensors' },
      { key: 'Water Resistance', value: '5 ATM (50 meters swimming certified)', category: 'Protection' },
      { key: 'Connectivity', value: 'Bluetooth 5.3, Dual-band GNSS (GPS/GLONASS/Galileo)', category: 'Wireless' },
    ],
    variants: [
      {
        id: 'var_watch_01',
        productId: 'prod_watch_02',
        sku: 'NG-WATCH-42-BLK',
        title: '42mm Case / Stealth Black',
        price: 5999,
        compareAtPrice: 7999,
        inventoryCount: 38,
        attributes: { caseSize: '42mm', color: 'Stealth Black' },
        isAvailable: true,
      },
      {
        id: 'var_watch_02',
        productId: 'prod_watch_02',
        sku: 'NG-WATCH-46-TITAN',
        title: '46mm Case / Titanium Gray',
        price: 6499,
        compareAtPrice: 8999,
        inventoryCount: 50,
        attributes: { caseSize: '46mm', color: 'Titanium Gray' },
        isAvailable: true,
      },
    ],
  },
  {
    id: 'prod_audio_03',
    merchantId: DEMO_MERCHANT_ID,
    title: 'Wireless Earbuds',
    handle: 'wireless-earbuds-anc',
    description: 'Pro-grade spatial audio with 45dB hybrid ANC, 40ms ultra-low latency game sync, and 36-hour total playback battery case.',
    category: 'Audio',
    basePrice: 2499,
    currency: 'INR',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
    tags: ['audio', 'earbuds', 'anc', 'wireless', 'spatial-audio'],
    stockQuantity: 210,
    hasStructuredData: true,
    isAgentPurchasable: true,
    createdAt: '2026-08-14T12:00:00.000Z',
    updatedAt: '2026-08-24T12:00:00.000Z',
    specs: [
      { key: 'Noise Cancellation', value: '45dB Hybrid Active Noise Cancellation + AI ENC Mic', category: 'Acoustics' },
      { key: 'Driver Unit', value: '12.4mm Titanium Diaphragm Dynamic Drivers', category: 'Acoustics' },
      { key: 'Battery', value: '8.5h per bud + 28h charging case (36.5h Total)', category: 'Power' },
      { key: 'Fast Charging', value: '10 min charge = 3.5 hours playback (USB-C)', category: 'Power' },
      { key: 'Latency', value: '40ms Ultra-low latency gaming mode', category: 'Gaming' },
      { key: 'Water Resistance', value: 'IP55 Sweat & Dust Resistance', category: 'Protection' },
    ],
    variants: [
      {
        id: 'var_audio_01',
        productId: 'prod_audio_03',
        sku: 'NG-EAR-MATTE-BLK',
        title: 'Matte Onyx Black',
        price: 2499,
        compareAtPrice: 3999,
        inventoryCount: 110,
        attributes: { color: 'Matte Onyx Black' },
        isAvailable: true,
      },
      {
        id: 'var_audio_02',
        productId: 'prod_audio_03',
        sku: 'NG-EAR-PEARL-WHT',
        title: 'Pearl Arctic White',
        price: 2499,
        compareAtPrice: 3999,
        inventoryCount: 100,
        attributes: { color: 'Pearl Arctic White' },
        isAvailable: true,
      },
    ],
  },
];

export const initialBuyerPersonas: BuyerPersona[] = [
  {
    id: 'persona_spec_inspector',
    type: 'strict_spec_matcher',
    name: 'Autonomous Spec Inspector',
    tagline: 'Performs micro-attribute verification before executing purchase order',
    description: 'Simulates strict procurement agents that verify technical specs, materials, drop ratios, and structured JSON-LD attributes before recommending a checkout.',
    purchasingGoal: 'Verify granular micro-attributes, material composition, and Schema.org specs before issuing purchase intent.',
    budgetConstraints: 'Maximum allocation of ₹12,000. Rejects items with undisclosed dimensional specs regardless of discount.',
    evaluationCriteria: [
      'Schema.org JSON-LD AdditionalProperty validation',
      'Minimum 3 structured key-value specifications',
      'Machine-verifiable technical dimensions & materials',
      'Explicit warranty & compliance tags',
    ],
    behaviorRules: [
      'Aborts immediately if specifications are only present in unstructured marketing prose',
      'Checks Schema.org Product markup for compliance',
      'Rejects ambiguous or missing SKU identifiers',
    ],
    icon: 'Cpu',
    maxBudget: 12000,
    specStrictness: 95,
    inventoryTolerance: 90,
    policySensitivity: 75,
    maxLatencyToleranceMs: 1800,
    prefersAgentCheckoutToken: true,
    disallowsCaptcha: true,
    samplePromptQuery: 'Find a carbon-plated marathon shoe under ₹4,000 in UK size 9 with machine-readable specs and verifiable drop < 10mm.',
  },
  {
    id: 'persona_budget_optimizer',
    type: 'budget_optimizer',
    name: 'Discount & Tax Arbitrage Agent',
    tagline: 'Calculates total landing cost including shipping, GST, and coupons',
    description: 'Scans catalog endpoints for price parity, flags hidden handling fees, verifies free shipping thresholds, and rejects stores with deceptive checkout markup.',
    purchasingGoal: 'Compute exact landing cost including GST and shipping, seeking maximum price parity with zero hidden markups.',
    budgetConstraints: 'Hard cap of ₹6,500 total cart value inclusive of all delivery fees and GST.',
    evaluationCriteria: [
      'Gross price vs advertised base price parity',
      'Transparent free shipping threshold evaluation',
      'No dynamic surcharge or stealth fee at checkout',
      'Tax-inclusive GST pricing declaration',
    ],
    behaviorRules: [
      'Rejects stores with undisclosed handling fees at checkout',
      'Validates free shipping threshold against cart subtotal',
      'Fails if price exceeds ₹6,500 budget limit',
    ],
    icon: 'Percent',
    maxBudget: 6500,
    specStrictness: 70,
    inventoryTolerance: 60,
    policySensitivity: 85,
    maxLatencyToleranceMs: 2200,
    prefersAgentCheckoutToken: true,
    disallowsCaptcha: true,
    samplePromptQuery: 'Purchase a fitness smartwatch with GPS and SpO2 with total landing cost strictly under ₹6,000 inclusive of shipping.',
  },
  {
    id: 'persona_rapid_agent',
    type: 'rapid_autonomous_agent',
    name: 'High-Speed Autonomous Shopper',
    tagline: 'Zero-tolerance for human CAPTCHAs, popups, or multi-redirect checkout',
    description: 'Simulates high-velocity personal assistant agents executing instant 1-click orders via programmatic tokens. Fails immediately on anti-bot checks.',
    purchasingGoal: 'Execute instant sub-second order placement via headless machine-to-machine agent payment tokens.',
    budgetConstraints: 'Authorized for up to ₹15,000 for verified 1-click tokenized checkout.',
    evaluationCriteria: [
      'Direct server-to-server Agent Token settlement endpoint',
      'Zero anti-bot CAPTCHA / Cloudflare challenges',
      'API response latency under 800ms',
      'Instant order commitment webhook',
    ],
    behaviorRules: [
      'Immediate critical failure if interactive CAPTCHA or iframe redirect is encountered',
      'Requires Razorpay Agent Token checkout API',
      'Demands real-time stock allocation endpoint',
    ],
    icon: 'Zap',
    maxBudget: 15000,
    specStrictness: 80,
    inventoryTolerance: 95,
    policySensitivity: 60,
    maxLatencyToleranceMs: 800,
    prefersAgentCheckoutToken: true,
    disallowsCaptcha: true,
    samplePromptQuery: 'Instant order 1 unit of Wireless Earbuds with 40ms low latency to saved address using agent token authorization.',
  },
  {
    id: 'persona_multivariant_explorer',
    type: 'multi_variant_explorer',
    name: 'Variant Matrix Explorer',
    tagline: 'Traverses SKU permutations and live stock states across catalog',
    description: 'Evaluates if variant matrices (sizes, colors, specs) have explicit distinct SKUs and accurate stock states rather than fuzzy front-end dropdowns.',
    purchasingGoal: 'Traverse complex SKU matrices (sizes, colors, materials) to ensure all variant permutations have valid stock states.',
    budgetConstraints: 'Allocates up to ₹20,000 across variant combinations.',
    evaluationCriteria: [
      'Distinct SKU assigned to every variant permutation',
      'Individual inventory counts per variant',
      'No out-of-stock ghost variants presented as active',
      'Consistent pricing across attribute axes',
    ],
    behaviorRules: [
      'Inspects variant inventory arrays',
      'Aborts if selected variant has 0 inventory or missing SKU',
      'Verifies attribute key-value integrity',
    ],
    icon: 'Layers',
    maxBudget: 20000,
    specStrictness: 85,
    inventoryTolerance: 90,
    policySensitivity: 80,
    maxLatencyToleranceMs: 2000,
    prefersAgentCheckoutToken: true,
    disallowsCaptcha: true,
    samplePromptQuery: 'Check inventory for running shoes across all size/color combinations and buy the best rated variant.',
  },
  {
    id: 'persona_corporate_compliance',
    type: 'policy_sensitive_corporate',
    name: 'Enterprise Policy & Compliance Agent',
    tagline: 'Verifies GST invoices, explicit return windows, and warranty SLAs',
    description: 'Simulates B2B / corporate purchasing bots that require clear refund terms (≥14 days), unambiguous shipping SLAs, and tax invoice generation.',
    purchasingGoal: 'Procure verified catalog items meeting enterprise compliance, explicit ≥14-day return window, and GST invoicing.',
    budgetConstraints: 'Enterprise corporate budget up to ₹50,000 with mandatory GST compliance.',
    evaluationCriteria: [
      'MerchantReturnPolicy Schema with ≥14 days return window',
      'Clear hassle-free pickup and refund logistics',
      'Delivery SLA guaranteed under 5 business days',
      'Valid GST tax invoice generation',
    ],
    behaviorRules: [
      'Strictly rejects stores with "no returns" or vague discretionary policies',
      'Requires standard delivery SLA',
      'Validates merchant contact info and business registry',
    ],
    icon: 'ShieldCheck',
    maxBudget: 50000,
    specStrictness: 90,
    inventoryTolerance: 85,
    policySensitivity: 100,
    maxLatencyToleranceMs: 3000,
    prefersAgentCheckoutToken: true,
    disallowsCaptcha: false,
    samplePromptQuery: 'Procure 2 units of fitness smartwatches with valid GST tax invoice and guaranteed 14-day replacement warranty.',
  },
];

// In-Memory Database Store Class
class DatabaseStore {
  private merchants: Map<string, Merchant> = new Map();
  private storeProfiles: Map<string, StoreProfile> = new Map();
  private products: Map<string, Product> = new Map();
  private personas: Map<string, BuyerPersona> = new Map();
  private simulations: Map<string, SimulationReport> = new Map();
  private orders: Map<string, Order> = new Map();
  private razorpayOrders: Map<string, RazorpayOrder> = new Map();
  private paymentAttempts: Map<string, PaymentAttempt> = new Map();
  private credentials: Map<string, { hash: string; salt: string }> = new Map();
  private notifications: Map<string, MerchantNotification> = new Map();
  private revenueLeaks: Map<string, RevenueLeakItem> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    this.merchants.set(initialMerchant.id, { ...initialMerchant });
    this.storeProfiles.set(initialStoreProfile.id, { ...initialStoreProfile });

    for (const p of initialProducts) {
      this.products.set(p.id, JSON.parse(JSON.stringify(p)));
    }

    for (const persona of initialBuyerPersonas) {
      this.personas.set(persona.id, { ...persona });
    }

    // Seed realistic notifications for NovaGear Demo Store
    const seedNotifs: MerchantNotification[] = [
      {
        id: 'notif_demo_01',
        merchantId: DEMO_MERCHANT_ID,
        type: 'critical_readiness_failure',
        title: 'Agent Blocked: CAPTCHA on Checkout Detected',
        message: 'Autonomous Spec Inspector aborted purchase of "AI-ready Running Shoes" due to interactive Cloudflare challenge.',
        severity: 'critical',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 mins ago
        relatedEntityType: 'fix',
        relatedEntityId: 'fix_captcha_05',
        actionUrl: '/fixes',
        dedupKey: 'dedup_fix_captcha_05',
      },
      {
        id: 'notif_demo_02',
        merchantId: DEMO_MERCHANT_ID,
        type: 'high_severity_friction',
        title: 'Missing Discovery Manifest (.well-known/agent-commerce.json)',
        message: 'Agent commerce manifest not found. Autonomous buyers cannot discover machine-readable product catalog endpoints.',
        severity: 'warning',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        relatedEntityType: 'fix',
        relatedEntityId: 'fix_manifest_01',
        actionUrl: '/fixes',
        dedupKey: 'dedup_fix_manifest_01',
      },
      {
        id: 'notif_demo_03',
        merchantId: DEMO_MERCHANT_ID,
        type: 'critical_fix_resolved',
        title: 'Razorpay Agent Token Protocol Verified',
        message: 'Zero-iframe direct tokenization passed HMAC cryptographic verification in payment sandbox.',
        severity: 'success',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18 hours ago
        relatedEntityType: 'payment',
        actionUrl: '/payment_sandbox',
        dedupKey: 'dedup_payment_verified',
      },
    ];

    for (const n of seedNotifs) {
      this.notifications.set(n.id, n);
    }

    // Seed baseline simulation for instant dashboard load
    const baselineId = 'sim_baseline_novagear_01';
    const baselineReport: SimulationReport = {
      id: baselineId,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      merchantId: DEMO_MERCHANT_ID,
      storeName: 'NovaGear',
      persona: initialBuyerPersonas[0],
      evaluatedProducts: [initialProducts[0]],
      overallStatus: 'SUCCESS',
      score: {
        overallScore: 92,
        machineReadability: 95,
        apiCompleteness: 90,
        policyClarity: 90,
        pricingTransparency: 95,
        checkoutViability: 90,
        grade: 'A+',
      },
      journeySteps: [
        {
          id: 'step_1',
          stepIndex: 1,
          stage: 'intent_discovery',
          title: 'Intent & Merchant Discovery',
          status: 'pass',
          durationMs: 42,
          buyerThought: 'Parsed merchant identity for NovaGear. Store URL and structured manifest verified at 200 OK.',
          technicalInsight: 'Discovery handshake resolved in 42ms. Clean domain DNS, HTTPS certificate, and agent root discovery endpoint accessible.',
          requestPayload: { targetDomain: 'https://novagear.in', query: 'Find carbon-plated marathon shoe in UK size 9' },
          responsePayload: { status: 200, merchantId: DEMO_MERCHANT_ID, country: 'IN' },
        },
        {
          id: 'step_2',
          stepIndex: 2,
          stage: 'catalog_parsing',
          title: 'Catalog & Machine-Readable Schema Parsing',
          status: 'pass',
          durationMs: 65,
          buyerThought: 'Successfully ingested product entity "AI-ready Running Shoes". JSON-LD Schema.org Product markup detected.',
          technicalInsight: 'Machine-readable semantic tags extracted: @type "Product", name, sku, offers.price (INR 3499), availability.',
          requestPayload: { endpoint: 'https://novagear.in/.well-known/agent-commerce.json', accept: 'application/json' },
          responsePayload: { schemaOrgDetected: true, manifestDetected: true, productCount: initialProducts.length },
        },
        {
          id: 'step_3',
          stepIndex: 3,
          stage: 'spec_validation',
          title: 'Specification & Micro-Attribute Extraction',
          status: 'pass',
          durationMs: 88,
          buyerThought: 'Validated 6 technical specifications against buyer constraints. Dual-density foam and 8mm drop confirmed.',
          technicalInsight: 'Attribute parser extracted key-value pairs with 100% confidence. No contradictory marketing text or ambiguous sizing charts found.',
          requestPayload: { requiredSpecs: ['material', 'dimensions', 'drop', 'compatibility'] },
          responsePayload: { matchedSpecs: initialProducts[0].specs },
        },
        {
          id: 'step_4',
          stepIndex: 4,
          stage: 'inventory_check',
          title: 'Dynamic Inventory & Stock Verification',
          status: 'pass',
          durationMs: 72,
          buyerThought: 'Real-time stock query confirmed 145 units available. Inventory certainty satisfies my 90% threshold.',
          technicalInsight: 'Inventory probe returned HTTP 200 with deterministic stockQuantity integer. No inventory caching staleness detected.',
          requestPayload: { sku: 'NG-SHOE-BLK-09', requestedQty: 1 },
          responsePayload: { stockQuantity: 145, realtimeApi: true },
        },
        {
          id: 'step_5',
          stepIndex: 5,
          stage: 'pricing_tax_eval',
          title: 'Pricing, Taxes & Shipping Calculation',
          status: 'pass',
          durationMs: 48,
          buyerThought: 'Calculated total landing price: ₹3,499. No surprise fees detected; free shipping qualified above ₹999.',
          technicalInsight: 'Deterministic pricing matrix evaluated. Zero undisclosed handling fees or dynamic currency conversion friction.',
          requestPayload: { itemPrice: 3499, currency: 'INR', destinationPin: '560001' },
          responsePayload: { subtotal: 3499, shipping: 0, taxIncluded: true },
        },
        {
          id: 'step_6',
          stepIndex: 6,
          stage: 'policy_shipping_check',
          title: 'Return Policy & Shipping SLA Verification',
          status: 'pass',
          durationMs: 52,
          buyerThought: 'Verified 14-day return window with clear pickup logistics. Meets enterprise policy mandate.',
          technicalInsight: 'Policy schema matched standard MerchantReturnPolicy with returnPolicyCategory "MerchantReturnFiniteDays".',
          requestPayload: { requiredReturnDays: 14, corporateEntity: false },
          responsePayload: { returnWindowDays: 14, description: 'Hassle-free 14-day return window' },
        },
        {
          id: 'step_7',
          stepIndex: 7,
          stage: 'payment_negotiation',
          title: 'Autonomous Payment & Token Negotiation',
          status: 'pass',
          durationMs: 110,
          buyerThought: 'Negotiated checkout with Razorpay Agent Token. Zero interactive CAPTCHA roadblocks.',
          technicalInsight: 'Server-to-server tokenized checkout handshake established via secure Razorpay Order protocol.',
          requestPayload: { protocol: 'Razorpay-Agentic-Token-v1', amount: 3499, currency: 'INR' },
          responsePayload: { captchaTriggered: false, agentTokenAccepted: true },
        },
        {
          id: 'step_8',
          stepIndex: 8,
          stage: 'checkout_confirmation',
          title: 'Order Confirmation & Webhook Dispatch',
          status: 'pass',
          durationMs: 60,
          buyerThought: 'Autonomous purchase complete. Cryptographic order receipt received and logged.',
          technicalInsight: 'Order status confirmed: webhook dispatched, order ID generated, and idempotency key committed.',
          requestPayload: { orderAction: 'COMMIT', idempotencyKey: 'idemp_baseline_01' },
          responsePayload: { status: 'ORDER_PLACED', orderId: 'order_novagear_base_01' },
        },
      ],
      frictionPoints: [],
      revenueImpact: {
        simulatedMonthlyAiTraffic: 24000,
        averageOrderValue: 3499,
        baselineAiConversionRate: 0.045,
        actualSimulatedConversionRate: 0.041,
        estimatedMonthlyRevenueLoss: 33590,
        potentialRevenueRecovery: 28551,
        currency: 'INR',
      },
      recommendations: [
        {
          id: 'fix_manifest_01',
          title: 'Deploy Universal Commerce Protocol Manifest (.well-known/agent-commerce.json)',
          category: 'metadata',
          priority: 'P0',
          effort: '5 mins',
          impactPoints: 18,
          estimatedRevenueGain: 11756,
          explanation: 'Exposes direct JSON catalog schema and checkout API bindings for AI shopping agents.',
          fileTarget: 'public/.well-known/agent-commerce.json',
          beforeSnippet: `<!-- No agent discovery manifest detected on host -->`,
          afterSnippet: `{\n  "version": "1.0.0",\n  "protocol": "UCP-1.0",\n  "merchant": { "name": "NovaGear", "currency": "INR" },\n  "endpoints": {\n    "catalogJson": "/api/products",\n    "agentCheckout": "/api/payments/create-order"\n  }\n}`,
          applied: true,
        },
      ],
      executionTimeMs: 537,
      aiBuyerSummary: 'Autonomous purchase simulated successfully! The store "NovaGear" satisfies machine readability, structured schema, real-time inventory checks, and agent checkout token protocols.',
      isCounterfactual: false,
    };
    this.simulations.set(baselineId, baselineReport);

    // Seed realistic autonomous AI orders for NovaGear Demo Store
    const now = Date.now();
    const demoOrders: Order[] = [
      {
        id: 'ord_novagear_demo_01',
        merchantId: DEMO_MERCHANT_ID,
        orderNumber: 'ORD-2026-9101',
        customer: {
          name: 'AI Agent (Strict Spec Matcher)',
          email: 'agent.spec.strict@openai.operator.net',
          phone: '+91 98765 00101',
          shippingAddress: {
            line1: 'NovaTech Tower, 4th Floor, Indiranagar',
            line2: '100 Feet Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560038',
            country: 'IN',
          },
        },
        items: [
          {
            productId: 'prod_shoes_01',
            variantId: 'var_prod_shoes_01_01',
            title: 'AI-ready Running Shoes',
            sku: 'NG-SHOE-BLK-09',
            quantity: 1,
            unitPrice: 3499,
            subtotal: 3499,
            imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
            attributes: { Color: 'Carbon Black', Size: 'UK 9' },
          },
        ],
        pricing: {
          subtotal: 3499,
          tax: 0,
          taxRate: 0.18,
          isTaxInclusive: true,
          shippingCost: 0,
          discount: 0,
          totalAmount: 3499,
          currency: 'INR',
        },
        status: 'PAID',
        paymentStatus: 'PAID',
        source: 'simulation',
        aiMetadata: {
          personaId: 'strict_spec_matcher',
          personaType: 'strict_spec_matcher',
          personaName: 'Strict Specification Matcher',
          simulationId: baselineId,
          agentProtocol: 'UCP-1.0',
          autonomyLevel: 'L4_FULLY_AUTONOMOUS',
          idempotencyKey: 'idemp_demo_sim_9101',
          paymentAttemptId: 'att_demo_9101',
          razorpayOrderId: 'order_rzp_demo_9101',
          verificationHash: 'hmac_sha256_verified_9101',
          clientUserAgent: 'OpenAI-Operator-Shopping-Agent/1.0',
        },
        idempotencyKey: 'idemp_demo_sim_9101',
        razorpayOrderId: 'order_rzp_demo_9101',
        razorpayPaymentId: 'pay_rzp_demo_9101_ok',
        notes: 'Autonomous purchase executed via Agent Commerce Protocol UCP-1.0',
        timeline: [
          {
            id: 'tl_9101_1',
            orderId: 'ord_novagear_demo_01',
            type: 'ORDER_CREATED',
            title: 'Order Draft Created by AI Agent',
            description: 'Strict Specification Matcher selected "AI-ready Running Shoes" based on verified JSON-LD microdata.',
            status: 'SUCCESS',
            timestamp: new Date(now - 1000 * 60 * 18).toISOString(), // 18 mins ago
          },
          {
            id: 'tl_9101_2',
            orderId: 'ord_novagear_demo_01',
            type: 'INVENTORY_VALIDATED',
            title: 'Real-time Stock Locked',
            description: 'Inventory verified (145 units in stock). Reserved 1 unit for SKU NG-SHOE-BLK-09.',
            status: 'SUCCESS',
            timestamp: new Date(now - 1000 * 60 * 17.8).toISOString(),
          },
          {
            id: 'tl_9101_3',
            orderId: 'ord_novagear_demo_01',
            type: 'CHECKOUT_STARTED',
            title: 'Zero-Iframe Agent Checkout Initiated',
            description: 'Order total ₹3,499 calculated server-side. Pre-authorized payment token submitted.',
            status: 'SUCCESS',
            timestamp: new Date(now - 1000 * 60 * 17.5).toISOString(),
          },
          {
            id: 'tl_9101_4',
            orderId: 'ord_novagear_demo_01',
            type: 'PAYMENT_AUTHORIZED',
            title: 'Razorpay Agent Token Authorized',
            description: 'Direct settlement approved without browser redirect or interactive CAPTCHA. Payment ID: pay_rzp_demo_9101_ok.',
            status: 'SUCCESS',
            timestamp: new Date(now - 1000 * 60 * 17.2).toISOString(),
          },
          {
            id: 'tl_9101_5',
            orderId: 'ord_novagear_demo_01',
            type: 'WEBHOOK_RECEIVED',
            title: 'payment.captured Webhook Ingested',
            description: 'Cryptographic HMAC-SHA256 signature verified against merchant webhook secret.',
            status: 'SUCCESS',
            timestamp: new Date(now - 1000 * 60 * 17.0).toISOString(),
          },
          {
            id: 'tl_9101_6',
            orderId: 'ord_novagear_demo_01',
            type: 'ORDER_CONFIRMED',
            title: 'Order Settled & Confirmed',
            description: 'Autonomous purchase completed successfully. Commercial invoice and tracking generated.',
            status: 'SUCCESS',
            timestamp: new Date(now - 1000 * 60 * 16.8).toISOString(),
          },
          {
            id: 'tl_9101_7',
            orderId: 'ord_novagear_demo_01',
            type: 'INVENTORY_UPDATED',
            title: 'Inventory Decremented',
            description: 'Catalog stock updated to reflect fulfilled order.',
            status: 'SUCCESS',
            timestamp: new Date(now - 1000 * 60 * 16.5).toISOString(),
          },
        ],
        createdAt: new Date(now - 1000 * 60 * 18).toISOString(),
        updatedAt: new Date(now - 1000 * 60 * 16.5).toISOString(),
        completedAt: new Date(now - 1000 * 60 * 16.8).toISOString(),
        isSimulated: true,
        isTestMode: true,
      },
      {
        id: 'ord_novagear_demo_02',
        merchantId: DEMO_MERCHANT_ID,
        orderNumber: 'ORD-2026-9102',
        customer: {
          name: 'B2B Enterprise Procurement Bot',
          email: 'procurement.bot@tata-corp.com',
          phone: '+91 98765 00102',
          shippingAddress: {
            line1: 'Tata Consultancy Services Cyber Park',
            line2: 'Electronic City Phase II',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560100',
            country: 'IN',
          },
        },
        items: [
          {
            productId: 'prod_watch_02',
            variantId: 'var_prod_watch_02_01',
            title: 'Precision Smart Tracker Pro',
            sku: 'NG-WTCH-SIL-01',
            quantity: 2,
            unitPrice: 4499,
            subtotal: 8998,
            imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&auto=format&fit=crop&q=80',
            attributes: { Finish: 'Titanium Silver', Band: 'Fluororubber' },
          },
        ],
        pricing: {
          subtotal: 8998,
          tax: 0,
          taxRate: 0.18,
          isTaxInclusive: true,
          shippingCost: 0,
          discount: 0,
          totalAmount: 8998,
          currency: 'INR',
        },
        status: 'PAID',
        paymentStatus: 'PAID',
        source: 'direct_agent',
        aiMetadata: {
          personaId: 'policy_sensitive_corporate',
          personaType: 'policy_sensitive_corporate',
          personaName: 'Enterprise Policy & Compliance Agent',
          agentProtocol: 'AgentCommerce-v1',
          autonomyLevel: 'L4_FULLY_AUTONOMOUS',
          idempotencyKey: 'idemp_demo_corp_9102',
          paymentAttemptId: 'att_demo_9102',
          razorpayOrderId: 'order_rzp_demo_9102',
          verificationHash: 'hmac_sha256_verified_9102',
          clientUserAgent: 'Claude-Enterprise-Procure/3.5',
        },
        idempotencyKey: 'idemp_demo_corp_9102',
        razorpayOrderId: 'order_rzp_demo_9102',
        razorpayPaymentId: 'pay_rzp_demo_9102_ok',
        notes: 'Corporate procurement order with 14-day warranty validation and GST invoicing.',
        timeline: [
          {
            id: 'tl_9102_1',
            orderId: 'ord_novagear_demo_02',
            type: 'ORDER_CREATED',
            title: 'Enterprise Order Created',
            description: 'Procurement bot matched corporate return policy (14 days) and GST tax compliance.',
            status: 'SUCCESS',
            timestamp: new Date(now - 1000 * 60 * 55).toISOString(),
          },
          {
            id: 'tl_9102_2',
            orderId: 'ord_novagear_demo_02',
            type: 'INVENTORY_VALIDATED',
            title: 'Stock Allocation Locked',
            description: 'Reserved 2 units for SKU NG-WTCH-SIL-01.',
            status: 'SUCCESS',
            timestamp: new Date(now - 1000 * 60 * 54.8).toISOString(),
          },
          {
            id: 'tl_9102_3',
            orderId: 'ord_novagear_demo_02',
            type: 'PAYMENT_AUTHORIZED',
            title: 'Corporate Spending Token Settled',
            description: 'Amount ₹8,998 debited from pre-authorized enterprise budget cap.',
            status: 'SUCCESS',
            timestamp: new Date(now - 1000 * 60 * 54.2).toISOString(),
          },
          {
            id: 'tl_9102_4',
            orderId: 'ord_novagear_demo_02',
            type: 'ORDER_CONFIRMED',
            title: 'Order Confirmed & Awaiting Dispatch',
            description: 'Fulfillment dispatched to warehouse logistics team.',
            status: 'SUCCESS',
            timestamp: new Date(now - 1000 * 60 * 53.8).toISOString(),
          },
        ],
        createdAt: new Date(now - 1000 * 60 * 55).toISOString(),
        updatedAt: new Date(now - 1000 * 60 * 53.8).toISOString(),
        completedAt: new Date(now - 1000 * 60 * 53.8).toISOString(),
        isSimulated: false,
        isTestMode: true,
      },
      {
        id: 'ord_novagear_demo_03',
        merchantId: DEMO_MERCHANT_ID,
        orderNumber: 'ORD-2026-9103',
        customer: {
          name: 'Rapid Autonomous Consumer Bot',
          email: 'agent.rapid@anthropic.claude.ai',
          phone: '+91 98765 00103',
          shippingAddress: {
            line1: 'Flat 302, Prestige Palms',
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400050',
            country: 'IN',
          },
        },
        items: [
          {
            productId: 'prod_earbuds_03',
            variantId: 'var_prod_earbuds_03_01',
            title: 'Spatial ANC Wireless Earbuds',
            sku: 'NG-EAR-MAT-01',
            quantity: 1,
            unitPrice: 2499,
            subtotal: 2499,
            imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
            attributes: { Color: 'Matte Graphite' },
          },
        ],
        pricing: {
          subtotal: 2499,
          tax: 0,
          taxRate: 0.18,
          isTaxInclusive: true,
          shippingCost: 149,
          discount: 0,
          totalAmount: 2648,
          currency: 'INR',
        },
        status: 'PROCESSING',
        paymentStatus: 'PAID',
        source: 'sandbox_test',
        aiMetadata: {
          personaId: 'rapid_autonomous_agent',
          personaType: 'rapid_autonomous_agent',
          personaName: 'Rapid Autonomous Checkout Agent',
          agentProtocol: 'UCP-1.0',
          autonomyLevel: 'L4_FULLY_AUTONOMOUS',
          idempotencyKey: 'idemp_demo_rapid_9103',
          paymentAttemptId: 'att_demo_9103',
          razorpayOrderId: 'order_rzp_demo_9103',
          verificationHash: 'hmac_sha256_verified_9103',
        },
        idempotencyKey: 'idemp_demo_rapid_9103',
        razorpayOrderId: 'order_rzp_demo_9103',
        razorpayPaymentId: 'pay_rzp_demo_9103_ok',
        notes: 'Priority express delivery requested (+₹149).',
        timeline: [
          {
            id: 'tl_9103_1',
            orderId: 'ord_novagear_demo_03',
            type: 'ORDER_CREATED',
            title: 'Rapid Order Created',
            description: 'Completed in <600ms latency window.',
            status: 'SUCCESS',
            timestamp: new Date(now - 1000 * 60 * 120).toISOString(),
          },
          {
            id: 'tl_9103_2',
            orderId: 'ord_novagear_demo_03',
            type: 'PAYMENT_AUTHORIZED',
            title: 'Payment Authorized',
            description: 'Razorpay test token processed.',
            status: 'SUCCESS',
            timestamp: new Date(now - 1000 * 60 * 119.5).toISOString(),
          },
          {
            id: 'tl_9103_3',
            orderId: 'ord_novagear_demo_03',
            type: 'ORDER_CONFIRMED',
            title: 'Order Processing',
            description: 'Fulfillment queue assigned to express priority hub.',
            status: 'SUCCESS',
            timestamp: new Date(now - 1000 * 60 * 119.0).toISOString(),
          },
        ],
        createdAt: new Date(now - 1000 * 60 * 120).toISOString(),
        updatedAt: new Date(now - 1000 * 60 * 119.0).toISOString(),
        completedAt: new Date(now - 1000 * 60 * 119.0).toISOString(),
        isSimulated: true,
        isTestMode: true,
      },
      {
        id: 'ord_novagear_demo_04',
        merchantId: DEMO_MERCHANT_ID,
        orderNumber: 'ORD-2026-9104',
        customer: {
          name: 'Flash Deal AI Bot',
          email: 'budget.shopper@agentic.shopping',
          phone: '+91 98765 00104',
        },
        items: [
          {
            productId: 'prod_shoes_01',
            variantId: 'var_prod_shoes_01_01',
            title: 'AI-ready Running Shoes',
            sku: 'NG-SHOE-BLK-09',
            quantity: 1,
            unitPrice: 3499,
            subtotal: 3499,
            imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
          },
        ],
        pricing: {
          subtotal: 3499,
          tax: 0,
          taxRate: 0.18,
          isTaxInclusive: true,
          shippingCost: 0,
          discount: 0,
          totalAmount: 3499,
          currency: 'INR',
        },
        status: 'FAILED',
        paymentStatus: 'FAILED',
        source: 'simulation',
        aiMetadata: {
          personaId: 'budget_optimizer',
          personaType: 'budget_optimizer',
          personaName: 'Budget & Discount Optimizer',
          simulationId: 'sim_demo_failed_01',
          idempotencyKey: 'idemp_demo_fail_9104',
        },
        idempotencyKey: 'idemp_demo_fail_9104',
        cancellationReason: 'Agent wallet allowance limit exceeded (Max budget: ₹3,000)',
        timeline: [
          {
            id: 'tl_9104_1',
            orderId: 'ord_novagear_demo_04',
            type: 'ORDER_CREATED',
            title: 'Checkout Attempt Created',
            description: 'Budget optimizer initiated checkout at ₹3,499.',
            status: 'SUCCESS',
            timestamp: new Date(now - 1000 * 60 * 240).toISOString(),
          },
          {
            id: 'tl_9104_2',
            orderId: 'ord_novagear_demo_04',
            type: 'PAYMENT_FAILED',
            title: 'Payment Authorization Rejected',
            description: 'AI Buyer wallet spending limit exceeded budget constraint (₹3,000 threshold).',
            status: 'FAILED',
            timestamp: new Date(now - 1000 * 60 * 239.5).toISOString(),
          },
        ],
        createdAt: new Date(now - 1000 * 60 * 240).toISOString(),
        updatedAt: new Date(now - 1000 * 60 * 239.5).toISOString(),
        isSimulated: true,
        isTestMode: true,
      },
      {
        id: 'ord_novagear_demo_05',
        merchantId: DEMO_MERCHANT_ID,
        orderNumber: 'ORD-2026-9105',
        customer: {
          name: 'Corporate Fleet Agent',
          email: 'fleet.bot@wipro.com',
          phone: '+91 98765 00105',
        },
        items: [
          {
            productId: 'prod_watch_02',
            variantId: 'var_prod_watch_02_01',
            title: 'Precision Smart Tracker Pro',
            sku: 'NG-WTCH-SIL-01',
            quantity: 1,
            unitPrice: 4499,
            subtotal: 4499,
            imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&auto=format&fit=crop&q=80',
          },
        ],
        pricing: {
          subtotal: 4499,
          tax: 0,
          taxRate: 0.18,
          isTaxInclusive: true,
          shippingCost: 0,
          discount: 0,
          totalAmount: 4499,
          currency: 'INR',
        },
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        source: 'api',
        aiMetadata: {
          personaId: 'policy_sensitive_corporate',
          personaType: 'policy_sensitive_corporate',
          idempotencyKey: 'idemp_demo_cancel_9105',
        },
        idempotencyKey: 'idemp_demo_cancel_9105',
        cancelledAt: new Date(now - 1000 * 60 * 300).toISOString(),
        cancellationReason: 'Autonomous Agent submitted pre-fulfillment cancellation per corporate policy update.',
        timeline: [
          {
            id: 'tl_9105_1',
            orderId: 'ord_novagear_demo_05',
            type: 'ORDER_CREATED',
            title: 'Order Placed',
            description: 'Initial order authorized.',
            status: 'SUCCESS',
            timestamp: new Date(now - 1000 * 60 * 360).toISOString(),
          },
          {
            id: 'tl_9105_2',
            orderId: 'ord_novagear_demo_05',
            type: 'PAYMENT_AUTHORIZED',
            title: 'Payment Paid',
            description: 'Payment token authorized.',
            status: 'SUCCESS',
            timestamp: new Date(now - 1000 * 60 * 359).toISOString(),
          },
          {
            id: 'tl_9105_3',
            orderId: 'ord_novagear_demo_05',
            type: 'ORDER_CANCELLED',
            title: 'Order Cancelled by Agent',
            description: 'Automated cancellation requested before warehouse packing.',
            status: 'WARNING',
            timestamp: new Date(now - 1000 * 60 * 300).toISOString(),
          },
          {
            id: 'tl_9105_4',
            orderId: 'ord_novagear_demo_05',
            type: 'REFUND_INITIATED',
            title: 'Automated Refund Credited',
            description: '₹4,499 returned to AI Agent pre-authorized corporate allowance.',
            status: 'INFO',
            timestamp: new Date(now - 1000 * 60 * 299).toISOString(),
          },
        ],
        createdAt: new Date(now - 1000 * 60 * 360).toISOString(),
        updatedAt: new Date(now - 1000 * 60 * 299).toISOString(),
        isSimulated: false,
        isTestMode: true,
      },
    ];

    for (const order of demoOrders) {
      this.orders.set(order.id, order);
    }
  }

  // Merchant operations
  getMerchant(id: string): Merchant | undefined {
    return this.merchants.get(id);
  }

  async getMerchantAsync(id: string): Promise<Merchant | undefined> {
    const cached = this.merchants.get(id);
    if (cached) return cached;
    const remote = await supabaseDb.getMerchant(id);
    if (remote) {
      this.merchants.set(remote.id, remote);
      return remote;
    }
    return undefined;
  }

  getMerchantByEmail(email: string): Merchant | undefined {
    return Array.from(this.merchants.values()).find((m) => m.email.toLowerCase() === email.toLowerCase());
  }

  async getMerchantByEmailAsync(email: string): Promise<Merchant | undefined> {
    const cached = this.getMerchantByEmail(email);
    if (cached) return cached;
    const remote = await supabaseDb.getMerchantByEmail(email);
    if (remote) {
      this.merchants.set(remote.id, remote);
      return remote;
    }
    return undefined;
  }

  saveMerchant(merchant: Merchant): Merchant {
    this.merchants.set(merchant.id, merchant);
    // Background async sync to Supabase
    supabaseDb.saveMerchant(merchant).catch((err) => {
      console.warn('[DB] Supabase merchant sync:', err);
    });
    return merchant;
  }

  updateMerchant(merchantId: string, updates: Partial<Merchant>): Merchant {
    const current = this.getMerchant(merchantId);
    if (!current) {
      throw new Error('Merchant not found');
    }
    const updated: Merchant = {
      ...current,
      ...updates,
      id: current.id, // Immutable ID
    };
    return this.saveMerchant(updated);
  }

  saveCredentials(merchantId: string, hash: string, salt: string) {
    this.credentials.set(merchantId, { hash, salt });
  }

  getCredentials(merchantId: string): { hash: string; salt: string } | undefined {
    return this.credentials.get(merchantId);
  }

  // Store operations
  getStoreProfile(merchantId: string): StoreProfile | undefined {
    return Array.from(this.storeProfiles.values()).find((s) => s.merchantId === merchantId);
  }

  async getStoreProfileAsync(merchantId: string): Promise<StoreProfile | undefined> {
    const cached = this.getStoreProfile(merchantId);
    if (cached) return cached;
    const remote = await supabaseDb.getStoreProfile(merchantId);
    if (remote) {
      this.storeProfiles.set(remote.id, remote);
      return remote;
    }
    return undefined;
  }

  updateStoreProfile(merchantId: string, updates: Partial<StoreProfile>): StoreProfile {
    let current = this.getStoreProfile(merchantId);
    if (!current) {
      current = {
        id: `store_${merchantId}`,
        merchantId,
        name: updates.name || 'My Store',
        slug: updates.slug || 'my-store',
        tagline: updates.tagline || '',
        websiteUrl: updates.websiteUrl || 'https://mystore.com',
        currency: updates.currency || 'INR',
        country: updates.country || 'IN',
        description: updates.description || '',
        contactName: updates.contactName,
        email: updates.email,
        phone: updates.phone,
        returnPolicyDays: updates.returnPolicyDays ?? 14,
        returnPolicyDescription: updates.returnPolicyDescription || '',
        restockingFee: updates.restockingFee ?? 0,
        hasFreeReturns: updates.hasFreeReturns ?? true,
        freeShippingThreshold: updates.freeShippingThreshold ?? 999,
        standardDeliveryDays: updates.standardDeliveryDays ?? 3,
        expressShippingCost: updates.expressShippingCost ?? 149,
        shippingRules: updates.shippingRules || [],
        supportedPaymentMethods: updates.supportedPaymentMethods || ['card', 'upi', 'agent_token'],
        schemaOrgEnabled: updates.schemaOrgEnabled ?? true,
        hasAgentManifest: updates.hasAgentManifest ?? true,
        hasAgentCheckoutApi: updates.hasAgentCheckoutApi ?? true,
        hasStockApi: updates.hasStockApi ?? true,
        hasPriceParityGuarantee: updates.hasPriceParityGuarantee ?? true,
        captchaOnCheckout: updates.captchaOnCheckout ?? false,
        isTaxInclusive: updates.isTaxInclusive ?? true,
        hasCaptchaBypassForAgents: updates.hasCaptchaBypassForAgents ?? true,
        monthlySimulatedAiTraffic: updates.monthlySimulatedAiTraffic ?? 15000,
        averageOrderValue: updates.averageOrderValue ?? 3499,
        updatedAt: new Date().toISOString(),
      };
    } else {
      current = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    }
    this.storeProfiles.set(current.id, current);
    supabaseDb.saveStoreProfile(current).catch((err) => {
      console.warn('[DB] Supabase store profile sync:', err);
    });
    return current;
  }

  // Products
  getProducts(merchantId: string): Product[] {
    return Array.from(this.products.values()).filter((p) => p.merchantId === merchantId);
  }

  async getProductsAsync(merchantId: string): Promise<Product[]> {
    const cached = this.getProducts(merchantId);
    if (cached.length > 0) return cached;
    const remote = await supabaseDb.getProducts(merchantId);
    if (remote && remote.length > 0) {
      remote.forEach((p) => this.products.set(p.id, p));
      return remote;
    }
    return cached;
  }

  getProduct(id: string): Product | undefined {
    return this.products.get(id);
  }

  saveProduct(product: Product): Product {
    this.products.set(product.id, product);
    supabaseDb.saveProduct(product).catch((err) => {
      console.warn('[DB] Supabase product sync:', err);
    });
    return product;
  }

  updateProductStock(id: string, stockQuantity: number): Product | undefined {
    const product = this.products.get(id);
    if (!product) return undefined;

    const cleanQty = Math.max(0, Math.floor(stockQuantity));
    product.stockQuantity = cleanQty;
    product.updatedAt = new Date().toISOString();

    // If product has variants, update primary variant or distribute
    if (product.variants && product.variants.length > 0) {
      product.variants[0].inventoryCount = cleanQty;
      product.variants[0].isAvailable = cleanQty > 0;
    }

    this.products.set(product.id, product);
    supabaseDb.saveProduct(product).catch((err) => {
      console.warn('[DB] Supabase stock sync:', err);
    });
    return product;
  }

  deleteProduct(id: string): boolean {
    const deleted = this.products.delete(id);
    supabaseDb.deleteProduct(id).catch((err) => {
      console.warn('[DB] Supabase product delete sync:', err);
    });
    return deleted;
  }

  // Personas
  getPersonas(): BuyerPersona[] {
    return Array.from(this.personas.values());
  }

  getPersona(id: string): BuyerPersona | undefined {
    return this.personas.get(id);
  }

  // Simulations
  saveSimulation(report: SimulationReport): SimulationReport {
    this.simulations.set(report.id, report);
    supabaseDb.saveSimulation(report).catch((err) => {
      console.warn('[DB] Supabase simulation sync:', err);
    });
    return report;
  }

  getSimulation(id: string): SimulationReport | undefined {
    return this.simulations.get(id);
  }

  async getSimulationAsync(id: string): Promise<SimulationReport | undefined> {
    const cached = this.simulations.get(id);
    if (cached) return cached;
    const remote = await supabaseDb.getSimulation(id);
    if (remote) {
      this.simulations.set(remote.id, remote);
      return remote;
    }
    return undefined;
  }

  getSimulationHistory(merchantId: string): SimulationHistoryItem[] {
    return Array.from(this.simulations.values())
      .filter((s) => s.merchantId === merchantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
        storeName: s.storeName,
        personaName: s.persona.name,
        personaType: s.persona.type,
        productTitle: s.evaluatedProducts?.[0]?.title || 'Store Catalog',
        productId: s.evaluatedProducts?.[0]?.id,
        overallScore: s.score.overallScore,
        grade: s.score.grade,
        status: s.overallStatus,
        revenueLoss: s.revenueImpact.estimatedMonthlyRevenueLoss,
        frictionCount: s.frictionPoints.length,
        executionTimeMs: s.executionTimeMs,
        executionMode: s.executionMode || 'gemini_ai',
      }));
  }

  // Fixes & Recommendations Queue
  getMerchantFixes(merchantId: string): AgentReadyFix[] {
    const store = this.getStoreProfile(merchantId);
    const storeName = store?.name || 'Your Store';
    const currency = store?.currency || 'INR';

    return [
      {
        id: 'fix_manifest_01',
        title: 'Deploy Universal Commerce Protocol Manifest (/.well-known/agent-commerce.json)',
        category: 'metadata',
        priority: 'P0',
        effort: '5 mins',
        impactPoints: 18,
        estimatedRevenueGain: 65000,
        explanation: 'Exposes direct JSON catalog schema and checkout API bindings for AI shopping agents (ChatGPT Operator, Google Project Mariner, Perplexity Shopping).',
        fileTarget: 'public/.well-known/agent-commerce.json',
        beforeSnippet: `<!-- No machine-readable discovery manifest detected on host -->\nHTTP 404 Not Found on /.well-known/agent-commerce.json`,
        afterSnippet: `{\n  "version": "1.0.0",\n  "protocol": "UCP-1.0",\n  "merchant": {\n    "name": "${storeName}",\n    "currency": "${currency}"\n  },\n  "endpoints": {\n    "catalogJson": "/api/products",\n    "agentCheckout": "/api/payments/create-order"\n  }\n}`,
        applied: Boolean(store?.hasAgentManifest),
      },
      {
        id: 'fix_agent_token_02',
        title: 'Enable Razorpay Agentic Payment Tokenization & Remove Iframe Redirects',
        category: 'payment',
        priority: 'P0',
        effort: '15 mins',
        impactPoints: 24,
        estimatedRevenueGain: 95000,
        explanation: 'Allows autonomous agents with pre-authorized spending caps to commit orders without failing on 3DS browser redirects or human CAPTCHAs.',
        fileTarget: 'server/payment.ts',
        beforeSnippet: `// Standard Web redirect flow requiring human browser session\nres.redirect('/checkout/razorpay-hosted');`,
        afterSnippet: `// Server-to-server Agent Token settlement\nconst payment = await razorpay.orders.create({\n  amount: order.amount,\n  currency: "${currency}",\n  notes: { agent_token: req.headers['x-agent-auth-token'] }\n});`,
        applied: Boolean(store?.hasAgentCheckoutApi),
      },
      {
        id: 'fix_return_policy_03',
        title: 'Publish Machine-Readable 14-Day MerchantReturnPolicy Schema',
        category: 'policy',
        priority: 'P1',
        effort: '5 mins',
        impactPoints: 12,
        estimatedRevenueGain: 35000,
        explanation: 'Autonomous corporate and consumer bots mandate a verifiable return policy (≥14 days) before authorizing automated transactions.',
        fileTarget: 'public/index.html',
        beforeSnippet: `<p>Returns accepted within our discretion.</p>`,
        afterSnippet: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "MerchantReturnPolicy",\n  "applicableCountry": "${store?.country || 'IN'}",\n  "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteDays",\n  "merchantReturnDays": ${store?.returnPolicyDays || 14}\n}\n</script>`,
        applied: Boolean((store?.returnPolicyDays || 0) >= 14),
      },
      {
        id: 'fix_stock_api_04',
        title: 'Provide Real-time Stock Allocation & Lock Webhook',
        category: 'api',
        priority: 'P1',
        effort: '30 mins',
        impactPoints: 14,
        estimatedRevenueGain: 45000,
        explanation: 'Guarantees inventory reservation during the agent settlement phase to eliminate post-transaction out-of-stock cancellations.',
        fileTarget: 'server/routes/inventory.ts',
        beforeSnippet: `// Static stock query\nSELECT stock FROM products WHERE id = $1;`,
        afterSnippet: `// Atomic stock reservation for AI agent\nUPDATE products SET stock = stock - 1 WHERE id = $1 AND stock > 0 RETURNING true;`,
        applied: Boolean(store?.hasStockApi),
      },
      {
        id: 'fix_captcha_05',
        title: 'Bypass Interactive CAPTCHA for Authenticated Agent Tokens',
        category: 'payment',
        priority: 'P0',
        effort: '15 mins',
        impactPoints: 20,
        estimatedRevenueGain: 80000,
        explanation: 'Interactive Cloudflare and reCAPTCHA challenges block 100% of autonomous purchasing agents. Safely bypass challenges when valid cryptographic agent tokens are provided.',
        fileTarget: 'server/middleware/botProtection.ts',
        beforeSnippet: `// Blocks all programmatic user agents\nif (!req.headers['sec-ch-ua']) return res.status(403).json({ error: 'CAPTCHA challenge required' });`,
        afterSnippet: `// Allows verified agent token headers\nif (req.headers['x-agent-auth-token'] && verifyAgentToken(req.headers['x-agent-auth-token'])) {\n  return next(); // bypass human captcha\n}`,
        applied: Boolean(!store?.captchaOnCheckout),
      },
    ];
  }

  applyFix(merchantId: string, fixId: string, apply: boolean = true): StoreProfile {
    const store = this.getStoreProfile(merchantId);
    if (!store) {
      throw new Error('Store profile not found');
    }

    const updates: Partial<StoreProfile> = {};
    if (fixId === 'fix_manifest_01') {
      updates.hasAgentManifest = apply;
    } else if (fixId === 'fix_agent_token_02') {
      updates.hasAgentCheckoutApi = apply;
      if (apply) updates.captchaOnCheckout = false;
    } else if (fixId === 'fix_return_policy_03') {
      updates.returnPolicyDays = apply ? 14 : 0;
    } else if (fixId === 'fix_stock_api_04') {
      updates.hasStockApi = apply;
    } else if (fixId === 'fix_captcha_05') {
      updates.captchaOnCheckout = !apply;
    }

    const updatedStore = this.updateStoreProfile(merchantId, updates);

    // Sync corresponding revenue leak status if present
    const matchingLeaks = this.getRevenueLeaksByMerchant(merchantId).filter((l) => l.relatedFixId === fixId);
    for (const leak of matchingLeaks) {
      leak.status = apply ? 'RESOLVED' : 'OPEN';
      leak.updatedAt = new Date().toISOString();
      leak.resolvedAt = apply ? new Date().toISOString() : undefined;
      this.saveRevenueLeak(leak);
    }

    return updatedStore;
  }

  // Revenue Leak Operations
  saveRevenueLeak(leak: RevenueLeakItem): RevenueLeakItem {
    this.revenueLeaks.set(leak.id, leak);
    supabaseDb.saveRevenueLeak(leak).catch((err) => {
      console.warn('[DB] Supabase revenue leak sync:', err);
    });
    return leak;
  }

  getRevenueLeaksByMerchant(merchantId: string): RevenueLeakItem[] {
    const list = Array.from(this.revenueLeaks.values()).filter(
      (l) => l.merchantId === merchantId || (!l.merchantId && merchantId === DEMO_MERCHANT_ID)
    );
    return list.sort((a, b) => {
      // Critical first, then by estimated revenue loss descending
      const sevOrder: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };
      const diff = (sevOrder[b.severity] || 0) - (sevOrder[a.severity] || 0);
      if (diff !== 0) return diff;
      return b.estimatedRevenueAtRisk - a.estimatedRevenueAtRisk;
    });
  }

  async getRevenueLeaksAsync(merchantId: string): Promise<RevenueLeakItem[]> {
    const remote = await supabaseDb.getRevenueLeaks(merchantId);
    if (remote && remote.length > 0) {
      for (const l of remote) {
        this.revenueLeaks.set(l.id, l);
      }
      return remote;
    }
    return this.getRevenueLeaksByMerchant(merchantId);
  }

  getRevenueLeakById(id: string, merchantId: string): RevenueLeakItem | undefined {
    const leak = this.revenueLeaks.get(id);
    if (leak && (leak.merchantId === merchantId || merchantId === DEMO_MERCHANT_ID)) {
      return leak;
    }
    return undefined;
  }

  updateRevenueLeakStatus(id: string, status: RevenueLeakStatus, merchantId: string): RevenueLeakItem | undefined {
    const leak = this.getRevenueLeakById(id, merchantId);
    if (!leak) return undefined;
    leak.status = status;
    leak.updatedAt = new Date().toISOString();
    leak.resolvedAt = status === 'RESOLVED' ? new Date().toISOString() : undefined;
    return this.saveRevenueLeak(leak);
  }

  // Aggregate Revenue Leaks (Legacy summary support)
  getRevenueLeaks(merchantId: string): {
    totalEstimatedLoss: number;
    frictionCount: number;
    topFrictionPoints: FrictionPoint[];
  } {
    const sims = Array.from(this.simulations.values()).filter((s) => s.merchantId === merchantId);
    const latestSim = sims.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    if (!latestSim) {
      return {
        totalEstimatedLoss: 0,
        frictionCount: 0,
        topFrictionPoints: [],
      };
    }

    return {
      totalEstimatedLoss: latestSim.revenueImpact.estimatedMonthlyRevenueLoss,
      frictionCount: latestSim.frictionPoints.length,
      topFrictionPoints: latestSim.frictionPoints,
    };
  }

  // -------------------------------------------------------------
  // Razorpay Raw Orders (for Payment Gateway Low-Level Primitives)
  // -------------------------------------------------------------
  saveRazorpayOrder(order: RazorpayOrder): RazorpayOrder {
    this.razorpayOrders.set(order.orderId, order);
    return order;
  }

  getRazorpayOrder(orderId: string): RazorpayOrder | undefined {
    return this.razorpayOrders.get(orderId);
  }

  // -------------------------------------------------------------
  // Full Autonomous Order & Checkout Domain Lifecycle Operations
  // -------------------------------------------------------------
  saveOrder(order: Order): Order {
    this.orders.set(order.id, order);
    // Background sync to Supabase
    supabaseDb.saveOrder(order).catch((err) => {
      console.warn('[DB] Supabase order sync:', err);
    });
    return order;
  }

  getOrder(orderId: string, merchantId?: string): Order | undefined {
    const order = this.orders.get(orderId);
    if (!order) return undefined;
    if (merchantId && order.merchantId !== merchantId && !(merchantId === DEMO_MERCHANT_ID && order.merchantId === DEMO_MERCHANT_ID)) {
      return undefined;
    }
    return order;
  }

  async getOrderAsync(orderId: string, merchantId?: string): Promise<Order | undefined> {
    const cached = this.getOrder(orderId, merchantId);
    if (cached) return cached;
    const remote = await supabaseDb.getOrder(orderId);
    if (remote) {
      if (merchantId && remote.merchantId !== merchantId && !(merchantId === DEMO_MERCHANT_ID && remote.merchantId === DEMO_MERCHANT_ID)) {
        return undefined;
      }
      this.orders.set(remote.id, remote);
      return remote;
    }
    return undefined;
  }

  getOrders(merchantId: string, filters?: { status?: OrderStatus; source?: OrderSource; search?: string }): Order[] {
    let list = Array.from(this.orders.values()).filter(
      (o) => o.merchantId === merchantId || (!o.merchantId && merchantId === DEMO_MERCHANT_ID)
    );

    if (filters?.status) {
      list = list.filter((o) => o.status === filters.status);
    }
    if (filters?.source) {
      list = list.filter((o) => o.source === filters.source);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.email.toLowerCase().includes(q) ||
          o.items.some((i) => i.title.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getOrdersAsync(merchantId: string, filters?: { status?: OrderStatus; source?: OrderSource; search?: string }): Promise<Order[]> {
    const cached = this.getOrders(merchantId, filters);
    const remote = await supabaseDb.getOrders(merchantId);
    if (remote && remote.length > 0) {
      for (const r of remote) {
        this.orders.set(r.id, r);
      }
      return this.getOrders(merchantId, filters);
    }
    return cached;
  }

  getOrdersSummary(merchantId: string): OrderSummary {
    const orders = this.getOrders(merchantId);
    const paidOrders = orders.filter((o) => o.status === 'PAID' || o.status === 'PROCESSING' || o.status === 'SHIPPED' || o.status === 'DELIVERED');
    const pendingOrders = orders.filter((o) => o.status === 'PENDING' || o.status === 'PAYMENT_PENDING');
    const failedOrders = orders.filter((o) => o.status === 'FAILED');
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED' || o.status === 'REFUNDED');
    
    const totalOrderValue = paidOrders.reduce((sum, o) => sum + (o.pricing?.totalAmount || 0), 0);
    const averageOrderValue = paidOrders.length > 0 ? Math.round(totalOrderValue / paidOrders.length) : 0;
    const simulatedOrdersCount = orders.filter((o) => o.isSimulated || o.source === 'simulation').length;
    const testModeOrdersCount = orders.filter((o) => o.isTestMode).length;

    return {
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      pendingOrders: pendingOrders.length,
      failedOrders: failedOrders.length,
      cancelledOrders: cancelledOrders.length,
      totalOrderValue,
      averageOrderValue,
      simulatedOrdersCount,
      testModeOrdersCount,
      currency: 'INR',
    };
  }

  addOrderTimelineEvent(orderId: string, event: Omit<OrderTimelineEvent, 'id' | 'timestamp'>, merchantId?: string): Order | undefined {
    const order = this.getOrder(orderId, merchantId);
    if (!order) return undefined;
    const timelineEvent: OrderTimelineEvent = {
      ...event,
      id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    order.timeline = [...(order.timeline || []), timelineEvent];
    order.updatedAt = new Date().toISOString();
    return this.saveOrder(order);
  }

  updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus,
    metadata?: {
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      cancellationReason?: string;
      timelineTitle?: string;
      timelineDescription?: string;
    },
    merchantId?: string
  ): Order | undefined {
    const order = this.getOrder(orderId, merchantId);
    if (!order) return undefined;

    order.status = status;
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }
    if (metadata?.razorpayOrderId) order.razorpayOrderId = metadata.razorpayOrderId;
    if (metadata?.razorpayPaymentId) order.razorpayPaymentId = metadata.razorpayPaymentId;
    if (metadata?.cancellationReason) order.cancellationReason = metadata.cancellationReason;

    if (status === 'PAID' && !order.completedAt) {
      order.completedAt = new Date().toISOString();
    }
    if (status === 'CANCELLED' && !order.cancelledAt) {
      order.cancelledAt = new Date().toISOString();
    }

    if (metadata?.timelineTitle) {
      const tlEvent: OrderTimelineEvent = {
        id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        orderId: order.id,
        type: status === 'PAID' ? 'PAYMENT_AUTHORIZED' : status === 'CANCELLED' ? 'ORDER_CANCELLED' : status === 'FAILED' ? 'PAYMENT_FAILED' : 'ORDER_CONFIRMED',
        title: metadata.timelineTitle,
        description: metadata.timelineDescription || `Order status transition to ${status}`,
        status: status === 'FAILED' ? 'FAILED' : status === 'CANCELLED' ? 'WARNING' : 'SUCCESS',
        timestamp: new Date().toISOString(),
      };
      order.timeline = [...(order.timeline || []), tlEvent];
    }

    order.updatedAt = new Date().toISOString();
    return this.saveOrder(order);
  }

  // -------------------------------------------------------------
  // Atomic Inventory Safety (Lock & Restore on Order Lifecycle)
  // -------------------------------------------------------------
  reserveInventory(
    merchantId: string,
    items: Array<{ productId: string; variantId?: string; quantity: number }>
  ): { success: boolean; error?: string; errorCode?: string; reservedItems?: Array<{ productId: string; quantity: number; title: string }> } {
    // 1. Validation pass (all items must have sufficient stock)
    for (const item of items) {
      const product = this.getProduct(item.productId);
      if (!product) {
        return {
          success: false,
          error: `Product with ID "${item.productId}" does not exist in catalog.`,
          errorCode: 'PRODUCT_NOT_FOUND',
        };
      }
      if (product.merchantId !== merchantId && !(merchantId === DEMO_MERCHANT_ID && product.merchantId === DEMO_MERCHANT_ID)) {
        return {
          success: false,
          error: `Product "${product.title}" does not belong to merchant.`,
          errorCode: 'TENANT_VIOLATION',
        };
      }

      if (item.variantId && product.variants && product.variants.length > 0) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          return {
            success: false,
            error: `Variant "${item.variantId}" not found for product "${product.title}".`,
            errorCode: 'VARIANT_NOT_FOUND',
          };
        }
        const availVariant = variant.inventoryCount ?? product.stockQuantity;
        if (availVariant < item.quantity) {
          return {
            success: false,
            error: `Insufficient inventory for variant "${variant.title}". Requested ${item.quantity}, available: ${availVariant}.`,
            errorCode: 'INSUFFICIENT_STOCK',
          };
        }
      } else {
        if (product.stockQuantity < item.quantity) {
          return {
            success: false,
            error: `Insufficient inventory for product "${product.title}". Requested ${item.quantity}, available: ${product.stockQuantity}.`,
            errorCode: 'INSUFFICIENT_STOCK',
          };
        }
      }
    }

    // 2. Atomic decrement pass
    const reservedList: Array<{ productId: string; quantity: number; title: string }> = [];
    for (const item of items) {
      const product = this.getProduct(item.productId)!;
      if (item.variantId && product.variants && product.variants.length > 0) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (variant) {
          variant.inventoryCount = Math.max(0, (variant.inventoryCount ?? product.stockQuantity) - item.quantity);
        }
      }
      product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity);
      this.saveProduct(product);
      reservedList.push({ productId: product.id, quantity: item.quantity, title: product.title });
    }

    return {
      success: true,
      reservedItems: reservedList,
    };
  }

  restoreInventory(
    merchantId: string,
    items: Array<{ productId: string; variantId?: string; quantity: number }>
  ): boolean {
    for (const item of items) {
      const product = this.getProduct(item.productId);
      if (!product) continue;
      if (item.variantId && product.variants && product.variants.length > 0) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (variant) {
          variant.inventoryCount = (variant.inventoryCount ?? product.stockQuantity) + item.quantity;
        }
      }
      product.stockQuantity += item.quantity;
      this.saveProduct(product);
    }
    return true;
  }

  savePaymentAttempt(attempt: PaymentAttempt, merchantId?: string): PaymentAttempt {
    const enrichedAttempt = {
      ...attempt,
      merchantId: merchantId || attempt.merchantId || DEMO_MERCHANT_ID,
    };
    this.paymentAttempts.set(enrichedAttempt.id, enrichedAttempt);
    supabaseDb.savePaymentAttempt(enrichedAttempt, merchantId || DEMO_MERCHANT_ID).catch((err) => {
      console.warn('[DB] Supabase payment attempt sync:', err);
    });
    return enrichedAttempt;
  }

  getPaymentAttempts(orderId?: string): PaymentAttempt[] {
    const list = Array.from(this.paymentAttempts.values());
    if (orderId) {
      return list.filter((p) => p.orderId === orderId);
    }
    return list;
  }

  getPaymentAttemptsByMerchant(merchantId: string): PaymentAttempt[] {
    const list = Array.from(this.paymentAttempts.values());
    return list.filter((p) => p.merchantId === merchantId || (!p.merchantId && merchantId === DEMO_MERCHANT_ID));
  }

  // Notification Operations
  saveNotification(notification: MerchantNotification): MerchantNotification {
    // If deduplication key provided, avoid duplicate active notifications
    if (notification.dedupKey) {
      const existing = Array.from(this.notifications.values()).find(
        (n) => n.merchantId === notification.merchantId && n.dedupKey === notification.dedupKey && !n.isRead
      );
      if (existing) {
        // Update existing notification timestamp and details rather than creating spam duplicate
        existing.message = notification.message;
        existing.createdAt = notification.createdAt;
        return existing;
      }
    }

    this.notifications.set(notification.id, notification);
    supabaseDb.saveNotification(notification).catch((err) => {
      console.warn('[DB] Supabase notification sync:', err);
    });
    return notification;
  }

  async getNotificationsAsync(merchantId: string): Promise<MerchantNotification[]> {
    const remote = await supabaseDb.getNotifications(merchantId);
    if (remote && remote.length > 0) {
      for (const n of remote) {
        this.notifications.set(n.id, n);
      }
      return remote;
    }
    return this.getNotifications(merchantId);
  }

  getNotifications(merchantId: string): MerchantNotification[] {
    const list = Array.from(this.notifications.values()).filter(
      (n) => n.merchantId === merchantId || (!n.merchantId && merchantId === DEMO_MERCHANT_ID)
    );
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getUnreadNotificationCount(merchantId: string): number {
    return this.getNotifications(merchantId).filter((n) => !n.isRead).length;
  }

  markNotificationAsRead(id: string, merchantId: string): boolean {
    const notif = this.notifications.get(id);
    if (notif && (notif.merchantId === merchantId || merchantId === DEMO_MERCHANT_ID)) {
      notif.isRead = true;
      supabaseDb.markNotificationRead(id, merchantId).catch((err) => {
        console.warn('[DB] Supabase mark read sync:', err);
      });
      return true;
    }
    return false;
  }

  markAllNotificationsAsRead(merchantId: string): number {
    const notifs = this.getNotifications(merchantId);
    let count = 0;
    for (const n of notifs) {
      if (!n.isRead) {
        n.isRead = true;
        count++;
      }
    }
    supabaseDb.markAllNotificationsRead(merchantId).catch((err) => {
      console.warn('[DB] Supabase mark all read sync:', err);
    });
    return count;
  }

  // Reset to initial demo state
  resetDemoData() {
    this.merchants.clear();
    this.storeProfiles.clear();
    this.products.clear();
    this.personas.clear();
    this.simulations.clear();
    this.orders.clear();
    this.paymentAttempts.clear();
    this.notifications.clear();
    this.revenueLeaks.clear();
    this.seed();
  }
}

export const db = new DatabaseStore();
