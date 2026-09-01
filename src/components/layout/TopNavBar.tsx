import React, { useState } from 'react';
import {
  Search,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Activity,
  CheckCircle2,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { SimulationSession } from '../../types.ts';

interface TopNavBarProps {
  currentView: string;
  subViewTitle?: string;
  onOpenSearch: () => void;
  onOpenDocs: () => void;
  activeSimulation?: SimulationSession | null;
  onNavigate: (view: string) => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentView,
  subViewTitle,
  onOpenSearch,
  onOpenDocs,
  activeSimulation,
  onNavigate
}) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getBreadcrumb = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Overview Dashboard';
      case 'services':
        return 'Microservices Inventory';
      case 'register':
        return 'Register Microservice';
      case 'service-detail':
        return subViewTitle ? `Microservices / ${subViewTitle}` : 'Service Details';
      case 'simulation':
        return 'Live Simulation Console';
      case 'experiments':
        return 'Strategy Comparisons & Experiments';
      case 'analytics':
        return 'Analytics Dashboard';
      case 'settings':
        return 'System & Cluster Settings';
      default:
        return 'Platform';
    }
  };

  return (
    <header className="h-14 bg-[#070A0F]/90 backdrop-blur-md border-b border-[#1F2937] px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Breadcrumb path */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-[#8c909f] hover:text-[#d4e4fa] cursor-pointer" onClick={() => onNavigate('dashboard')}>
          Platform
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-[#8c909f]" />
        <span className="font-semibold text-white">{getBreadcrumb()}</span>

        {activeSimulation && activeSimulation.status === 'RUNNING' && (
          <div
            onClick={() => onNavigate('simulation')}
            className="ml-4 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#4edea3]/10 border border-[#4edea3]/30 text-[#4edea3] text-[11px] font-data-tabular cursor-pointer hover:bg-[#4edea3]/20 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] live-dot"></span>
            <span>{activeSimulation.id}: {activeSimulation.strategy} (6 reps)</span>
          </div>
        )}
      </div>

      {/* Center Search Bar */}
      <div className="flex-1 max-w-md mx-6">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-[#0B0F17] hover:bg-[#111827] border border-[#1F2937] rounded-lg text-xs text-[#8c909f] transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-3.5 h-3.5 text-[#8c909f] group-hover:text-[#d4e4fa]" />
            <span>Search services, simulations, experiments...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-[#111827] border border-[#2D3748] text-[#8c909f]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Links */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-[#8c909f] mr-2">
          <button onClick={onOpenDocs} className="hover:text-[#d4e4fa] transition-colors flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Docs</span>
          </button>
          <span className="text-[#1F2937]">|</span>
          <button onClick={onOpenDocs} className="hover:text-[#d4e4fa] transition-colors">
            API Reference
          </button>
          <span className="text-[#1F2937]">|</span>
          <div className="flex items-center gap-1 text-[#4edea3]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
            <span>All Systems Operational</span>
          </div>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-[#8c909f] hover:text-[#d4e4fa] hover:bg-[#111827] transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#4d8eff]"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0B0F17] border border-[#1F2937] rounded-xl shadow-2xl p-3 z-30 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-[#1F2937]">
                <p className="text-xs font-semibold text-white">System Notifications</p>
                <span className="text-[10px] text-[#4edea3]">3 New</span>
              </div>
              <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                <div className="p-2 bg-[#070A0F] rounded border border-[#1F2937] text-xs">
                  <p className="font-medium text-[#adc6ff]">Simulation SIM-2024-001 Auto-Scaled</p>
                  <p className="text-[11px] text-[#8c909f] mt-0.5">Scale up to 6 replicas triggered under burst load.</p>
                  <span className="text-[10px] text-[#8c909f] font-mono">1m ago</span>
                </div>
                <div className="p-2 bg-[#070A0F] rounded border border-[#1F2937] text-xs">
                  <p className="font-medium text-[#4edea3]">Experiment EXP-2049 Completed 31%</p>
                  <p className="text-[11px] text-[#8c909f] mt-0.5">CPU strategy maintaining 88% efficiency score.</p>
                  <span className="text-[10px] text-[#8c909f] font-mono">5m ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <button
          onClick={onOpenDocs}
          className="p-2 rounded-lg text-[#8c909f] hover:text-[#d4e4fa] hover:bg-[#111827] transition-colors"
          aria-label="Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-[#111827] transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full bg-[#4d8eff]/20 border border-[#4d8eff]/40 flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-xs font-bold text-[#adc6ff]">OP</span>
              )}
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-[#0B0F17] border border-[#1F2937] rounded-xl shadow-2xl p-2 z-30 animate-in fade-in zoom-in-95">
              <div className="p-2.5 border-b border-[#1F2937]">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Operator'}</p>
                <p className="text-[11px] text-[#8c909f] truncate">{user?.email || 'operator@company.com'}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded bg-[#4d8eff]/10 border border-[#4d8eff]/30 text-[10px] text-[#adc6ff] font-mono">
                  {user?.role || 'SRE Lead'}
                </span>
              </div>
              <div className="pt-1">
                <button
                  onClick={() => {
                    onNavigate('settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[#c2c6d6] hover:text-white hover:bg-[#111827] rounded-lg transition-colors"
                >
                  Cluster & System Settings
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#ffb4ab] hover:bg-[#93000a]/20 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
