/**
 * AgentReady Agent Commerce Manifest Service
 * Generates and validates .well-known/agent-commerce.json (Universal Commerce Protocol / ACP)
 */

import { StoreProfile, Product, AgentManifest } from '../src/types/index';

export function generateStoreManifest(store: StoreProfile, products: Product[], appUrl: string = 'http://localhost:3000'): AgentManifest {
  const baseUrl = appUrl.replace(/\/$/, '');

  return {
    version: '1.0.0',
    protocol: 'UCP-1.0',
    merchant: {
      id: store.merchantId,
      name: store.name,
      website: store.websiteUrl || baseUrl,
      country: store.country || 'IN',
      currency: store.currency || 'INR',
    },
    endpoints: {
      catalogJson: `${baseUrl}/api/products?merchantId=${store.merchantId}`,
      inventoryCheck: `${baseUrl}/api/products/inventory-check`,
      pricingEstimate: `${baseUrl}/api/pricing/estimate`,
      agentCheckout: `${baseUrl}/api/payments/create-order`,
      orderStatusWebhook: `${baseUrl}/api/payments/webhook`,
    },
    capabilities: {
      realtimeInventory: store.hasStockApi,
      programmaticDiscount: store.hasPriceParityGuarantee,
      autonomousPaymentTokens: store.hasAgentCheckoutApi,
      instantFulfillmentSla: true,
    },
    policies: {
      returnWindowDays: store.returnPolicyDays,
      freeReturnsThreshold: store.freeShippingThreshold,
      supportContact: `agent-support@${store.slug || 'novagear'}.in`,
    },
    products: products.map((p) => ({
      id: p.id,
      title: p.title,
      sku: p.handle,
      price: p.basePrice,
      currency: p.currency,
      stock: p.stockQuantity,
      variants: p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        price: v.price,
        attributes: v.attributes,
      })),
    })),
  };
}

export function validateManifest(manifest: Partial<AgentManifest>): {
  isValid: boolean;
  score: number;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  if (!manifest.protocol || manifest.protocol !== 'UCP-1.0') {
    errors.push('Missing or invalid protocol identifier (expected UCP-1.0)');
    score -= 20;
  }
  if (!manifest.merchant?.name) {
    errors.push('Merchant name is required');
    score -= 15;
  }
  if (!manifest.endpoints?.catalogJson) {
    errors.push('Missing catalogJson endpoint for AI agent ingestion');
    score -= 25;
  }
  if (!manifest.endpoints?.agentCheckout) {
    errors.push('Missing agentCheckout endpoint');
    score -= 20;
  }
  if (!manifest.capabilities?.autonomousPaymentTokens) {
    warnings.push('Autonomous payment token capability disabled; transactions will require browser redirection');
    score -= 10;
  }
  if (!manifest.policies?.returnWindowDays || manifest.policies.returnWindowDays < 7) {
    warnings.push('Return window is less than 7 days, which increases buyer agent abandonment');
    score -= 10;
  }

  return {
    isValid: errors.length === 0,
    score: Math.max(0, score),
    errors,
    warnings,
  };
}
