import React, { useState } from 'react';
import type { TelemetryPoint } from '../../types.ts';

interface TelemetryChartProps {
  data: TelemetryPoint[];
  metricType: 'cpu' | 'latency' | 'replicas';
  height?: number;
  showGrid?: boolean;
  color?: string;
  unit?: string;
  title?: string;
  thresholdLine?: number;
  thresholdLabel?: string;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  data,
  metricType,
  height = 140,
  showGrid = true,
  color = '#4d8eff',
  unit = '%',
  title,
  thresholdLine,
  thresholdLabel
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<TelemetryPoint | null>(null);

  if (!data || data.length < 2) {
    return (
      <div
        className="w-full flex items-center justify-center text-xs text-[#8c909f] bg-[#070A0F] rounded border border-[#1F2937]"
        style={{ height }}
      >
        Awaiting telemetry stream...
      </div>
    );
  }

  const values = data.map(d => (metricType === 'cpu' ? d.cpu : metricType === 'latency' ? d.latency : d.replicas));
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values, thresholdLine || 0);

  const min = metricType === 'cpu' ? 0 : Math.max(0, Math.floor(rawMin * 0.8));
  const max = metricType === 'cpu' ? 100 : Math.ceil(rawMax * 1.25) || 100;
  const range = max - min || 1;

  const width = 600;
  const paddingX = 10;
  const paddingY = 15;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Generate SVG path points
  const points = data.map((d, idx) => {
    const val = metricType === 'cpu' ? d.cpu : metricType === 'latency' ? d.latency : d.replicas;
    const x = paddingX + (idx / (data.length - 1)) * chartWidth;
    const y = height - paddingY - ((val - min) / range) * chartHeight;
    return { x, y, val, point: d };
  });

  const polylineStr = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Area path (closed at bottom)
  const areaPath = `M ${points[0].x.toFixed(1)},${height - paddingY} L ${polylineStr.replace(/ /g, ' L ')} L ${points[points.length - 1].x.toFixed(1)},${height - paddingY} Z`;

  // Threshold Y
  const thresholdY = thresholdLine !== undefined
    ? height - paddingY - ((thresholdLine - min) / range) * chartHeight
    : null;

  return (
    <div className="relative w-full">
      {title && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[#c2c6d6]">{title}</span>
          <span className="font-data-tabular text-xs font-semibold text-[#d4e4fa]">
            {data[data.length - 1]?.[metricType === 'cpu' ? 'cpu' : metricType === 'latency' ? 'latency' : 'replicas']}{' '}
            {unit}
          </span>
        </div>
      )}

      <div className="w-full relative overflow-hidden rounded bg-[#070A0F] border border-[#1F2937]/70 p-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`grad-${metricType}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {showGrid && (
            <g opacity="0.15" stroke="#8c909f" strokeDasharray="3 3">
              <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} />
              <line x1={paddingX} y1={paddingY + chartHeight * 0.5} x2={width - paddingX} y2={paddingY + chartHeight * 0.5} />
              <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} />
            </g>
          )}

          {/* Threshold Line */}
          {thresholdY !== null && thresholdY >= paddingY && thresholdY <= height - paddingY && (
            <g>
              <line
                x1={paddingX}
                y1={thresholdY}
                x2={width - paddingX}
                y2={thresholdY}
                stroke="#ffb4ab"
                strokeWidth="1.2"
                strokeDasharray="4 3"
                opacity="0.75"
              />
              {thresholdLabel && (
                <text
                  x={width - paddingX - 4}
                  y={thresholdY - 4}
                  fill="#ffb4ab"
                  fontSize="10"
                  textAnchor="end"
                  className="font-data-tabular font-semibold"
                >
                  {thresholdLabel}
                </text>
              )}
            </g>
          )}

          {/* Fill Area */}
          <path d={areaPath} fill={`url(#grad-${metricType})`} />

          {/* Line Stroke */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylineStr}
          />

          {/* Active pulse on last point */}
          {points.length > 0 && (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="4"
              fill={color}
              className="live-dot"
            />
          )}

          {/* Hover interactive bars */}
          {points.map((p, idx) => (
            <rect
              key={idx}
              x={p.x - chartWidth / (points.length * 2)}
              y="0"
              width={chartWidth / points.length}
              height={height}
              fill="transparent"
              className="cursor-crosshair"
              onMouseEnter={() => setHoveredPoint(p.point)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-2 right-2 px-2.5 py-1 bg-[#111827]/95 border border-[#2D3748] rounded text-[11px] font-data-tabular text-[#d4e4fa] shadow-lg pointer-events-none z-10 flex items-center gap-2">
            <span className="text-[#8c909f]">{hoveredPoint.timeLabel}:</span>
            <span className="font-bold text-[#4edea3]">
              {metricType === 'cpu' ? `${hoveredPoint.cpu}% CPU` : metricType === 'latency' ? `${hoveredPoint.latency}ms Latency` : `${hoveredPoint.replicas} Replicas`}
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-[10px] text-[#8c909f] mt-1 font-data-tabular">
        <span>T-{data.length * 5}s</span>
        <span>{min}{unit}</span>
        <span>Target: {thresholdLine ? `${thresholdLine}${unit}` : 'Optimal'}</span>
        <span>{max}{unit}</span>
        <span>Now</span>
      </div>
    </div>
  );
};
