import React, { useState } from 'react';
import {
  Server,
  Plus,
  Search,
  Activity,
  Play,
  Trash2,
  ExternalLink,
  Cpu,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Radio
} from 'lucide-react';
import type { Microservice, ServiceStatus, ScalingStrategy } from '../types.ts';
import { useToast } from '../context/ToastContext.tsx';
import { api } from '../services/api.ts';

interface ServicesInventoryViewProps {
  services: Microservice[];
  onNavigate: (view: string, id?: string) => void;
  onRefreshServices: () => void;
}

export const ServicesInventoryView: React.FC<ServicesInventoryViewProps> = ({
  services,
  onNavigate,
  onRefreshServices
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ServiceStatus>('ALL');

  const filteredServices = services.filter(svc => {
    const matchesSearch =
      svc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      svc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      svc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      svc.strategy.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || svc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteService = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to deregister ${name}?`)) {
      try {
        await api.deleteService(id);
        showToast('info', 'Microservice Deregistered', `${name} removed from cluster inventory.`);
        onRefreshServices();
      } catch (err: any) {
        showToast('error', 'Delete Failed', err.message);
      }
    }
  };

  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
            Running
          </span>
        );
      case 'SIMULATING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#4d8eff]/10 text-[#4d8eff] border border-[#4d8eff]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4d8eff] live-dot" />
            Simulating
          </span>
        );
      case 'IDLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#8c909f]/10 text-[#8c909f] border border-[#8c909f]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8c909f]" />
            Idle
          </span>
        );
      case 'FAILING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]" />
            Failing
          </span>
        );
    }
  };

  const getStrategyIcon = (strategy: ScalingStrategy) => {
    switch (strategy) {
      case 'CPU':
        return <Cpu className="w-3.5 h-3.5 text-[#4d8eff]" />;
      case 'TREND':
        return <TrendingUp className="w-3.5 h-3.5 text-[#4edea3]" />;
      case 'LATENCY':
        return <Clock className="w-3.5 h-3.5 text-[#ffb95f]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Register Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-display">Registered Microservices</h2>
          <p className="text-xs text-[#8c909f] mt-0.5">
            Manage containerized workloads and evaluate their auto-scaling configuration
          </p>
        </div>
        <button
          onClick={() => onNavigate('register')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#4d8eff] hover:bg-[#3b7ced] text-[#00285d] text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Register Microservice</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B0F17] p-3 rounded-xl border border-[#1F2937]">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#8c909f] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, type, cluster, or strategy..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#070A0F] border border-[#1F2937] rounded-lg text-xs text-[#d4e4fa] focus:border-[#4d8eff] focus:outline-none"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'RUNNING', 'SIMULATING', 'IDLE', 'FAILING'] as const).map(st => {
            const count = st === 'ALL' ? services.length : services.filter(s => s.status === st).length;
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#111827] text-white border border-[#4d8eff]/50'
                    : 'text-[#8c909f] hover:text-[#d4e4fa] hover:bg-[#111827]/40'
                }`}
              >
                <span>{st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}</span>
                <span className="text-[10px] font-mono px-1 rounded bg-[#070A0F] text-[#8c909f]">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Services Table */}
      <div className="card-level-1 rounded-xl border border-[#1F2937] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070A0F]/60 text-[#8c909f] font-label-caps border-b border-[#1F2937]">
              <tr>
                <th className="px-5 py-3">Service Name</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Replicas</th>
                <th className="px-5 py-3">Metrics (CPU / Latency)</th>
                <th className="px-5 py-3">Scaling Strategy</th>
                <th className="px-5 py-3">Last Simulated</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {filteredServices.map(svc => (
                <tr key={svc.id} className="data-row">
                  {/* Name & Type */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#111827] border border-[#1F2937] flex items-center justify-center text-[#4d8eff] shrink-0">
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <div
                          onClick={() => onNavigate('service-detail', svc.id)}
                          className="font-semibold text-[#d4e4fa] hover:text-[#4d8eff] cursor-pointer"
                        >
                          {svc.name}
                        </div>
                        <div className="text-[11px] text-[#8c909f]">{svc.type} • <span className="font-mono">{svc.cluster}</span></div>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">{getStatusBadge(svc.status)}</td>

                  {/* Replicas */}
                  <td className="px-5 py-3.5">
                    <span className="font-data-tabular text-sm font-bold text-white">
                      {svc.replicas}
                    </span>
                    <span className="text-[11px] text-[#8c909f] ml-1 font-mono">
                      (min: {svc.minReplicas}, max: {svc.maxReplicas})
                    </span>
                  </td>

                  {/* Metrics */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 font-data-tabular">
                      <span className={`font-semibold ${svc.cpuUtil > 80 ? 'text-[#ffb4ab]' : 'text-[#d4e4fa]'}`}>
                        {svc.cpuUtil}% CPU
                      </span>
                      <span className="text-[#1F2937]">/</span>
                      <span className={`font-semibold ${svc.latency > 150 ? 'text-[#ffb4ab]' : 'text-[#4edea3]'}`}>
                        {svc.latency}ms Latency
                      </span>
                    </div>
                  </td>

                  {/* Strategy */}
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#070A0F] border border-[#1F2937] text-xs font-mono font-medium text-[#adc6ff]">
                      {getStrategyIcon(svc.strategy)}
                      <span>{svc.strategy}</span>
                    </span>
                  </td>

                  {/* Last Simulated */}
                  <td className="px-5 py-3.5 font-mono text-[#8c909f]">{svc.lastSimulation}</td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onNavigate('service-detail', svc.id)}
                        className="px-2.5 py-1 rounded bg-[#111827] hover:bg-[#1f2937] text-[#adc6ff] text-xs font-medium border border-[#2D3748] transition-colors"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => onNavigate('simulation', svc.id)}
                        title="Simulate now"
                        className="p-1.5 rounded bg-[#4d8eff]/10 hover:bg-[#4d8eff]/20 text-[#4d8eff] border border-[#4d8eff]/30 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(svc.id, svc.name)}
                        title="Deregister service"
                        className="p-1.5 rounded hover:bg-[#ffb4ab]/10 text-[#8c909f] hover:text-[#ffb4ab] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredServices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-xs text-[#8c909f]">
                    No microservices match your search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
