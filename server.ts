/**
 * AgentReady Full-Stack Server
 * Express + Vite + TS backend powering Track 1: AI Growth & Agentic Commerce (Razorpay AI Buildathon)
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { db, DEMO_MERCHANT_ID, initialMerchant } from './server/db';
import { runDeterministicSimulation } from './server/simulationEngine';
import { generateStoreManifest, validateManifest } from './server/manifest';
import { paymentGateway } from './server/payment';
import { answerAgentCommerceQuery, generateCodeFix } from './server/ai';
import { getSupabaseStatus, supabaseDb } from './server/supabase';
import { systemDiagnostics } from './server/diagnostics';
import { notificationService } from './server/notifications';
import { revenueLeakEngine } from './server/revenueLeakEngine';
import { checkoutEngine } from './server/checkoutEngine';
import { analyticsEngine } from './server/analyticsEngine';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  revokeToken,
  resolveMerchantSession,
  requireAuth,
  AuthenticatedRequest,
} from './server/auth';
import { SimulationInput, Product, Merchant, StoreProfile, ProductVariant, OrderStatus, OrderSource } from './src/types/index';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Helper to reliably extract authenticated merchant ID or fallback safely to DEMO_MERCHANT_ID
  async function getScopedMerchantId(req: Request): Promise<string> {
    const session = await resolveMerchantSession(req);
    if (session.merchant) {
      return session.merchant.id;
    }
    return DEMO_MERCHANT_ID;
  }

  // -------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'AgentReady API Engine',
      framework: 'UCP-1.0 / Agentic Commerce',
      timestamp: new Date().toISOString(),
    });
  });

  // Integration runtime configuration status (safe diagnostics)
  app.get('/api/integrations/status', (_req: Request, res: Response) => {
    const supabase = getSupabaseStatus();
    const razorpay = paymentGateway.getStatus();
    const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');

    res.json({
      gemini: {
        isConfigured: geminiConfigured,
        model: 'gemini-3.7-flash',
      },
      supabase,
      razorpay,
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // ---------------- AUTHENTICATION & ONBOARDING ----------------

  // 1. Demo Login (Instant NovaGear Sandbox)
  app.post('/api/auth/demo-login', (_req: Request, res: Response) => {
    const merchant = db.getMerchant(DEMO_MERCHANT_ID) || initialMerchant;
    const store = db.getStoreProfile(merchant.id);
    const token = createSessionToken(merchant.id);
    res.json({
      success: true,
      merchant,
      store,
      token,
      isDemo: true,
    });
  });

  // 2. Merchant Registration
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { email, password, name, companyName, phone, website, businessDescription } = req.body;

      // Validation
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'A valid email address is required.' });
      }
      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Merchant contact name is required.' });
      }
      if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
        return res.status(400).json({ error: 'Store or company name is required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const existing = await db.getMerchantByEmailAsync(cleanEmail);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' });
      }

      // Hash password securely with PBKDF2 + unique cryptographic salt
      const { hash, salt } = hashPassword(password);

      const merchantId = `mer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const cleanCompanyName = companyName.trim();
      const cleanName = name.trim();
      const cleanWebsite = website ? website.trim() : `https://${cleanCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.shop`;

      const newMerchant: Merchant = {
        id: merchantId,
        email: cleanEmail,
        name: cleanName,
        companyName: cleanCompanyName,
        phone: phone?.trim() || undefined,
        website: cleanWebsite,
        businessDescription: businessDescription?.trim() || undefined,
        isOnboarded: false, // will complete during onboarding step
        createdAt: new Date().toISOString(),
        isDemo: false,
      };

      // Save merchant and credentials
      db.saveMerchant(newMerchant);
      db.saveCredentials(merchantId, hash, salt);

      // Provision isolated store profile
      const cleanSlug = cleanCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const newStore = db.updateStoreProfile(merchantId, {
        name: cleanCompanyName,
        slug: cleanSlug || `store-${Date.now()}`,
        tagline: businessDescription ? businessDescription.slice(0, 100) : `Official store for ${cleanCompanyName}`,
        websiteUrl: cleanWebsite,
        currency: 'INR',
        country: 'IN',
        description: businessDescription || `${cleanCompanyName} specializes in quality goods with machine-readable specifications and autonomous checkout readiness.`,
        returnPolicyDays: 14,
        returnPolicyDescription: 'Standard 14-day hassle-free returns with automated pickup for AI-assisted purchases.',
        freeShippingThreshold: 999,
        shippingRules: [
          {
            id: `ship_${merchantId}_std`,
            name: 'Standard Surface Shipping',
            cost: 0,
            estimatedDaysMin: 3,
            estimatedDaysMax: 5,
            isExpress: false,
          },
          {
            id: `ship_${merchantId}_exp`,
            name: 'Priority Air Express',
            cost: 149,
            estimatedDaysMin: 1,
            estimatedDaysMax: 2,
            isExpress: true,
          }
        ],
        supportedPaymentMethods: ['card', 'upi', 'agent_token'],
        schemaOrgEnabled: true,
        hasAgentManifest: true,
        hasAgentCheckoutApi: true,
        hasStockApi: true,
        hasPriceParityGuarantee: true,
        captchaOnCheckout: false,
        monthlySimulatedAiTraffic: 15000,
        averageOrderValue: 2499,
      });

      // Provision starter isolated catalog product
      const starterProduct: Product = {
        id: `prod_${merchantId}_01`,
        merchantId,
        title: `${cleanCompanyName} Flagship Edition`,
        handle: `${cleanSlug}-flagship-edition`,
        description: `Flagship high-performance item from ${cleanCompanyName}. Profiling complete with machine-readable Schema.org and real-time inventory tracking.`,
        category: 'Apparel & Goods',
        basePrice: 2499,
        currency: 'INR',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
        specs: [
          { key: 'Material', value: 'High-Density Engineered Composite', category: 'Composition' },
          { key: 'Warranty', value: '1 Year Full Manufacturer Warranty', category: 'Support' },
          { key: 'Agent Purchase Protocol', value: 'UCP-1.0 Machine Settled', category: 'Compliance' },
        ],
        variants: [
          {
            id: `var_${merchantId}_01`,
            productId: `prod_${merchantId}_01`,
            sku: `${cleanCompanyName.slice(0, 4).toUpperCase()}-FLG-01`,
            title: 'Standard / Onyx Black',
            price: 2499,
            inventoryCount: 45,
            attributes: { color: 'Onyx Black', size: 'Standard' },
            isAvailable: true,
          }
        ],
        hasStructuredData: true,
        tags: ['flagship', 'autonomous-ready'],
        stockQuantity: 45,
        isAgentPurchasable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.saveProduct(starterProduct);

      const token = createSessionToken(merchantId);

      res.status(201).json({
        success: true,
        merchant: newMerchant,
        store: newStore,
        token,
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Registration failed', details: err?.message });
    }
  });

  // 3. Merchant Login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'A valid merchant email address is required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      let merchant = await db.getMerchantByEmailAsync(cleanEmail);

      if (!merchant) {
        // If password was supplied and account not found, give clear error
        if (password) {
          return res.status(401).json({ error: 'No account found with this email. Please register to create your workspace.' });
        }

        // Auto-provision merchant for quick 1-step sign in
        const merchantId = `mer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const prefix = cleanEmail.split('@')[0];
        const companyName = `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} Store`;

        merchant = {
          id: merchantId,
          email: cleanEmail,
          name: prefix,
          companyName,
          createdAt: new Date().toISOString(),
          isDemo: false,
          isOnboarded: false,
        };
        db.saveMerchant(merchant);

        const cleanSlug = prefix.toLowerCase().replace(/[^a-z0-9]/g, '-');
        db.updateStoreProfile(merchant.id, {
          name: companyName,
          slug: cleanSlug,
          tagline: `Official store for ${companyName}`,
          websiteUrl: `https://${prefix.toLowerCase()}.shop`,
          currency: 'INR',
          country: 'IN',
          returnPolicyDays: 14,
          freeShippingThreshold: 999,
          schemaOrgEnabled: true,
          hasAgentManifest: true,
          hasAgentCheckoutApi: true,
          hasStockApi: true,
          hasPriceParityGuarantee: true,
          captchaOnCheckout: false,
          monthlySimulatedAiTraffic: 12000,
          averageOrderValue: 2499,
        });
      } else {
        // If account has registered password credentials, verify password
        const creds = db.getCredentials(merchant.id);
        if (creds && password) {
          const isValid = verifyPassword(password, creds.hash, creds.salt);
          if (!isValid) {
            return res.status(401).json({ error: 'Incorrect password. Please try again.' });
          }
        }
      }

      const store = await db.getStoreProfileAsync(merchant.id);
      const token = createSessionToken(merchant.id);

      res.json({
        success: true,
        merchant,
        store,
        token,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed', details: err?.message });
    }
  });

  // 4. Session Validation & Current User
  app.get('/api/auth/session', async (req: Request, res: Response) => {
    const session = await resolveMerchantSession(req);
    if (!session.merchant) {
      return res.status(401).json({
        error: 'Invalid or expired session',
        message: session.error || 'Please sign in.',
        expired: true,
      });
    }
    res.json({
      merchant: session.merchant,
      store: session.store,
      isDemo: session.isDemo,
    });
  });

  app.get('/api/auth/me', async (req: Request, res: Response) => {
    const session = await resolveMerchantSession(req);
    if (!session.merchant) {
      return res.status(401).json({ error: 'Unauthorized', expired: true });
    }
    res.json({
      merchant: session.merchant,
      store: session.store,
      isDemo: session.isDemo,
    });
  });

  // 5. Merchant Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      revokeToken(token);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // 6. Complete Merchant Onboarding Workspace Setup
  app.post('/api/merchant/onboarding', async (req: Request, res: Response) => {
    try {
      const session = await resolveMerchantSession(req);
      if (!session.merchant) {
        return res.status(401).json({ error: 'Authentication required to complete onboarding.' });
      }

      const {
        companyName,
        contactName,
        phone,
        websiteUrl,
        businessDescription,
        currency = 'INR',
        country = 'IN',
        returnPolicyDays = 14,
        freeShippingThreshold = 999,
        category = 'General',
      } = req.body;

      if (!companyName || typeof companyName !== 'string') {
        return res.status(400).json({ error: 'Company or Store name is required.' });
      }

      // Update merchant record
      const updatedMerchant = db.updateMerchant(session.merchant.id, {
        companyName: companyName.trim(),
        name: contactName?.trim() || session.merchant.name,
        phone: phone?.trim() || session.merchant.phone,
        website: websiteUrl?.trim() || session.merchant.website,
        businessDescription: businessDescription?.trim() || session.merchant.businessDescription,
        isOnboarded: true,
      });

      // Update store profile record
      const cleanSlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const updatedStore = db.updateStoreProfile(session.merchant.id, {
        name: companyName.trim(),
        slug: cleanSlug,
        tagline: businessDescription ? businessDescription.slice(0, 120) : undefined,
        websiteUrl: websiteUrl?.trim() || session.store?.websiteUrl,
        currency,
        country,
        description: businessDescription?.trim() || session.store?.description,
        returnPolicyDays: Number(returnPolicyDays) || 14,
        freeShippingThreshold: Number(freeShippingThreshold) || 999,
        updatedAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: 'Onboarding completed successfully! Workspace is ready.',
        merchant: updatedMerchant,
        store: updatedStore,
      });
    } catch (err: any) {
      console.error('Onboarding completion error:', err);
      res.status(500).json({ error: 'Failed to complete onboarding', details: err?.message });
    }
  });

  // 7. Merchant Profile Management
  app.get('/api/merchant/profile', async (req: Request, res: Response) => {
    const session = await resolveMerchantSession(req);
    if (!session.merchant) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    res.json({
      merchant: session.merchant,
      store: session.store,
    });
  });

  app.put('/api/merchant/profile', async (req: Request, res: Response) => {
    try {
      const session = await resolveMerchantSession(req);
      if (!session.merchant) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { name, companyName, phone, website, businessDescription } = req.body;
      const updatedMerchant = db.updateMerchant(session.merchant.id, {
        name: name !== undefined ? name.trim() : session.merchant.name,
        companyName: companyName !== undefined ? companyName.trim() : session.merchant.companyName,
        phone: phone !== undefined ? phone.trim() : session.merchant.phone,
        website: website !== undefined ? website.trim() : session.merchant.website,
        businessDescription: businessDescription !== undefined ? businessDescription.trim() : session.merchant.businessDescription,
      });

      res.json({
        success: true,
        merchant: updatedMerchant,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update merchant profile', details: err?.message });
    }
  });

  // ---------------- STORE PROFILE (TENANT ISOLATED) ----------------
  app.get('/api/store', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const merchant = await db.getMerchantAsync(merchantId);
      let store = await db.getStoreProfileAsync(merchantId);

      if (!store) {
        // Auto-provision default store profile if not exists
        store = db.updateStoreProfile(merchantId, {
          name: merchant?.companyName || 'My Store',
          slug: (merchant?.companyName || 'my-store').toLowerCase().replace(/[^a-z0-9]/g, '-'),
          contactName: merchant?.name || 'Store Owner',
          email: merchant?.email || 'store@example.com',
          phone: merchant?.phone || '',
          websiteUrl: merchant?.website || 'https://mystore.com',
          description: merchant?.businessDescription || 'High-performance commerce store configured for autonomous agent readiness.',
          currency: 'INR',
          country: 'IN',
        });
      } else if (merchant) {
        // Ensure store profile contains up-to-date contact metadata
        if (!store.contactName && merchant.name) store.contactName = merchant.name;
        if (!store.email && merchant.email) store.email = merchant.email;
        if (!store.phone && merchant.phone) store.phone = merchant.phone;
        if (!store.websiteUrl && merchant.website) store.websiteUrl = merchant.website;
      }

      res.json(store);
    } catch (err: any) {
      console.error('Error fetching store profile:', err);
      res.status(500).json({ error: 'Failed to fetch store profile', details: err?.message });
    }
  });

  app.put('/api/store', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const {
        name,
        contactName,
        email,
        phone,
        websiteUrl,
        businessDescription,
        description,
        country,
        currency,
        returnPolicyDays,
        returnPolicyDescription,
        restockingFee,
        hasFreeReturns,
        freeShippingThreshold,
        standardDeliveryDays,
        expressShippingCost,
        shippingRules,
        supportedPaymentMethods,
        schemaOrgEnabled,
        hasAgentManifest,
        hasAgentCheckoutApi,
        hasStockApi,
        hasPriceParityGuarantee,
        captchaOnCheckout,
        isTaxInclusive,
        hasCaptchaBypassForAgents,
      } = req.body;

      // Validation
      if (name !== undefined && (!name || typeof name !== 'string' || name.trim().length === 0)) {
        return res.status(400).json({ error: 'Store name cannot be empty.' });
      }

      if (returnPolicyDays !== undefined && (isNaN(Number(returnPolicyDays)) || Number(returnPolicyDays) < 0)) {
        return res.status(400).json({ error: 'Return policy window must be a non-negative number of days.' });
      }

      if (freeShippingThreshold !== undefined && (isNaN(Number(freeShippingThreshold)) || Number(freeShippingThreshold) < 0)) {
        return res.status(400).json({ error: 'Free shipping threshold must be a non-negative number.' });
      }

      const finalDescription = description !== undefined ? description : businessDescription;

      const updatedStore = db.updateStoreProfile(merchantId, {
        ...(name !== undefined && { name: name.trim() }),
        ...(contactName !== undefined && { contactName: contactName.trim() }),
        ...(email !== undefined && { email: email.trim() }),
        ...(phone !== undefined && { phone: phone.trim() }),
        ...(websiteUrl !== undefined && { websiteUrl: websiteUrl.trim() }),
        ...(finalDescription !== undefined && { description: finalDescription.trim() }),
        ...(country !== undefined && { country }),
        ...(currency !== undefined && { currency }),
        ...(returnPolicyDays !== undefined && { returnPolicyDays: Math.floor(Number(returnPolicyDays)) }),
        ...(returnPolicyDescription !== undefined && { returnPolicyDescription }),
        ...(restockingFee !== undefined && { restockingFee: Number(restockingFee) }),
        ...(hasFreeReturns !== undefined && { hasFreeReturns: Boolean(hasFreeReturns) }),
        ...(freeShippingThreshold !== undefined && { freeShippingThreshold: Number(freeShippingThreshold) }),
        ...(standardDeliveryDays !== undefined && { standardDeliveryDays: Number(standardDeliveryDays) }),
        ...(expressShippingCost !== undefined && { expressShippingCost: Number(expressShippingCost) }),
        ...(shippingRules !== undefined && { shippingRules }),
        ...(supportedPaymentMethods !== undefined && { supportedPaymentMethods }),
        ...(schemaOrgEnabled !== undefined && { schemaOrgEnabled: Boolean(schemaOrgEnabled) }),
        ...(hasAgentManifest !== undefined && { hasAgentManifest: Boolean(hasAgentManifest) }),
        ...(hasAgentCheckoutApi !== undefined && { hasAgentCheckoutApi: Boolean(hasAgentCheckoutApi) }),
        ...(hasStockApi !== undefined && { hasStockApi: Boolean(hasStockApi) }),
        ...(hasPriceParityGuarantee !== undefined && { hasPriceParityGuarantee: Boolean(hasPriceParityGuarantee) }),
        ...(captchaOnCheckout !== undefined && { captchaOnCheckout: Boolean(captchaOnCheckout) }),
        ...(isTaxInclusive !== undefined && { isTaxInclusive: Boolean(isTaxInclusive) }),
        ...(hasCaptchaBypassForAgents !== undefined && { hasCaptchaBypassForAgents: Boolean(hasCaptchaBypassForAgents) }),
        updatedAt: new Date().toISOString(),
      });

      // Synchronize contact and company info with merchant profile
      const merchantUpdates: Partial<Merchant> = {};
      if (contactName !== undefined) merchantUpdates.name = contactName.trim();
      if (name !== undefined) merchantUpdates.companyName = name.trim();
      if (phone !== undefined) merchantUpdates.phone = phone.trim();
      if (websiteUrl !== undefined) merchantUpdates.website = websiteUrl.trim();
      if (finalDescription !== undefined) merchantUpdates.businessDescription = finalDescription.trim();

      if (Object.keys(merchantUpdates).length > 0) {
        db.updateMerchant(merchantId, merchantUpdates);
      }

      res.json(updatedStore);
    } catch (err: any) {
      console.error('Error updating store profile:', err);
      res.status(500).json({ error: 'Failed to update store profile', details: err?.message });
    }
  });

  // ---------------- PRODUCTS (TENANT ISOLATED) ----------------
  app.get('/api/products', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      let products = await db.getProductsAsync(merchantId);

      // Support server-side search and filtering parameters
      const { search, category, stockStatus, agentPurchasable, hasStructuredData } = req.query;

      if (search && typeof search === 'string' && search.trim().length > 0) {
        const query = search.trim().toLowerCase();
        products = products.filter((p) => {
          const matchTitle = p.title.toLowerCase().includes(query);
          const matchDesc = p.description?.toLowerCase().includes(query);
          const matchCategory = p.category?.toLowerCase().includes(query);
          const matchTags = p.tags?.some((t) => t.toLowerCase().includes(query));
          const matchSku = p.variants?.some((v) => v.sku.toLowerCase().includes(query));
          return matchTitle || matchDesc || matchCategory || matchTags || matchSku;
        });
      }

      if (category && typeof category === 'string' && category !== 'all') {
        const cat = category.trim().toLowerCase();
        products = products.filter((p) => p.category?.toLowerCase() === cat);
      }

      if (stockStatus && typeof stockStatus === 'string') {
        if (stockStatus === 'in_stock') {
          products = products.filter((p) => p.stockQuantity > 10);
        } else if (stockStatus === 'low_stock') {
          products = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 10);
        } else if (stockStatus === 'out_of_stock') {
          products = products.filter((p) => p.stockQuantity === 0);
        }
      }

      if (agentPurchasable !== undefined && agentPurchasable !== '') {
        const isAgent = agentPurchasable === 'true';
        products = products.filter((p) => p.isAgentPurchasable === isAgent);
      }

      if (hasStructuredData !== undefined && hasStructuredData !== '') {
        const hasSchema = hasStructuredData === 'true';
        products = products.filter((p) => p.hasStructuredData === hasSchema);
      }

      res.json(products);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      res.status(500).json({ error: 'Failed to fetch products', details: err?.message });
    }
  });

  app.get('/api/products/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const product = db.getProduct(id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const merchantId = await getScopedMerchantId(req);
      if (product.merchantId !== merchantId && merchantId !== DEMO_MERCHANT_ID) {
        return res.status(403).json({ error: 'Forbidden: Access denied to another merchant catalog.' });
      }

      res.json(product);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch product', details: err?.message });
    }
  });

  app.post('/api/products', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const {
        title,
        description = '',
        category = 'General',
        basePrice,
        currency = 'INR',
        sku,
        stockQuantity = 50,
        imageUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
        specs = [],
        variants = [],
        hasStructuredData = true,
        tags = [],
        isAgentPurchasable = true,
      } = req.body;

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Product title is required.' });
      }

      const priceNum = Number(basePrice);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ error: 'Base price must be a valid non-negative number.' });
      }

      const stockNum = Math.max(0, Math.floor(Number(stockQuantity) || 0));
      const cleanTitle = title.trim();
      const generatedId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const cleanHandle = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const defaultSku = (sku && typeof sku === 'string' && sku.trim().length > 0)
        ? sku.trim().toUpperCase()
        : `${cleanTitle.slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Prepare variants
      let finalVariants: ProductVariant[] = [];
      if (Array.isArray(variants) && variants.length > 0) {
        finalVariants = variants.map((v, idx) => ({
          id: v.id || `var_${generatedId}_${idx + 1}`,
          productId: generatedId,
          sku: v.sku ? v.sku.trim().toUpperCase() : `${defaultSku}-V${idx + 1}`,
          title: v.title || 'Standard',
          price: Number(v.price) || priceNum,
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
          inventoryCount: Number(v.inventoryCount) !== undefined ? Math.max(0, Number(v.inventoryCount)) : stockNum,
          attributes: v.attributes || {},
          isAvailable: v.isAvailable ?? true,
        }));
      } else {
        finalVariants = [
          {
            id: `var_${generatedId}_01`,
            productId: generatedId,
            sku: defaultSku,
            title: 'Standard',
            price: priceNum,
            inventoryCount: stockNum,
            attributes: {},
            isAvailable: stockNum > 0,
          },
        ];
      }

      const newProduct: Product = {
        id: generatedId,
        merchantId,
        title: cleanTitle,
        handle: cleanHandle,
        description: description.trim(),
        category: category.trim(),
        basePrice: priceNum,
        currency: currency.trim() || 'INR',
        imageUrl: imageUrl.trim(),
        specs: Array.isArray(specs) ? specs : [],
        variants: finalVariants,
        hasStructuredData: Boolean(hasStructuredData),
        tags: Array.isArray(tags) ? tags : [],
        stockQuantity: stockNum,
        isAgentPurchasable: Boolean(isAgentPurchasable),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.saveProduct(newProduct);
      res.status(201).json(newProduct);
    } catch (err: any) {
      console.error('Error creating product:', err);
      res.status(500).json({ error: 'Failed to create product', details: err?.message });
    }
  });

  app.put('/api/products/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const existing = db.getProduct(id);
      if (!existing) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const merchantId = await getScopedMerchantId(req);
      if (existing.merchantId !== merchantId && merchantId !== DEMO_MERCHANT_ID) {
        return res.status(403).json({ error: 'Forbidden: You can only edit your own products.' });
      }

      const {
        title,
        description,
        category,
        basePrice,
        currency,
        sku,
        stockQuantity,
        imageUrl,
        specs,
        variants,
        hasStructuredData,
        tags,
        isAgentPurchasable,
      } = req.body;

      if (title !== undefined && (!title || typeof title !== 'string' || title.trim().length === 0)) {
        return res.status(400).json({ error: 'Product title cannot be empty.' });
      }

      if (basePrice !== undefined && (isNaN(Number(basePrice)) || Number(basePrice) < 0)) {
        return res.status(400).json({ error: 'Base price must be a non-negative number.' });
      }

      if (stockQuantity !== undefined && (isNaN(Number(stockQuantity)) || Number(stockQuantity) < 0)) {
        return res.status(400).json({ error: 'Stock quantity must be a non-negative number.' });
      }

      const updatedStock = stockQuantity !== undefined ? Math.max(0, Math.floor(Number(stockQuantity))) : existing.stockQuantity;
      const updatedPrice = basePrice !== undefined ? Number(basePrice) : existing.basePrice;

      // Handle variants update
      let updatedVariants = existing.variants;
      if (Array.isArray(variants) && variants.length > 0) {
        updatedVariants = variants.map((v, idx) => ({
          id: v.id || `var_${id}_${idx + 1}`,
          productId: id,
          sku: v.sku ? v.sku.trim().toUpperCase() : `${id.slice(0, 6).toUpperCase()}-V${idx + 1}`,
          title: v.title || 'Standard',
          price: Number(v.price) || updatedPrice,
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
          inventoryCount: Number(v.inventoryCount) !== undefined ? Math.max(0, Number(v.inventoryCount)) : updatedStock,
          attributes: v.attributes || {},
          isAvailable: v.isAvailable ?? true,
        }));
      } else if (sku !== undefined && existing.variants.length > 0) {
        // Update top-level variant SKU
        updatedVariants = existing.variants.map((v, i) => i === 0 ? { ...v, sku: sku.trim().toUpperCase(), inventoryCount: updatedStock, price: updatedPrice } : v);
      }

      const updated: Product = {
        ...existing,
        ...(title !== undefined && { title: title.trim(), handle: title.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') }),
        ...(description !== undefined && { description: description.trim() }),
        ...(category !== undefined && { category: category.trim() }),
        ...(basePrice !== undefined && { basePrice: updatedPrice }),
        ...(currency !== undefined && { currency: currency.trim() }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl.trim() }),
        ...(specs !== undefined && { specs: Array.isArray(specs) ? specs : existing.specs }),
        variants: updatedVariants,
        ...(hasStructuredData !== undefined && { hasStructuredData: Boolean(hasStructuredData) }),
        ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : existing.tags }),
        stockQuantity: updatedStock,
        ...(isAgentPurchasable !== undefined && { isAgentPurchasable: Boolean(isAgentPurchasable) }),
        updatedAt: new Date().toISOString(),
      };

      db.saveProduct(updated);
      res.json(updated);
    } catch (err: any) {
      console.error('Error updating product:', err);
      res.status(500).json({ error: 'Failed to update product', details: err?.message });
    }
  });

  // Dedicated Quick Stock Update Endpoint
  app.patch('/api/products/:id/stock', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const existing = db.getProduct(id);
      if (!existing) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const merchantId = await getScopedMerchantId(req);
      if (existing.merchantId !== merchantId && merchantId !== DEMO_MERCHANT_ID) {
        return res.status(403).json({ error: 'Forbidden: You can only edit your own products.' });
      }

      const { stockQuantity, delta } = req.body;
      let newStock = existing.stockQuantity;

      if (stockQuantity !== undefined) {
        const qty = Number(stockQuantity);
        if (isNaN(qty) || qty < 0) {
          return res.status(400).json({ error: 'Stock quantity must be a non-negative number.' });
        }
        newStock = Math.floor(qty);
      } else if (delta !== undefined) {
        const d = Number(delta);
        if (isNaN(d)) {
          return res.status(400).json({ error: 'Stock delta must be a valid number.' });
        }
        newStock = Math.max(0, existing.stockQuantity + Math.floor(d));
      } else {
        return res.status(400).json({ error: 'Either stockQuantity or delta must be provided.' });
      }

      const updated = db.updateProductStock(id, newStock);
      res.json(updated);
    } catch (err: any) {
      console.error('Error updating product stock:', err);
      res.status(500).json({ error: 'Failed to update stock', details: err?.message });
    }
  });

  app.delete('/api/products/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const existing = db.getProduct(id);
      if (!existing) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const merchantId = await getScopedMerchantId(req);
      if (existing.merchantId !== merchantId && merchantId !== DEMO_MERCHANT_ID) {
        return res.status(403).json({ error: 'Forbidden: You can only delete your own products.' });
      }

      const success = db.deleteProduct(id);
      res.json({ success, id });
    } catch (err: any) {
      console.error('Error deleting product:', err);
      res.status(500).json({ error: 'Failed to delete product', details: err?.message });
    }
  });

  // ---------------- BUYER PERSONAS ----------------
  app.get('/api/buyer-personas', (_req: Request, res: Response) => {
    res.json(db.getPersonas());
  });

  // ---------------- DETERMINISTIC AI BUYER SIMULATION (TENANT ISOLATED) ----------------
  app.post('/api/simulations/run', async (req: Request, res: Response) => {
    try {
      const input: SimulationInput = req.body;
      const merchantId = await getScopedMerchantId(req);
      const store = (await db.getStoreProfileAsync(merchantId)) || db.getStoreProfile(DEMO_MERCHANT_ID)!;
      const products = await db.getProductsAsync(merchantId);
      const personas = db.getPersonas();
      const persona = personas.find((p) => p.id === input.personaId) || personas[0];

      if (!store) {
        return res.status(404).json({ error: 'Store profile not found for simulation' });
      }

      const report = await runDeterministicSimulation({
        store,
        products: products.length > 0 ? products : [db.getProduct('prod_shoes_01')!],
        persona,
        input: { ...input, merchantId },
      });

      db.saveSimulation(report);
      notificationService.notifyOnSimulationResult(merchantId, report);

      // If simulation passed, automatically generate an autonomous test order for the merchant
      if (report.overallStatus === 'SUCCESS') {
        checkoutEngine.createOrderFromSimulation(report, merchantId).catch((err) => {
          console.warn('[Simulation] Auto order creation failed:', err);
        });
      }

      res.json(report);
    } catch (err: any) {
      console.error('Error running simulation:', err);
      res.status(500).json({ error: 'Simulation execution failed', details: err?.message });
    }
  });

  app.get('/api/simulations/history', async (req: Request, res: Response) => {
    const merchantId = await getScopedMerchantId(req);
    const history = db.getSimulationHistory(merchantId);
    res.json(history);
  });

  app.get('/api/simulations/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const report = db.getSimulation(id);
    if (!report) {
      return res.status(404).json({ error: 'Simulation report not found' });
    }
    res.json(report);
  });

  // ---------------- COUNTERFACTUAL WHAT-IF SIMULATION ----------------
  app.post('/api/counterfactual/run', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const { baselineId, appliedFixIds } = req.body;
      const baselineReport =
        (baselineId ? db.getSimulation(baselineId) : undefined) ||
        db.getSimulation('sim_baseline_novagear_01') ||
        (db.getSimulationHistory(merchantId).length > 0 ? db.getSimulation(db.getSimulationHistory(merchantId)[0].id) : undefined);

      const store = (await db.getStoreProfileAsync(merchantId)) || db.getStoreProfile(DEMO_MERCHANT_ID)!;
      const products = await db.getProductsAsync(merchantId);
      const persona = baselineReport ? baselineReport.persona : db.getPersonas()[0];

      if (!store) {
        return res.status(404).json({ error: 'Store not found' });
      }

      const counterfactualInput: SimulationInput = {
        merchantId,
        personaId: persona.id,
        counterfactualFixes: appliedFixIds || [],
      };

      const counterfactualReport = await runDeterministicSimulation({
        store,
        products: products.length > 0 ? products : [db.getProduct('prod_shoes_01')!],
        persona,
        input: counterfactualInput,
      });

      const baseScore = baselineReport?.score.overallScore || 50;
      const newScore = counterfactualReport.score.overallScore;
      const baseLoss = baselineReport?.revenueImpact.estimatedMonthlyRevenueLoss || 250000;
      const newLoss = counterfactualReport.revenueImpact.estimatedMonthlyRevenueLoss;
      const revenueRecovered = Math.max(0, baseLoss - newLoss);

      res.json({
        baselineReport: baselineReport || counterfactualReport,
        counterfactualReport,
        scoreDelta: newScore - baseScore,
        revenueRecoveredMonthly: revenueRecovered,
        resolvedFrictionCount: Math.max(0, (baselineReport?.frictionPoints.length || 0) - counterfactualReport.frictionPoints.length),
      });
    } catch (err: any) {
      console.error('Counterfactual run error:', err);
      res.status(500).json({ error: 'Counterfactual calculation failed', details: err?.message });
    }
  });

  // ---------------- AGENT COMMERCE MANIFEST (UCP / .well-known) ----------------
  app.get('/.well-known/agent-commerce.json', async (req: Request, res: Response) => {
    const merchantId = await getScopedMerchantId(req);
    const store = (await db.getStoreProfileAsync(merchantId)) || db.getStoreProfile(DEMO_MERCHANT_ID)!;
    const products = await db.getProductsAsync(merchantId);
    const appUrl = process.env.APP_URL || `http://${req.headers.host}`;
    const manifest = generateStoreManifest(store, products, appUrl);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(manifest);
  });

  app.get('/api/manifest', async (req: Request, res: Response) => {
    const merchantId = await getScopedMerchantId(req);
    const store = (await db.getStoreProfileAsync(merchantId)) || db.getStoreProfile(DEMO_MERCHANT_ID)!;
    const products = await db.getProductsAsync(merchantId);
    const appUrl = process.env.APP_URL || `http://${req.headers.host}`;
    const manifest = generateStoreManifest(store, products, appUrl);
    res.json(manifest);
  });

  app.post('/api/manifest/validate', (req: Request, res: Response) => {
    const manifest = req.body;
    const validation = validateManifest(manifest);
    res.json(validation);
  });

  // ---------------- RAZORPAY TEST PAYMENT SIMULATION & READINESS ----------------
  app.get('/api/payments/config', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const store = (await db.getStoreProfileAsync(merchantId)) || db.getStoreProfile(DEMO_MERCHANT_ID);
      const config = paymentGateway.getMerchantConfig(merchantId, store || undefined);
      res.json(config);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch payment config', details: err?.message });
    }
  });

  app.put('/api/payments/config', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const updates = req.body;
      const updatedConfig = paymentGateway.updateMerchantConfig(merchantId, updates);
      res.json(updatedConfig);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update payment config', details: err?.message });
    }
  });

  app.get('/api/payments/readiness', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const store = (await db.getStoreProfileAsync(merchantId)) || db.getStoreProfile(DEMO_MERCHANT_ID);
      const report = paymentGateway.getPaymentReadinessDiagnostics(merchantId, store || undefined);
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: 'Payment readiness check failed', details: err?.message });
    }
  });

  app.get('/api/payments/records', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      // Check Supabase first, fallback to memory
      const supabaseRecords = await supabaseDb.getPaymentRecords(merchantId);
      if (supabaseRecords && supabaseRecords.length > 0) {
        return res.json(supabaseRecords);
      }
      const records = paymentGateway.getMerchantPaymentRecords(merchantId);
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch payment records', details: err?.message });
    }
  });

  app.get('/api/payments/history', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const records = paymentGateway.getMerchantPaymentRecords(merchantId);
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch payment history', details: err?.message });
    }
  });

  app.post('/api/payments/create-order', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const { amount, currency = 'INR', receipt, notes } = req.body;
      const order = await paymentGateway.createOrder({
        amount: Number(amount),
        currency,
        receipt,
        notes,
        merchantId,
      });
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ error: 'Order creation failed', details: err?.message });
    }
  });

  app.post('/api/payments/process', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const { orderId, method = 'razorpay_agent_token', amount, currency, simulateFailure, failureReason, idempotencyKey } = req.body;
      const result = await paymentGateway.processPayment({
        orderId,
        method,
        amount: Number(amount),
        currency,
        idempotencyKey,
        simulateFailure: !!simulateFailure,
        failureReason,
        merchantId,
      });
      if (result.status === 'FAILED') {
        notificationService.notifyOnPaymentFailure(merchantId, result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Payment authorization failed', details: err?.message });
    }
  });

  app.post('/api/payments/verify', (req: Request, res: Response) => {
    const { orderId, paymentId, signature } = req.body;
    const isValid = paymentGateway.verifyPaymentSignature(orderId, paymentId, signature);
    res.json({ isValid });
  });

  app.post('/api/payments/retry', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const { orderId, previousAttemptId } = req.body;
      const result = await paymentGateway.retryPayment(orderId, previousAttemptId, merchantId);
      if (result.status === 'FAILED') {
        notificationService.notifyOnPaymentFailure(merchantId, result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Payment retry failed', details: err?.message });
    }
  });

  app.post('/api/payments/webhook', (req: Request, res: Response) => {
    try {
      const signatureHeader = (req.headers['x-razorpay-signature'] || req.headers['x-signature']) as string | undefined;
      const result = paymentGateway.handleWebhook(req.body, signatureHeader);
      res.status(result.success ? 200 : 400).json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Webhook processing error', details: err?.message });
    }
  });

  app.post('/api/payments/test-webhook', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const { event = 'payment.captured', orderId, paymentId } = req.body;
      const result = paymentGateway.handleWebhook(
        {
          id: `evt_test_${Date.now()}`,
          event,
          orderId: orderId || `order_demo_${Date.now().toString(36)}`,
          paymentId: paymentId || `pay_demo_${Date.now().toString(36)}`,
          createdAt: new Date().toISOString(),
        },
        'test_sig_manual',
        merchantId
      );
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Test webhook failed', details: err?.message });
    }
  });

  app.post('/api/payments/test-suite', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const store = (await db.getStoreProfileAsync(merchantId)) || db.getStoreProfile(DEMO_MERCHANT_ID);
      const result = await paymentGateway.runTestSuite(merchantId, store || undefined);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Payment test suite execution failed', details: err?.message });
    }
  });

  // ---------------- WEBHOOK MONITORING ENDPOINTS ----------------
  app.get('/api/webhooks/events', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const events = paymentGateway.getMerchantWebhookEvents(merchantId);
      res.json(events);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch webhook events', details: err?.message });
    }
  });

  app.post('/api/webhooks/replay', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const { event = 'order.paid', orderId, paymentId } = req.body;
      const result = paymentGateway.handleWebhook(
        {
          id: `evt_replay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          event,
          orderId: orderId || `order_${Date.now().toString(36)}`,
          paymentId: paymentId || `pay_${Date.now().toString(36)}`,
          createdAt: new Date().toISOString(),
          isReplay: true,
        },
        'test_sig_manual',
        merchantId
      );
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Webhook replay failed', details: err?.message });
    }
  });

  // ---------------- SYSTEM HEALTH & INTEGRATION DIAGNOSTICS ----------------
  app.get('/api/system/health', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const report = await systemDiagnostics.runDiagnostics(merchantId);
      res.json(report);
    } catch (err: any) {
      console.error('System health check error:', err);
      res.status(500).json({ error: 'Failed to run system diagnostics', details: err?.message });
    }
  });

  app.get('/api/system/diagnostics', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const report = await systemDiagnostics.runDiagnostics(merchantId);
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to run diagnostics', details: err?.message });
    }
  });

  // ---------------- NOTIFICATION SYSTEM (TENANT ISOLATED) ----------------
  app.get('/api/notifications', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const notifications = await db.getNotificationsAsync(merchantId);
      res.json(notifications);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch notifications', details: err?.message });
    }
  });

  app.get('/api/notifications/unread-count', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const count = db.getUnreadNotificationCount(merchantId);
      res.json({ count });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch unread count', details: err?.message });
    }
  });

  app.put('/api/notifications/:id/read', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const { id } = req.params;
      const success = db.markNotificationAsRead(id, merchantId);
      res.json({ success, id });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to mark notification as read', details: err?.message });
    }
  });

  app.put('/api/notifications/read-all', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const markedCount = db.markAllNotificationsAsRead(merchantId);
      res.json({ success: true, count: markedCount });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to mark all notifications read', details: err?.message });
    }
  });

  app.post('/api/notifications/test', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const notif = notificationService.dispatch({
        merchantId,
        type: 'system_alert',
        title: 'Diagnostic Test Alert',
        message: 'Notification subsystem verified and delivering alerts successfully.',
        severity: 'info',
        actionUrl: '/diagnostics',
      });
      res.json({ success: true, notification: notif });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to dispatch test notification', details: err?.message });
    }
  });

  // ---------------- MERCHANT REVENUE LEAK & REMEDIATION ANALYTICS ----------------
  app.get('/api/revenue-leaks', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const { status, category, severity } = req.query;

      // Automatically sync/analyze to return fresh data
      let leaks = await revenueLeakEngine.analyzeMerchantLeaks(merchantId);

      if (status && typeof status === 'string') {
        leaks = leaks.filter((l) => l.status === status);
      }
      if (category && typeof category === 'string') {
        leaks = leaks.filter((l) => l.category === category);
      }
      if (severity && typeof severity === 'string') {
        leaks = leaks.filter((l) => l.severity === severity);
      }

      res.json(leaks);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch revenue leaks', details: err?.message });
    }
  });

  app.get('/api/revenue-leaks/summary', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const summary = await revenueLeakEngine.getSummary(merchantId);
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch revenue leak summary', details: err?.message });
    }
  });

  app.get('/api/revenue-leaks/:id', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const { id } = req.params;
      const leak = db.getRevenueLeakById(id, merchantId);
      if (!leak) {
        return res.status(404).json({ error: 'Revenue leak not found' });
      }
      res.json(leak);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch revenue leak', details: err?.message });
    }
  });

  app.post('/api/revenue-leaks/analyze', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const leaks = await revenueLeakEngine.analyzeMerchantLeaks(merchantId);
      const summary = await revenueLeakEngine.getSummary(merchantId);

      // Check for any newly discovered critical leaks to alert
      const criticalOpen = leaks.filter((l) => l.severity === 'critical' && l.status === 'OPEN');
      if (criticalOpen.length > 0) {
        notificationService.notifyOnRevenueLeakDetected(merchantId, criticalOpen[0]);
      }

      res.json({ success: true, leaks, summary });
    } catch (err: any) {
      res.status(500).json({ error: 'Revenue leak analysis scan failed', details: err?.message });
    }
  });

  app.put('/api/revenue-leaks/:id/status', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value. Must be OPEN, IN_PROGRESS, or RESOLVED.' });
      }

      const updated = await revenueLeakEngine.updateLeakStatus(id, status, merchantId);
      if (!updated) {
        return res.status(404).json({ error: 'Revenue leak not found' });
      }

      if (status === 'RESOLVED') {
        notificationService.notifyOnRevenueRecovered(merchantId, updated.estimatedRevenueAtRisk, updated.title);
      }

      const summary = await revenueLeakEngine.getSummary(merchantId);
      res.json({ success: true, leak: updated, summary });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update revenue leak status', details: err?.message });
    }
  });

  // ---------------- AUTONOMOUS ORDER & CHECKOUT LIFECYCLE ----------------
  app.get('/api/orders', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const { status, source, search } = req.query;

      let orders = (await db.getOrdersAsync(merchantId)) || db.getOrders(merchantId);

      if (status && typeof status === 'string' && status !== 'ALL') {
        orders = orders.filter((o) => o.status === status);
      }

      if (source && typeof source === 'string' && source !== 'ALL') {
        orders = orders.filter((o) => o.source === source);
      }

      if (search && typeof search === 'string' && search.trim().length > 0) {
        const query = search.trim().toLowerCase();
        orders = orders.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(query) ||
            o.customer.name.toLowerCase().includes(query) ||
            o.customer.email.toLowerCase().includes(query) ||
            o.items.some((item) => item.title.toLowerCase().includes(query) || item.sku.toLowerCase().includes(query))
        );
      }

      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch orders', details: err?.message });
    }
  });

  app.get('/api/orders/summary', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const summary = db.getOrdersSummary(merchantId);
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch orders summary', details: err?.message });
    }
  });

  app.get('/api/orders/:id', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const { id } = req.params;
      const order = (await db.getOrderAsync(id, merchantId)) || db.getOrder(id, merchantId);

      if (!order) {
        return res.status(404).json({ error: 'Order not found or access denied.' });
      }

      res.json(order);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch order', details: err?.message });
    }
  });

  app.get('/api/orders/:id/timeline', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const { id } = req.params;
      const order = (await db.getOrderAsync(id, merchantId)) || db.getOrder(id, merchantId);

      if (!order) {
        return res.status(404).json({ error: 'Order not found or access denied.' });
      }

      res.json(order.timeline || []);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch order timeline', details: err?.message });
    }
  });

  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const input = req.body;

      if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
        return res.status(400).json({ error: 'Order must contain at least one item.' });
      }

      const order = await checkoutEngine.createOrder(input, merchantId);
      res.status(201).json(order);
    } catch (err: any) {
      res.status(400).json({ error: 'Failed to create order', details: err?.message });
    }
  });

  app.post('/api/orders/:id/checkout', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const { id } = req.params;
      const { paymentMethod, simulatePaymentFailure, failureReason, agentSignature, idempotencyKey } = req.body;

      const result = await checkoutEngine.executeCheckout(
        {
          orderId: id,
          paymentMethod,
          simulatePaymentFailure,
          failureReason,
          agentSignature,
          idempotencyKey,
        },
        merchantId
      );

      if (!result.success && result.errorCode === 'ORDER_NOT_FOUND') {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Checkout execution failed', details: err?.message });
    }
  });

  app.post('/api/orders/:id/cancel', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const { id } = req.params;
      const { reason = 'Merchant requested cancellation' } = req.body;

      const order = await checkoutEngine.cancelOrder(id, reason, merchantId);
      res.json({ success: true, order });
    } catch (err: any) {
      res.status(400).json({ error: 'Failed to cancel order', details: err?.message });
    }
  });

  app.post('/api/orders/simulate-ai-order', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const { productId, personaId, simulatePaymentFailure = false, failureReason } = req.body;

      const products = await db.getProductsAsync(merchantId);
      const targetProduct = productId ? db.getProduct(productId) : (products.find((p) => p.stockQuantity > 0) || products[0]);

      if (!targetProduct) {
        return res.status(400).json({ error: 'No purchasable products found in catalog.' });
      }

      const persona = personaId ? db.getPersona(personaId) : db.getPersonas()[0];
      const personaName = persona?.name || 'Autonomous AI Buyer';

      // 1. Create order
      const order = await checkoutEngine.createOrder(
        {
          items: [{ productId: targetProduct.id, quantity: 1 }],
          personaId: persona?.id,
          source: 'simulation',
          idempotencyKey: `idemp_sim_${Date.now()}`,
          notes: `Simulated Autonomous Order triggered by ${personaName}`,
          customer: {
            name: `${personaName} (Simulated)`,
            email: `ai.agent.${Date.now()}@autonomous-buyer.net`,
            phone: '+91 98765 43210',
            shippingAddress: {
              line1: 'AI Logistics Center, Phase 2',
              city: 'Bengaluru',
              state: 'Karnataka',
              postalCode: '560100',
              country: 'IN',
            },
          },
        },
        merchantId
      );

      // 2. Execute checkout
      const checkoutResult = await checkoutEngine.executeCheckout(
        {
          orderId: order.id,
          paymentMethod: 'razorpay_agent_token',
          simulatePaymentFailure: Boolean(simulatePaymentFailure),
          failureReason: failureReason || (simulatePaymentFailure ? 'Issuer 3DS mandatory verification failed on autonomous token' : undefined),
          idempotencyKey: `idemp_sim_chk_${order.id}`,
        },
        merchantId
      );

      res.json({
        success: true,
        order: checkoutResult.order,
        paymentAttempt: checkoutResult.paymentAttempt,
        checkoutResult,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Simulated AI order execution failed', details: err?.message });
    }
  });

  // ---------------- AGENT QUERY BOX ----------------
  app.post('/api/agent-query', async (req: Request, res: Response) => {
    try {
      const { query, personaId } = req.body;
      const merchantId = await getScopedMerchantId(req);
      const store = (await db.getStoreProfileAsync(merchantId)) || db.getStoreProfile(DEMO_MERCHANT_ID)!;
      const products = await db.getProductsAsync(merchantId);
      const persona = db.getPersona(personaId) || db.getPersonas()[0];

      const result = await answerAgentCommerceQuery({
        query: query || 'Can I purchase running shoes in size UK 9 with express shipping?',
        persona,
        store,
        products,
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Agent query processing failed', details: err?.message });
    }
  });

  // ---------------- CODE FIX GENERATOR & QUEUE ----------------
  app.get('/api/fixes', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const fixes = db.getMerchantFixes(merchantId);
      res.json(fixes);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve fix queue', details: err?.message });
    }
  });

  app.post('/api/fixes/apply', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const { fixId, apply = true } = req.body;
      if (!fixId) {
        return res.status(400).json({ error: 'fixId is required' });
      }
      const updatedStore = db.applyFix(merchantId, fixId, Boolean(apply));
      const updatedFixes = db.getMerchantFixes(merchantId);
      const appliedFix = updatedFixes.find((f) => f.id === fixId);

      if (apply && appliedFix) {
        notificationService.notifyOnFixApplied(merchantId, appliedFix.title, fixId);
      }

      res.json({
        success: true,
        store: updatedStore,
        fixes: updatedFixes,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to apply fix', details: err?.message });
    }
  });

  app.post('/api/fixes/generate-code', async (req: Request, res: Response) => {
    try {
      const { fixCategory, productId } = req.body;
      const merchantId = await getScopedMerchantId(req);
      const store = (await db.getStoreProfileAsync(merchantId)) || db.getStoreProfile(DEMO_MERCHANT_ID)!;
      const product = productId ? db.getProduct(productId) : undefined;

      const codeFix = await generateCodeFix({
        fixCategory: fixCategory || 'manifest',
        store,
        product,
      });

      res.json(codeFix);
    } catch (err: any) {
      res.status(500).json({ error: 'Code generation failed', details: err?.message });
    }
  });

  // ---------------- MERCHANT ANALYTICS & REPORTING ----------------
  app.get('/api/analytics/overview', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const filters = {
        timeRange: (req.query.timeRange as any) || '30d',
        personaId: req.query.personaId as string,
        productId: req.query.productId as string,
        orderStatus: req.query.orderStatus as string,
        paymentStatus: req.query.paymentStatus as string,
        leakCategory: req.query.leakCategory as string,
      };

      const overview = await analyticsEngine.getOverviewMetrics(merchantId, filters);
      res.json(overview);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to compute analytics overview', details: err?.message });
    }
  });

  app.get('/api/analytics/timeseries', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const filters = {
        timeRange: (req.query.timeRange as any) || '30d',
        personaId: req.query.personaId as string,
        productId: req.query.productId as string,
      };

      const timeSeries = await analyticsEngine.getTimeSeries(merchantId, filters);
      res.json(timeSeries);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to compute analytics time series', details: err?.message });
    }
  });

  app.get('/api/analytics/personas', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const filters = {
        timeRange: (req.query.timeRange as any) || '30d',
      };

      const personas = await analyticsEngine.getPersonaAnalytics(merchantId, filters);
      res.json(personas);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to compute persona analytics', details: err?.message });
    }
  });

  app.get('/api/analytics/products', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const filters = {
        timeRange: (req.query.timeRange as any) || '30d',
      };

      const products = await analyticsEngine.getProductAnalytics(merchantId, filters);
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to compute product analytics', details: err?.message });
    }
  });

  app.get('/api/analytics/stage-failures', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const filters = {
        timeRange: (req.query.timeRange as any) || '30d',
      };

      const stageFailures = await analyticsEngine.getStageFailureAnalytics(merchantId, filters);
      res.json(stageFailures);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to compute stage failure analytics', details: err?.message });
    }
  });

  app.get('/api/analytics/recommendations', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const filters = {
        timeRange: (req.query.timeRange as any) || '30d',
      };

      const recommendations = await analyticsEngine.getRecommendations(merchantId, filters);
      res.json(recommendations);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to compute recommendations', details: err?.message });
    }
  });

  app.get('/api/analytics/report', async (req: Request, res: Response) => {
    try {
      const merchantId = await getScopedMerchantId(req);
      const filters = {
        timeRange: (req.query.timeRange as any) || '30d',
        personaId: req.query.personaId as string,
        productId: req.query.productId as string,
        orderStatus: req.query.orderStatus as string,
        paymentStatus: req.query.paymentStatus as string,
        leakCategory: req.query.leakCategory as string,
      };

      const report = await analyticsEngine.generateReport(merchantId, filters);
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate comprehensive analytics report', details: err?.message });
    }
  });

  // ---------------- RESET DEMO DATA ----------------
  app.post('/api/demo/reset', (_req: Request, res: Response) => {
    db.resetDemoData();
    res.json({ success: true, message: 'NovaGear demo state reset to default' });
  });

  // -------------------------------------------------------------
  // VITE / STATIC SERVING
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AgentReady server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server start failure:', err);
  process.exit(1);
});
