import React from 'react';
import { X, BookOpen, Cpu, TrendingUp, Clock, CheckCircle2, ShieldAlert, Zap } from 'lucide-react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[85vh] bg-[#0B0F17] border border-[#1F2937] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2937]">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#adc6ff]" />
            <div>
              <h3 className="text-base font-semibold text-[#d4e4fa]">Cloud Auto-Scaling Evaluation Framework</h3>
              <p className="text-xs text-[#8c909f]">Technical specification & mathematical decision models</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8c909f] hover:text-[#d4e4fa] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-[#c2c6d6] leading-relaxed">
          {/* Section 1 */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[#adc6ff] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#adc6ff]" /> 1. Overview & Research Objective
            </h4>
            <p>
              In cloud computing, auto-scaling ensures that applications dynamically adjust computing resources to match workload demands.
              Traditional Kubernetes and Cloud autoscalers primarily rely on <strong>CPU utilization</strong> (HPA).
              However, modern microservices exhibit diverse bottlenecks (e.g. database locking, I/O wait, latency SLA breaches, sudden flash-sale bursts).
            </p>
            <p>
              This simulator evaluates whether <strong>custom metrics (Latency SLA)</strong> and <strong>predictive derivative modeling (Trend-based)</strong>
              outperform traditional <strong>CPU-based auto-scaling</strong> in terms of <em>response time</em>, <em>resource efficiency</em>, and <em>thrashing reduction</em>.
            </p>
          </div>

          {/* Section 2: Strategies */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#4edea3] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#4edea3]" /> 2. Scaling Decision Models
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-[#070A0F] border border-[#1F2937] rounded-lg space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#4d8eff]">
                  <Cpu className="w-3.5 h-3.5" /> CPU-Based (HPA)
                </div>
                <p className="text-[11px] text-[#8c909f]">
                  Evaluates instantaneous CPU vs target threshold (70-80%). Computes desired replicas = <code className="text-[#adc6ff]">ceil(Reps * CPU / Target)</code>.
                </p>
                <div className="text-[10px] text-[#4edea3]">✔ Stable under linear load</div>
                <div className="text-[10px] text-[#ffb4ab]">✖ Lags behind sudden micro-spikes</div>
              </div>

              <div className="p-3 bg-[#070A0F] border border-[#1F2937] rounded-lg space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#4edea3]">
                  <TrendingUp className="w-3.5 h-3.5" /> Trend-Based (Predictive)
                </div>
                <p className="text-[11px] text-[#8c909f]">
                  Calculates derivative rate-of-change <code className="text-[#4edea3]">d(Load)/dt</code>. Pre-allocates replicas before queue saturation occurs.
                </p>
                <div className="text-[10px] text-[#4edea3]">✔ Lowest SLA violation rates</div>
                <div className="text-[10px] text-[#ffb95f]">⚠ Requires warm-up calibration</div>
              </div>

              <div className="p-3 bg-[#070A0F] border border-[#1F2937] rounded-lg space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#ffb95f]">
                  <Clock className="w-3.5 h-3.5" /> Latency-Based (Custom)
                </div>
                <p className="text-[11px] text-[#8c909f]">
                  Direct p95/p99 latency trigger. Immediately provisions burst capacity if SLA is breached (e.g. {'>'} 150ms).
                </p>
                <div className="text-[10px] text-[#4edea3]">✔ Protects user-facing response times</div>
                <div className="text-[10px] text-[#ffb4ab]">✖ High thrashing / higher cloud cost</div>
              </div>
            </div>
          </div>

          {/* Section 3: Key Metrics */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[#ffb95f] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#ffb95f]" /> 3. Evaluation Metrics
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-[11px]">
              <li><strong className="text-white">Average Response Time (ms):</strong> Mean time to serve requests under stress.</li>
              <li><strong className="text-white">Resource Efficiency (%):</strong> Useful work performed divided by provisioned compute capacity.</li>
              <li><strong className="text-white">Scaling Thrashing Score:</strong> Unnecessary rapid scale-up/down oscillations within cooldown windows.</li>
              <li><strong className="text-white">Cost per Hour ($):</strong> Normalized infrastructure spend based on active container replicas.</li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-[#070A0F] border-t border-[#1F2937] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#4d8eff] hover:bg-[#3b7ced] text-[#00285d] font-bold text-xs rounded-lg transition-colors"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
