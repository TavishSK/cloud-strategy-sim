import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ToastProvider, useToast } from './context/ToastContext.tsx';
import { MainLayout } from './components/layout/MainLayout.tsx';
import { LoginView } from './views/LoginView.tsx';
import { OverviewDashboardView } from './views/OverviewDashboardView.tsx';
import { ServicesInventoryView } from './views/ServicesInventoryView.tsx';
import { RegisterServiceView } from './views/RegisterServiceView.tsx';
import { ServiceDetailView } from './views/ServiceDetailView.tsx';
import { LiveSimulationView } from './views/LiveSimulationView.tsx';
import { ExperimentsView } from './views/ExperimentsView.tsx';
import { AnalyticsView } from './views/AnalyticsView.tsx';
import { SettingsView } from './views/SettingsView.tsx';
import type { Microservice, Experiment, SimulationSession, DashboardStats, ScalingStrategy } from './types.ts';
import { api } from './services/api.ts';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Core Data
  const [services, setServices] = useState<Microservice[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeSimulation, setActiveSimulation] = useState<SimulationSession | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [servicesData, expsData, statsData, simData] = await Promise.allSettled([
        api.getServices(),
        api.getExperiments(),
        api.getDashboardStats(),
        api.getLiveSimulation()
      ]);

      if (servicesData.status === 'fulfilled') setServices(servicesData.value);
      if (expsData.status === 'fulfilled') setExperiments(expsData.value);
      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (simData.status === 'fulfilled') setActiveSimulation(simData.value);
    } catch (err) {
      console.error('Error loading initial data', err);
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Polling for live simulation sync in layout
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(async () => {
      try {
        const live = await api.getLiveSimulation();
        if (live) setActiveSimulation(live);
      } catch (e) {
        // ignore
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleNavigate = (view: string, id?: string) => {
    if (id) {
      setSelectedServiceId(id);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartSimulation = async (data: {
    serviceId: string;
    strategy?: ScalingStrategy;
    strategies?: ScalingStrategy[];
    workloadProfile: string;
    minReplicas: number;
    maxReplicas: number;
  }) => {
    try {
      const newSim = await api.startSimulation(data);
      setActiveSimulation(newSim);
      showToast('success', 'Simulation Launched', `Running ${newSim.id} on ${newSim.serviceName}.`);
      setCurrentView('simulation');
      loadData();
    } catch (err: any) {
      showToast('error', 'Launch Failed', err.message);
    }
  };

  if (!isAuthenticated) {
    return <LoginView onSuccess={() => setCurrentView('dashboard')} />;
  }

  // Selected Service for Detail View
  const activeDetailService = services.find(s => s.id === selectedServiceId);

  return (
    <MainLayout
      currentView={currentView}
      subViewTitle={currentView === 'service-detail' ? activeDetailService?.name : undefined}
      onNavigate={handleNavigate}
      services={services}
      experiments={experiments}
      activeSimulation={activeSimulation}
      onStartSimulation={handleStartSimulation}
    >
      {currentView === 'dashboard' && (
        <OverviewDashboardView
          stats={stats}
          services={services}
          onNavigate={handleNavigate}
          onRefreshStats={loadData}
        />
      )}

      {currentView === 'services' && (
        <ServicesInventoryView
          services={services}
          onNavigate={handleNavigate}
          onRefreshServices={loadData}
        />
      )}

      {currentView === 'register' && (
        <RegisterServiceView
          onBack={() => setCurrentView('services')}
          onSuccess={() => {
            loadData();
            setCurrentView('services');
          }}
        />
      )}

      {currentView === 'service-detail' && (
        <ServiceDetailView
          serviceId={selectedServiceId || services[0]?.id || 'srv-payment-gw'}
          onBack={() => setCurrentView('services')}
          onLaunchSimulation={(svcId) => {
            const svc = services.find(s => s.id === svcId);
            handleStartSimulation({
              serviceId: svcId,
              strategy: svc?.strategy || 'CPU',
              workloadProfile: 'HIGH_BURST',
              minReplicas: svc?.minReplicas || 2,
              maxReplicas: svc?.maxReplicas || 12
            });
          }}
        />
      )}

      {currentView === 'simulation' && (
        <LiveSimulationView
          initialSimulation={activeSimulation}
          onRefresh={loadData}
        />
      )}

      {currentView === 'experiments' && (
        <ExperimentsView
          experiments={experiments}
          services={services}
          onRefreshExperiments={loadData}
        />
      )}

      {currentView === 'analytics' && <AnalyticsView />}

      {currentView === 'settings' && <SettingsView />}
    </MainLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
