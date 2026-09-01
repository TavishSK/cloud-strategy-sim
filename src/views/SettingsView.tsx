import React, { useState, useEffect } from 'react';
import {
  Settings,
  Server,
  Shield,
  Layers,
  Cpu,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useToast } from '../context/ToastContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export const SettingsView: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [arch, setArch] = useState('multi-region-k8s-v1.24');
  const [loadProfileName, setLoadProfileName] = useState('Sustained high traffic simulation');
  const [loadPercent, setLoadPercent] = useState(65);
  const [loadDesc, setLoadDesc] = useState('Simulates diurnal traffic curves with bursty surges during peak daylight hours.');
  const [cooldownPeriod, setCooldownPeriod] = useState(30);
  const [hpaThreshold, setHpaThreshold] = useState(75);
  const [latencySla, setLatencySla] = useState(150);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings().then(res => {
      if (res) {
        if (res.targetArchitecture) setArch(res.targetArchitecture);
        if (res.loadProfileName) setLoadProfileName(res.loadProfileName);
        if (typeof res.loadProfilePercent === 'number') setLoadPercent(res.loadProfilePercent);
        if (res.loadProfileDesc) setLoadDesc(res.loadProfileDesc);
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings({
        targetArchitecture: arch,
        loadProfileName,
        loadProfilePercent: loadPercent,
        loadProfileDesc: loadDesc
      });
      showToast('success', 'Settings Saved', 'Cluster engine configuration updated.');
    } catch (err: any) {
      showToast('error', 'Save Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight font-display">System & Cluster Settings</h2>
        <p className="text-xs text-[#8c909f] mt-0.5">
          Configure baseline orchestration target, auto-scaler stabilization windows, and cluster limits
        </p>
      </div>

      <form onSubmit={handleSave} className="card-level-1 p-6 sm:p-8 rounded-xl border border-[#1F2937] space-y-6">
        {/* Section 1: Environment Orchestrator */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-4 pb-2 border-b border-[#1F2937] flex items-center gap-2">
            <Server className="w-4 h-4 text-[#4d8eff]" />
            <span>1. Target Cloud Architecture</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-label-caps text-[#c2c6d6] mb-1.5">Orchestrator Stack</label>
              <select
                value={arch}
                onChange={e => setArch(e.target.value)}
                className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-xs text-[#d4e4fa] focus:border-[#4d8eff] focus:outline-none"
              >
                <option value="multi-region-k8s-v1.24">Multi-Region Kubernetes (v1.24+ HPA v2)</option>
                <option value="aws-eks-managed-nodes">AWS EKS Managed Node Groups (Bottlerocket)</option>
                <option value="gke-autopilot-arm64">GKE Autopilot (Tau T2A ARM64 Compute)</option>
                <option value="azure-aks-virtual-nodes">Azure AKS Virtual Nodes (KEDA Serverless)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-label-caps text-[#c2c6d6] mb-1.5">Load Profile Preset</label>
              <input
                type="text"
                value={loadProfileName}
                onChange={e => setLoadProfileName(e.target.value)}
                className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-xs text-[#d4e4fa] focus:border-[#4d8eff] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-label-caps text-[#c2c6d6] mb-1.5">Environment Description</label>
              <textarea
                rows={2}
                value={loadDesc}
                onChange={e => setLoadDesc(e.target.value)}
                className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-xs text-[#d4e4fa] focus:border-[#4d8eff] focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Stabilization & Cooldown Windows */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-4 pb-2 border-b border-[#1F2937] flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#4edea3]" />
            <span>2. Auto-Scaler Stabilization & Cooldown Rules</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-label-caps text-[#8c909f] mb-1">
                Scale-Down Cooldown (seconds)
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={cooldownPeriod}
                onChange={e => setCooldownPeriod(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-xs text-[#d4e4fa] font-data-tabular focus:border-[#4d8eff] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-label-caps text-[#8c909f] mb-1">
                Default CPU Threshold (%)
              </label>
              <input
                type="number"
                min="30"
                max="95"
                value={hpaThreshold}
                onChange={e => setHpaThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-xs text-[#d4e4fa] font-data-tabular focus:border-[#4d8eff] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-label-caps text-[#8c909f] mb-1">
                Default SLA Ceiling (ms)
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                value={latencySla}
                onChange={e => setLatencySla(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-xs text-[#d4e4fa] font-data-tabular focus:border-[#4d8eff] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Active Operator Session */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-4 pb-2 border-b border-[#1F2937] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#ffb95f]" />
            <span>3. Active SRE Operator Session</span>
          </h3>

          <div className="p-4 bg-[#070A0F] rounded-lg border border-[#1F2937] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#4d8eff]/20 border border-[#4d8eff]/40 flex items-center justify-center overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-xs font-bold text-[#adc6ff]">OP</span>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-white">{user?.name || 'Operator'}</p>
                <p className="text-[11px] text-[#8c909f] font-mono">{user?.email || 'operator@company.com'}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-[#4edea3]/10 border border-[#4edea3]/30 text-xs font-mono text-[#4edea3] font-bold">
              Authenticated Session
            </span>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-[#1F2937]">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#4d8eff] hover:bg-[#3b7ced] text-[#00285d] text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
