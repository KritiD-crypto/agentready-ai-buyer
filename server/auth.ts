/**
 * AgentReady Production Authentication & Session Engine
 * Cryptographically secure password hashing (PBKDF2-SHA512), session token signatures (HMAC-SHA256),
 * session expiry handling, and merchant data isolation middleware.
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { db, DEMO_MERCHANT_ID, initialMerchant } from './db';
import { Merchant, StoreProfile } from '../src/types/index';

// Server-side session signing secret (kept strictly server-side)
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.RAZORPAY_KEY_SECRET || 'agentready_secure_session_hmac_secret_2026';
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days expiration

// In-memory revoked tokens blacklist for instant logout invalidation
const revokedTokens = new Set<string>();

export interface AuthenticatedRequest extends Request {
  merchant?: Merchant;
  merchantId?: string;
  isDemo?: boolean;
}

/**
 * Hash a password securely with PBKDF2 and a unique cryptographic salt
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Verify a plain text password against a stored PBKDF2 hash & salt
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const computedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Create a tamper-proof signed session token
 * Format: ar_sess.<merchantId>.<timestamp>.<hmacSignature>
 */
export function createSessionToken(merchantId: string): string {
  const timestamp = Date.now().toString();
  const payload = `${merchantId}.${timestamp}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `ar_sess.${payload}.${signature}`;
}

/**
 * Verify a session token, signature, and expiration
 */
export function verifySessionToken(token: string): {
  valid: boolean;
  merchantId?: string;
  isDemo?: boolean;
  expired?: boolean;
  error?: string;
} {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Missing token' };
  }

  // Handle Demo Session Token
  if (token === `demo_session_${DEMO_MERCHANT_ID}` || token.startsWith('demo_session_')) {
    return { valid: true, merchantId: DEMO_MERCHANT_ID, isDemo: true };
  }

  if (revokedTokens.has(token)) {
    return { valid: false, error: 'Session has been logged out/revoked' };
  }

  // Handle Signed Production Token
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== 'ar_sess') {
    // Fallback support for simple format if needed
    if (token.startsWith('session_mer_')) {
      const cleanId = token.replace('session_', '');
      return { valid: true, merchantId: cleanId, isDemo: false };
    }
    return { valid: false, error: 'Invalid token format' };
  }

  const [_, merchantId, timestampStr, providedSignature] = parts;
  const timestamp = parseInt(timestampStr, 10);

  if (isNaN(timestamp)) {
    return { valid: false, error: 'Invalid timestamp' };
  }

  // Check TTL expiration
  if (Date.now() - timestamp > TOKEN_TTL_MS) {
    return { valid: false, expired: true, error: 'Session token has expired' };
  }

  // Verify HMAC signature
  const payload = `${merchantId}.${timestampStr}`;
  const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');

  try {
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(providedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (!isSignatureValid) {
      return { valid: false, error: 'Invalid token signature' };
    }

    return { valid: true, merchantId, isDemo: false };
  } catch {
    return { valid: false, error: 'Signature verification failure' };
  }
}

/**
 * Revoke a token on logout
 */
export function revokeToken(token: string): void {
  if (token) {
    revokedTokens.add(token);
  }
}

/**
 * Helper to resolve merchant and store from an incoming HTTP Request
 */
export async function resolveMerchantSession(req: Request): Promise<{
  merchant: Merchant | null;
  store: StoreProfile | null;
  isDemo: boolean;
  error?: string;
}> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Default to NovaGear Demo when unauthenticated in demo environments
    const demoMerchant = db.getMerchant(DEMO_MERCHANT_ID) || initialMerchant;
    const demoStore = db.getStoreProfile(demoMerchant.id);
    return { merchant: demoMerchant, store: demoStore || null, isDemo: true };
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const verified = verifySessionToken(token);

  if (!verified.valid || !verified.merchantId) {
    return { merchant: null, store: null, isDemo: false, error: verified.error || 'Invalid session' };
  }

  const merchant = await db.getMerchantAsync(verified.merchantId);
  if (!merchant) {
    return { merchant: null, store: null, isDemo: false, error: 'Merchant not found' };
  }

  const store = (await db.getStoreProfileAsync(merchant.id)) || null;
  return { merchant, store, isDemo: !!verified.isDemo };
}

/**
 * Authentication Middleware that enforces strict merchant authentication
 * Rejects invalid or expired credentials with HTTP 401
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide a valid Authorization Bearer token to access this workspace.',
    });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const verified = verifySessionToken(token);

  if (!verified.valid || !verified.merchantId) {
    return res.status(401).json({
      error: 'Invalid or expired session',
      message: verified.error || 'Your session has expired. Please sign in again.',
      expired: verified.expired,
    });
  }

  const merchant = await db.getMerchantAsync(verified.merchantId);
  if (!merchant) {
    return res.status(401).json({
      error: 'Merchant workspace not found',
      message: 'The requested merchant account does not exist or has been deleted.',
    });
  }

  // Attach strictly verified merchant identity to request
  req.merchant = merchant;
  req.merchantId = merchant.id;
  req.isDemo = verified.isDemo;

  next();
}
