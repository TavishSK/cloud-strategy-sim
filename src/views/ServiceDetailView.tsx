import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Server,
  Activity,
  Play,
  Cpu,
  Clock,
  TrendingUp,
  Layers,
  Settings,
  ShieldCheck
} from 'lucide-react';
import type { Microservice } from '../types.ts';
import { api } from '../services/api.ts';
import { TelemetryChart } from '../components/common/TelemetryChart.tsx';

interface ServiceDetailViewProps {
  serviceId: string;
  onBack: () => void;
  onLaunchSimulation: (serviceId: string) => void;
}

export const ServiceDetailView: React.FC<ServiceDetailViewProps> = ({
  serviceId,
  onBack,
  onLaunchSimulation
}) => {
  const [service, setService] = useState<(Microservice & { telemetry?: any[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getService(serviceId)
      .then(data => {
        if (isMounted) setService(data);
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [serviceId]);

  if (loading || !service) {
    return (
      <div className="py-20 text-center text-xs text-[#8c909f]">
        Loading microservice telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-[#0B0F17] hover:bg-[#111827] text-[#8c909f] hover:text-white border border-[#1F2937] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight font-display">{service.name}</h2>
              <span className="px-2 py-0.5 rounded bg-[#111827] border border-[#1F2937] text-xs font-mono text-[#adc6ff]">
                {service.id}
              </span>
            </div>
            <p className="text-xs text-[#8c909f] mt-0.5">
              {service.type} • Cluster: <span className="font-mono text-[#d4e4fa]">{service.cluster}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onLaunchSimulation(service.id)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#4d8eff] hover:bg-[#3b7ced] text-[#00285d] text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch Simulation</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-level-1 p-4 rounded-xl border border-[#1F2937]">
          <span className="text-[11px] font-label-caps text-[#8c909f]">Active Replicas</span>
          <div className="text-2xl font-bold font-data-tabular text-white mt-1">
            {service.replicas} <span className="text-xs font-normal text-[#8c909f]">Pods</span>
          </div>
          <p className="text-[11px] text-[#8c909f] mt-1 font-mono">
            Bound: {service.minReplicas} min / {service.maxReplicas} max
          </p>
        </div>

        <div className="card-level-1 p-4 rounded-xl border border-[#1F2937]">
          <span className="text-[11px] font-label-caps text-[#8c909f]">CPU Utilization</span>
          <div className="text-2xl font-bold font-data-tabular text-white mt-1">
            {service.cpuUtil}%
          </div>
          <p className="text-[11px] text-[#8c909f] mt-1 font-mono">
            Baseline: {service.cpuBaseline} mCores
          </p>
        </div>

        <div className="card-level-1 p-4 rounded-xl border border-[#1F2937]">
          <span className="text-[11px] font-label-caps text-[#8c909f]">Response Latency</span>
          <div className="text-2xl font-bold font-data-tabular text-white mt-1">
            {service.latency}ms
          </div>
          <p className="text-[11px] text-[#8c909f] mt-1 font-mono">
            Target SLA: {service.responseBaseline}ms
          </p>
        </div>

        <div className="card-level-1 p-4 rounded-xl border border-[#1F2937]">
          <span className="text-[11px] font-label-caps text-[#8c909f]">Auto-Scaling Policies</span>
          <div className="text-sm font-bold font-mono text-[#4edea3] mt-1 flex flex-wrap gap-1">
            {(service.strategies && service.strategies.length > 0 ? service.strategies : [service.strategy]).map(st => (
              <span key={st} className="px-1.5 py-0.5 rounded bg-[#070A0F] border border-[#1F2937] text-xs">
                {st}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-[#8c909f] mt-1 font-mono">
            Workload: {service.workloadPattern}
          </p>
        </div>
      </div>

      {/* Telemetry Charts (3 Strategies Stacked Vertically) */}
      <div className="space-y-5">
        {/* CPU Strategy */}
        <div className="card-level-1 p-5 rounded-xl border border-[#1F2937] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F2937]">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#4d8eff]" />
              <h3 className="text-xs font-semibold text-white">CPU Utilization (% Capacity)</h3>
            </div>
            <span className="text-[11px] font-mono text-[#8c909f]">Target: 75%</span>
          </div>
          <TelemetryChart
            data={service.telemetry || []}
            metricType="cpu"
            height={170}
            color="#4d8eff"
            unit="%"
            thresholdLine={75}
            thresholdLabel="HPA Scale Threshold"
          />
        </div>

        {/* Predictive Trend Strategy */}
        <div className="card-level-1 p-5 rounded-xl border border-[#1F2937] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F2937]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#b69df8]" />
              <h3 className="text-xs font-semibold text-white">Predictive Forecast & Trend (%)</h3>
            </div>
            <span className="text-[11px] font-mono text-[#b69df8]">Horizon: +15s</span>
          </div>
          <TelemetryChart
            data={service.telemetry || []}
            metricType="predictive"
            height={170}
            color="#b69df8"
            unit="%"
            thresholdLine={80}
            thresholdLabel="Pre-Provision Horizon (80%)"
          />
        </div>

        {/* Latency Strategy */}
        <div className="card-level-1 p-5 rounded-xl border border-[#1F2937] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F2937]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#4edea3]" />
              <h3 className="text-xs font-semibold text-white">Response Latency (P99 ms)</h3>
            </div>
            <span className="text-[11px] font-mono text-[#8c909f]">SLA: {service.responseBaseline}ms</span>
          </div>
          <TelemetryChart
            data={service.telemetry || []}
            metricType="latency"
            height={170}
            color="#4edea3"
            unit="ms"
            thresholdLine={service.responseBaseline}
            thresholdLabel="SLA Ceiling"
          />
        </div>
      </div>

      {/* Details Description & Spec */}
      <div className="card-level-1 p-5 rounded-xl border border-[#1F2937]">
        <h3 className="text-xs font-label-caps text-[#8c909f] mb-2">Service Description & Architecture Notes</h3>
        <p className="text-xs text-[#d4e4fa] leading-relaxed">
          {service.description}
        </p>
      </div>
    </div>
  );
};
