/**
 * AgentReady Authentication & Merchant Context
 * Production-ready authentication state, session persistence, onboarding management, and NovaGear Demo sandbox.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Merchant, StoreProfile } from '../types/index';
import { api } from '../lib/api';

interface OnboardingInput {
  companyName: string;
  contactName?: string;
  phone?: string;
  websiteUrl?: string;
  businessDescription?: string;
  currency?: string;
  country?: string;
  returnPolicyDays?: number;
  freeShippingThreshold?: number;
  category?: string;
}

interface AuthContextType {
  merchant: Merchant | null;
  store: StoreProfile | null;
  isLoading: boolean;
  isDemoMode: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  authError: string | null;
  clearAuthError: () => void;
  launchDemo: () => Promise<void>;
  loginWithEmail: (email: string, password?: string) => Promise<void>;
  registerMerchant: (data: {
    email: string;
    password?: string;
    name: string;
    companyName: string;
    phone?: string;
    website?: string;
    businessDescription?: string;
  }) => Promise<void>;
  completeOnboarding: (data: OnboardingInput) => Promise<void>;
  updateMerchantProfile: (profile: Partial<Merchant>) => Promise<void>;
  logout: () => Promise<void>;
  refreshStore: () => Promise<void>;
  resetDemoData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  // Initialize session on mount
  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem('agentready_token');
      try {
        const session = await api.getSession();
        if (session && session.merchant) {
          setMerchant(session.merchant);
          setStore(session.store);
        }
      } catch (err: any) {
        console.warn('Session verification fallback:', err?.message || err);
        if (token && (err?.message?.includes('expired') || err?.message?.includes('Invalid') || err?.message?.includes('401'))) {
          localStorage.removeItem('agentready_token');
          setMerchant(null);
          setStore(null);
        }
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const launchDemo = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await api.demoLogin();
      localStorage.setItem('agentready_token', res.token);
      setMerchant(res.merchant);
      setStore(res.store);
    } catch (err: any) {
      console.error('Demo launch error:', err);
      setAuthError(err.message || 'Failed to initialize demo sandbox');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password?: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await api.login({ email, password });
      localStorage.setItem('agentready_token', res.token);
      setMerchant(res.merchant);
      setStore(res.store);
    } catch (err: any) {
      console.error('Login error:', err);
      setAuthError(err.message || 'Failed to authenticate merchant');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerMerchant = async (data: {
    email: string;
    password?: string;
    name: string;
    companyName: string;
    phone?: string;
    website?: string;
    businessDescription?: string;
  }) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await api.register(data);
      localStorage.setItem('agentready_token', res.token);
      setMerchant(res.merchant);
      setStore(res.store);
    } catch (err: any) {
      console.error('Registration error:', err);
      setAuthError(err.message || 'Failed to register merchant account');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (data: OnboardingInput) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await api.completeOnboarding(data);
      setMerchant(res.merchant);
      setStore(res.store);
    } catch (err: any) {
      console.error('Onboarding completion error:', err);
      setAuthError(err.message || 'Failed to complete merchant onboarding');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateMerchantProfile = async (profile: Partial<Merchant>) => {
    try {
      const res = await api.updateMerchantProfile(profile);
      setMerchant(res.merchant);
    } catch (err: any) {
      console.error('Profile update error:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('agentready_token');
      setMerchant(null);
      setStore(null);
      setAuthError(null);
    }
  };

  const refreshStore = useCallback(async () => {
    if (!merchant) return;
    try {
      const updatedStore = await api.getStore(merchant.id);
      setStore(updatedStore);
    } catch (err) {
      console.error('Error refreshing store profile:', err);
    }
  }, [merchant]);

  const resetDemoData = async () => {
    setIsLoading(true);
    try {
      await api.resetDemoData();
      await launchDemo();
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isDemoMode = Boolean(merchant?.isDemo);
  const isAuthenticated = Boolean(merchant);
  const needsOnboarding = Boolean(merchant && !merchant.isDemo && merchant.isOnboarded === false);

  return (
    <AuthContext.Provider
      value={{
        merchant,
        store,
        isLoading,
        isDemoMode,
        isAuthenticated,
        needsOnboarding,
        authError,
        clearAuthError,
        launchDemo,
        loginWithEmail,
        registerMerchant,
        completeOnboarding,
        updateMerchantProfile,
        logout,
        refreshStore,
        resetDemoData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
