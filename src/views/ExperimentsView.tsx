import React, { useState } from 'react';
import {
  GitCompare,
  Play,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  TrendingUp,
  DollarSign,
  Layers,
  Sparkles,
  BookOpen,
  Filter
} from 'lucide-react';
import type { Experiment, Microservice, ScalingStrategy } from '../types.ts';
import { api } from '../services/api.ts';
import { useToast } from '../context/ToastContext.tsx';
import { Sparkline } from '../components/common/Sparkline.tsx';

interface ExperimentsViewProps {
  experiments: Experiment[];
  services: Microservice[];
  onRefreshExperiments: () => void;
}

export const ExperimentsView: React.FC<ExperimentsViewProps> = ({
  experiments,
  services,
  onRefreshExperiments
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'comparison' | 'history'>('comparison');

  // Form states for new comparison
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || 'srv-payment-gw');
  const [selectedStrategies, setSelectedStrategies] = useState<ScalingStrategy[]>(['CPU', 'TREND', 'LATENCY']);
  const [durationHours, setDurationHours] = useState(4);
  const [workloadProfile, setWorkloadProfile] = useState('E-Commerce: Black Friday Spike');
  const [isRunning, setIsRunning] = useState(false);

  // Pick the most recent / in-progress experiment for comparison showcase
  const activeExp = experiments.find(e => e.status === 'IN PROGRESS') || experiments[0];

  const handleToggleStrategy = (strat: ScalingStrategy) => {
    if (selectedStrategies.includes(strat)) {
      if (selectedStrategies.length > 1) {
        setSelectedStrategies(selectedStrategies.filter(s => s !== strat));
      } else {
        showToast('warning', 'Minimum Strategy', 'At least one scaling strategy must be active for comparison.');
      }
    } else {
      setSelectedStrategies([...selectedStrategies, strat]);
    }
  };

  const handleRunExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    try {
      await api.runExperiment({
        strategies: selectedStrategies,
        durationHours,
        workloadProfile,
        serviceId: selectedServiceId
      });
      showToast('success', 'Experiment Launched', 'Multi-strategy comparison simulation initiated.');
      onRefreshExperiments();
    } catch (err: any) {
      showToast('error', 'Launch Failed', err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const formatElapsed = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-display">Auto-Scaling Experiments</h2>
          <p className="text-xs text-[#8c909f] mt-0.5">
            Conduct multi-strategy comparisons and evaluate thrashing vs latency SLA trade-offs
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#0B0F17] p-1 rounded-xl border border-[#1F2937]">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'comparison'
                ? 'bg-[#111827] text-white border border-[#4d8eff]/50 shadow-xs'
                : 'text-[#8c909f] hover:text-[#d4e4fa]'
            }`}
          >
            Strategy Comparison
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-[#111827] text-white border border-[#4d8eff]/50 shadow-xs'
                : 'text-[#8c909f] hover:text-[#d4e4fa]'
            }`}
          >
            History & Strategy Library
          </button>
        </div>
      </div>

      {activeTab === 'comparison' ? (
        <div className="space-y-6">
          {/* Experiment Launcher Panel (Image 13 Controls) */}
          <form
            onSubmit={handleRunExperiment}
            className="card-level-1 p-5 rounded-xl border border-[#1F2937] space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2937]">
              <div className="flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-[#4d8eff]" />
                <h3 className="text-sm font-semibold text-white">Configure Strategy Benchmark</h3>
              </div>
              <span className="text-xs font-mono text-[#8c909f]">Deterministic Load Matrix</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Target Service */}
              <div>
                <label className="block text-xs font-label-caps text-[#c2c6d6] mb-1.5">Target Microservice</label>
                <select
                  value={selectedServiceId}
                  onChange={e => setSelectedServiceId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-xs text-[#d4e4fa] focus:border-[#4d8eff] focus:outline-none"
                >
                  {services.map(svc => (
                    <option key={svc.id} value={svc.id}>
                      {svc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Workload Profile */}
              <div>
                <label className="block text-xs font-label-caps text-[#c2c6d6] mb-1.5">Workload Profile</label>
                <select
                  value={workloadProfile}
                  onChange={e => setWorkloadProfile(e.target.value)}
                  className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-xs text-[#d4e4fa] focus:border-[#4d8eff] focus:outline-none"
                >
                  <option value="E-Commerce: Black Friday Spike">E-Commerce: Black Friday Spike (10x Surge)</option>
                  <option value="Sustained High Traffic">Sustained High Traffic (Peak Diurnal)</option>
                  <option value="Chaotic Micro-Burst">Chaotic Micro-Burst (High Jitter)</option>
                  <option value="Linear Ramp-Up">Linear Ramp-Up (Gradual Growth)</option>
                </select>
              </div>

              {/* Duration Slider */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <label className="font-label-caps text-[#c2c6d6]">Duration</label>
                  <span className="font-data-tabular font-bold text-[#4edea3]">{durationHours} Hours</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="24"
                  value={durationHours}
                  onChange={e => setDurationHours(Number(e.target.value))}
                  className="w-full accent-[#4edea3] cursor-pointer mt-1.5"
                />
                <div className="flex justify-between text-[10px] text-[#8c909f] font-mono mt-0.5">
                  <span>1h</span>
                  <span>12h</span>
                  <span>24h</span>
                </div>
              </div>

              {/* Strategies Checkboxes */}
              <div>
                <label className="block text-xs font-label-caps text-[#c2c6d6] mb-1.5">Strategies to Compare</label>
                <div className="flex items-center gap-2">
                  {(['CPU', 'TREND', 'LATENCY'] as ScalingStrategy[]).map(s => {
                    const isChecked = selectedStrategies.includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => handleToggleStrategy(s)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono font-semibold border transition-all ${
                          isChecked
                            ? 'bg-[#4d8eff]/15 text-[#adc6ff] border-[#4d8eff]'
                            : 'bg-[#070A0F] text-[#8c909f] border-[#1F2937]'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#1F2937]">
              <button
                type="submit"
                disabled={isRunning}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#4d8eff] hover:bg-[#3b7ced] text-[#00285d] text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunning ? 'Launching...' : 'Run Experiment'}</span>
              </button>
            </div>
          </form>

          {/* Active Experiment Comparison Display (Image 13) */}
          {activeExp && (
            <div className="card-level-1 p-6 rounded-xl border border-[#1F2937] space-y-6">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1F2937]">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-[#adc6ff]">{activeExp.id}</span>
                    <span className="text-sm font-semibold text-white">{activeExp.serviceName}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        activeExp.status === 'IN PROGRESS'
                          ? 'bg-[#4d8eff]/10 text-[#4d8eff] border-[#4d8eff]/30'
                          : 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/30'
                      }`}
                    >
                      STATUS: {activeExp.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#8c909f] mt-1 font-mono">
                    Profile: <strong className="text-[#d4e4fa]">{activeExp.workloadProfile}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono text-[#8c909f]">
                    Progress: <span className="text-white font-bold">{activeExp.progressPercent}% Complete</span>
                  </div>
                  <div className="text-[11px] font-mono text-[#4edea3] mt-0.5">
                    Duration: {formatElapsed(activeExp.elapsedSeconds)} / {formatElapsed(activeExp.totalSeconds)}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-[#070A0F] rounded-full overflow-hidden border border-[#1F2937]">
                <div
                  className="h-full bg-linear-to-r from-[#4d8eff] to-[#4edea3] transition-all duration-500 rounded-full"
                  style={{ width: `${activeExp.progressPercent}%` }}
                />
              </div>

              {/* Side-by-Side Strategy Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeExp.strategyResults.map(res => {
                  const isHealthy = res.status === 'Healthy' || res.status === 'Optimal';
                  const isThrashing = res.status === 'Thrashing';

                  return (
                    <div
                      key={res.strategy}
                      className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                        isHealthy
                          ? 'bg-[#0B0F17] border-[#4edea3]/40 shadow-sm'
                          : isThrashing
                          ? 'bg-[#0B0F17] border-[#ffb95f]/40 shadow-sm'
                          : 'bg-[#0B0F17] border-[#ffb4ab]/40'
                      }`}
                    >
                      <div>
                        {/* Strategy Title & Status */}
                        <div className="flex items-center justify-between pb-3 border-b border-[#1F2937]">
                          <div className="flex items-center gap-2">
                            {res.strategy === 'CPU' ? (
                              <Cpu className="w-4 h-4 text-[#4d8eff]" />
                            ) : res.strategy === 'TREND' ? (
                              <TrendingUp className="w-4 h-4 text-[#4edea3]" />
                            ) : (
                              <Clock className="w-4 h-4 text-[#ffb95f]" />
                            )}
                            <h4 className="text-sm font-bold text-white">{res.strategy}-Based Strategy</h4>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isHealthy
                                ? 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/30'
                                : 'bg-[#ffb95f]/10 text-[#ffb95f] border-[#ffb95f]/30'
                            }`}
                          >
                            STATUS: {res.status.toUpperCase()}
                          </span>
                        </div>

                        {/* Metrics Breakdown */}
                        <div className="space-y-3 mt-4">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#8c909f]">Active Replicas</span>
                            <span className="font-data-tabular font-bold text-white">{res.activeReplicas} Pods</span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#8c909f]">Avg. Latency</span>
                            <span className={`font-data-tabular font-bold ${res.avgLatency < 50 ? 'text-[#4edea3]' : 'text-[#ffb4ab]'}`}>
                              {res.avgLatency}ms
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#8c909f]">Estimated Cost / hr</span>
                            <span className="font-data-tabular font-bold text-white">${res.resourceCostPerHour.toFixed(2)}/hr</span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#8c909f]">Scaling Events (Thrashing)</span>
                            <span className="font-data-tabular font-mono text-[#adc6ff]">
                              {res.scalingEventsCount} ops ({res.thrashingScore} score)
                            </span>
                          </div>

                          <div className="pt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-[#8c909f]">Efficiency Rating</span>
                              <span className="font-data-tabular font-bold text-[#4edea3]">{res.efficiencyPercent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#070A0F] rounded-full overflow-hidden border border-[#1F2937]">
                              <div
                                className={`h-full rounded-full ${
                                  res.efficiencyPercent > 80
                                    ? 'bg-[#4edea3]'
                                    : res.efficiencyPercent > 60
                                    ? 'bg-[#ffb95f]'
                                    : 'bg-[#ffb4ab]'
                                }`}
                                style={{ width: `${res.efficiencyPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Best strategy badge */}
                      {activeExp.bestStrategy === res.strategy && (
                        <div className="mt-5 pt-3 border-t border-[#1F2937] flex items-center justify-center gap-1.5 text-xs text-[#4edea3] font-semibold bg-[#4edea3]/5 py-1.5 rounded-lg">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Authoritative Recommendation</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* History & Strategy Library (Image 15) */
        <div className="space-y-6">
          {/* History Table */}
          <div className="card-level-1 rounded-xl border border-[#1F2937] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1F2937] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Historical Experiment Runs</h3>
                <p className="text-xs text-[#8c909f]">Archived multi-strategy simulation benchmarks</p>
              </div>
              <span className="text-xs font-mono text-[#8c909f]">{experiments.length} Experiments Run</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#070A0F]/60 text-[#8c909f] font-label-caps border-b border-[#1F2937]">
                  <tr>
                    <th className="px-5 py-3">Experiment ID</th>
                    <th className="px-5 py-3">Target Microservice</th>
                    <th className="px-5 py-3">Workload Pattern</th>
                    <th className="px-5 py-3">Duration</th>
                    <th className="px-5 py-3">Winning Strategy</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]">
                  {experiments.map(exp => (
                    <tr key={exp.id} className="data-row">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#adc6ff]">{exp.id}</td>
                      <td className="px-5 py-3.5 font-semibold text-white">{exp.serviceName}</td>
                      <td className="px-5 py-3.5 text-[#c2c6d6] font-mono">{exp.workloadProfile}</td>
                      <td className="px-5 py-3.5 font-data-tabular text-[#8c909f]">{exp.durationHours}h</td>
                      <td className="px-5 py-3.5">
                        {exp.bestStrategy ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#4edea3]/10 border border-[#4edea3]/30 text-[#4edea3] text-xs font-mono font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {exp.bestStrategy} ({exp.confidencePercent}%)
                          </span>
                        ) : (
                          <span className="text-[#8c909f] font-mono">Inconclusive</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            exp.status === 'COMPLETED'
                              ? 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/30'
                              : exp.status === 'IN PROGRESS'
                              ? 'bg-[#4d8eff]/10 text-[#4d8eff] border-[#4d8eff]/30'
                              : 'bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/30'
                          }`}
                        >
                          {exp.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setActiveTab('comparison');
                          }}
                          className="text-xs text-[#4d8eff] hover:underline font-medium"
                        >
                          Inspect Run
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Strategy Library Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-level-1 p-5 rounded-xl border border-[#1F2937] space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#4d8eff]">
                <Cpu className="w-4 h-4" />
                <span>CPU Target Tracking (HPA)</span>
              </div>
              <p className="text-xs text-[#8c909f] leading-relaxed">
                Standard reactive scaling. Desired replicas = <code className="text-[#adc6ff]">ceil(Reps * CPU / Target)</code>. Ideal for steady predictable loads, but slow to react to flash-sale surges.
              </p>
            </div>

            <div className="card-level-1 p-5 rounded-xl border border-[#1F2937] space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#4edea3]">
                <TrendingUp className="w-4 h-4" />
                <span>TREND Predictive Model</span>
              </div>
              <p className="text-xs text-[#8c909f] leading-relaxed">
                Computes real-time derivative <code className="text-[#4edea3]">dLoad/dt</code>. Pre-scales pods before latency spikes occur, minimizing SLA violations while avoiding thrashing.
              </p>
            </div>

            <div className="card-level-1 p-5 rounded-xl border border-[#1F2937] space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#ffb95f]">
                <Clock className="w-4 h-4" />
                <span>LATENCY Custom Trigger</span>
              </div>
              <p className="text-xs text-[#8c909f] leading-relaxed">
                Direct p95/p99 SLA ceiling violation trigger. Guarantees tightest response times under sudden load, but generates higher pod churn and cloud costs.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
