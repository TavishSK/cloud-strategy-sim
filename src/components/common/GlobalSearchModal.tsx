import React, { useState, useEffect } from 'react';
import { Search, X, Cpu, Server, Activity, ArrowRight } from 'lucide-react';
import type { Microservice, Experiment } from '../../types.ts';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Microservice[];
  experiments: Experiment[];
  onNavigate: (view: string, id?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  services,
  experiments,
  onNavigate
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle search
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.type.toLowerCase().includes(query.toLowerCase()) ||
    s.strategy.toLowerCase().includes(query.toLowerCase())
  );

  const filteredExperiments = experiments.filter(e =>
    e.title.toLowerCase().includes(query.toLowerCase()) ||
    e.id.toLowerCase().includes(query.toLowerCase()) ||
    e.workloadProfile.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-[#0B0F17] border border-[#1F2937] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1F2937]">
          <Search className="w-5 h-5 text-[#8c909f]" />
          <input
            type="text"
            placeholder="Search microservices, experiments, or simulation logs..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-sm text-[#d4e4fa] placeholder-[#8c909f] focus:outline-none"
          />
          <button onClick={onClose} className="text-[#8c909f] hover:text-[#d4e4fa] p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {/* Quick Views */}
          {!query && (
            <div>
              <p className="text-[11px] font-label-caps text-[#8c909f] px-3 py-1">Quick Navigation</p>
              <div className="grid grid-cols-2 gap-1.5 p-1">
                {[
                  { label: 'Overview Dashboard', view: 'dashboard' },
                  { label: 'Microservices Inventory', view: 'services' },
                  { label: 'Live Simulation Console', view: 'simulation' },
                  { label: 'Strategy Comparisons', view: 'experiments' },
                  { label: 'Analytics Dashboard', view: 'analytics' },
                  { label: 'Register New Service', view: 'register' }
                ].map(item => (
                  <button
                    key={item.view}
                    onClick={() => {
                      onNavigate(item.view);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2 rounded-lg text-xs text-[#c2c6d6] hover:text-white hover:bg-[#111827] text-left transition-colors"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="w-3 h-3 text-[#8c909f]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Services Result */}
          {filteredServices.length > 0 && (
            <div>
              <p className="text-[11px] font-label-caps text-[#8c909f] px-3 py-1">Microservices</p>
              <div className="space-y-1">
                {filteredServices.map(svc => (
                  <button
                    key={svc.id}
                    onClick={() => {
                      onNavigate('service-detail', svc.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-[#111827] text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Server className="w-4 h-4 text-[#4d8eff]" />
                      <div>
                        <p className="text-xs font-semibold text-[#d4e4fa] group-hover:text-white">{svc.name}</p>
                        <p className="text-[11px] text-[#8c909f]">{svc.type} • {svc.cluster}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-data-tabular">
                      <span className="text-[#8c909f]">{svc.replicas} reps</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#111827] border border-[#1F2937] text-[#adc6ff]">{svc.strategy}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Experiments Result */}
          {filteredExperiments.length > 0 && (
            <div>
              <p className="text-[11px] font-label-caps text-[#8c909f] px-3 py-1">Experiments</p>
              <div className="space-y-1">
                {filteredExperiments.map(exp => (
                  <button
                    key={exp.id}
                    onClick={() => {
                      onNavigate('experiments', exp.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-[#111827] text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-[#4edea3]" />
                      <div>
                        <p className="text-xs font-semibold text-[#d4e4fa] group-hover:text-white">{exp.id}: {exp.title}</p>
                        <p className="text-[11px] text-[#8c909f]">{exp.workloadProfile} • {exp.durationHours}h</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-data-tabular px-2 py-0.5 rounded bg-[#111827] border border-[#1F2937] text-[#4edea3]">
                      {exp.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredServices.length === 0 && filteredExperiments.length === 0 && query && (
            <div className="py-8 text-center text-xs text-[#8c909f]">
              No services or experiments match "<span className="text-white">{query}</span>"
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-[#070A0F] border-t border-[#1F2937] flex items-center justify-between text-[11px] text-[#8c909f]">
          <span>Navigate with mouse or quick click</span>
          <span className="font-data-tabular">ESC to close</span>
        </div>
      </div>
    </div>
  );
};
