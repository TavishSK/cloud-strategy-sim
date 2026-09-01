import React, { useState } from 'react';
import { X, Play, Zap, Cpu, TrendingUp, Clock } from 'lucide-react';
import type { Microservice, ScalingStrategy } from '../../types.ts';

interface NewSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Microservice[];
  onStartSimulation: (data: {
    serviceId: string;
    strategy: ScalingStrategy;
    workloadProfile: string;
    minReplicas: number;
    maxReplicas: number;
  }) => Promise<void>;
}

export const NewSimulationModal: React.FC<NewSimulationModalProps> = ({
  isOpen,
  onClose,
  services,
  onStartSimulation
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || 'srv-order-svc');
  const [strategy, setStrategy] = useState<ScalingStrategy>('CPU');
  const [workloadProfile, setWorkloadProfile] = useState('HIGH_BURST');
  const [minReplicas, setMinReplicas] = useState(2);
  const [maxReplicas, setMaxReplicas] = useState(12);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onStartSimulation({
        serviceId: selectedServiceId,
        strategy,
        workloadProfile,
        minReplicas,
        maxReplicas
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#0B0F17] border border-[#1F2937] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2937]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4d8eff]/10 border border-[#4d8eff]/30 flex items-center justify-center text-[#4d8eff]">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#d4e4fa]">Launch Simulation Session</h3>
              <p className="text-xs text-[#8c909f]">Run live auto-scaler stress tests with telemetry streaming</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8c909f] hover:text-[#d4e4fa] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Service Selector */}
          <div>
            <label className="block text-xs font-label-caps text-[#c2c6d6] mb-1.5">Target Microservice</label>
            <select
              value={selectedServiceId}
              onChange={e => setSelectedServiceId(e.target.value)}
              className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-sm text-[#d4e4fa] focus:border-[#4d8eff] focus:outline-none"
            >
              {services.map(svc => (
                <option key={svc.id} value={svc.id}>
                  {svc.name} ({svc.type} • {svc.cluster})
                </option>
              ))}
            </select>
          </div>

          {/* Scaling Strategy Options */}
          <div>
            <label className="block text-xs font-label-caps text-[#c2c6d6] mb-1.5">Scaling Strategy</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'CPU', label: 'CPU Target', icon: <Cpu className="w-4 h-4 text-[#4d8eff]" /> },
                { id: 'TREND', label: 'TREND Predictive', icon: <TrendingUp className="w-4 h-4 text-[#4edea3]" /> },
                { id: 'LATENCY', label: 'LATENCY Custom', icon: <Clock className="w-4 h-4 text-[#ffb95f]" /> }
              ].map(s => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setStrategy(s.id as ScalingStrategy)}
                  className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                    strategy === s.id
                      ? 'bg-[#4d8eff]/10 border-[#4d8eff] text-white shadow-xs'
                      : 'bg-[#070A0F] border-[#1F2937] text-[#8c909f] hover:border-[#424754]'
                  }`}
                >
                  {s.icon}
                  <span className="text-xs font-semibold text-[#d4e4fa]">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Workload Profile */}
          <div>
            <label className="block text-xs font-label-caps text-[#c2c6d6] mb-1.5">Simulated Workload Profile</label>
            <select
              value={workloadProfile}
              onChange={e => setWorkloadProfile(e.target.value)}
              className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-sm text-[#d4e4fa] focus:border-[#4d8eff] focus:outline-none"
            >
              <option value="HIGH_BURST">High Burst & Chaotic Micro-Spikes</option>
              <option value="PERIODIC">Periodic Diurnal Sine Wave (Day/Night)</option>
              <option value="SUDDEN_SPIKE">Sudden 10x Flash-Sale Spike</option>
              <option value="STABLE">Stable Baseline Load (±5% Noise)</option>
              <option value="BLACK_FRIDAY">E-Commerce Black Friday Ramp</option>
            </select>
          </div>

          {/* Replica bounds */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-label-caps text-[#8c909f] mb-1">Min Replicas</label>
              <input
                type="number"
                min="1"
                max="20"
                value={minReplicas}
                onChange={e => setMinReplicas(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-sm text-[#d4e4fa] font-data-tabular focus:border-[#4d8eff] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-label-caps text-[#8c909f] mb-1">Max Replicas</label>
              <input
                type="number"
                min="2"
                max="60"
                value={maxReplicas}
                onChange={e => setMaxReplicas(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-sm text-[#d4e4fa] font-data-tabular focus:border-[#4d8eff] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1F2937]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#c2c6d6] hover:bg-[#111827] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#4d8eff] hover:bg-[#3b7ced] text-[#00285d] text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              {isSubmitting ? 'Starting...' : 'Start Simulation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
