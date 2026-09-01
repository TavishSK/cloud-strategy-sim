import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Clock,
  Cpu,
  Zap,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Activity
} from 'lucide-react';
import type { AnalyticsData } from '../types.ts';
import { api } from '../services/api.ts';
import { useToast } from '../context/ToastContext.tsx';

export const AnalyticsView: React.FC = () => {
  const { showToast } = useToast();
  const [timeframe, setTimeframe] = useState('Last 1 Hour');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalytics = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await api.getAnalytics(timeframe);
      setData(res);
    } catch (err) {
      // silent handle background poll error
    } finally {
      if (isManual) setIsRefreshing(false);
      setLoading(false);
    }
  };

  // Initial fetch and auto-refresh polling every 2.5s to capture live simulation changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getAnalytics(timeframe)
      .then(res => {
        if (isMounted) setData(res);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const interval = setInterval(() => {
      if (isMounted) {
        api.getAnalytics(timeframe)
          .then(res => {
            if (isMounted) setData(res);
          })
          .catch(() => {});
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [timeframe]);

  const handleExport = (format: 'CSV' | 'JSON') => {
    if (!data) return;
    if (format === 'JSON') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `axiom-analytics-${Date.now()}.json`;
      a.click();
    } else {
      // CSV
      let csv = 'Strategy,Avg Latency (ms),Final Replicas,Scaling Events,Efficiency (%),Rating\n';
      data.strategyComparisons.forEach(s => {
        csv += `"${s.name}",${s.avgLatency},${s.finalReplicas},${s.scalingEvents},${s.efficiency},"${s.rating}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `axiom-strategy-matrix-${Date.now()}.csv`;
      a.click();
    }
    showToast('success', 'Telemetry Exported', `Downloaded analytics metrics in ${format} format.`);
  };

  if (loading || !data) {
    return (
      <div className="py-20 text-center text-xs text-[#8c909f]">
        Aggregating system-wide auto-scaling analytics...
      </div>
    );
  }

  // Dynamic SVG Points Calculation
  const pts = data.timelineTelemetry && data.timelineTelemetry.length > 0 ? data.timelineTelemetry : [];
  const ptCount = Math.max(pts.length, 1);
  const maxLatency = Math.max(...pts.map(p => p.latency), 100);

  const latencyPointsStr = pts
    .map((p, i) => {
      const x = 15 + (i / Math.max(ptCount - 1, 1)) * 470;
      const y = Math.max(15, Math.min(125, 130 - (p.latency / maxLatency) * 110));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const cpuPointsStr = pts
    .map((p, i) => {
      const x = 15 + (i / Math.max(ptCount - 1, 1)) * 470;
      const y = Math.max(15, Math.min(125, 130 - (p.cpu / 100) * 110));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Histogram metrics
  const maxHistCount = Math.max(...data.scalingHistogram.map(h => h.count), 1);
  const totalScalingOps = data.scalingHistogram.reduce((acc, h) => acc + h.count, 0);
  const peakBucket = data.scalingHistogram.find(h => h.isPeak)?.bucket || 'T-30m';

  return (
    <div className="space-y-6">
      {/* Header with Timeframe and Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-white tracking-tight font-display">Analytics & Strategy Evaluation</h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#4edea3]/10 border border-[#4edea3]/30 text-[10px] font-mono text-[#4edea3]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] live-dot" /> LIVE SYNC
            </span>
          </div>
          <p className="text-xs text-[#8c909f] mt-0.5">
            Cross-cluster performance analytics, thrashing metrics, and strategy efficiency matrix
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0B0F17] hover:bg-[#1f2937] text-[#adc6ff] text-xs font-semibold rounded-lg border border-[#1F2937] transition-colors cursor-pointer"
            title="Refresh analytics snapshot"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Timeframe Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#0B0F17] px-3 py-1.5 rounded-lg border border-[#1F2937] text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#8c909f]" />
            <select
              value={timeframe}
              onChange={e => setTimeframe(e.target.value)}
              className="bg-transparent text-[#d4e4fa] focus:outline-none cursor-pointer"
            >
              <option value="Last 1 Hour">Last 1 Hour</option>
              <option value="Last 24 Hours">Last 24 Hours</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </select>
          </div>

          {/* Export Button */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleExport('CSV')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] hover:bg-[#1f2937] text-[#adc6ff] text-xs font-semibold rounded-lg border border-[#2D3748] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExport('JSON')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] hover:bg-[#1f2937] text-[#adc6ff] text-xs font-semibold rounded-lg border border-[#2D3748] transition-colors cursor-pointer"
            >
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Avg Response Time */}
        <div className="card-level-1 p-5 rounded-xl border border-[#1F2937]">
          <span className="text-xs font-label-caps text-[#8c909f]">Avg. Response Time</span>
          <div className="mt-2 text-2xl font-bold font-data-tabular text-white tracking-tight">
            {data.avgResponseTime}ms
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#ffb4ab] mt-1 font-mono">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+{data.avgResponseTimeDeltaPercent}% vs baseline SLA</span>
          </div>
        </div>

        {/* 2. Avg CPU Load */}
        <div className="card-level-1 p-5 rounded-xl border border-[#1F2937]">
          <span className="text-xs font-label-caps text-[#8c909f]">Avg. CPU Load</span>
          <div className="mt-2 text-2xl font-bold font-data-tabular text-white tracking-tight">
            {data.avgCpu}%
          </div>
          <div className={`flex items-center gap-1 text-[11px] mt-1 font-mono ${data.avgCpuDeltaPercent <= 0 ? 'text-[#4edea3]' : 'text-[#ffb4ab]'}`}>
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>{data.avgCpuDeltaPercent}% vs 75% target threshold</span>
          </div>
        </div>

        {/* 3. Scaling Events / Hour */}
        <div className="card-level-1 p-5 rounded-xl border border-[#1F2937]">
          <span className="text-xs font-label-caps text-[#8c909f]">Scaling Events / Hr</span>
          <div className="mt-2 text-2xl font-bold font-data-tabular text-white tracking-tight">
            {data.scalingEventsPerHour.toLocaleString()}
          </div>
          <p className="text-[11px] text-[#8c909f] mt-1 font-mono">
            across active simulation & clusters
          </p>
        </div>

        {/* 4. Efficiency Rating */}
        <div className="card-level-1 p-5 rounded-xl border border-[#1F2937]">
          <span className="text-xs font-label-caps text-[#8c909f]">Efficiency Rating</span>
          <div className="mt-2 text-2xl font-bold font-data-tabular text-[#4edea3] tracking-tight flex items-center gap-2">
            <span>{data.efficiencyRating}</span>
            <span className="text-xs font-normal text-[#8c909f]">({data.efficiencyStatus})</span>
          </div>
          <p className="text-[11px] text-[#4edea3] mt-1 font-mono">
            ✔ Optimized cost vs latency SLA
          </p>
        </div>
      </div>

      {/* Visual Analytics Charts: Dual Latency/CPU Graph + Scaling Events Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Response Time vs CPU Utilization over Time */}
        <div className="card-level-1 p-5 rounded-xl border border-[#1F2937] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F2937]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#4d8eff]" />
              <h3 className="text-xs font-semibold text-white">Response Time vs CPU Utilization (Live Snapshot)</h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-[#4edea3]">
                <span className="w-2 h-2 rounded-full bg-[#4edea3]" /> Latency (ms)
              </span>
              <span className="flex items-center gap-1 text-[#4d8eff]">
                <span className="w-2 h-2 rounded-full bg-[#4d8eff]" /> CPU (%)
              </span>
            </div>
          </div>

          {/* Dynamic SVG Comparison Graph */}
          <div className="w-full h-44 relative bg-[#070A0F] rounded-lg p-2 border border-[#1F2937]">
            <svg viewBox="0 0 500 140" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="10" y1="20" x2="490" y2="20" stroke="#1F2937" strokeDasharray="3 3" />
              <line x1="10" y1="70" x2="490" y2="70" stroke="#1F2937" strokeDasharray="3 3" />
              <line x1="10" y1="120" x2="490" y2="120" stroke="#1F2937" strokeDasharray="3 3" />

              {/* Latency Line (Green) */}
              {latencyPointsStr && (
                <polyline
                  fill="none"
                  stroke="#4edea3"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={latencyPointsStr}
                />
              )}

              {/* CPU Line (Blue) */}
              {cpuPointsStr && (
                <polyline
                  fill="none"
                  stroke="#4d8eff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="4 2"
                  points={cpuPointsStr}
                />
              )}

              {/* Data points */}
              {pts.map((p, i) => {
                const x = 15 + (i / Math.max(ptCount - 1, 1)) * 470;
                const yLat = Math.max(15, Math.min(125, 130 - (p.latency / maxLatency) * 110));
                const yCpu = Math.max(15, Math.min(125, 130 - (p.cpu / 100) * 110));
                return (
                  <g key={i}>
                    <circle cx={x} cy={yLat} r="3" fill="#4edea3" />
                    <circle cx={x} cy={yCpu} r="3" fill="#4d8eff" />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex justify-between text-[10px] text-[#8c909f] font-mono">
            {pts.length > 0 ? (
              pts.map((pt, i) => (
                <span key={i} className="truncate">{pt.time}</span>
              ))
            ) : (
              <>
                <span>T-60m</span>
                <span>T-45m</span>
                <span>T-30m</span>
                <span>T-15m</span>
                <span>Now</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Scaling Events Histogram */}
        <div className="card-level-1 p-5 rounded-xl border border-[#1F2937] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1F2937]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#ffb95f]" />
              <h3 className="text-xs font-semibold text-white">Scaling Frequency Distribution (Thrashing Metric)</h3>
            </div>
            <span className="text-[10px] font-mono text-[#4edea3]">Peak at {peakBucket}</span>
          </div>

          <div className="w-full h-44 flex items-end justify-between gap-2 bg-[#070A0F] rounded-lg p-4 border border-[#1F2937]">
            {data.scalingHistogram.map((item, idx) => {
              const heightPercent = Math.min(100, Math.max(15, (item.count / maxHistCount) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[9px] font-mono text-[#8c909f] opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </span>
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      item.isPeak ? 'bg-[#ffb4ab]' : 'bg-[#4d8eff]/60 hover:bg-[#4d8eff]'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[9px] font-mono text-[#8c909f] truncate">{item.bucket}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#8c909f] font-mono">
            <span>Total scaling adjustments in sample: {totalScalingOps} ops</span>
            <span className="text-[#ffb4ab]">Oscillations damped</span>
          </div>
        </div>
      </div>

      {/* Comprehensive Strategy Comparison Matrix */}
      <div className="card-level-1 rounded-xl border border-[#1F2937] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1F2937] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#4edea3]" />
            <div>
              <h3 className="text-sm font-semibold text-white">Strategy Decision Performance Matrix</h3>
              <p className="text-xs text-[#8c909f]">Evaluated across live simulation telemetry and synthetic stress cycles</p>
            </div>
          </div>
          <span className="text-xs font-mono text-[#4edea3]">Dynamic Confidence: 94.2%</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070A0F]/60 text-[#8c909f] font-label-caps border-b border-[#1F2937]">
              <tr>
                <th className="px-5 py-3">Auto-Scaling Strategy</th>
                <th className="px-5 py-3">Avg Latency (P99)</th>
                <th className="px-5 py-3">Peak Replicas Provisioned</th>
                <th className="px-5 py-3">Scaling Events (Thrashing)</th>
                <th className="px-5 py-3">Resource Efficiency</th>
                <th className="px-5 py-3 text-right">Evaluation Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {data.strategyComparisons.map((strat, idx) => (
                <tr key={idx} className="data-row">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{strat.name}</span>
                      {strat.isBest && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#4edea3]/10 border border-[#4edea3]/30 text-[10px] font-mono font-bold text-[#4edea3]">
                          <Sparkles className="w-3 h-3" /> BEST OPTION
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-data-tabular font-bold text-[#d4e4fa]">
                    {strat.avgLatency}ms
                  </td>
                  <td className="px-5 py-3.5 font-data-tabular text-[#d4e4fa]">
                    {strat.finalReplicas} Pods
                  </td>
                  <td className="px-5 py-3.5 font-data-tabular font-mono text-[#adc6ff]">
                    {strat.scalingEvents} events
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-data-tabular font-bold text-white">{strat.efficiency}%</span>
                      <div className="w-20 h-1.5 bg-[#070A0F] rounded-full overflow-hidden border border-[#1F2937]">
                        <div
                          className={`h-full rounded-full ${
                            strat.efficiency >= 80 ? 'bg-[#4edea3]' : strat.efficiency >= 50 ? 'bg-[#ffb95f]' : 'bg-[#ffb4ab]'
                          }`}
                          style={{ width: `${strat.efficiency}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        strat.rating === 'EXCELLENT'
                          ? 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/30'
                          : strat.rating === 'FAIR'
                          ? 'bg-[#ffb95f]/10 text-[#ffb95f] border-[#ffb95f]/30'
                          : 'bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/30'
                      }`}
                    >
                      {strat.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

