/**
 * AgentReady Typed Frontend API Client
 * Connects React UI to server-side endpoints cleanly.
 */

import {
  Merchant,
  StoreProfile,
  Product,
  BuyerPersona,
  SimulationInput,
  SimulationReport,
  SimulationHistoryItem,
  AgentManifest,
  RazorpayOrder,
  PaymentAttempt,
  MerchantPaymentConfig,
  PaymentReadinessReport,
  PaymentTestSuiteResult,
  CounterfactualComparison,
  AnalyticsFilterParams,
  AnalyticsOverviewMetrics,
  AnalyticsTimeSeriesPoint,
  PersonaAnalytics,
  ProductAnalytics,
  SimulationStageFailureMetric,
  DeterministicRecommendation,
  MerchantAnalyticsReport,
} from '../types/index';


const API_BASE = '';

async function fetchJson<T>(url: string, options?: RequestInit, retries: number = 2): Promise<T> {
  const token = localStorage.getItem('agentready_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || errBody.details || `API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (err: any) {
      lastError = err;
      if (attempt < retries) {
        // Wait 300ms before retrying on transient network/connection drops
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Network request failed');
}

export const api = {
  // Auth & Onboarding
  demoLogin: () => fetchJson<{ success: boolean; merchant: Merchant; store: StoreProfile; token: string }>('/api/auth/demo-login', { method: 'POST' }),
  register: (data: { email: string; password?: string; name: string; companyName: string; phone?: string; website?: string; businessDescription?: string }) =>
    fetchJson<{ success: boolean; merchant: Merchant; store: StoreProfile; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (credentials: string | { email: string; password?: string }) => {
    const body = typeof credentials === 'string' ? { email: credentials } : credentials;
    return fetchJson<{ success: boolean; merchant: Merchant; store: StoreProfile; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  logout: () => fetchJson<{ success: boolean; message: string }>('/api/auth/logout', { method: 'POST' }),
  getSession: () => fetchJson<{ merchant: Merchant; store: StoreProfile; isDemo?: boolean }>('/api/auth/session'),
  getMe: () => fetchJson<{ merchant: Merchant; store: StoreProfile; isDemo?: boolean }>('/api/auth/me'),

  completeOnboarding: (data: {
    companyName: string;
    contactName?: string;
    phone?: string;
    websiteUrl?: string;
    businessDescription?: string;
    currency?: string;
    country?: string;
    returnPolicyDays?: number;
    freeShippingThreshold?: number;
  }) =>
    fetchJson<{ success: boolean; message: string; merchant: Merchant; store: StoreProfile }>('/api/merchant/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMerchantProfile: () => fetchJson<{ merchant: Merchant; store: StoreProfile }>('/api/merchant/profile'),
  updateMerchantProfile: (profile: Partial<Merchant>) =>
    fetchJson<{ success: boolean; merchant: Merchant }>('/api/merchant/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),

  // Store & Products
  getStore: (merchantId?: string) => fetchJson<StoreProfile>(`/api/store${merchantId ? `?merchantId=${merchantId}` : ''}`),
  updateStore: (store: Partial<StoreProfile>) => fetchJson<StoreProfile>('/api/store', { method: 'PUT', body: JSON.stringify(store) }),
  getProducts: (params?: {
    merchantId?: string;
    search?: string;
    category?: string;
    stockStatus?: string;
    agentPurchasable?: boolean;
    hasStructuredData?: boolean;
  } | string) => {
    const p = typeof params === 'string' ? { merchantId: params } : params;
    const query = new URLSearchParams();
    if (p?.merchantId) query.set('merchantId', p.merchantId);
    if (p?.search) query.set('search', p.search);
    if (p?.category) query.set('category', p.category);
    if (p?.stockStatus) query.set('stockStatus', p.stockStatus);
    if (p?.agentPurchasable !== undefined) query.set('agentPurchasable', String(p.agentPurchasable));
    if (p?.hasStructuredData !== undefined) query.set('hasStructuredData', String(p.hasStructuredData));
    const qs = query.toString();
    return fetchJson<Product[]>(`/api/products${qs ? `?${qs}` : ''}`);
  },
  getProduct: (id: string) => fetchJson<Product>(`/api/products/${id}`),
  createProduct: (product: Partial<Product>) => fetchJson<Product>('/api/products', { method: 'POST', body: JSON.stringify(product) }),
  updateProduct: (id: string, product: Partial<Product>) => fetchJson<Product>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(product) }),
  updateProductStock: (id: string, update: number | { stockQuantity?: number; delta?: number }) =>
    fetchJson<Product>(`/api/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify(typeof update === 'number' ? { stockQuantity: update } : update),
    }),
  deleteProduct: (id: string) => fetchJson<{ success: boolean; id: string }>(`/api/products/${id}`, { method: 'DELETE' }),

  // Personas
  getBuyerPersonas: () => fetchJson<BuyerPersona[]>('/api/buyer-personas'),

  // Simulations
  runSimulation: (input: SimulationInput) => fetchJson<SimulationReport>('/api/simulations/run', { method: 'POST', body: JSON.stringify(input) }),
  getSimulationHistory: (merchantId?: string) => fetchJson<SimulationHistoryItem[]>(`/api/simulations/history${merchantId ? `?merchantId=${merchantId}` : ''}`),
  getSimulation: (id: string) => fetchJson<SimulationReport>(`/api/simulations/${id}`),

  // Counterfactual Lab
  runCounterfactual: (baselineId: string, appliedFixIds: string[], merchantId?: string) =>
    fetchJson<CounterfactualComparison>('/api/counterfactual/run', {
      method: 'POST',
      body: JSON.stringify({ baselineId, appliedFixIds, merchantId }),
    }),

  // Manifest
  getManifest: (merchantId?: string) => fetchJson<AgentManifest>(`/api/manifest${merchantId ? `?merchantId=${merchantId}` : ''}`),
  validateManifest: (manifest: Partial<AgentManifest>) => fetchJson<{ isValid: boolean; score: number; errors: string[]; warnings: string[] }>('/api/manifest/validate', { method: 'POST', body: JSON.stringify(manifest) }),

  // Payments (Razorpay Simulator & Agentic Payment Readiness)
  getPaymentConfig: () => fetchJson<MerchantPaymentConfig>('/api/payments/config'),
  updatePaymentConfig: (updates: Partial<MerchantPaymentConfig>) =>
    fetchJson<MerchantPaymentConfig>('/api/payments/config', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  getPaymentReadiness: () => fetchJson<PaymentReadinessReport>('/api/payments/readiness'),
  getPaymentRecords: () => fetchJson<PaymentAttempt[]>('/api/payments/records'),
  runPaymentTestSuite: () => fetchJson<PaymentTestSuiteResult>('/api/payments/test-suite', { method: 'POST' }),
  sendTestWebhook: (event?: string, orderId?: string, paymentId?: string) =>
    fetchJson<{ success: boolean; eventId: string; processed: boolean; message: string }>('/api/payments/test-webhook', {
      method: 'POST',
      body: JSON.stringify({ event, orderId, paymentId }),
    }),
  createPaymentOrder: (amount: number, receipt?: string, notes?: Record<string, string>) =>
    fetchJson<RazorpayOrder>('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount, receipt, notes }),
    }),
  processPayment: (params: { orderId: string; method?: string; amount: number; idempotencyKey?: string; simulateFailure?: boolean; failureReason?: string }) =>
    fetchJson<PaymentAttempt>('/api/payments/process', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  verifyPaymentSignature: (orderId: string, paymentId: string, signature: string) =>
    fetchJson<{ isValid: boolean }>('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ orderId, paymentId, signature }),
    }),
  retryPayment: (orderId: string, previousAttemptId: string) =>
    fetchJson<PaymentAttempt>('/api/payments/retry', {
      method: 'POST',
      body: JSON.stringify({ orderId, previousAttemptId }),
    }),


  // Agent Query Box
  queryAgent: (query: string, personaId: string, merchantId?: string) =>
    fetchJson<{ answer: string; agentVerdict: 'BUY_RECOMMENDED' | 'NEEDS_VERIFICATION' | 'ABORTED'; reasoning: string[] }>('/api/agent-query', {
      method: 'POST',
      body: JSON.stringify({ query, personaId, merchantId }),
    }),

  // Code Fix Generator & Fixes Queue
  getFixes: (merchantId?: string) => fetchJson<any[]>(`/api/fixes${merchantId ? `?merchantId=${merchantId}` : ''}`),
  applyFix: (fixId: string, apply: boolean = true, merchantId?: string) =>
    fetchJson<{ success: boolean; store: StoreProfile; fixes: any[] }>('/api/fixes/apply', {
      method: 'POST',
      body: JSON.stringify({ fixId, apply, merchantId }),
    }),
  getRevenueLeaks: (merchantId?: string) =>
    fetchJson<{ totalEstimatedLoss: number; frictionCount: number; topFrictionPoints: any[] }>(`/api/revenue-leaks${merchantId ? `?merchantId=${merchantId}` : ''}`),
  generateCodeFix: (fixCategory: string, merchantId?: string, productId?: string) =>
    fetchJson<{ codeSnippet: string; explanation: string }>('/api/fixes/generate-code', {
      method: 'POST',
      body: JSON.stringify({ fixCategory, merchantId, productId }),
    }),

  // Merchant Analytics & Reporting Engine
  getAnalyticsOverview: (filters?: AnalyticsFilterParams) => {
    const query = new URLSearchParams();
    if (filters?.timeRange) query.set('timeRange', filters.timeRange);
    if (filters?.personaId) query.set('personaId', filters.personaId);
    if (filters?.productId) query.set('productId', filters.productId);
    if (filters?.orderStatus) query.set('orderStatus', filters.orderStatus);
    if (filters?.paymentStatus) query.set('paymentStatus', filters.paymentStatus);
    if (filters?.leakCategory) query.set('leakCategory', filters.leakCategory);
    const qs = query.toString();
    return fetchJson<AnalyticsOverviewMetrics>(`/api/analytics/overview${qs ? `?${qs}` : ''}`);
  },
  getAnalyticsTimeSeries: (filters?: AnalyticsFilterParams) => {
    const query = new URLSearchParams();
    if (filters?.timeRange) query.set('timeRange', filters.timeRange);
    if (filters?.personaId) query.set('personaId', filters.personaId);
    if (filters?.productId) query.set('productId', filters.productId);
    const qs = query.toString();
    return fetchJson<AnalyticsTimeSeriesPoint[]>(`/api/analytics/timeseries${qs ? `?${qs}` : ''}`);
  },
  getPersonaAnalytics: (filters?: AnalyticsFilterParams) => {
    const query = new URLSearchParams();
    if (filters?.timeRange) query.set('timeRange', filters.timeRange);
    const qs = query.toString();
    return fetchJson<PersonaAnalytics[]>(`/api/analytics/personas${qs ? `?${qs}` : ''}`);
  },
  getProductAnalytics: (filters?: AnalyticsFilterParams) => {
    const query = new URLSearchParams();
    if (filters?.timeRange) query.set('timeRange', filters.timeRange);
    const qs = query.toString();
    return fetchJson<ProductAnalytics[]>(`/api/analytics/products${qs ? `?${qs}` : ''}`);
  },
  getStageFailureAnalytics: (filters?: AnalyticsFilterParams) => {
    const query = new URLSearchParams();
    if (filters?.timeRange) query.set('timeRange', filters.timeRange);
    const qs = query.toString();
    return fetchJson<SimulationStageFailureMetric[]>(`/api/analytics/stage-failures${qs ? `?${qs}` : ''}`);
  },
  getAnalyticsRecommendations: (filters?: AnalyticsFilterParams) => {
    const query = new URLSearchParams();
    if (filters?.timeRange) query.set('timeRange', filters.timeRange);
    const qs = query.toString();
    return fetchJson<DeterministicRecommendation[]>(`/api/analytics/recommendations${qs ? `?${qs}` : ''}`);
  },
  getAnalyticsReport: (filters?: AnalyticsFilterParams) => {
    const query = new URLSearchParams();
    if (filters?.timeRange) query.set('timeRange', filters.timeRange);
    if (filters?.personaId) query.set('personaId', filters.personaId);
    if (filters?.productId) query.set('productId', filters.productId);
    if (filters?.orderStatus) query.set('orderStatus', filters.orderStatus);
    if (filters?.paymentStatus) query.set('paymentStatus', filters.paymentStatus);
    if (filters?.leakCategory) query.set('leakCategory', filters.leakCategory);
    const qs = query.toString();
    return fetchJson<MerchantAnalyticsReport>(`/api/analytics/report${qs ? `?${qs}` : ''}`);
  },

  // Integration Status
  getIntegrationStatus: () =>
    fetchJson<{
      gemini: { isConfigured: boolean; model: string };
      supabase: { isConfigured: boolean; hasUrl: boolean; hasAnonKey: boolean; hasServiceRoleKey: boolean; mode: string };
      razorpay: { isConfigured: boolean; hasKeyId: boolean; hasKeySecret: boolean; mode: string };
      environment: string;
    }>('/api/integrations/status'),

  // Reset Demo
  resetDemoData: () => fetchJson<{ success: boolean; message: string }>('/api/demo/reset', { method: 'POST' }),
};
