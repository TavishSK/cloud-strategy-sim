import React, { useState, useEffect } from 'react';
import {
  Activity,
  Pause,
  Play,
  Square,
  RotateCcw,
  Cpu,
  Clock,
  Server,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import type { SimulationSession, ScalingEvent } from '../types.ts';
import { api } from '../services/api.ts';
import { TelemetryChart } from '../components/common/TelemetryChart.tsx';
import { useToast } from '../context/ToastContext.tsx';

interface LiveSimulationViewProps {
  initialSimulation: SimulationSession | null;
  onRefresh: () => void;
}

export const LiveSimulationView: React.FC<LiveSimulationViewProps> = ({
  initialSimulation,
  onRefresh
}) => {
  const { showToast } = useToast();
  const [simulation, setSimulation] = useState<SimulationSession | null>(initialSimulation);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Poll live telemetry every 1.5s
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const live = await api.getLiveSimulation();
        if (isMounted && live) {
          setSimulation(live);
        }
      } catch (err) {
        // silent fail on network jitter
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const formatElapsed = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `T+ ${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handlePause = async () => {
    if (!simulation) return;
    setIsActionLoading(true);
    try {
      if (simulation.status === 'RUNNING') {
        const updated = await api.pauseSimulation(simulation.id);
        setSimulation(updated);
        showToast('warning', 'Simulation Paused', 'Compute traffic injection suspended.');
      } else {
        const updated = await api.resumeSimulation(simulation.id);
        setSimulation(updated);
        showToast('success', 'Simulation Resumed', 'Compute traffic stream active.');
      }
      onRefresh();
    } catch (err: any) {
      showToast('error', 'Action Failed', err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStop = async () => {
    if (!simulation) return;
    setIsActionLoading(true);
    try {
      const updated = await api.stopSimulation(simulation.id);
      setSimulation(updated);
      showToast('info', 'Simulation Stopped', 'Session telemetry archived.');
      onRefresh();
    } catch (err: any) {
      showToast('error', 'Action Failed', err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRestart = async () => {
    if (!simulation) return;
    setIsActionLoading(true);
    try {
      const updated = await api.restartSimulation(simulation.id);
      setSimulation(updated);
      showToast('success', 'Simulation Restarted', 'Reset counters to T+ 00:00:00.');
      onRefresh();
    } catch (err: any) {
      showToast('error', 'Action Failed', err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (!simulation) {
    return (
      <div className="py-20 text-center text-xs text-[#8c909f]">
        No active simulation session. Launch one from the Microservices inventory.
      </div>
    );
  }

  const isRunning = simulation.status === 'RUNNING';

  return (
    <div className="space-y-6">
      {/* Simulation Session Top Header Bar */}
      <div className="card-level-1 p-5 rounded-xl border border-[#1F2937] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#4d8eff]/10 border border-[#4d8eff]/30 flex items-center justify-center text-[#4d8eff]">
            <Activity className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-label-caps text-[#8c909f]">Simulation ID:</span>
              <span className="font-mono text-sm font-bold text-white">{simulation.id}</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  simulation.status === 'RUNNING'
                    ? 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/30'
                    : simulation.status === 'PAUSED'
                    ? 'bg-[#ffb95f]/10 text-[#ffb95f] border-[#ffb95f]/30'
                    : 'bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/30'
                }`}
              >
                {simulation.status === 'RUNNING' && <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] live-dot" />}
                <span>STATUS: {simulation.status}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#8c909f] mt-1 font-mono">
              <span>Service: <strong className="text-[#adc6ff]">{simulation.serviceName}</strong></span>
              <span>•</span>
              <span>Region: <strong className="text-white">{simulation.region}</strong></span>
              <span>•</span>
              <span>Strategy: <strong className="text-[#4edea3]">{simulation.strategy}</strong></span>
              <span>•</span>
              <span>Profile: <strong className="text-[#ffb95f]">{simulation.workloadProfile}</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Controls & Timer */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-[#070A0F] border border-[#1F2937] rounded-lg font-mono text-sm font-bold text-[#adc6ff]">
            {formatElapsed(simulation.elapsedSeconds)}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePause}
              disabled={isActionLoading || simulation.status === 'STOPPED'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isRunning
                  ? 'bg-[#111827] hover:bg-[#1f2937] text-[#ffb95f] border-[#ffb95f]/40'
                  : 'bg-[#4edea3] hover:bg-[#3ec48e] text-[#003824] border-[#4edea3]'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume</span>
                </>
              )}
            </button>

            <button
              onClick={handleStop}
              disabled={isActionLoading || simulation.status === 'STOPPED'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#111827] hover:bg-[#93000a]/30 text-[#ffb4ab] border border-[#ffb4ab]/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>

            <button
              onClick={handleRestart}
              disabled={isActionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#111827] hover:bg-[#1f2937] text-[#adc6ff] border border-[#2D3748] transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. CPU Utilization */}
        <div className="card-level-1 p-5 rounded-xl border border-[#1F2937]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-label-caps text-[#8c909f]">CPU Utilization</span>
            <div className="w-7 h-7 rounded-lg bg-[#4d8eff]/10 flex items-center justify-center text-[#4d8eff]">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-data-tabular text-white tracking-tight">
              {simulation.currentCpu}%
            </div>
            <p className="text-[11px] text-[#8c909f] mt-1 font-mono">
              Threshold target: <span className="text-[#adc6ff]">75.0%</span>
            </p>
          </div>
        </div>

        {/* 2. Response Latency */}
        <div className="card-level-1 p-5 rounded-xl border border-[#1F2937]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-label-caps text-[#8c909f]">Response Latency</span>
            <div className="w-7 h-7 rounded-lg bg-[#4edea3]/10 flex items-center justify-center text-[#4edea3]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-data-tabular text-white tracking-tight">
              {simulation.currentLatency}ms
            </div>
            <p className="text-[11px] text-[#8c909f] mt-1 font-mono">
              SLA limit: <span className="text-[#4edea3]">150ms</span>
            </p>
          </div>
        </div>

        {/* 3. Current Replicas */}
        <div className="card-level-1 p-5 rounded-xl border border-[#1F2937]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-label-caps text-[#8c909f]">Current Replicas</span>
            <div className="w-7 h-7 rounded-lg bg-[#ffb95f]/10 flex items-center justify-center text-[#ffb95f]">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-data-tabular text-white tracking-tight">
              {simulation.currentReplicas} <span className="text-sm font-normal text-[#8c909f]">Pods</span>
            </div>
            <p className="text-[11px] text-[#8c909f] mt-1 font-mono">
              Range: {simulation.minReplicas} min / {simulation.maxReplicas} max
            </p>
          </div>
        </div>

        {/* 4. Total Cost / Hour */}
        <div className="card-level-1 p-5 rounded-xl border border-[#1F2937]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-label-caps text-[#8c909f]">Est. Cost Rate</span>
            <div className="w-7 h-7 rounded-lg bg-[#adc6ff]/10 flex items-center justify-center text-[#adc6ff]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-data-tabular text-white tracking-tight">
              ${(simulation.currentReplicas * 2.45).toFixed(2)} <span className="text-sm font-normal text-[#8c909f]">/ hr</span>
            </div>
            <p className="text-[11px] text-[#8c909f] mt-1 font-mono">
              Events: <span className="text-[#4edea3]">{simulation.stats.scalingEventsCount} scaling ops</span>
            </p>
          </div>
        </div>
      </div>

      {/* Dual Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: CPU Utilization Chart */}
        <div className="card-level-1 p-5 rounded-xl border border-[#1F2937] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F2937]">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#4d8eff]" />
              <h3 className="text-xs font-semibold text-white">CPU Utilization (%)</h3>
            </div>
            <span className="text-[11px] font-mono text-[#ffb4ab]">Target: 75%</span>
          </div>
          <TelemetryChart
            data={simulation.telemetry}
            metricType="cpu"
            height={160}
            color="#4d8eff"
            unit="%"
            thresholdLine={75}
            thresholdLabel="Scale Threshold (75%)"
          />
        </div>

        {/* Right: Response Latency Chart */}
        <div className="card-level-1 p-5 rounded-xl border border-[#1F2937] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F2937]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#4edea3]" />
              <h3 className="text-xs font-semibold text-white">Response Latency (ms)</h3>
            </div>
            <span className="text-[11px] font-mono text-[#4edea3]">SLA: 150ms</span>
          </div>
          <TelemetryChart
            data={simulation.telemetry}
            metricType="latency"
            height={160}
            color="#4edea3"
            unit="ms"
            thresholdLine={150}
            thresholdLabel="SLA Baseline (150ms)"
          />
        </div>
      </div>

      {/* Scaling & System Activity Log */}
      <div className="card-level-1 rounded-xl border border-[#1F2937] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1F2937] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#adc6ff]" />
            <h3 className="text-xs font-label-caps text-[#8c909f]">Scaling & System Activity Log</h3>
          </div>
          <span className="text-[11px] font-mono text-[#8c909f]">{simulation.events.length} Events Logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070A0F]/60 text-[#8c909f] font-label-caps border-b border-[#1F2937]">
              <tr>
                <th className="px-5 py-2.5">Timestamp</th>
                <th className="px-5 py-2.5">Event Type</th>
                <th className="px-5 py-2.5">Severity</th>
                <th className="px-5 py-2.5">Trigger Condition</th>
                <th className="px-5 py-2.5">Message / Action Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {simulation.events.map((evt, idx) => {
                const badgeStyle = {
                  success: 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/30',
                  info: 'bg-[#4d8eff]/10 text-[#4d8eff] border-[#4d8eff]/30',
                  warning: 'bg-[#ffb95f]/10 text-[#ffb95f] border-[#ffb95f]/30',
                  error: 'bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/30'
                }[evt.severity];

                return (
                  <tr key={evt.id || idx} className="data-row">
                    <td className="px-5 py-3 font-mono text-[#8c909f]">{evt.timestamp}</td>
                    <td className="px-5 py-3 font-semibold text-white">{evt.message}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
                        {evt.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-[#adc6ff]">{evt.metricTrigger || 'N/A'}</td>
                    <td className="px-5 py-3 text-[#c2c6d6] font-mono text-[11px]">{evt.detail}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
