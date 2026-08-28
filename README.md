# AgentReady

### AI Commerce Readiness Engine for Autonomous AI Buyers

> Built for the Razorpay AI Buildathon 2026 — AI Growth & Agentic Commerce

AgentReady is an AI-powered simulation and audit platform that helps merchants evaluate whether their commerce infrastructure is ready for autonomous AI buyers.

Instead of waiting for AI shopping agents to encounter failures in production, merchants can simulate buyer journeys, inject controlled friction, identify failure points, and measure their AI commerce readiness.

---

## Live Demo

 https://agentready.ai.studio

---

## Problem

Traditional e-commerce websites are designed primarily for human shoppers.

Autonomous AI buyers have different requirements. They need:

- Machine-readable product information
- Structured product schemas
- Reliable real-time inventory
- Transparent pricing
- Deterministic tax and shipping calculations
- Clear return and warranty policies
- Low-friction checkout
- Machine-verifiable order confirmation

A website can work perfectly for a human while still failing an autonomous AI buyer.

AgentReady provides a pre-flight testing environment to identify these problems before they cause lost transactions.

---

## Solution

AgentReady simulates deterministic AI buyer journeys against a merchant's commerce infrastructure.

The platform provides:

- 5 AI buyer personas
- 3 demo products
- 8-stage autonomous buyer journey
- Machine-readable schema validation
- Product specification verification
- Real-time inventory verification
- Pricing, tax and shipping validation
- Return policy and SLA verification
- Autonomous payment/token simulation
- Order confirmation and webhook verification
- Controlled friction injection
- AI commerce readiness scoring
- Revenue leak analysis
- Stage-by-stage failure explanations

---

## AI Buyer Personas

### Autonomous Spec Inspector
Focuses on product specifications and micro-attributes.

### Discount & Tax Arbitrage Agent
Calculates total landed cost including pricing, tax, shipping and discounts.

### High-Speed Autonomous Shopper
Rejects CAPTCHA, unnecessary popups and multi-step checkout friction.

### Variant Matrix Explorer
Tests product variants and inventory states.

### Enterprise Policy & Compliance Agent
Verifies invoices, return windows, warranty policies and shipping SLAs.

---

## 8-Stage AI Buyer Journey

1. Intent & Merchant Discovery
2. Catalog & Machine-Readable Schema Parsing
3. Specification & Micro-Attribute Extraction
4. Dynamic Inventory & Stock Verification
5. Pricing, Taxes & Shipping Calculation
6. Return Policy & Shipping SLA Verification
7. Autonomous Payment & Token Negotiation
8. Order Confirmation & Webhook Dispatch

---

## Failure Simulation

AgentReady includes controlled friction injection to test how autonomous buyers respond to merchant infrastructure failures.

Supported scenarios:

- Anti-Bot CAPTCHA Gate
- Out-of-Stock SKU
- Missing JSON-LD Schema
- Hidden Checkout Fees

The simulation stops at the first critical failure and identifies:

- Failure stage
- Expected behavior
- Actual behavior
- Abandonment reason
- Business impact
- Recommended remediation

---

##  AI Commerce Readiness Score

AgentReady evaluates merchants across:

| Dimension | Description |
|---|---|
| Machine Readability | JSON-LD, Schema.org and UCP manifest detection |
| API Completeness | Inventory and pricing endpoint availability |
| Policy Clarity | Return and shipping SLA verification |
| Pricing Transparency | Tax, shipping and hidden-fee validation |
| Agent Checkout Viability | Autonomous checkout compatibility |

The final result is presented as a merchant-facing readiness score and grade.

---

## Architecture

```text
Merchant / Product Infrastructure
              │
              ▼
      AI Buyer Personas
              │
              ▼
     8-Stage Simulation
              │
       ┌──────┴──────┐
       ▼             ▼
   Gemini AI    Deterministic
   Analysis     Verification
       │             │
       └──────┬──────┘
              ▼
      Readiness Analytics
              │
       ┌──────┼──────┐
       ▼      ▼      ▼
     Score  Friction Revenue
            Points    Leak
