import React, { useState } from 'react';
import { X, Settings2, Sliders, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext.tsx';
import { api } from '../../services/api.ts';

interface ModifyEnvironmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: {
    targetArchitecture: string;
    loadProfileName: string;
    loadProfilePercent: number;
    loadProfileDesc: string;
  };
  onUpdated: () => void;
}

export const ModifyEnvironmentModal: React.FC<ModifyEnvironmentModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onUpdated
}) => {
  const { showToast } = useToast();
  const [arch, setArch] = useState(currentSettings?.targetArchitecture || 'multi-region-k8s-v1.24');
  const [loadName, setLoadName] = useState(currentSettings?.loadProfileName || 'Sustained high traffic simulation');
  const [loadPercent, setLoadPercent] = useState(currentSettings?.loadProfilePercent || 65);
  const [loadDesc, setLoadDesc] = useState(
    currentSettings?.loadProfileDesc || 'Simulates diurnal traffic curves with bursty surges during peak daylight hours.'
  );
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings({
        targetArchitecture: arch,
        loadProfileName: loadName,
        loadProfilePercent: loadPercent,
        loadProfileDesc: loadDesc
      });
      showToast('success', 'Environment Profile Updated', 'Simulator environment baseline configured successfully.');
      onUpdated();
      onClose();
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message || 'Could not update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#0B0F17] border border-[#1F2937] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2937]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4edea3]/10 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3]">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#d4e4fa]">Modify Environment Profile</h3>
              <p className="text-xs text-[#8c909f]">Configure cluster orchestrator and background load baseline</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8c909f] hover:text-[#d4e4fa] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-label-caps text-[#c2c6d6] mb-1.5">Target Architecture</label>
            <select
              value={arch}
              onChange={e => setArch(e.target.value)}
              className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-sm text-[#d4e4fa] focus:border-[#4d8eff] focus:outline-none"
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
              value={loadName}
              onChange={e => setLoadName(e.target.value)}
              className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-sm text-[#d4e4fa] focus:border-[#4d8eff] focus:outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-label-caps text-[#c2c6d6]">Baseline Traffic Intensity</label>
              <span className="font-data-tabular text-xs font-bold text-[#4edea3]">{loadPercent}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={loadPercent}
              onChange={e => setLoadPercent(Number(e.target.value))}
              className="w-full accent-[#4edea3] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8c909f] mt-1 font-data-tabular">
              <span>10% (Off-peak)</span>
              <span>50% (Normal)</span>
              <span>100% (Extreme Stress)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-label-caps text-[#c2c6d6] mb-1.5">Profile Description / Notes</label>
            <textarea
              rows={2}
              value={loadDesc}
              onChange={e => setLoadDesc(e.target.value)}
              className="w-full px-3 py-2 bg-[#070A0F] border border-[#1F2937] rounded-lg text-xs text-[#d4e4fa] focus:border-[#4d8eff] focus:outline-none resize-none"
            />
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
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#4edea3] hover:bg-[#3ec48e] text-[#003824] text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Apply Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
