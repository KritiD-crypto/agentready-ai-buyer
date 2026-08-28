import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { TabType } from './components/layout/Sidebar';

import { MerchantDashboard } from './components/dashboard/MerchantDashboard';
import { AiBuyerLab } from './components/simulation/AiBuyerLab';
import { CounterfactualLab } from './components/simulation/CounterfactualLab';
import { FixPriorityQueue } from './components/fixes/FixPriorityQueue';
import { AgentManifestViewer } from './components/manifest/AgentManifestViewer';
import { ProductManager } from './components/store/ProductManager';
import { StoreProfileEditor } from './components/store/StoreProfileEditor';
import { RazorpayTestSandbox } from './components/payment/RazorpayTestSandbox';
import { SimulationHistoryView } from './components/simulation/SimulationHistoryView';
import { SystemDiagnosticsView } from './components/diagnostics/SystemDiagnosticsView';
import { RevenueIntelligenceView } from './components/revenue/RevenueIntelligenceView';
import { OrdersView } from './components/orders/OrdersView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { LandingView } from './components/landing/LandingView';
import { BuyerQueryBox } from './components/query/BuyerQueryBox';
import { AuthModal } from './components/auth/AuthModal';
import { OnboardingModal } from './components/auth/OnboardingModal';

function AgentReadyApp() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isQueryBoxOpen, setIsQueryBoxOpen] = useState(false);
  const { merchant, needsOnboarding, launchDemo, isLoading } = useAuth();

  // Keyboard shortcut: Cmd+K / Ctrl+K for Ask AI Buyer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQueryBoxOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-launch demo if no merchant logged in initially for seamless 1st-turn experience
  useEffect(() => {
    if (!isLoading && !merchant) {
      launchDemo();
    }
  }, [isLoading, merchant]);

  // Prompt onboarding if newly registered merchant hasn't completed profile
  useEffect(() => {
    if (needsOnboarding) {
      setIsOnboardingOpen(true);
    }
  }, [needsOnboarding]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'landing':
        return (
          <LandingView
            onLaunchDemo={() => setActiveTab('dashboard')}
            onExploreLab={() => setActiveTab('buyer_lab')}
            onViewRevenue={() => setActiveTab('revenue_intelligence')}
          />
        );
      case 'dashboard':
        return <MerchantDashboard onNavigate={setActiveTab} />;
      case 'analytics':
        return <AnalyticsView onNavigateToTab={(tab) => setActiveTab(tab)} />;
      case 'revenue_intelligence':
        return <RevenueIntelligenceView onNavigateToTab={(tab) => setActiveTab(tab)} />;
      case 'orders':
        return <OrdersView onNavigateToCatalog={() => setActiveTab('products')} />;
      case 'buyer_lab':
        return (
          <AiBuyerLab
            onNavigateFixes={() => setActiveTab('fixes')}
            onNavigateManifest={() => setActiveTab('manifest')}
          />
        );
      case 'counterfactual':
        return <CounterfactualLab />;
      case 'fixes':
        return <FixPriorityQueue />;
      case 'manifest':
        return <AgentManifestViewer />;
      case 'products':
        return <ProductManager />;
      case 'store_profile':
        return <StoreProfileEditor />;
      case 'payment_sandbox':
        return <RazorpayTestSandbox />;
      case 'diagnostics':
        return <SystemDiagnosticsView />;
      case 'history':
        return <SimulationHistoryView />;
      default:
        return <MerchantDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onOpenAuth={() => setIsAuthOpen(true)}
      onOpenQueryBox={() => setIsQueryBoxOpen(true)}
    >
      {renderActiveTab()}

      {/* Global Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />
      <BuyerQueryBox isOpen={isQueryBoxOpen} onClose={() => setIsQueryBoxOpen(false)} />
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AgentReadyApp />
    </AuthProvider>
  );
}
