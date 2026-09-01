import React, { useState } from 'react';
import {
  Server,
  Activity,
  GitCompare,
  CheckCircle2,
  TrendingUp,
  Settings2,
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  Layers,
  Cpu
} from 'lucide-react';
import type { DashboardStats, Microservice } from '../types.ts';
import { Sparkline } from '../components/common/Sparkline.tsx';
import { ModifyEnvironmentModal } from '../components/common/ModifyEnvironmentModal.tsx';

interface OverviewDashboardViewProps {
  stats: DashboardStats | null;
  services: Microservice[];
  onNavigate: (view: string, id?: string) => void;
  onRefreshStats: () => void;
}

export const OverviewDashboardView: React.FC<OverviewDashboardViewProps> = ({
  stats,
  services,
  onNavigate,
  onRefreshStats
}) => {
  const [isModifyEnvOpen, setIsModifyEnvOpen] = useState(false);

  const registeredCount = services.length || stats?.registeredServices || 12;
  const activeSims = stats?.activeSimulations || 3;
  const computeLoad = stats?.computeLoadPercent || 78;
  const totalExps = stats?.totalExperiments || 48;
  const topStrategy = stats?.topStrategy || 'Aggressive Scale-Out';
  const confidence = stats?.confidencePercent || 94.2;

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Registered Microservices */}
        <div
          onClick={() => onNavigate('services')}
          className="card-level-1 p-5 rounded-xl border border-[#1F2937] hover:border-[#4d8eff]/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-label-caps text-[#8c909f]">Registered Microservices</span>
            <div className="w-8 h-8 rounded-lg bg-[#4d8eff]/10 border border-[#4d8eff]/20 flex items-center justify-center text-[#4d8eff]">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-data-tabular text-white tracking-tight">
              {registeredCount} <span className="text-sm font-normal text-[#8c909f]">Services</span>
            </div>
            <p className="text-[11px] text-[#8c909f] mt-1 font-mono">across 3 active clusters</p>
          </div>
        </div>

        {/* 2. Active Simulations */}
        <div
          onClick={() => onNavigate('simulation')}
          className="card-level-1 p-5 rounded-xl border border-[#1F2937] hover:border-[#4edea3]/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-label-caps text-[#8c909f]">Active Simulations</span>
            <div className="w-8 h-8 rounded-lg bg-[#4edea3]/10 border border-[#4edea3]/20 flex items-center justify-center text-[#4edea3]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-data-tabular text-white tracking-tight flex items-center gap-2">
              <span>{activeSims} Active</span>
              <span className="w-2 h-2 rounded-full bg-[#4edea3] live-dot"></span>
            </div>
            <p className="text-[11px] text-[#4edea3] mt-1 font-mono">{computeLoad}% Total compute load</p>
          </div>
        </div>

        {/* 3. Total Experiments */}
        <div
          onClick={() => onNavigate('experiments')}
          className="card-level-1 p-5 rounded-xl border border-[#1F2937] hover:border-[#ffb95f]/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-label-caps text-[#8c909f]">Total Experiments</span>
            <div className="w-8 h-8 rounded-lg bg-[#ffb95f]/10 border border-[#ffb95f]/20 flex items-center justify-center text-[#ffb95f]">
              <GitCompare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-data-tabular text-white tracking-tight">
              {totalExps} <span className="text-sm font-normal text-[#8c909f]">Runs</span>
            </div>
            <p className="text-[11px] text-[#8c909f] mt-1 font-mono">
              <span className="text-[#ffb4ab]">-2</span> this week vs baseline
            </p>
          </div>
        </div>

        {/* 4. Top Performing Strategy */}
        <div
          onClick={() => onNavigate('analytics')}
          className="card-level-1 p-5 rounded-xl border border-[#1F2937] hover:border-[#adc6ff]/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-label-caps text-[#8c909f]">Top Performing Strategy</span>
            <div className="w-8 h-8 rounded-lg bg-[#adc6ff]/10 border border-[#adc6ff]/20 flex items-center justify-center text-[#adc6ff]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-white tracking-tight truncate">{topStrategy}</div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-[#4edea3]/20 border border-[#4edea3]/30 text-[#4edea3] text-[10px] font-data-tabular font-bold">
                {confidence}% Confidence
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Recent Simulation Activity (Table) + Environment Profile (Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Simulation Activity Table */}
        <div className="lg:col-span-2 card-level-1 rounded-xl border border-[#1F2937] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1F2937] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Simulation Activity</h3>
              <p className="text-xs text-[#8c909f]">Real-time container replicas and P99 latency telemetry</p>
            </div>
            <button
              onClick={() => onNavigate('simulation')}
              className="text-xs text-[#4d8eff] hover:text-[#adc6ff] flex items-center gap-1 font-medium"
            >
              <span>Live Console</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070A0F]/60 text-[#8c909f] font-label-caps border-b border-[#1F2937]">
                <tr>
                  <th className="px-4 py-2.5">Service ID</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Current Replicas</th>
                  <th className="px-4 py-2.5">Latency (P99)</th>
                  <th className="px-4 py-2.5">Telemetry Trend</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]">
                {(stats?.recentActivity || [
                  {
                    serviceId: 'srv-auth-core',
                    status: 'Stable',
                    replicas: '12 / 12',
                    latency: '42ms',
                    sparkline: [20, 18, 22, 15, 16, 8, 12, 5, 10, 4, 6]
                  },
                  {
                    serviceId: 'srv-payment-gw',
                    status: 'Scaling',
                    replicas: '8 / 16',
                    latency: '115ms',
                    sparkline: [22, 21, 18, 20, 15, 18, 10, 12, 5, 8, 2]
                  },
                  {
                    serviceId: 'srv-cache-redis',
                    status: 'Stable',
                    replicas: '6 / 6',
                    latency: '5ms',
                    sparkline: [12, 13, 11, 14, 12, 13, 12, 14, 11, 13]
                  },
                  {
                    serviceId: 'srv-ml-inference',
                    status: 'Degraded',
                    replicas: '2 / 4',
                    latency: '850ms',
                    sparkline: [5, 2, 8, 4, 10, 6, 20, 18, 22, 19, 23]
                  }
                ]).map((item, idx) => {
                  const statusColors: Record<string, string> = {
                    Stable: 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/30',
                    Scaling: 'bg-[#4d8eff]/10 text-[#4d8eff] border-[#4d8eff]/30',
                    Degraded: 'bg-[#ffb95f]/10 text-[#ffb95f] border-[#ffb95f]/30',
                    Failing: 'bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/30'
                  };

                  const sparkColor =
                    item.status === 'Degraded' || item.status === 'Failing'
                      ? '#ffb4ab'
                      : item.status === 'Scaling'
                      ? '#4d8eff'
                      : '#4edea3';

                  return (
                    <tr key={idx} className="data-row">
                      <td className="px-4 py-3 font-mono font-medium text-[#adc6ff]">
                        {item.serviceId}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            statusColors[item.status] || statusColors.Stable
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.status === 'Scaling' ? 'bg-[#4d8eff] live-dot' : 'bg-current'
                            }`}
                          />
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-data-tabular text-[#d4e4fa]">
                        {item.replicas}
                      </td>
                      <td className="px-4 py-3 font-data-tabular font-semibold text-white">
                        {item.latency}
                      </td>
                      <td className="px-4 py-3">
                        <Sparkline data={item.sparkline} color={sparkColor} width={70} height={20} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onNavigate('service-detail', item.serviceId)}
                          className="text-xs text-[#4d8eff] hover:underline font-medium"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Environment Profile */}
        <div className="card-level-1 p-5 rounded-xl border border-[#1F2937] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2937]">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-[#4edea3]" />
                <h3 className="text-sm font-semibold text-white">Environment Profile</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#111827] border border-[#2D3748] text-[#8c909f]">
                Active
              </span>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <span className="text-[11px] font-label-caps text-[#8c909f]">Target Architecture</span>
                <p className="text-xs font-mono font-medium text-[#adc6ff] mt-0.5">
                  {stats?.environmentProfile?.targetArchitecture || 'multi-region-k8s-v1.24'}
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="font-label-caps text-[#8c909f]">Load Profile</span>
                  <span className="font-data-tabular font-bold text-[#4edea3]">
                    {stats?.environmentProfile?.loadProfilePercent || 65}% Intensity
                  </span>
                </div>
                <p className="text-xs text-white font-medium">
                  {stats?.environmentProfile?.loadProfileName || 'Sustained high traffic simulation'}
                </p>
                <div className="w-full h-1.5 bg-[#070A0F] rounded-full overflow-hidden mt-1.5 border border-[#1F2937]">
                  <div
                    className="h-full bg-linear-to-r from-[#4d8eff] to-[#4edea3] rounded-full"
                    style={{ width: `${stats?.environmentProfile?.loadProfilePercent || 65}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-[#070A0F] rounded-lg border border-[#1F2937] text-[11px] text-[#c2c6d6] leading-relaxed">
                {stats?.environmentProfile?.loadProfileDesc ||
                  'Simulates diurnal traffic curves with bursty surges during peak daylight hours.'}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-[#1F2937]">
            <button
              onClick={() => setIsModifyEnvOpen(true)}
              className="w-full py-2 px-3 rounded-lg bg-[#111827] hover:bg-[#1f2937] border border-[#2D3748] text-xs font-medium text-[#d4e4fa] hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5 text-[#4edea3]" />
              <span>Modify Environment Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modify Environment Modal */}
      <ModifyEnvironmentModal
        isOpen={isModifyEnvOpen}
        onClose={() => setIsModifyEnvOpen(false)}
        currentSettings={
          stats?.environmentProfile || {
            targetArchitecture: 'multi-region-k8s-v1.24',
            loadProfileName: 'Sustained high traffic simulation',
            loadProfilePercent: 65,
            loadProfileDesc: 'Simulates diurnal traffic curves with bursty surges during peak daylight hours.'
          }
        }
        onUpdated={onRefreshStats}
      />
    </div>
  );
};
