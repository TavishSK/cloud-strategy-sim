import React, { useState } from 'react';
import { X, Play, Zap, Cpu, TrendingUp, Clock, CheckSquare, Square, AlertCircle } from 'lucide-react';
import type { Microservice, ScalingStrategy } from '../../types.ts';

interface NewSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Microservice[];
  onStartSimulation: (data: {
    serviceId: string;
    strategy?: ScalingStrategy;
    strategies?: ScalingStrategy[];
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
  // Default: all 3 strategies selected initially
  const [strategies, setStrategies] = useState<ScalingStrategy[]>(['CPU', 'TREND', 'LATENCY']);
  const [workloadProfile, setWorkloadProfile] = useState('HIGH_BURST');
  const [minReplicas, setMinReplicas] = useState(2);
  const [maxReplicas, setMaxReplicas] = useState(12);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleStrategy = (strat: ScalingStrategy) => {
    if (strategies.includes(strat)) {
      setStrategies(prev => prev.filter(s => s !== strat));
    } else {
      setStrategies(prev => [...prev, strat]);
    }
    setErrorMsg(null);
  };

  const selectAllStrategies = () => {
    setStrategies(['CPU', 'TREND', 'LATENCY']);
    setErrorMsg(null);
  };

  const isValidStrategies = strategies.length > 0;
  const isValidReplicas = minReplicas > 0 && maxReplicas >= minReplicas;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidStrategies) {
      setErrorMsg('Please select at least 1 scaling strategy.');
      return;
    }
    if (!isValidReplicas) {
      setErrorMsg('Min replicas must be less than or equal to Max replicas.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await onStartSimulation({
        serviceId: selectedServiceId,
        strategy: strategies[0] || 'CPU',
        strategies,
        workloadProfile,
        minReplicas,
        maxReplicas
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to start simulation session.');
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
          <button onClick={onClose} className="text-[#8c909f] hover:text-[#d4e4fa] p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 rounded-lg flex items-center gap-2 text-xs text-[#ffb4ab]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Service Selector */}
          <div>
            <label className="block text-xs font-label-caps text-[#c2c6d6] mb-1.5">Target Microservice</label>
            <select
              value={selectedServiceId}
              onChange={e => setSelectedServiceId(e.target.value)}
              className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-sm text-[#d4e4fa] focus:border-[#4d8eff] focus:outline-none cursor-pointer"
            >
              {services.map(svc => (
                <option key={svc.id} value={svc.id}>
                  {svc.name} ({svc.type} • {svc.cluster})
                </option>
              ))}
            </select>
          </div>

          {/* Multi-Select Scaling Strategy Options */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-label-caps text-[#c2c6d6]">
                Scaling Strategy (Select 1 or more)
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                    strategies.length > 0
                      ? 'bg-[#070A0F] border-[#1F2937] text-[#adc6ff]'
                      : 'bg-[#ffb4ab]/10 border-[#ffb4ab]/40 text-[#ffb4ab]'
                  }`}
                >
                  {strategies.length} of 3 Selected
                </span>
                {strategies.length < 3 && (
                  <button
                    type="button"
                    onClick={selectAllStrategies}
                    className="text-[11px] text-[#4d8eff] hover:underline cursor-pointer font-medium"
                  >
                    Select All
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: 'CPU' as ScalingStrategy,
                  label: 'CPU Target',
                  sub: '75% HPA trigger',
                  icon: <Cpu className="w-4 h-4 text-[#4d8eff]" />
                },
                {
                  id: 'TREND' as ScalingStrategy,
                  label: 'TREND Predictive',
                  sub: 'Rate-of-change forecast',
                  icon: <TrendingUp className="w-4 h-4 text-[#4edea3]" />
                },
                {
                  id: 'LATENCY' as ScalingStrategy,
                  label: 'LATENCY Custom',
                  sub: '150ms SLA ceiling',
                  icon: <Clock className="w-4 h-4 text-[#ffb95f]" />
                }
              ].map(s => {
                const isSelected = strategies.includes(s.id);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleStrategy(s.id)}
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#4d8eff]/10 border-[#4d8eff] text-white shadow-xs ring-1 ring-[#4d8eff]/40'
                        : 'bg-[#070A0F]/60 border-[#1F2937] text-[#8c909f] opacity-60 hover:opacity-100 hover:border-[#424754]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      {s.icon}
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#4d8eff]" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-[#8c909f]" />
                      )}
                    </div>
                    <div>
                      <span className={`text-xs font-semibold block ${isSelected ? 'text-[#d4e4fa]' : 'text-[#8c909f]'}`}>
                        {s.label}
                      </span>
                      <span className="text-[10px] text-[#8c909f] block leading-tight mt-0.5">{s.sub}</span>
                    </div>
                    <div className="text-[10px] font-mono pt-1 border-t border-[#1F2937]/50 flex items-center justify-between">
                      <span className={isSelected ? 'text-[#4edea3]' : 'text-[#8c909f]'}>
                        {isSelected ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {strategies.length === 0 && (
              <p className="text-[11px] text-[#ffb4ab] mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>At least 1 strategy must be selected. Click any card to select it.</span>
              </p>
            )}
          </div>

          {/* Workload Profile */}
          <div>
            <label className="block text-xs font-label-caps text-[#c2c6d6] mb-1.5">Simulated Workload Profile</label>
            <select
              value={workloadProfile}
              onChange={e => setWorkloadProfile(e.target.value)}
              className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-sm text-[#d4e4fa] focus:border-[#4d8eff] focus:outline-none cursor-pointer"
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
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#c2c6d6] hover:bg-[#111827] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValidStrategies || !isValidReplicas}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#4d8eff] hover:bg-[#3b7ced] text-[#00285d] text-xs font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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

