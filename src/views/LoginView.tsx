import React, { useState } from 'react';
import { Activity, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, Server, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface LoginViewProps {
  onSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('operator@company.com');
  const [password, setPassword] = useState('••••••••••••');
  const [remember, setRemember] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password, remember);
    onSuccess();
  };

  const handleDemoQuickLogin = async () => {
    setEmail('operator@company.com');
    setPassword('demo-sre-2024');
    await login('operator@company.com', 'demo-sre-2024', true);
    onSuccess();
  };

  return (
    <div className="min-h-screen w-full bg-[#051424] flex items-center justify-center p-4 lg:p-8 relative overflow-hidden select-none">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#4d8eff]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[200px] bg-[#4edea3]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#0B0F17] border border-[#1F2937] rounded-2xl shadow-2xl p-8 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-br from-[#4d8eff] to-[#00285d] border border-[#4d8eff]/40 text-white shadow-lg mb-4">
            <Activity className="w-6 h-6 text-[#adc6ff]" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight font-display">Axiom Cloud Strategy Simulator</h2>
          <p className="text-xs text-[#8c909f] mt-1.5 leading-relaxed">
            Enterprise cloud auto-scaling simulation & decision benchmark platform
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-label-caps text-[#c2c6d6] mb-1.5">Work Email / SSO ID</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8c909f] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="operator@company.com"
                className="w-full pl-9 pr-3 py-2.5 bg-[#070A0F] border border-[#1F2937] rounded-lg text-sm text-[#d4e4fa] focus:border-[#4d8eff] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-label-caps text-[#c2c6d6]">Password / Token</label>
              <button
                type="button"
                onClick={() => alert('Demo environment: click "Quick Demo Login" below or enter any credentials.')}
                className="text-xs text-[#4d8eff] hover:underline"
              >
                Forgot key?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8c909f] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#070A0F] border border-[#1F2937] rounded-lg text-sm text-[#d4e4fa] focus:border-[#4d8eff] focus:outline-none transition-colors font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-1">
            <label className="flex items-center gap-2 text-xs text-[#8c909f] cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="rounded bg-[#070A0F] border-[#1F2937] text-[#4d8eff] focus:ring-0"
              />
              <span>Remember session token</span>
            </label>
            <span className="text-[11px] text-[#4edea3] flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" /> TLS Encrypted
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#4d8eff] hover:bg-[#3b7ced] text-[#00285d] text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer active:scale-98 disabled:opacity-50 mt-2"
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In to Console'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Access */}
        <div className="mt-6 pt-5 border-t border-[#1F2937]/80 text-center">
          <button
            type="button"
            onClick={handleDemoQuickLogin}
            className="w-full py-2 px-3 rounded-lg bg-[#111827] hover:bg-[#1f2937] border border-[#2D3748] text-xs font-medium text-[#adc6ff] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3]" />
            <span>Fast Access (Auto-fill Demo SRE Session)</span>
          </button>
        </div>

        {/* Bottom Platform Info */}
        <div className="mt-6 flex items-center justify-between text-[11px] text-[#8c909f] font-mono">
          <span className="flex items-center gap-1">
            <Server className="w-3 h-3 text-[#4edea3]" /> 3 Regions
          </span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-[#4d8eff]" /> K8s HPA v2 Engine
          </span>
        </div>
      </div>
    </div>
  );
};
