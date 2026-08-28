/**
 * AgentReady Deterministic Simulation Engine
 * Core infrastructure that answers: "Would an autonomous AI buyer successfully buy from this merchant?"
 * 
 * Executes an 8-stage deterministic evaluation matrix against AI Buyer Personas,
 * computes exact mathematical readiness scores and financial leakage,
 * and calls the LLM layer for step reasoning and friction diagnostics.
 */

import {
  StoreProfile,
  Product,
  BuyerPersona,
  SimulationInput,
  SimulationReport,
  JourneyStep,
  FrictionPoint,
  RevenueImpact,
  ReadinessScores,
  AgentReadyFix,
  StepStage,
  StepStatus,
} from '../src/types/index';
import { generateBatchBuyerReasoning, StageEvaluationInput } from './ai';
import { paymentGateway } from './payment';


export async function runDeterministicSimulation(params: {
  store: StoreProfile;
  products: Product[];
  persona: BuyerPersona;
  input: SimulationInput;
}): Promise<SimulationReport> {
  const { store, products, persona, input } = params;
  const startTime = Date.now();
  const appliedFixIds = new Set(input.counterfactualFixes || []);

  // Compute effective store state after counterfactual fixes
  const effectiveStore: StoreProfile = { ...store };
  if (appliedFixIds.has('fix_manifest_01')) {
    effectiveStore.hasAgentManifest = true;
    effectiveStore.schemaOrgEnabled = true;
  }
  if (appliedFixIds.has('fix_agent_token_02')) {
    effectiveStore.hasAgentCheckoutApi = true;
    effectiveStore.captchaOnCheckout = false;
  }
  if (appliedFixIds.has('fix_return_policy_03')) {
    effectiveStore.returnPolicyDays = 14;
  }
  if (appliedFixIds.has('fix_stock_api_04')) {
    effectiveStore.hasStockApi = true;
  }
  if (appliedFixIds.has('fix_captcha_05')) {
    effectiveStore.captchaOnCheckout = false;
  }

  // Selected product (or primary product)
  const targetProduct = (input.productIds && input.productIds.length > 0)
    ? products.find(p => p.id === input.productIds![0]) || products[0]
    : products[0];

  const journeySteps: JourneyStep[] = [];
  const frictionPoints: FrictionPoint[] = [];
  const activeStagesForAi: StageEvaluationInput[] = [];
  let executionHalted = false;

  // -------------------------------------------------------------
  // STAGE 1: INTENT & MERCHANT DISCOVERY
  // -------------------------------------------------------------
  {
    const stepIndex = 1;
    const stage: StepStage = 'intent_discovery';
    const hasValidUrl = !!effectiveStore.websiteUrl && effectiveStore.websiteUrl.startsWith('http');
    const isPass = hasValidUrl;
    const durationMs = 45;
    const frictionReason = !isPass ? 'Merchant domain unreachable or missing HTTPS validation' : undefined;

    activeStagesForAi.push({
      stageKey: `step_${stepIndex}`,
      stageName: 'Intent & Merchant Discovery',
      isFriction: !isPass,
      frictionReason,
    });

    journeySteps.push({
      id: `step_${stepIndex}`,
      stepIndex,
      stage,
      title: 'Intent & Merchant Discovery',
      status: isPass ? 'pass' : 'fail',
      durationMs,
      buyerThought: '',
      technicalInsight: '',
      requestPayload: { targetDomain: effectiveStore.websiteUrl, query: input.intentQuery || persona.samplePromptQuery },
      responsePayload: { status: 200, merchantId: effectiveStore.merchantId, country: effectiveStore.country },
    });

    if (!isPass) {
      frictionPoints.push({
        id: `fric_${frictionPoints.length + 1}`,
        stage,
        severity: 'critical',
        title: 'Unreachable Merchant DNS / Domain Verification Failure',
        explanation: 'The AI buyer could not verify the authenticity of the merchant URL during initial DNS handshake.',
        technicalRootCause: 'Missing valid SSL/TLS certificate or unresolvable domain endpoint.',
        estimatedDropoffRate: 1.0,
        revenueImpactMonthly: 0,
        suggestedFixId: 'fix_manifest_01',
      });
      executionHalted = true;
    }
  }

  // -------------------------------------------------------------
  // STAGE 2: CATALOG SCHEMA & MACHINE READABILITY
  // -------------------------------------------------------------
  if (!executionHalted) {
    const stepIndex = 2;
    const stage: StepStage = 'catalog_parsing';
    const isOverriddenMissing = !!input.scenarioOverrides?.simulateMissingJsonLd;
    const hasSchema = (effectiveStore.schemaOrgEnabled && targetProduct.hasStructuredData) && !isOverriddenMissing;
    const hasManifest = effectiveStore.hasAgentManifest;

    let status: StepStatus = 'pass';
    let frictionReason: string | undefined;

    if (isOverriddenMissing) {
      status = 'fail';
      frictionReason = 'Simulated Missing JSON-LD Schema: No Schema.org Product structured data detected in catalog response.';
      executionHalted = true;
    } else if (!hasSchema && !hasManifest) {
      status = 'fail';
      frictionReason = 'No JSON-LD Product schema or .well-known/agent-commerce.json manifest detected.';
      executionHalted = true;
    } else if (!hasManifest) {
      status = 'friction';
      frictionReason = 'Catalog is scrapeable via HTML microdata, but lacks direct .well-known/agent-commerce.json manifest endpoint.';
    } else if (!hasSchema) {
      status = 'friction';
      frictionReason = 'Manifest detected but Schema.org Product structured data is missing from page markup.';
    }

    activeStagesForAi.push({
      stageKey: `step_${stepIndex}`,
      stageName: 'Catalog & Machine-Readable Schema Parsing',
      isFriction: status !== 'pass',
      frictionReason,
    });

    journeySteps.push({
      id: `step_${stepIndex}`,
      stepIndex,
      stage,
      title: 'Catalog & Machine-Readable Schema Parsing',
      status,
      durationMs: status === 'pass' ? 68 : 340,
      buyerThought: '',
      technicalInsight: '',
      requestPayload: { endpoint: `${effectiveStore.websiteUrl}/.well-known/agent-commerce.json`, accept: 'application/json' },
      responsePayload: { schemaOrgDetected: hasSchema, manifestDetected: hasManifest, productCount: products.length, stressTestInjected: isOverriddenMissing },
    });

    if (status !== 'pass') {
      frictionPoints.push({
        id: `fric_${frictionPoints.length + 1}`,
        stage,
        severity: status === 'fail' ? 'critical' : 'moderate',
        title: isOverriddenMissing || !hasSchema
          ? 'Missing JSON-LD / Schema.org Product Structured Data'
          : 'Missing Machine-Readable Agent Commerce Manifest',
        explanation: isOverriddenMissing || !hasSchema
          ? 'Stress-test simulated missing JSON-LD structured data. Autonomous shopping agents (ChatGPT Operator, Google Mariner, Perplexity Shopping) cannot parse product price, specifications, and SKU availability deterministically without Schema.org markup.'
          : 'Autonomous buyer bots cannot parse product specifications deterministically without standard JSON-LD / UCP manifests.',
        technicalRootCause: isOverriddenMissing
          ? 'Injected stress-test override: `<script type="application/ld+json">` is missing or stripped from product catalog response.'
          : (!hasSchema ? 'No schema.org structured data detected on product details page.' : 'Absence of /.well-known/agent-commerce.json endpoint causes 74% higher parsing latency and scraping token dropoffs.'),
        estimatedDropoffRate: status === 'fail' ? 0.85 : 0.35,
        revenueImpactMonthly: 0,
        suggestedFixId: 'fix_manifest_01',
      });
    }
  }

  // -------------------------------------------------------------
  // STAGE 3: SPECIFICATION & ATTRIBUTE VERIFICATION
  // -------------------------------------------------------------
  if (!executionHalted) {
    const stepIndex = 3;
    const stage: StepStage = 'spec_validation';
    const specCount = targetProduct.specs?.length || 0;
    const hasEnoughSpecs = specCount >= 3;
    const strictnessThresholdMet = persona.specStrictness < 90 || hasEnoughSpecs;

    let status: StepStatus = 'pass';
    let frictionReason: string | undefined;

    if (!strictnessThresholdMet) {
      status = 'fail';
      frictionReason = `Persona strictness (${persona.specStrictness}%) requires micro-attribute specifications (found ${specCount} specs).`;
      executionHalted = true;
    } else if (specCount < 4) {
      status = 'friction';
      frictionReason = 'Product contains basic specs but lacks granular dimensional/material tags.';
    }

    activeStagesForAi.push({
      stageKey: `step_${stepIndex}`,
      stageName: 'Specification & Micro-Attribute Extraction',
      isFriction: status !== 'pass',
      frictionReason,
    });

    journeySteps.push({
      id: `step_${stepIndex}`,
      stepIndex,
      stage,
      title: 'Specification & Micro-Attribute Extraction',
      status,
      durationMs: 95,
      buyerThought: '',
      technicalInsight: '',
      requestPayload: { requiredSpecs: ['material', 'dimensions', 'drop', 'compatibility'], evaluatedProduct: targetProduct.title },
      responsePayload: { matchedSpecs: targetProduct.specs },
    });

    if (status !== 'pass') {
      frictionPoints.push({
        id: `fric_${frictionPoints.length + 1}`,
        stage,
        severity: status === 'fail' ? 'critical' : 'minor',
        title: 'Sparse Structured Specifications on Catalog Entity',
        explanation: 'Autonomous shoppers looking for precise compatibility (e.g. dimensions, drop ratios, ANC decibels) bounce when specs are buried in freeform prose.',
        technicalRootCause: 'Specifications are unkeyed strings instead of machine-verifiable key-value tuples in Schema.org `additionalProperty`.',
        estimatedDropoffRate: status === 'fail' ? 0.60 : 0.20,
        revenueImpactMonthly: 0,
        suggestedFixId: 'fix_specs_06',
      });
    }
  }

  // -------------------------------------------------------------
  // STAGE 4: LIVE INVENTORY & STOCK CHECK
  // -------------------------------------------------------------
  if (!executionHalted) {
    const stepIndex = 4;
    const stage: StepStage = 'inventory_check';
    const isSimulatedStockOut = !!input.scenarioOverrides?.simulateStockOut;
    const currentStock = isSimulatedStockOut ? 0 : targetProduct.stockQuantity;
    const hasStockApi = effectiveStore.hasStockApi;

    let status: StepStatus = 'pass';
    let frictionReason: string | undefined;

    if (currentStock <= 0) {
      status = 'fail';
      frictionReason = isSimulatedStockOut
        ? 'Simulated Out of Stock: Zero inventory available for selected SKU.'
        : 'Zero inventory available for selected SKU.';
      executionHalted = true;
    } else if (!hasStockApi) {
      status = 'friction';
      frictionReason = 'Inventory is static in catalog; no real-time stock API available to guarantee allocation.';
    }

    activeStagesForAi.push({
      stageKey: `step_${stepIndex}`,
      stageName: 'Dynamic Inventory & Stock Verification',
      isFriction: status !== 'pass',
      frictionReason,
    });

    journeySteps.push({
      id: `step_${stepIndex}`,
      stepIndex,
      stage,
      title: 'Dynamic Inventory & Stock Verification',
      status,
      durationMs: 82,
      buyerThought: '',
      technicalInsight: '',
      requestPayload: { sku: targetProduct.handle, requestedQty: 1 },
      responsePayload: { stockQuantity: currentStock, realtimeApi: hasStockApi, stressTestInjected: isSimulatedStockOut },
    });

    if (status !== 'pass') {
      frictionPoints.push({
        id: `fric_${frictionPoints.length + 1}`,
        stage,
        severity: status === 'fail' ? 'critical' : 'moderate',
        title: isSimulatedStockOut || currentStock <= 0 ? 'Out of Stock on Selected SKU' : 'Missing Real-time Inventory API',
        explanation: 'Autonomous AI buyers will not risk placing an order if stock levels cannot be locked in real-time.',
        technicalRootCause: isSimulatedStockOut
          ? 'Injected stress-test override: target product stock forced to 0 units.'
          : (currentStock <= 0 ? 'Target product inventory is depleted (0 units available).' : 'No programmatic `/inventory-check` webhook; risk of post-purchase cancellation.'),
        estimatedDropoffRate: status === 'fail' ? 1.0 : 0.40,
        revenueImpactMonthly: 0,
        suggestedFixId: 'fix_stock_api_04',
      });
    }
  }

  // -------------------------------------------------------------
  // STAGE 5: PRICING, TAX & SHIPPING SLA
  // -------------------------------------------------------------
  if (!executionHalted) {
    const stepIndex = 5;
    const stage: StepStage = 'pricing_tax_eval';
    const hasHiddenTaxes = !!input.scenarioOverrides?.simulateHiddenTaxes;
    const qualifiesForFreeShipping = targetProduct.basePrice >= effectiveStore.freeShippingThreshold;
    const priceExceedsBudget = targetProduct.basePrice > persona.maxBudget;

    let status: StepStatus = 'pass';
    let frictionReason: string | undefined;

    if (priceExceedsBudget) {
      status = 'fail';
      frictionReason = `Price ₹${targetProduct.basePrice} exceeds persona max budget limit of ₹${persona.maxBudget}.`;
      executionHalted = true;
    } else if (hasHiddenTaxes) {
      status = 'fail';
      frictionReason = 'Simulated Hidden Checkout Fees: Undisclosed surcharge / unexpected checkout fee surfaced during net landing calculation.';
      executionHalted = true;
    } else if (!effectiveStore.hasPriceParityGuarantee) {
      status = 'friction';
      frictionReason = 'No price parity guarantee; dynamic surge pricing risk detected.';
    }

    activeStagesForAi.push({
      stageKey: `step_${stepIndex}`,
      stageName: 'Pricing, Taxes & Shipping Calculation',
      isFriction: status !== 'pass',
      frictionReason,
    });

    journeySteps.push({
      id: `step_${stepIndex}`,
      stepIndex,
      stage,
      title: 'Pricing, Taxes & Shipping Calculation',
      status,
      durationMs: 55,
      buyerThought: '',
      technicalInsight: '',
      requestPayload: { itemPrice: targetProduct.basePrice, currency: targetProduct.currency, destinationPin: '560001' },
      responsePayload: { subtotal: targetProduct.basePrice, shipping: qualifiesForFreeShipping ? 0 : 99, taxIncluded: !hasHiddenTaxes, stressTestInjected: hasHiddenTaxes },
    });

    if (status !== 'pass') {
      frictionPoints.push({
        id: `fric_${frictionPoints.length + 1}`,
        stage,
        severity: status === 'fail' ? 'critical' : 'minor',
        title: hasHiddenTaxes ? 'Hidden Checkout Fee Discrepancy' : (priceExceedsBudget ? 'Price Exceeds Agent Budget Constraint' : 'Missing Price Parity Guarantee'),
        explanation: hasHiddenTaxes
          ? 'Simulated hidden checkout fees detected. Autonomous AI buyers calculate net landing cost before initiating token settlement and immediately abort on undisclosed fees.'
          : 'AI buyers calculate net landing cost before initiating token settlement and abandon carts with deceptive pricing.',
        technicalRootCause: hasHiddenTaxes
          ? 'Injected stress-test override: unexpected fees/surcharges surfaced during checkout calculation.'
          : 'Taxes and shipping are calculated asynchronously on client-side JS instead of being declared in UCP pricing manifest.',
        estimatedDropoffRate: hasHiddenTaxes ? 0.75 : 0.55,
        revenueImpactMonthly: 0,
        suggestedFixId: 'fix_manifest_01',
      });
    }
  }

  // -------------------------------------------------------------
  // STAGE 6: RETURN POLICY & SLA CLARITY
  // -------------------------------------------------------------
  if (!executionHalted) {
    const stepIndex = 6;
    const stage: StepStage = 'policy_shipping_check';
    const isVagueReturn = input.scenarioOverrides?.simulateVagueReturnPolicy;
    const returnDays = isVagueReturn ? 0 : effectiveStore.returnPolicyDays;

    let status: StepStatus = 'pass';
    let frictionReason: string | undefined;

    if (returnDays === 0) {
      status = 'fail';
      frictionReason = 'No returns or refund policy specified; high corporate compliance risk.';
      if (persona.policySensitivity > 70) executionHalted = true;
    } else if (returnDays < 14 && persona.policySensitivity > 80) {
      status = 'friction';
      frictionReason = `${returnDays}-day return policy is below enterprise agent target of 14 days.`;
    }

    activeStagesForAi.push({
      stageKey: `step_${stepIndex}`,
      stageName: 'Return Policy & Shipping SLA Verification',
      isFriction: status !== 'pass',
      frictionReason,
    });

    journeySteps.push({
      id: `step_${stepIndex}`,
      stepIndex,
      stage,
      title: 'Return Policy & Shipping SLA Verification',
      status,
      durationMs: 60,
      buyerThought: '',
      technicalInsight: '',
      requestPayload: { requiredReturnDays: 14, corporateEntity: persona.type === 'policy_sensitive_corporate' },
      responsePayload: { returnWindowDays: returnDays, description: effectiveStore.returnPolicyDescription },
    });

    if (status !== 'pass') {
      frictionPoints.push({
        id: `fric_${frictionPoints.length + 1}`,
        stage,
        severity: status === 'fail' ? 'critical' : 'moderate',
        title: 'Unambiguous / Short Return Window',
        explanation: 'Autonomous shoppers prioritize merchants with standardized return guarantees to protect human consumers.',
        technicalRootCause: 'Return policy lacks schema `MerchantReturnPolicy` markup with explicit refund logistics.',
        estimatedDropoffRate: status === 'fail' ? 0.70 : 0.30,
        revenueImpactMonthly: 0,
        suggestedFixId: 'fix_return_policy_03',
      });
    }
  }

  // -------------------------------------------------------------
  // STAGE 7: AUTONOMOUS PAYMENT & TOKEN NEGOTIATION
  // -------------------------------------------------------------
  if (!executionHalted) {
    const stepIndex = 7;
    const stage: StepStage = 'payment_negotiation';
    const paymentDiag = paymentGateway.getPaymentReadinessDiagnostics(effectiveStore.merchantId, effectiveStore);
    const hasCaptchaBlock = effectiveStore.captchaOnCheckout || !!input.scenarioOverrides?.forceCaptchaBlock;
    const hasAgentCheckout = effectiveStore.hasAgentCheckoutApi && paymentDiag.agentCompatibility.autonomousTokenSupported;

    let status: StepStatus = 'pass';
    let frictionReason: string | undefined;

    if (hasCaptchaBlock) {
      status = 'fail';
      frictionReason = 'Interactive CAPTCHA / Cloudflare challenge triggered on checkout route. Autonomous agent execution terminated.';
      executionHalted = true;
    } else if (!hasAgentCheckout) {
      status = 'friction';
      frictionReason = 'Store requires interactive 3D Secure browser iframe redirect; cannot execute direct server-to-server Razorpay Agent Token.';
    } else if (paymentDiag.status === 'NOT_CONFIGURED') {
      status = 'fail';
      frictionReason = 'Payment gateway not configured for autonomous token settlement.';
      executionHalted = true;
    }

    activeStagesForAi.push({
      stageKey: `step_${stepIndex}`,
      stageName: 'Autonomous Payment & Token Negotiation',
      isFriction: status !== 'pass',
      frictionReason,
    });

    journeySteps.push({
      id: `step_${stepIndex}`,
      stepIndex,
      stage,
      title: 'Autonomous Payment & Token Negotiation',
      status,
      durationMs: status === 'pass' ? 120 : 450,
      buyerThought: '',
      technicalInsight: '',
      requestPayload: { protocol: 'Razorpay-Agentic-Token-v1', amount: targetProduct.basePrice, currency: effectiveStore.currency || 'INR' },
      responsePayload: {
        captchaTriggered: !!hasCaptchaBlock,
        agentTokenAccepted: hasAgentCheckout,
        paymentReadinessScore: paymentDiag.overallScore,
        paymentReadinessGrade: paymentDiag.grade,
        stressTestInjected: !!input.scenarioOverrides?.forceCaptchaBlock,
      },
    });

    if (status !== 'pass') {
      frictionPoints.push({
        id: `fric_${frictionPoints.length + 1}`,
        stage,
        severity: status === 'fail' ? 'critical' : 'moderate',
        title: hasCaptchaBlock ? 'Anti-Bot CAPTCHA Gate on Checkout Route' : 'Missing Razorpay Agent Token Checkout Protocol',
        explanation: hasCaptchaBlock
          ? 'Cloudflare / Google reCAPTCHA gates immediately brick autonomous AI shopping bots from completing purchases.'
          : 'Without agentic tokenization, purchases require human browser redirects, destroying conversion.',
        technicalRootCause: input.scenarioOverrides?.forceCaptchaBlock
          ? 'Injected stress-test override: CAPTCHA / Cloudflare challenge forced on checkout endpoint.'
          : (hasCaptchaBlock ? 'WAF rule blocks non-browser HTTP User-Agents on /checkout' : 'No server-side Razorpay agent order creation endpoint.'),
        estimatedDropoffRate: hasCaptchaBlock ? 0.98 : 0.45,
        revenueImpactMonthly: 0,
        suggestedFixId: hasCaptchaBlock ? 'fix_captcha_05' : 'fix_agent_token_02',
      });
    }
  }

  // -------------------------------------------------------------
  // STAGE 8: ORDER CONFIRMATION & RECEIPT
  // -------------------------------------------------------------
  if (!executionHalted) {
    const stepIndex = 8;
    const stage: StepStage = 'checkout_confirmation';
    const paymentDiag = paymentGateway.getPaymentReadinessDiagnostics(effectiveStore.merchantId, effectiveStore);
    const webhookReady = paymentDiag.agentCompatibility.webhookDeliveryWorking;
    const status: StepStatus = 'pass';

    activeStagesForAi.push({
      stageKey: `step_${stepIndex}`,
      stageName: 'Order Confirmation & Webhook Dispatch',
      isFriction: !webhookReady,
      frictionReason: !webhookReady ? 'Asynchronous webhook sync unverified; order confirmation delayed.' : undefined,
    });

    journeySteps.push({
      id: `step_${stepIndex}`,
      stepIndex,
      stage,
      title: 'Order Confirmation & Webhook Dispatch',
      status,
      durationMs: 75,
      buyerThought: '',
      technicalInsight: '',
      requestPayload: { orderAction: 'COMMIT', idempotencyKey: `idemp_${Date.now()}` },
      responsePayload: { status: 'ORDER_PLACED', orderId: `order_sim_${Date.now()}`, webhookVerified: webhookReady },
    });
  }

  // Generate batch AI reasoning for all active steps in a single call (fast, rate-limit resilient)
  const batchReasoningResult = await generateBatchBuyerReasoning({
    persona,
    store: effectiveStore,
    product: targetProduct,
    stages: activeStagesForAi,
  });

  const reasoningMap = batchReasoningResult.reasoning;
  const executionMode = batchReasoningResult.executionMode;
  const aiModelUsed = batchReasoningResult.aiModelUsed;

  for (const step of journeySteps) {
    const reasoning = reasoningMap[step.id];
    if (reasoning) {
      step.buyerThought = reasoning.buyerThought;
      step.technicalInsight = reasoning.technicalInsight;
    }
  }

  // Fill skipped steps if halted early
  const allStages: Array<{ stage: StepStage; title: string }> = [
    { stage: 'intent_discovery', title: 'Intent & Merchant Discovery' },
    { stage: 'catalog_parsing', title: 'Catalog & Machine-Readable Schema Parsing' },
    { stage: 'spec_validation', title: 'Specification & Micro-Attribute Extraction' },
    { stage: 'inventory_check', title: 'Dynamic Inventory & Stock Verification' },
    { stage: 'pricing_tax_eval', title: 'Pricing, Taxes & Shipping Calculation' },
    { stage: 'policy_shipping_check', title: 'Return Policy & Shipping SLA Verification' },
    { stage: 'payment_negotiation', title: 'Autonomous Payment & Token Negotiation' },
    { stage: 'checkout_confirmation', title: 'Order Confirmation & Webhook Dispatch' },
  ];

  for (let i = journeySteps.length; i < allStages.length; i++) {
    const stageInfo = allStages[i];
    journeySteps.push({
      id: `step_${i + 1}`,
      stepIndex: i + 1,
      stage: stageInfo.stage,
      title: stageInfo.title,
      status: 'skipped',
      durationMs: 0,
      buyerThought: 'Stage bypassed: upstream friction or critical blocker aborted the agent pipeline.',
      technicalInsight: 'Execution halted before reaching this stage.',
    });
  }

  // -------------------------------------------------------------
  // DETERMINISTIC READINESS SCORE ALGORITHM
  // -------------------------------------------------------------
  const passCount = journeySteps.filter(s => s.status === 'pass').length;
  const failCount = journeySteps.filter(s => s.status === 'fail').length;
  const criticalCount = frictionPoints.filter(f => f.severity === 'critical').length;
  const warningsCount = frictionPoints.filter(f => f.severity === 'moderate' || f.severity === 'minor').length;

  const machineReadability = Math.min(100, Math.max(0,
    (effectiveStore.schemaOrgEnabled ? 40 : 0) +
    (effectiveStore.hasAgentManifest ? 35 : 0) +
    (targetProduct.hasStructuredData ? 15 : 0) +
    (targetProduct.specs && targetProduct.specs.length >= 3 ? 10 : 0) -
    (input.scenarioOverrides?.simulateMissingJsonLd ? 60 : 0)
  ));

  const apiCompleteness = Math.min(100, Math.max(0,
    (effectiveStore.hasStockApi ? 45 : 0) +
    (effectiveStore.hasAgentCheckoutApi ? 35 : 0) +
    (effectiveStore.hasPriceParityGuarantee ? 20 : 0)
  ));

  const policyClarity = Math.min(100, Math.max(0,
    Math.min(60, (effectiveStore.returnPolicyDays / 14) * 60) +
    (effectiveStore.hasFreeReturns ? 20 : 10) +
    (effectiveStore.freeShippingThreshold <= 999 ? 20 : 10) -
    (input.scenarioOverrides?.simulateVagueReturnPolicy ? 70 : 0)
  ));

  const pricingTransparency = Math.min(100, Math.max(0,
    (effectiveStore.hasPriceParityGuarantee ? 40 : 15) +
    (effectiveStore.isTaxInclusive ? 30 : 10) +
    (effectiveStore.freeShippingThreshold > 0 ? 30 : 15) -
    (input.scenarioOverrides?.simulateHiddenTaxes ? 70 : 0)
  ));

  const checkoutViability = Math.min(100, Math.max(0,
    (effectiveStore.hasAgentCheckoutApi ? 50 : 15) +
    (!effectiveStore.captchaOnCheckout ? 35 : 0) +
    (targetProduct.stockQuantity > 0 ? 15 : 0) -
    (input.scenarioOverrides?.forceCaptchaBlock ? 85 : 0)
  ));

  const overallScore = Math.round(
    machineReadability * 0.25 +
    apiCompleteness * 0.20 +
    policyClarity * 0.15 +
    pricingTransparency * 0.15 +
    checkoutViability * 0.25
  );

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
  if (overallScore >= 92) grade = 'A+';
  else if (overallScore >= 82) grade = 'A';
  else if (overallScore >= 70) grade = 'B';
  else if (overallScore >= 55) grade = 'C';
  else if (overallScore >= 40) grade = 'D';

  const scores: ReadinessScores = {
    overallScore,
    machineReadability,
    apiCompleteness,
    policyClarity,
    pricingTransparency,
    checkoutViability,
    grade,
    passedChecksCount: passCount,
    warningsCount,
    criticalCount,
    frictionCount: frictionPoints.length,
  };

  // -------------------------------------------------------------
  // DETERMINISTIC REVENUE LEAKAGE CALCULATION
  // -------------------------------------------------------------
  const traffic = effectiveStore.monthlySimulatedAiTraffic || 24000;
  const aov = effectiveStore.averageOrderValue || targetProduct.basePrice || 3499;
  const baselineConversion = 0.045; // 4.5% benchmark agent conversion rate
  const realizedConversion = Math.max(0.002, (overallScore / 100) * baselineConversion);
  const monthlyRevenueLoss = Math.round((baselineConversion - realizedConversion) * traffic * aov);
  const potentialRecovery = Math.round(monthlyRevenueLoss * 0.85);

  // Distribute revenue leakage across friction points deterministically
  for (const f of frictionPoints) {
    f.revenueImpactMonthly = Math.round(monthlyRevenueLoss * (f.estimatedDropoffRate / (frictionPoints.reduce((acc, x) => acc + x.estimatedDropoffRate, 0) || 1)));
  }

  const revenueImpact: RevenueImpact = {
    simulatedMonthlyAiTraffic: traffic,
    averageOrderValue: aov,
    baselineAiConversionRate: baselineConversion,
    actualSimulatedConversionRate: realizedConversion,
    estimatedMonthlyRevenueLoss: monthlyRevenueLoss,
    potentialRevenueRecovery: potentialRecovery,
    currency: effectiveStore.currency || 'INR',
  };

  // -------------------------------------------------------------
  // RECOMMENDATIONS / AGENT-READY FIXES
  // -------------------------------------------------------------
  const recommendations: AgentReadyFix[] = [
    {
      id: 'fix_manifest_01',
      title: 'Deploy Universal Commerce Protocol Manifest (.well-known/agent-commerce.json)',
      category: 'metadata',
      priority: 'P0',
      effort: '5 mins',
      impactPoints: 18,
      estimatedRevenueGain: Math.round(monthlyRevenueLoss * 0.35),
      explanation: 'Exposes direct JSON catalog schema and checkout API bindings for AI shopping agents (ChatGPT Operator, Google Project Mariner, Perplexity Shopping).',
      fileTarget: 'public/.well-known/agent-commerce.json',
      beforeSnippet: `<!-- No agent discovery manifest detected on host -->`,
      afterSnippet: `{\n  "version": "1.0.0",\n  "protocol": "UCP-1.0",\n  "merchant": { "name": "${effectiveStore.name}", "currency": "${effectiveStore.currency}" },\n  "endpoints": {\n    "catalogJson": "/api/products",\n    "agentCheckout": "/api/payments/create-order"\n  }\n}`,
      applied: appliedFixIds.has('fix_manifest_01'),
    },
    {
      id: 'fix_agent_token_02',
      title: 'Enable Razorpay Agentic Payment Tokenization & Remove Iframe Redirects',
      category: 'payment',
      priority: 'P0',
      effort: '15 mins',
      impactPoints: 24,
      estimatedRevenueGain: Math.round(monthlyRevenueLoss * 0.40),
      explanation: 'Allows autonomous agents with pre-authorized spending caps to commit orders without failing on 3DS browser redirects or human CAPTCHAs.',
      fileTarget: 'server/payment.ts',
      beforeSnippet: `// Standard Web redirect flow requiring human browser session\nres.redirect('/checkout/razorpay-hosted');`,
      afterSnippet: `// Server-to-server Agent Token settlement\nconst payment = await razorpay.orders.create({\n  amount: order.amount,\n  currency: "INR",\n  notes: { agent_token: req.headers['x-agent-auth-token'] }\n});`,
      applied: appliedFixIds.has('fix_agent_token_02'),
    },
    {
      id: 'fix_return_policy_03',
      title: 'Publish Machine-Readable 14-Day MerchantReturnPolicy Schema',
      category: 'policy',
      priority: 'P1',
      effort: '5 mins',
      impactPoints: 12,
      estimatedRevenueGain: Math.round(monthlyRevenueLoss * 0.15),
      explanation: 'Autonomous corporate and consumer bots mandate a verifiable return policy (≥14 days) before authorizing automated transactions.',
      fileTarget: 'public/index.html',
      beforeSnippet: `<p>Returns accepted within our discretion.</p>`,
      afterSnippet: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "MerchantReturnPolicy",\n  "applicableCountry": "IN",\n  "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteDays",\n  "merchantReturnDays": 14\n}\n</script>`,
      applied: appliedFixIds.has('fix_return_policy_03'),
    },
    {
      id: 'fix_stock_api_04',
      title: 'Provide Real-time Stock Allocation & Lock Webhook',
      category: 'api',
      priority: 'P1',
      effort: '30 mins',
      impactPoints: 14,
      estimatedRevenueGain: Math.round(monthlyRevenueLoss * 0.20),
      explanation: 'Guarantees inventory reservation during the agent settlement phase to eliminate post-transaction out-of-stock cancellations.',
      fileTarget: 'server/routes/inventory.ts',
      beforeSnippet: `// Static stock query\nSELECT stock FROM products WHERE id = $1;`,
      afterSnippet: `// Atomic stock reservation for AI agent\nUPDATE products SET stock = stock - 1 WHERE id = $1 AND stock > 0 RETURNING true;`,
      applied: appliedFixIds.has('fix_stock_api_04'),
    },
    {
      id: 'fix_captcha_05',
      title: 'Bypass WAF Anti-Bot CAPTCHA for Cryptographically Signed Agent Tokens',
      category: 'api',
      priority: 'P0',
      effort: '15 mins',
      impactPoints: 20,
      estimatedRevenueGain: Math.round(monthlyRevenueLoss * 0.30),
      explanation: 'Configure Cloudflare / WAF rules to exempt requests carrying valid Razorpay Agent authorization headers from visual CAPTCHA challenges.',
      fileTarget: 'middleware/wafAuth.ts',
      beforeSnippet: `if (isBot(req.headers['user-agent'])) {\n  return challengeWithCaptcha(res);\n}`,
      afterSnippet: `if (hasValidAgentSignature(req.headers['x-razorpay-signature'])) {\n  return next(); // Verified AI Buyer agent bypass\n}`,
      applied: appliedFixIds.has('fix_captcha_05'),
    },
  ];

  const overallStatus = failCount > 0 ? (passCount > 3 ? 'BLOCKED_BY_FRICTION' : 'FAILED') : 'SUCCESS';
  const executionTimeMs = Date.now() - startTime;

  const aiBuyerSummary = overallStatus === 'SUCCESS'
    ? `Autonomous purchase simulated successfully! The store "${effectiveStore.name}" satisfies machine readability, structured schema, real-time inventory checks, and agent checkout token protocols.`
    : `Autonomous purchase was aborted at stage "${journeySteps.find(s => s.status === 'fail')?.title || 'Payment Negotiation'}". Found ${frictionPoints.length} friction points costing an estimated ₹${monthlyRevenueLoss.toLocaleString('en-IN')}/month in lost AI commerce revenue.`;

  const report: SimulationReport = {
    id: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
    merchantId: effectiveStore.merchantId,
    storeName: effectiveStore.name,
    persona,
    evaluatedProducts: [targetProduct],
    overallStatus,
    score: scores,
    journeySteps,
    frictionPoints,
    revenueImpact,
    recommendations,
    executionTimeMs,
    aiBuyerSummary,
    executionMode,
    aiModelUsed,
    isCounterfactual: !!input.counterfactualFixes && input.counterfactualFixes.length > 0,
  };

  return report;
}
