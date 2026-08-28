-- ==============================================================================
-- AgentReady: Supabase / PostgreSQL Production Database Schema
-- Track 1: AI Growth & Agentic Commerce (Razorpay AI Buildathon)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. MERCHANTS TABLE
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  business_description TEXT,
  is_onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_demo BOOLEAN DEFAULT FALSE
);

-- 2. STORE PROFILES TABLE
CREATE TABLE IF NOT EXISTS store_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT,
  website_url TEXT,
  currency TEXT DEFAULT 'INR',
  country TEXT DEFAULT 'IN',
  description TEXT,
  return_policy_days INT DEFAULT 14,
  return_policy_description TEXT,
  free_shipping_threshold NUMERIC(10,2) DEFAULT 999.00,
  shipping_rules JSONB DEFAULT '[]'::jsonb,
  supported_payment_methods TEXT[] DEFAULT ARRAY['card', 'upi', 'netbanking', 'agent_token'],
  schema_org_enabled BOOLEAN DEFAULT TRUE,
  has_agent_manifest BOOLEAN DEFAULT TRUE,
  has_agent_checkout_api BOOLEAN DEFAULT TRUE,
  has_stock_api BOOLEAN DEFAULT TRUE,
  has_price_parity_guarantee BOOLEAN DEFAULT TRUE,
  captcha_on_checkout BOOLEAN DEFAULT FALSE,
  monthly_simulated_ai_traffic INT DEFAULT 15000,
  average_order_value NUMERIC(10,2) DEFAULT 3499.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  handle TEXT NOT NULL,
  description TEXT,
  category TEXT,
  base_price NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  image_url TEXT,
  specs JSONB DEFAULT '[]'::jsonb,
  has_structured_data BOOLEAN DEFAULT TRUE,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  stock_quantity INT DEFAULT 100,
  is_agent_purchasable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCT VARIANTS TABLE
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  compare_at_price NUMERIC(10,2),
  inventory_count INT DEFAULT 0,
  attributes JSONB DEFAULT '{}'::jsonb,
  is_available BOOLEAN DEFAULT TRUE
);

-- 5. BUYER PERSONAS TABLE
CREATE TABLE IF NOT EXISTS buyer_personas (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  icon TEXT,
  max_budget NUMERIC(10,2) DEFAULT 10000.00,
  spec_strictness INT DEFAULT 85,
  inventory_tolerance INT DEFAULT 90,
  policy_sensitivity INT DEFAULT 80,
  max_latency_tolerance_ms INT DEFAULT 2500,
  prefers_agent_checkout_token BOOLEAN DEFAULT TRUE,
  disallows_captcha BOOLEAN DEFAULT TRUE,
  sample_prompt_query TEXT
);

-- 6. SIMULATIONS TABLE
CREATE TABLE IF NOT EXISTS simulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  persona_id TEXT REFERENCES buyer_personas(id),
  overall_status TEXT NOT NULL, -- 'SUCCESS', 'FAILED', 'BLOCKED_BY_FRICTION'
  overall_score INT NOT NULL,
  grade TEXT NOT NULL,
  subscores JSONB NOT NULL,
  revenue_impact JSONB NOT NULL,
  recommendations JSONB DEFAULT '[]'::jsonb,
  execution_time_ms INT DEFAULT 0,
  ai_buyer_summary TEXT,
  is_counterfactual BOOLEAN DEFAULT FALSE,
  compared_to_baseline_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. JOURNEY STEPS TABLE
CREATE TABLE IF NOT EXISTS simulation_journey_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
  step_index INT NOT NULL,
  stage TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL, -- 'pass', 'fail', 'friction', 'skipped'
  duration_ms INT NOT NULL,
  buyer_thought TEXT,
  technical_insight TEXT,
  request_payload JSONB,
  response_payload JSONB
);

-- 8. FRICTION POINTS TABLE
CREATE TABLE IF NOT EXISTS friction_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'critical', 'moderate', 'minor'
  title TEXT NOT NULL,
  explanation TEXT,
  technical_root_cause TEXT,
  estimated_dropoff_rate NUMERIC(4,3),
  revenue_impact_monthly NUMERIC(12,2),
  suggested_fix_id TEXT
);

-- 9. PAYMENT SIMULATION RECORDS TABLE
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL,
  payment_id TEXT UNIQUE NOT NULL,
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  method TEXT NOT NULL,
  status TEXT NOT NULL,
  signature_verified BOOLEAN DEFAULT TRUE,
  idempotency_key TEXT,
  retry_count INT DEFAULT 0,
  agent_signature TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. REVENUE LEAKS & REMEDIATION TABLE
CREATE TABLE IF NOT EXISTS revenue_leaks (
  id TEXT PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  title TEXT NOT NULL,
  affected_entity TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  evidence TEXT NOT NULL,
  why_ai_buyer_fails TEXT NOT NULL,
  estimated_revenue_at_risk NUMERIC(12,2) NOT NULL,
  potential_monthly_loss NUMERIC(12,2) NOT NULL,
  confidence_score NUMERIC(4,3) DEFAULT 0.95,
  recommended_remediation TEXT NOT NULL,
  related_fix_id TEXT,
  related_simulation_stage TEXT,
  related_simulation_id UUID,
  related_payment_attempt_id TEXT,
  readiness_impact_points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 11. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_merchant_id ON products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_simulations_merchant_id ON simulations(merchant_id);
CREATE INDEX IF NOT EXISTS idx_journey_steps_simulation_id ON simulation_journey_steps(simulation_id);
CREATE INDEX IF NOT EXISTS idx_friction_points_simulation_id ON friction_points(simulation_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_order ON payment_records(order_id);
CREATE INDEX IF NOT EXISTS idx_revenue_leaks_merchant_id ON revenue_leaks(merchant_id);
CREATE INDEX IF NOT EXISTS idx_revenue_leaks_status ON revenue_leaks(status);

-- 12. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_leaks ENABLE ROW LEVEL SECURITY;

-- Demo & Auth Access Policies
CREATE POLICY "Public Read Demo Merchants" ON merchants FOR SELECT USING (is_demo = TRUE);
CREATE POLICY "Public Read Demo Stores" ON store_profiles FOR SELECT USING (merchant_id IN (SELECT id FROM merchants WHERE is_demo = TRUE));
CREATE POLICY "Public Read Demo Products" ON products FOR SELECT USING (merchant_id IN (SELECT id FROM merchants WHERE is_demo = TRUE));
CREATE POLICY "Public Read Demo Revenue Leaks" ON revenue_leaks FOR SELECT USING (merchant_id IN (SELECT id FROM merchants WHERE is_demo = TRUE));

