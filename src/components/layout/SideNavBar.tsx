import React from 'react';
import {
  LayoutDashboard,
  Server,
  Activity,
  GitCompare,
  BarChart3,
  Settings,
  Plus,
  BookOpen,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

interface SideNavBarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenNewSimulation: () => void;
  onOpenDocs: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  currentView,
  onNavigate,
  onOpenNewSimulation,
  onOpenDocs
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'services', label: 'Microservices Inventory', icon: Server },
    { id: 'simulation', label: 'Live Simulation Console', icon: Activity, badge: 'LIVE' },
    { id: 'experiments', label: 'Strategy Comparisons', icon: GitCompare },
    { id: 'analytics', label: 'Analytics Dashboard', icon: BarChart3 },
    { id: 'settings', label: 'System Settings', icon: Settings }
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#070A0F] border-r border-[#1F2937] flex flex-col justify-between h-screen sticky top-0 select-none z-30">
      {/* Top Header & Brand */}
      <div>
        <div className="p-4 flex items-center gap-3 border-b border-[#1F2937]/80">
          <div className="w-9 h-9 rounded-lg bg-linear-to-br from-[#4d8eff] to-[#00285d] border border-[#4d8eff]/40 flex items-center justify-center text-white shadow-md">
            <Activity className="w-5 h-5 text-[#adc6ff]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              Axiom Cloud
            </h1>
            <p className="text-[11px] text-[#8c909f] font-mono">AutoScaler Core v2.4</p>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="p-3.5">
          <button
            onClick={onOpenNewSimulation}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#4d8eff] hover:bg-[#3b7ced] text-[#00285d] text-xs font-bold rounded-lg shadow-md transition-all duration-150 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Simulation</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="px-2 space-y-1 mt-1">
          <p className="px-3 py-1 text-[10px] font-label-caps text-[#8c909f]">Main Navigation</p>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (item.id === 'services' && currentView === 'register') || (item.id === 'services' && currentView === 'service-detail');
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#111827] text-white border-l-2 border-[#4d8eff] font-semibold'
                    : 'text-[#c2c6d6] hover:text-white hover:bg-[#111827]/60 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#4d8eff]' : 'text-[#8c909f]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-data-tabular font-bold rounded bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Support / Docs */}
      <div className="p-3 border-t border-[#1F2937] space-y-1">
        <button
          onClick={onOpenDocs}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-[#8c909f] hover:text-[#d4e4fa] hover:bg-[#111827] transition-colors text-left"
        >
          <BookOpen className="w-4 h-4 text-[#8c909f]" />
          <span>Technical Docs</span>
        </button>
        <button
          onClick={onOpenDocs}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-[#8c909f] hover:text-[#d4e4fa] hover:bg-[#111827] transition-colors text-left"
        >
          <HelpCircle className="w-4 h-4 text-[#8c909f]" />
          <span>Research Framework</span>
        </button>
        <div className="pt-2 px-3 flex items-center justify-between text-[10px] text-[#8c909f]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4edea3] live-dot"></span>
            <span className="font-mono">Engine Online</span>
          </div>
          <span className="font-mono">3 Clusters</span>
        </div>
      </div>
    </aside>
  );
};
