import React, { useState } from 'react';
import {
  ArrowLeft,
  Server,
  Cpu,
  Clock,
  TrendingUp,
  Activity,
  Zap,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  Square
} from 'lucide-react';
import type { ScalingStrategy, TrafficPattern } from '../types.ts';
import { useToast } from '../context/ToastContext.tsx';
import { api } from '../services/api.ts';

interface RegisterServiceViewProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const RegisterServiceView: React.FC<RegisterServiceViewProps> = ({ onBack, onSuccess }) => {
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [type, setType] = useState('Payment Processing');
  const [description, setDescription] = useState('');
  const [workloadPattern, setWorkloadPattern] = useState<TrafficPattern>('spike');
  const [initialReplicas, setInitialReplicas] = useState(3);
  const [minReplicas, setMinReplicas] = useState(2);
  const [maxReplicas, setMaxReplicas] = useState(12);
  const [cpuBaseline, setCpuBaseline] = useState(250);
  const [responseBaseline, setResponseBaseline] = useState(120);
  // Default: all 3 strategies selected initially
  const [strategies, setStrategies] = useState<ScalingStrategy[]>(['CPU', 'TREND', 'LATENCY']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Validation
  const isValidReplicas = minReplicas <= initialReplicas && initialReplicas <= maxReplicas;
  const isValidStrategies = strategies.length > 0;

  const toggleStrategy = (strat: ScalingStrategy) => {
    if (strategies.includes(strat)) {
      setStrategies(prev => prev.filter(s => s !== strat));
    } else {
      setStrategies(prev => [...prev, strat]);
    }
  };

  const selectAllStrategies = () => {
    setStrategies(['CPU', 'TREND', 'LATENCY']);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Service name is required.');
      return;
    }
    if (!isValidReplicas) {
      setErrorMsg('Constraint error: Minimum Replicas ≤ Initial Replicas ≤ Maximum Replicas.');
      return;
    }
    if (!isValidStrategies) {
      setErrorMsg('Policy constraint error: Please select at least 1 auto-scaling strategy.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await api.createService({
        name: name.trim(),
        type,
        description: description.trim() || 'Containerized microservice workload on Kubernetes.',
        initialReplicas: Number(initialReplicas),
        minReplicas: Number(minReplicas),
        maxReplicas: Number(maxReplicas),
        workloadPattern,
        cpuBaseline: Number(cpuBaseline),
        responseBaseline: Number(responseBaseline),
        strategy: strategies[0],
        strategies
      });
      showToast(
        'success',
        'Microservice Registered',
        `${name} successfully provisioned with ${strategies.length} auto-scaling ${strategies.length === 1 ? 'policy' : 'policies'} (${strategies.join(', ')}).`
      );
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register service.');
      showToast('error', 'Registration Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-[#0B0F17] hover:bg-[#111827] text-[#8c909f] hover:text-white border border-[#1F2937] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-display">Register Microservice</h2>
          <p className="text-xs text-[#8c909f]">
            Define pod specifications, load behavior, and auto-scaling decision policies
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 rounded-xl flex items-start gap-3 text-xs text-[#ffb4ab]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card-level-1 p-6 sm:p-8 rounded-xl border border-[#1F2937] space-y-6">
        {/* Section 1: Basic Identifiers */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-4 pb-2 border-b border-[#1F2937] flex items-center gap-2">
            <Server className="w-4 h-4 text-[#4d8eff]" />
            <span>1. Service Identification</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-label-caps text-[#c2c6d6] mb-1.5">
                Service Name <span className="text-[#ffb4ab]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Payment Gateway"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-sm text-[#d4e4fa] focus:border-[#4d8eff] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-label-caps text-[#c2c6d6] mb-1.5">Service Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-sm text-[#d4e4fa] focus:border-[#4d8eff] focus:outline-none cursor-pointer"
              >
                <option value="Payment Processing">Payment Processing</option>
                <option value="Order Management">Order Management</option>
                <option value="Authentication">Authentication / Identity</option>
                <option value="Data Analytics">Data Analytics / ML</option>
                <option value="API Gateway">API Gateway / Edge</option>
                <option value="Background Worker">Background Worker</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-label-caps text-[#c2c6d6] mb-1.5">Description</label>
              <textarea
                rows={2}
                placeholder="Briefly describe the microservice's role in the architecture..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-xs text-[#d4e4fa] focus:border-[#4d8eff] focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Workload Profile */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-4 pb-2 border-b border-[#1F2937] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#4edea3]" />
            <span>2. Workload Traffic Pattern</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                id: 'stable',
                title: 'Stable Load',
                desc: 'Predictable baseline with ±5% background jitter.',
                icon: <Zap className="w-4 h-4 text-[#4edea3]" />
              },
              {
                id: 'spike',
                title: 'Sudden Spike',
                desc: 'Flash-sale surges (up to 10x within seconds).',
                icon: <Activity className="w-4 h-4 text-[#ffb95f]" />
              },
              {
                id: 'periodic',
                title: 'Periodic Wave',
                desc: 'Diurnal daytime vs nighttime traffic cycles.',
                icon: <TrendingUp className="w-4 h-4 text-[#4d8eff]" />
              },
              {
                id: 'chaotic',
                title: 'Chaotic Burst',
                desc: 'High variance uncoordinated micro-spikes.',
                icon: <Cpu className="w-4 h-4 text-[#ffb4ab]" />
              }
            ].map(item => (
              <div
                key={item.id}
                onClick={() => setWorkloadPattern(item.id as TrafficPattern)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  workloadPattern === item.id
                    ? 'bg-[#111827] border-[#4d8eff] shadow-md'
                    : 'bg-[#070A0F] border-[#1F2937] hover:border-[#424754]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    {item.icon}
                    {workloadPattern === item.id && (
                      <CheckCircle2 className="w-4 h-4 text-[#4d8eff]" />
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-[#d4e4fa]">{item.title}</h4>
                  <p className="text-[11px] text-[#8c909f] mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Replica Limits */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-4 pb-2 border-b border-[#1F2937] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#ffb95f]" />
              <span>3. Replica Constraints</span>
            </div>
            <span
              className={`text-[11px] font-mono ${
                isValidReplicas ? 'text-[#4edea3]' : 'text-[#ffb4ab] font-bold'
              }`}
            >
              {minReplicas} ≤ {initialReplicas} ≤ {maxReplicas}
            </span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-label-caps text-[#8c909f] mb-1">
                Minimum Replicas
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={minReplicas}
                onChange={e => setMinReplicas(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-sm text-[#d4e4fa] font-data-tabular focus:border-[#4d8eff] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-label-caps text-[#8c909f] mb-1">
                Initial Desired Replicas
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={initialReplicas}
                onChange={e => setInitialReplicas(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-sm text-[#d4e4fa] font-data-tabular focus:border-[#4d8eff] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-label-caps text-[#8c909f] mb-1">
                Maximum Replicas
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={maxReplicas}
                onChange={e => setMaxReplicas(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-sm text-[#d4e4fa] font-data-tabular focus:border-[#4d8eff] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Performance Baselines & Multi-Strategy Selection */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-[#1F2937]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#adc6ff]" />
              <span className="text-sm font-semibold text-white">4. Auto-Scaling Decision Policies</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
                  strategies.length > 0
                    ? 'bg-[#111827] border-[#4d8eff]/40 text-[#adc6ff]'
                    : 'bg-[#ffb4ab]/10 border-[#ffb4ab]/40 text-[#ffb4ab] font-bold'
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-label-caps text-[#8c909f] mb-1">
                Baseline CPU per Replica (mCores)
              </label>
              <input
                type="number"
                min="50"
                max="4000"
                step="50"
                value={cpuBaseline}
                onChange={e => setCpuBaseline(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-sm text-[#d4e4fa] font-data-tabular focus:border-[#4d8eff] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-label-caps text-[#8c909f] mb-1">
                Target Response SLA (ms)
              </label>
              <input
                type="number"
                min="5"
                max="2000"
                value={responseBaseline}
                onChange={e => setResponseBaseline(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-sm text-[#d4e4fa] font-data-tabular focus:border-[#4d8eff] focus:outline-none"
              />
            </div>
          </div>

          <p className="text-xs text-[#8c909f] mb-3">
            Select 1 or more auto-scaling policies to apply to this microservice. Click each card to toggle on/off:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'CPU' as ScalingStrategy,
                title: 'CPU Target Tracking',
                sub: 'Kubernetes standard HPA. Scales when CPU utilization breaches 75%.',
                badge: 'STANDARD'
              },
              {
                id: 'TREND' as ScalingStrategy,
                title: 'TREND Predictive Model',
                sub: 'Pre-provisions compute capacity using derivative load rate calculations.',
                badge: 'RECOMMENDED'
              },
              {
                id: 'LATENCY' as ScalingStrategy,
                title: 'LATENCY SLA Trigger',
                sub: 'Aggressive burst scaling triggered whenever p95 latency exceeds threshold.',
                badge: 'CUSTOM'
              }
            ].map(s => {
              const isSelected = strategies.includes(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => toggleStrategy(s.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between select-none ${
                    isSelected
                      ? 'bg-[#111827] border-[#4d8eff] shadow-md ring-1 ring-[#4d8eff]/30'
                      : 'bg-[#070A0F]/60 border-[#1F2937] opacity-60 hover:opacity-90 hover:border-[#424754]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        isSelected
                          ? 'bg-[#070A0F] border-[#1F2937] text-[#adc6ff]'
                          : 'bg-[#070A0F]/50 border-[#1F2937] text-[#8c909f]'
                      }`}>
                        {s.badge}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#4d8eff]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#8c909f]" />
                        )}
                      </div>
                    </div>
                    <h4 className={`text-xs font-semibold ${isSelected ? 'text-[#d4e4fa]' : 'text-[#8c909f]'}`}>
                      {s.title}
                    </h4>
                    <p className="text-[11px] text-[#8c909f] mt-1 leading-relaxed">{s.sub}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#1F2937]/50 flex items-center justify-between">
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-[#4edea3]' : 'text-[#8c909f]'}`}>
                      {isSelected ? '● Active' : '○ Click to Enable'}
                    </span>
                    <span className="text-[10px] text-[#8c909f]">
                      {isSelected ? 'Click to unselect' : 'Click to select'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {strategies.length === 0 && (
            <div className="mt-3 p-3 bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 rounded-lg flex items-center gap-2 text-xs text-[#ffb4ab]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>At least 1 scaling strategy must be selected. Click on any of the cards above to select it.</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#1F2937]">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-lg text-xs font-medium text-[#c2c6d6] hover:bg-[#111827] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isValidReplicas || !isValidStrategies}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#4d8eff] hover:bg-[#3b7ced] text-[#00285d] text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>{isSubmitting ? 'Registering...' : 'Register Microservice'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
