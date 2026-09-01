import React, { useState } from 'react';
import { SideNavBar } from './SideNavBar.tsx';
import { TopNavBar } from './TopNavBar.tsx';
import { GlobalSearchModal } from '../common/GlobalSearchModal.tsx';
import { NewSimulationModal } from '../common/NewSimulationModal.tsx';
import { DocsModal } from '../common/DocsModal.tsx';
import type { Microservice, Experiment, SimulationSession, ScalingStrategy } from '../../types.ts';

interface MainLayoutProps {
  currentView: string;
  subViewTitle?: string;
  onNavigate: (view: string, id?: string) => void;
  services: Microservice[];
  experiments: Experiment[];
  activeSimulation: SimulationSession | null;
  onStartSimulation: (data: {
    serviceId: string;
    strategy: ScalingStrategy;
    workloadProfile: string;
    minReplicas: number;
    maxReplicas: number;
  }) => Promise<void>;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentView,
  subViewTitle,
  onNavigate,
  services,
  experiments,
  activeSimulation,
  onStartSimulation,
  children
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewSimOpen, setIsNewSimOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#070A0F] text-[#d4e4fa] flex">
      {/* Side Navigation */}
      <SideNavBar
        currentView={currentView}
        onNavigate={onNavigate}
        onOpenNewSimulation={() => setIsNewSimOpen(true)}
        onOpenDocs={() => setIsDocsOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavBar
          currentView={currentView}
          subViewTitle={subViewTitle}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenDocs={() => setIsDocsOpen(true)}
          activeSimulation={activeSimulation}
          onNavigate={onNavigate}
        />

        <main className="flex-1 p-6 lg:p-8 max-w-[1600px] w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        services={services}
        experiments={experiments}
        onNavigate={onNavigate}
      />

      <NewSimulationModal
        isOpen={isNewSimOpen}
        onClose={() => setIsNewSimOpen(false)}
        services={services}
        onStartSimulation={onStartSimulation}
      />

      <DocsModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </div>
  );
};
